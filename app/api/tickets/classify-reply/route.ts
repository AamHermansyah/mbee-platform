/**
 * POST /api/tickets/classify-reply
 * body: { ticket: { title, summary, priority, status }, history?: { author, message }[], reply: string }
 *
 * Gemini (model teks) menentukan status tiket sesudah balasan admin: on_progress atau resolved, beserta alasannya.
 * Admin tidak memilih status sendiri; status ikut isi balasan.
 */

const API = "https://generativelanguage.googleapis.com/v1beta"
/** Model utama lalu cadangan bila sedang sibuk (503/429) atau lambat. */
const MODELS = [...new Set([process.env.GEMINI_TEXT_MODEL || "gemini-3.8-flash", "gemini-3.5-flash", "gemini-2.5-flash"])]
const TIMEOUT_MS = 20_000

const INSTRUCTION = `Kamu menilai status tiket dukungan pelanggan Mbee Platform sesudah tim mengirim balasan ke klien.
Pilih satu status:
- "resolved": balasan menyatakan kendala sudah diperbaiki, sudah berjalan normal, atau pertanyaan klien sudah terjawab tuntas, dan tidak ada lagi tindakan yang ditunggu dari tim.
- "on_progress": tim masih memeriksa atau memperbaiki, menjadwalkan tindakan, meminta data/tindakan dari klien, menunggu pihak lain (mis. Meta), atau belum ada kepastian selesai.
Bila ragu, pilih "on_progress".
Tulis "alasan" dalam satu kalimat bahasa Indonesia untuk admin.`

function clean(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : ""
}

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return Response.json({ error: "GEMINI_API_KEY belum diisi" }, { status: 500 })

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
  const ticket = (body.ticket ?? {}) as Record<string, unknown>
  const reply = clean(body.reply, 4000)
  if (!reply) return Response.json({ error: "isi balasan kosong" }, { status: 400 })
  const history = (Array.isArray(body.history) ? body.history : [])
    .slice(-5)
    .map((h: Record<string, unknown>) => `- ${clean(h.author, 60)}: ${clean(h.message, 800)}`)
    .join("\n")

  const prompt = `TIKET
Judul: ${clean(ticket.title, 200)}
Ringkasan kendala: ${clean(ticket.summary, 1500)}
Tingkat urgensi: ${clean(ticket.priority, 20)}
Status sekarang: ${clean(ticket.status, 20)}
${history ? `\nBALASAN SEBELUMNYA\n${history}\n` : ""}
BALASAN BARU DARI TIM
${reply}`

  const payload = JSON.stringify({
    systemInstruction: { parts: [{ text: INSTRUCTION }] },
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0,
      responseMimeType: "application/json",
      responseSchema: {
        type: "OBJECT",
        properties: {
          status: { type: "STRING", enum: ["on_progress", "resolved"] },
          alasan: { type: "STRING" },
        },
        required: ["status", "alasan"],
      },
    },
  })

  const failures: string[] = []
  for (const model of MODELS) {
    const res = await fetch(`${API}/models/${model}:generateContent`, {
      method: "POST",
      headers: { "x-goog-api-key": apiKey, "Content-Type": "application/json" },
      body: payload,
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    }).catch((error: unknown) => (error instanceof Error ? error.name : "network"))

    if (typeof res === "string" || !res.ok) {
      failures.push(`${model}: ${typeof res === "string" ? res : res.status}`)
      continue
    }
    try {
      const json = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] }
      const text = json.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? ""
      const parsed = JSON.parse(text) as { status?: string; alasan?: string }
      const status = parsed.status === "resolved" ? "resolved" : "on_progress"
      return Response.json({ status, reason: clean(parsed.alasan, 300) || "—", model })
    } catch {
      failures.push(`${model}: jawaban tidak terbaca`)
    }
  }

  console.warn("[tickets] klasifikasi status gagal:", failures.join("; "))
  return Response.json({ error: "Gemini tidak bisa menentukan status", detail: failures.join("; ") }, { status: 502 })
}
