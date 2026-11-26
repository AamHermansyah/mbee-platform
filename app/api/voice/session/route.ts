import { buildSystemInstruction } from "@/lib/voice/live/prompt"
import { FUNCTION_DECLARATIONS } from "@/lib/voice/live/tools"

/**
 * POST /api/voice/session  body: { mode: "guest" | "member" }
 *
 * Membuat token sementara (ephemeral, sekali pakai) Gemini Live supaya browser bisa terhubung langsung
 * ke Gemini tanpa memegang GEMINI_API_KEY, plus konfigurasi setup (model, suara, prompt, tools).
 * Menggantikan signaling /offer + server Python di proyek "WebRTC Avatar Revised".
 */

const API = "https://generativelanguage.googleapis.com"
const MODEL = process.env.GEMINI_LIVE_MODEL || "gemini-3.8-live"
const VOICE = process.env.GEMINI_VOICE || "Puck"

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return Response.json({ error: "GEMINI_API_KEY belum diisi di .env.local" }, { status: 500 })
  }

  const body = (await request.json().catch(() => ({}))) as { mode?: unknown }
  const mode = body.mode === "member" ? "member" : "guest"

  const now = Date.now()
  const tokenRes = await fetch(`${API}/v1alpha/auth_tokens`, {
    method: "POST",
    headers: { "x-goog-api-key": apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({
      uses: 1,
      // sesi boleh berjalan 30 menit, tetapi harus dimulai dalam 2 menit
      expireTime: new Date(now + 30 * 60_000).toISOString(),
      newSessionExpireTime: new Date(now + 2 * 60_000).toISOString(),
    }),
    cache: "no-store",
  }).catch(() => null)

  if (!tokenRes?.ok) {
    const detail = tokenRes ? `${tokenRes.status} ${(await tokenRes.text()).slice(0, 200)}` : "tidak bisa menghubungi Gemini"
    console.warn("[voice] gagal membuat token Gemini Live:", detail)
    return Response.json({ error: "Gagal membuat sesi Gemini Live", detail }, { status: 502 })
  }

  const { name: token } = (await tokenRes.json()) as { name: string }

  return Response.json({
    token,
    url: `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContentConstrained?access_token=${encodeURIComponent(token)}`,
    setup: {
      model: `models/${MODEL}`,
      generationConfig: {
        responseModalities: ["AUDIO"],
        // id-ID: suara dan pengenalan ucapan memakai bahasa Indonesia (prompt juga mewajibkannya)
        speechConfig: { languageCode: "id-ID", voiceConfig: { prebuiltVoiceConfig: { voiceName: VOICE } } },
      },
      systemInstruction: { parts: [{ text: await buildSystemInstruction(mode) }] },
      tools: [{ functionDeclarations: FUNCTION_DECLARATIONS }],
      inputAudioTranscription: {},
      outputAudioTranscription: {},
    },
  })
}
