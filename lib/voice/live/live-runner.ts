import { toast } from "sonner"

import { ASSISTANT_NAME, PLATFORM_DOMAIN, PLATFORM_NAME, PLATFORM_TEAM } from "@/lib/constants/brand"
import { getPlan, higherPlans, planRank, PLANS, upgradePrice, type PlanId } from "@/lib/constants/plans"
import {
  ISSUE_CATEGORIES,
  ISSUE_CATEGORY_LABEL,
  PAYMENT_METHOD_LABEL,
  PRIORITIES,
  PRIORITY_LABEL,
  responseDueDate,
  URGENCY_RESPONSE_LABEL,
} from "@/lib/constants/ticket"
import { ticketRepository } from "@/lib/data/ticket-repository"
import { normalizeEmail } from "@/lib/auth/accounts"
import { formatDate, formatRupiah } from "@/lib/format"
import { allAccounts, useAccountStore } from "@/lib/stores/account-store"
import { finishCheckout, openCheckout, usePaymentStore } from "@/lib/stores/payment-store"
import { useTicketStore } from "@/lib/stores/ticket-store"
import { useVoiceStore, type MessageAttachment, type QuestionAnswer, type VoiceQuestion } from "@/lib/stores/voice-store"
import type { IssueCategory, IssueReport, JourneyEvent, JourneyStage, Priority, Sentiment, TicketInput, TicketTemplate } from "@/lib/types"
import { answerQuestion, askQuestion, cancelQuestion, navigate } from "@/lib/voice/bridge"
import { confirmLabel, confirmQuestion, planOptions, summary, upgradeOptions } from "@/lib/voice/demo-script"
import { LiveAudio } from "@/lib/voice/live/audio"
import { TOOL } from "@/lib/voice/live/tools"
import { sendTicketEmail } from "@/lib/tickets/notify"
import { EMPTY_TICKET, prepareSession, type PreparedSession } from "@/lib/voice/session-setup"

/**
 * Mesin LIVE: percakapan suara asli dengan Gemini Live (native speech-to-speech).
 *
 * Browser ⇄ Gemini Live langsung lewat WebSocket memakai token sementara dari /api/voice/session.
 * Tool call agen dijalankan di sini karena tiket, tagihan, akun, popup, dan dialog pembayaran ada
 * di browser. Popup dan perilakunya sama dengan naskah simulasi (lib/voice/demo-script.ts).
 */

type Args = Record<string, unknown>
type ToolResult = Record<string, unknown>

interface FunctionCall {
  id: string
  name: string
  args?: Args
}

interface ServerMessage {
  setupComplete?: object
  serverContent?: {
    modelTurn?: { parts?: { inlineData?: { data?: string; mimeType?: string } }[] }
    inputTranscription?: { text?: string }
    outputTranscription?: { text?: string }
    turnComplete?: boolean
    interrupted?: boolean
  }
  toolCall?: { functionCalls?: FunctionCall[] }
  toolCallCancellation?: { ids?: string[] }
  goAway?: { timeLeft?: string }
}

interface SessionConfig {
  url: string
  setup: object
}

interface Session {
  prepared: PreparedSession
  ws: WebSocket | null
  audio: LiveAudio | null
  unsubscribe: (() => void) | null
  /** Data yang sudah dikonfirmasi selama sesi. */
  data: {
    name: string
    email: string
    phone: string
    company: string
    plan: PlanId | null
    upgradeFrom: PlanId | null
    periodEnd: string | null
    paid: boolean
    accountEmail: string | null
  }
  agentMessageId: string | null
  userMessageId: string | null
  /** Lampiran (kartu paket/akun) untuk ucapan Mbee berikutnya. */
  pendingAttachment: MessageAttachment | null
  /** Ekspresi saat Mbee berbicara berikutnya (mis. senang setelah lunas). */
  moodHint: "happy" | "confused" | null
  activeCalls: Set<string>
  cancelAsk: (() => void) | null
  /** Diisi runToolCalls: dipanggil saat tool mulai menunggu pelanggan (popup/jendela pembayaran tampil). */
  onWaiting: ((shown: string) => void) | null
  /** Tool popup yang sedang menunggu pelanggan (nama + argumen), untuk menolak panggilan ganda. */
  waitingKey: string | null
  /** Hasil akhir tool popup yang sedang menunggu (dipakai jawab_popup saat pelanggan menjawab lisan). */
  waitingExecution: Promise<ToolResult> | null
  /** Tool popup yang hasilnya sudah dikembalikan lewat jawab_popup, jadi [HASIL ...]-nya tidak dikirim lagi. */
  takenOver: Set<string>
  ready: boolean
  /** akhiri_sesi dipanggil sebelum salam penutup: tutup sesi setelah giliran Mbee berikutnya selesai. */
  endAfterTurn: boolean
  /** Mbee sudah bicara sejak pelanggan terakhir bicara (dipakai supaya kalimat "cek di layar" tidak diulang). */
  agentSpokeSinceUser: boolean
  /** Penjaga giliran: memastikan Mbee menjawab setelah pelanggan selesai bicara. */
  turn: {
    timer: ReturnType<typeof setInterval> | null
    /** Pelanggan sudah bicara dan belum ada jawaban Mbee. */
    awaitingReply: boolean
    lastVoiceAt: number
    noiseFloor: number
    streamEndSent: boolean
    slowNotified: boolean
  }
  ending: boolean
}

const CONNECT_TIMEOUT_MS = 15_000
/** Pelanggan dianggap selesai bicara setelah hening selama ini (cadangan bila VAD Gemini belum menutup giliran). */
const USER_DONE_MS = 1_500
/** Jawaban belum datang selama ini setelah pelanggan selesai: beri tahu koneksi lambat. */
const SLOW_REPLY_MS = 9_000
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

let current: Session | null = null

const voice = () => useVoiceStore.getState()

export function isLiveSessionActive(): boolean {
  return current !== null
}

// ─── Utilitas ────────────────────────────────────────────────────────────────

function text(args: Args, key: string, max = 600): string {
  const value = args[key]
  return typeof value === "string" ? value.trim().slice(0, max) : ""
}

function send(session: Session, payload: object) {
  if (session.ws?.readyState === WebSocket.OPEN) session.ws.send(JSON.stringify(payload))
}

function currentTicket() {
  const id = voice().ticketId
  return id ? useTicketStore.getState().tickets.find((t) => t.id === id) : undefined
}

async function updateTicket(patch: Partial<TicketInput>, event?: Omit<JourneyEvent, "at">) {
  const id = voice().ticketId
  if (id) await ticketRepository.update(id, patch, event)
}

function setStage(stage: JourneyStage) {
  voice().patch({ stage })
}

function emailTaken(email: string): boolean {
  const normalized = normalizeEmail(email)
  return allAccounts().some((a) => a.email === normalized)
}

/**
 * Tool mulai menunggu pelanggan (popup/jendela pembayaran tampil). runToolCalls lalu langsung menjawab
 * Gemini "menunggu_pelanggan" supaya Mbee bisa bicara selama pelanggan memilih; hasil akhirnya dikirim
 * belakangan sebagai pesan [HASIL nama_tool]. Hanya sinyal pertama per tool call yang dipakai.
 */
function signalWaiting(session: Session, shown: string) {
  const notify = session.onWaiting
  session.onWaiting = null
  notify?.(shown)
}

/** Popup yang bisa dibatalkan bila agen membatalkan tool call (null = batal). */
function ask(session: Session, question: Omit<VoiceQuestion, "id">): Promise<QuestionAnswer | null> {
  const choices = question.options.map((o) => `${o.value} (${o.label})`).join("; ")
  const free = question.revise || question.other ? " Pelanggan juga bisa mengoreksi dengan teks sendiri." : ""
  signalWaiting(session, `Popup "${question.header}" tampil: ${question.question}${choices ? ` Opsi: ${choices}.` : ""}${free}`)
  return new Promise((resolve) => {
    session.cancelAsk = () => {
      session.cancelAsk = null
      cancelQuestion()
      resolve(null)
    }
    if (!session.audio?.isPlaying()) voice().patch({ mood: "listening" })
    void askQuestion(question).then((answer) => {
      session.cancelAsk = null
      resolve(answer)
    })
  })
}

const CANCELLED: ToolResult = { ok: false, dibatalkan: true }

/**
 * Tool yang sengaja TIDAK dijawab ke Gemini. Dipakai akhiri_sesi: jawaban apa pun memancing giliran bicara
 * baru setelah salam penutup, yang keluar sebagai token kosong seperti "<no speech> pause".
 */
const NO_RESPONSE: ToolResult = { ok: true }

/** Tool yang membuka popup atau jendela pembayaran dan menunggu pelanggan. */
const POPUP_TOOLS = new Set<string>([TOOL.reportIssue, TOOL.confirmData, TOOL.showPlans, TOOL.choosePlan, TOOL.emailTaken, TOOL.askChoice, TOOL.openPayment])

// ─── Transkrip ───────────────────────────────────────────────────────────────

/** Token non-ucapan dari transkripsi Gemini, mis. "<no speech>", "<noise>", "[pause]". */
const NON_SPEECH_TAG = /<[^<>]*>|\[[^\[\]]*\]/g
/** Sisa transkrip yang hanya berisi penanda jeda, tanpa kata sungguhan. */
const ONLY_PAUSE = /^[\s.,…-]*(?:(?:pause|jeda|silence|noise)[\s.,…-]*)*$/i

function cleanSpeech(chunk: string): string {
  return chunk.replace(NON_SPEECH_TAG, "")
}

/** Tutup pesan transkrip; pesan yang ternyata kosong atau hanya penanda jeda dihapus dari transkrip. */
function closeMessage(id: string | null) {
  if (!id) return
  const message = voice().messages.find((m) => m.id === id)
  if (message && ONLY_PAUSE.test(message.text) && !message.attachment) {
    voice().patch({ messages: voice().messages.filter((m) => m.id !== id) })
  } else voice().updateMessage(id, { streaming: false })
}

function closeAgentMessage(session: Session) {
  closeMessage(session.agentMessageId)
  session.agentMessageId = null
}

function closeUserMessage(session: Session) {
  closeMessage(session.userMessageId)
  session.userMessageId = null
}

function appendText(id: string, chunk: string) {
  const message = voice().messages.find((m) => m.id === id)
  if (message) voice().updateMessage(id, { text: message.text + chunk })
}

function appendUser(session: Session, raw: string) {
  const chunk = cleanSpeech(raw)
  if (!chunk.trim() && !session.userMessageId) return
  session.agentSpokeSinceUser = false
  closeAgentMessage(session)
  if (!session.userMessageId) {
    session.userMessageId = voice().pushMessage({ role: "user", text: chunk.trimStart(), streaming: true })
  } else appendText(session.userMessageId, chunk)
  if (!session.audio?.isPlaying() && !voice().question) voice().patch({ mood: "listening" })
}

function appendAgent(session: Session, raw: string) {
  const chunk = cleanSpeech(raw)
  if (!chunk.trim() && !session.agentMessageId) return
  if (chunk.trim() && !ONLY_PAUSE.test(chunk)) session.agentSpokeSinceUser = true
  closeUserMessage(session)
  if (!session.agentMessageId) {
    const attachment = session.pendingAttachment ?? undefined
    session.pendingAttachment = null
    session.agentMessageId = voice().pushMessage({ role: "agent", text: chunk.trimStart(), streaming: true, attachment })
  } else appendText(session.agentMessageId, chunk)
}

/** Lampiran yang belum sempat menempel (agen tidak berbicara lagi) dipasang ke ucapan terakhir. */
function flushAttachment(session: Session) {
  if (!session.pendingAttachment) return
  const last = [...voice().messages].reverse().find((m) => m.role === "agent")
  if (last) voice().updateMessage(last.id, { attachment: session.pendingAttachment })
  session.pendingAttachment = null
}

// ─── Konteks awal ────────────────────────────────────────────────────────────

function kickoffText(prepared: PreparedSession): string {
  const today = formatDate(new Date().toISOString())
  if (prepared.mode === "guest" || !prepared.profile || !prepared.member) {
    return `[KONTEKS SESI] Mode: tamu di landing ${PLATFORM_DOMAIN}, belum login dan belum punya akun. Tanggal hari ini ${today}.
Mulai sekarang: sapa singkat, perkenalkan dirimu sebagai Mbee, dan minta pelanggan menceritakan kendala usahanya. Satu pertanyaan saja.`
  }
  const { profile, member } = prepared
  const active = profile.activePlan
  const plans = active
    ? `Paket aktif: ${getPlan(active.planId).name}, berlaku sampai ${formatDate(active.periodEnd)}. Paket yang bisa di-upgrade: ${
        higherPlans(active.planId)
          .map((p) => {
            const diff = upgradePrice(active.planId, p.id)
            return `${p.name} (${diff === null ? "custom lewat tim sales" : `bayar selisih ${formatRupiah(diff)}`})`
          })
          .join(", ") || "tidak ada, sudah paket tertinggi"
      }.`
    : "Belum berlangganan paket apa pun."
  return `[KONTEKS SESI] Mode: klien sudah login di dashboard. Tanggal hari ini ${today}.
Nama: ${profile.personName}. Nama usaha: ${profile.accountName}. Email: ${member.email}. WhatsApp: ${member.phone || "-"}.
${plans}
Mulai sekarang: sapa dengan nama depannya sesuai alur ${active ? "B" : "A"}. Satu pertanyaan saja.`
}

// ─── Eksekutor tool ──────────────────────────────────────────────────────────

const TEMPLATE_BY_KIND: Record<string, TicketTemplate> = {
  onboarding: "onboarding_payment",
  upgrade: "billing",
  teknis: "technical",
  umum: "general",
}

const PAGE_PATH: Record<string, string> = {
  riwayat_penagihan: "/dashboard/billing/history",
  penagihan: "/dashboard/billing",
  mulai: "/dashboard/get-started",
}

const SENTIMENTS: Sentiment[] = ["positive", "neutral", "negative"]

/** Catat paket pilihan pelanggan (baru atau upgrade) ke sesi, tiket, dan kartu paket di transkrip. */
async function applyPlan(session: Session, planId: PlanId, how: "dipilih di popup" | "dikonfirmasi pelanggan"): Promise<ToolResult> {
  const { prepared, data } = session
  const plan = getPlan(planId)
  const active = prepared.profile?.activePlan
  session.pendingAttachment = { type: "plan", planId: plan.id }

  if (active) {
    const from = getPlan(active.planId)
    const diff = upgradePrice(from.id, plan.id)
    Object.assign(data, { plan: plan.id, upgradeFrom: from.id, periodEnd: active.periodEnd })
    await updateTicket(
      {
        template: "billing",
        paymentStatus: null,
        planId: plan.id,
        amount: plan.monthlyPrice ?? 0,
        ...(currentTicket()?.title.startsWith("Sesi Voice AI") ? { title: `Upgrade paket · ${prepared.profile?.accountName}` } : {}),
      },
      { stage: "recommendation", label: `Upgrade ${how}: ${from.name} → ${plan.name}` }
    )
    return {
      ok: true,
      paket: plan.name,
      upgrade_dari: from.name,
      harga_normal_per_bulan: plan.monthlyPrice === null ? "custom" : formatRupiah(plan.monthlyPrice),
      bayar_sekarang: diff === null ? "custom lewat tim sales (Enterprise)" : formatRupiah(diff),
      masa_berlaku_tetap_sampai: formatDate(active.periodEnd),
    }
  }

  Object.assign(data, { plan: plan.id, upgradeFrom: null, periodEnd: null })
  await updateTicket(
    { planId: plan.id, amount: plan.monthlyPrice ?? 0 },
    { stage: "recommendation", label: `Paket layanan ${how}: ${plan.name}` }
  )
  return {
    ok: true,
    paket: plan.name,
    harga_per_bulan: plan.monthlyPrice === null ? "custom lewat tim sales" : formatRupiah(plan.monthlyPrice),
  }
}

async function executeTool(session: Session, name: string, args: Args): Promise<ToolResult> {
  const { prepared, data } = session
  const guest = prepared.mode === "guest"

  switch (name) {
    case TOOL.noteNeeds: {
      const existing = currentTicket()?.summary ?? summary({})
      const obstacle = text(args, "kendala")
      const needs = [existing.needs, text(args, "kebutuhan"), text(args, "keinginan")].filter(Boolean)
      setStage(obstacle ? "data" : "discovery")
      await updateTicket(
        {
          summary: { ...existing, needs: [...new Set(needs)].join(" "), obstacles: obstacle || existing.obstacles },
          ...(obstacle ? { priority: "high" as const } : {}),
        },
        { stage: obstacle ? "data" : "discovery", label: obstacle ? `Kendala dicatat: ${obstacle}` : "Kebutuhan pelanggan tercatat" }
      )
      return { ok: true }
    }

    case TOOL.reportIssue: {
      if (guest || !prepared.member) {
        return { ok: false, error: "Pelapor harus klien yang sudah masuk. Arahkan pelanggan untuk masuk ke dashboard, lalu melapor lewat Mbee di sana." }
      }
      const category: IssueCategory = ISSUE_CATEGORIES.find((c) => c === args.kategori) ?? "other"
      const priority: Priority = PRIORITIES.find((p) => p === args.urgensi) ?? "medium"
      const title = text(args, "judul", 120) || "Kendala klien"
      const proposed = text(args, "ringkasan", 1200)
      if (!proposed) return { ok: false, error: "ringkasan kendala kosong; gali dulu apa yang terjadi" }
      const since = text(args, "sejak", 120)
      const impact = text(args, "dampak", 400)
      setStage("handling")

      const answer = await ask(session, {
        header: "Konfirmasi kendala",
        question: "Ringkasan kendala ini sudah benar?",
        options: [
          {
            value: proposed,
            label: "Ya, kirim tiket",
            description: `${ISSUE_CATEGORY_LABEL[category]} · Urgensi ${PRIORITY_LABEL[priority]} · ${proposed}`,
          },
        ],
        revise: { label: "Revisi ringkasan", placeholder: "Perbaiki ringkasan kendala" },
      })
      if (!answer) return CANCELLED

      const now = new Date()
      const accountName = prepared.profile?.accountName ?? prepared.ticket.companyName
      const report: IssueReport = { category, since, impact, urgencyReason: text(args, "alasan_urgensi", 300), reportedAt: now.toISOString() }
      const patch: Partial<TicketInput> = {
        template: "technical",
        title: `${title} · ${accountName}`,
        priority,
        dueDate: responseDueDate(priority, now),
        issueStatus: "open",
        paymentStatus: null,
        paymentMethod: null,
        amount: 0,
        planId: prepared.profile?.activePlan?.planId ?? null,
        summary: {
          overview: answer.value.trim(),
          needs: "Kendala ditangani dan diselesaikan tim Mbee Platform.",
          obstacles: [since && `Sejak ${since}`, impact && `Dampak: ${impact}`].filter(Boolean).join(". "),
          nextAction: `Tim merespons ${URGENCY_RESPONSE_LABEL[priority]} lewat email.`,
          sentiment: priority === "urgent" || priority === "high" ? "negative" : "neutral",
        },
        report,
      }
      const label = `Kendala dilaporkan klien (${ISSUE_CATEGORY_LABEL[category]}), urgensi ${PRIORITY_LABEL[priority]} ditentukan Gemini${answer.custom ? ", ringkasan direvisi klien" : ""}`

      // Tiket sesi dipakai bila belum dipakai untuk hal lain (upgrade, kendala lain); selain itu tiket baru
      const sessionTicket = currentTicket()
      let ticketId: string
      if (sessionTicket && sessionTicket.title.startsWith("Sesi Voice AI") && !sessionTicket.report) {
        await updateTicket(patch, { stage: "handling", label })
        ticketId = sessionTicket.id
      } else {
        const created = await ticketRepository.create({
          ...EMPTY_TICKET,
          ...patch,
          accountId: prepared.accountId,
          name: prepared.ticket.name,
          email: prepared.member.email,
          phone: prepared.member.phone,
          companyName: accountName,
          journey: [{ stage: "handling", label, at: now.toISOString() }],
        })
        ticketId = created.id
        if (sessionTicket) await updateTicket({}, { stage: "handling", label: `Kendala dilaporkan sebagai tiket terpisah ${ticketId}` })
      }

      const ticket = useTicketStore.getState().tickets.find((t) => t.id === ticketId)
      const mail = ticket ? await sendTicketEmail("created", ticket) : { sent: false, detail: "tiket tidak ditemukan" }
      if (current !== session) return CANCELLED
      await ticketRepository.update(ticketId, {}, {
        stage: "handling",
        label: mail.sent ? `Email "tiket diterima" terkirim ke ${prepared.member.email}` : `Email "tiket diterima" gagal terkirim (${mail.detail ?? "—"})`,
      })
      session.pendingAttachment = {
        type: "ticket",
        ticketId,
        title,
        priority,
        responseLabel: URGENCY_RESPONSE_LABEL[priority],
        email: prepared.member.email,
        emailSent: mail.sent,
      }
      return {
        ok: true,
        nomor_tiket: ticketId,
        tiga_digit_terakhir: ticketId.slice(-3),
        urgensi: PRIORITY_LABEL[priority],
        target_respons: URGENCY_RESPONSE_LABEL[priority],
        email_terkirim: mail.sent,
        email_klien: prepared.member.email,
        ringkasan_direvisi_klien: answer.custom,
      }
    }

    case TOOL.setTicketKind: {
      if (guest) return { ok: false, error: "Hanya untuk klien yang sudah login." }
      const kind = text(args, "jenis")
      const template = TEMPLATE_BY_KIND[kind]
      if (!template) return { ok: false, error: "jenis tidak dikenal" }
      const title = text(args, "judul", 120) || "Sesi Voice AI"
      setStage(kind === "teknis" || kind === "umum" ? "handling" : "discovery")
      await updateTicket(
        {
          template,
          title: `${title} · ${prepared.profile?.accountName ?? ""}`.trim(),
          paymentStatus: template === "onboarding_payment" ? "unpaid" : null,
          planId: prepared.profile?.activePlan?.planId ?? null,
        },
        { stage: voice().stage ?? "discovery", label: `Topik sesi: ${title}` }
      )
      return { ok: true }
    }

    case TOOL.showPlans:
    case TOOL.choosePlan: {
      setStage("recommendation")
      const active = prepared.profile?.activePlan
      const from = active ? getPlan(active.planId) : null

      // Pelanggan sudah menyebut paketnya: popup konfirmasi khusus paket itu (bukan semua pilihan)
      if (name === TOOL.choosePlan) {
        const wanted = args.paket
        if (!PLANS.some((p) => p.id === wanted)) return { ok: false, error: "paket tidak dikenal" }
        const plan = getPlan(wanted as PlanId)
        if (from && planRank(plan.id) <= planRank(from.id)) {
          return {
            ok: false,
            alasan: `Paket aktif ${from.name}; paket ${plan.name} tidak bisa dipilih karena hanya paket di atas paket aktif yang tersedia. Jelaskan ke pelanggan, lalu tawarkan pilihan lewat ${TOOL.showPlans}.`,
          }
        }
        const diff = from ? upgradePrice(from.id, plan.id) : null
        const price =
          plan.monthlyPrice === null
            ? "Custom, dihubungi tim sales"
            : from
              ? `Bayar selisih ${formatRupiah(diff ?? 0)} (normal ${formatRupiah(plan.monthlyPrice)}/bln)`
              : `${formatRupiah(plan.monthlyPrice)}/bln`
        const confirmed = await ask(session, {
          header: "Konfirmasi paket",
          question: from ? `Upgrade dari ${from.name} ke ${plan.name}?` : `Lanjut dengan paket ${plan.name}?`,
          options: [
            { value: plan.id, label: `Ya, pilih ${plan.name}`, description: `${price} · ${plan.features.slice(0, 4).join(", ")}` },
            { value: "other", label: "Lihat paket lain", description: from ? "Tampilkan paket di atas paket aktif" : "Tampilkan semua pilihan paket" },
          ],
        })
        if (!confirmed) return CANCELLED
        if (confirmed.value !== "other") return applyPlan(session, plan.id, "dikonfirmasi pelanggan")

        const others = await ask(session, {
          header: from ? "Upgrade paket" : "Pilih paket",
          question: from ? `Naik dari ${from.name} ke paket mana?` : "Paket layanan mana yang ingin diaktifkan?",
          options: from ? upgradeOptions(from.id) : planOptions(plan.id),
        })
        if (!others) return CANCELLED
        return { ...(await applyPlan(session, others.value as PlanId, "dipilih di popup")), pelanggan_melihat_paket_lain: true }
      }

      if (from && active) {
        const options = upgradeOptions(from.id)
        if (options.length === 0) {
          await updateTicket({ issueStatus: "resolved" }, { stage: "recommendation", label: "Sudah di paket tertinggi, tidak ada upgrade" })
          return { ok: false, alasan: `Paket ${from.name} sudah paket tertinggi, tidak ada yang bisa di-upgrade.` }
        }
        const answer = await ask(session, { header: "Upgrade paket", question: `Naik dari ${from.name} ke paket mana?`, options })
        if (!answer) return CANCELLED
        return applyPlan(session, answer.value as PlanId, "dipilih di popup")
      }

      const recommended = PLANS.some((p) => p.id === args.rekomendasi) ? (args.rekomendasi as PlanId) : "starter"
      const answer = await ask(session, {
        header: "Pilih paket",
        question: "Paket layanan mana yang ingin diaktifkan?",
        options: planOptions(recommended),
      })
      if (!answer) return CANCELLED
      return { ...(await applyPlan(session, answer.value as PlanId, "dipilih di popup")), sesuai_rekomendasi: answer.value === recommended }
    }

    case TOOL.confirmData: {
      const kind = text(args, "jenis")
      if (kind !== "nama" && kind !== "nama_usaha" && kind !== "email" && kind !== "telepon") {
        return { ok: false, error: "jenis harus nama, nama_usaha, email, atau telepon" }
      }
      setStage("data")
      let heard = text(args, "nilai", 120)
      if (kind === "email") heard = heard.toLowerCase().replace(/\s+/g, "")
      const config = {
        nama: { header: "Konfirmasi nama", question: "Apakah nama Anda sudah benar?", input: "text", what: "nama", label: "Nama" },
        nama_usaha: { header: "Konfirmasi nama usaha", question: "Apakah nama usaha Anda sudah benar?", input: "text", what: "nama usaha", label: "Nama usaha" },
        email: { header: "Konfirmasi email", question: "Apakah email Anda sudah benar?", input: "email", what: "email", label: "Email" },
        telepon: { header: "Konfirmasi nomor", question: "Apakah nomor WhatsApp Anda sudah benar?", input: "phone", what: "nomor", label: "Nomor WhatsApp" },
      }[kind]
      const answer = await ask(
        session,
        confirmQuestion(config.header, config.question, heard, config.input as "text" | "email" | "phone", config.what)
      )
      if (!answer) return CANCELLED
      const value = kind === "email" ? normalizeEmail(answer.value) : answer.value.trim()
      if (kind === "email" && !EMAIL_RE.test(value)) {
        return { ok: false, error: "Format email tidak valid. Minta pelanggan menyebutkan emailnya lagi." }
      }
      if (kind === "nama_usaha") {
        data.company = value
        await updateTicket(
          { companyName: value, ...(guest ? { title: `Calon klien · ${value}` } : {}) },
          { stage: "data", label: confirmLabel(answer, config.label) }
        )
        return { ok: true, nilai: value, dikoreksi: answer.custom }
      }
      const field = kind === "nama" ? "name" : kind === "email" ? "email" : "phone"
      data[field] = value
      await updateTicket({ [field]: value }, { stage: "data", label: confirmLabel(answer, config.label) })

      const result: ToolResult = { ok: true, nilai: value, dikoreksi: answer.custom }
      if (kind === "nama") result.nama_depan = value.split(" ")[0]
      if (kind === "email" && guest) {
        const taken = emailTaken(value)
        result.email_sudah_terdaftar = taken
        if (taken) {
          session.pendingAttachment = { type: "login", email: value, loginHref: `/login?email=${encodeURIComponent(value)}` }
          session.moodHint = "confused"
          await updateTicket({}, { stage: "data", label: `Email ${value} sudah terdaftar, tidak dipakai untuk akun baru` })
        }
      }
      return result
    }

    case TOOL.emailTaken: {
      if (!guest) return { ok: false, error: "Hanya untuk tamu landing." }
      const choice = await ask(session, {
        header: "Email sudah terdaftar",
        question: "Mau lanjut dengan email lain?",
        options: [
          { value: "other", label: "Pakai email lain", description: "Buat akun baru dengan email berbeda" },
          { value: "login", label: "Masuk ke akun ini", description: "Tombol masuk ada di kartu, dibuka di tab baru" },
        ],
      })
      if (!choice) return CANCELLED
      if (choice.value === "login") {
        await updateTicket(
          {
            summary: summary({ overview: `Email ${data.email} sudah punya akun, calon klien diarahkan masuk ke akun tersebut.`, nextAction: "Tidak ada tindak lanjut." }),
            issueStatus: "resolved",
          },
          { stage: "data", label: "Calon klien diarahkan masuk ke akun yang sudah ada" }
        )
        return { ok: true, pilihan: "masuk_ke_akun" }
      }
      const typed = await ask(session, {
        header: "Email baru",
        question: "Email apa yang ingin dipakai?",
        options: [],
        other: { label: "Ketik email baru", placeholder: "nama@email.com", kind: "email" },
      })
      if (!typed) return CANCELLED
      const email = normalizeEmail(typed.value)
      data.email = email
      await updateTicket({ email }, { stage: "data", label: `Email diganti pelanggan: ${email}` })
      const taken = emailTaken(email)
      if (taken) {
        session.pendingAttachment = { type: "login", email, loginHref: `/login?email=${encodeURIComponent(email)}` }
        await updateTicket({}, { stage: "data", label: `Email ${email} sudah terdaftar, tidak dipakai untuk akun baru` })
      }
      return { ok: true, pilihan: "email_baru", email, email_sudah_terdaftar: taken }
    }

    case TOOL.openPayment: {
      if (!data.plan) return { ok: false, error: `Paket belum dipilih; panggil ${TOOL.showPlans} dulu.` }
      if (guest) {
        const missing = [!data.name && "nama", !data.email && "email", !data.phone && "nomor WhatsApp"].filter(Boolean)
        if (missing.length) return { ok: false, data_kurang: missing }
        if (emailTaken(data.email)) return { ok: false, error: "Email sudah terdaftar; minta email lain dulu." }
      }
      setStage("payment")
      const plan = getPlan(data.plan)
      if (plan.monthlyPrice === null) {
        await updateTicket({}, { stage: "payment", label: "Menunggu penawaran paket Enterprise dari tim sales" })
        return { ok: true, status: "enterprise", catatan: "Tidak ada pembayaran langsung. Tim sales menghubungi lewat WhatsApp untuk penawaran." }
      }
      await updateTicket({ paymentStatus: "pending" }, { stage: "payment", label: `Tagihan paket ${plan.name} dibuat` })
      voice().patch({ mood: "listening" })
      const checkout = openCheckout(prepared.accountId, plan.id, "voice", data.upgradeFrom)
      signalWaiting(session, `Jendela pembayaran paket ${plan.name} tampil; pelanggan memilih metode dan membayar.`)
      const outcome = await checkout
      if (current !== session) return CANCELLED

      if (outcome.status === "paid") {
        const method = PAYMENT_METHOD_LABEL[outcome.method]
        const until = data.upgradeFrom && data.periodEnd ? new Date(data.periodEnd) : new Date()
        if (!data.upgradeFrom) until.setMonth(until.getMonth() + 1)
        data.paid = true
        session.moodHint = "happy"
        await updateTicket(
          { paymentMethod: outcome.method, paymentStatus: "paid" },
          { stage: "payment", label: `Pembayaran ${method} lunas · ${outcome.invoiceId}` }
        )
        return { ok: true, status: "lunas", paket: plan.name, metode: method, jumlah: formatRupiah(outcome.amount), aktif_sampai: formatDate(until.toISOString()) }
      }
      if (outcome.status === "failed") {
        const method = PAYMENT_METHOD_LABEL[outcome.method]
        session.moodHint = "confused"
        await updateTicket(
          { paymentMethod: outcome.method, paymentStatus: "failed" },
          { stage: "payment", label: `Pembayaran ${method} gagal: ${outcome.reason}` }
        )
        return { ok: true, status: "gagal", metode: method, alasan: outcome.reason, catatan: "Tidak ada dana yang terpotong." }
      }
      await updateTicket({ paymentStatus: "unpaid" }, { stage: "payment", label: "Pembayaran dibatalkan pelanggan" })
      return { ok: true, status: "dibatalkan", catatan: "Jendela pembayaran ditutup sebelum pembayaran selesai." }
    }

    case TOOL.askChoice: {
      const raw = Array.isArray(args.opsi) ? (args.opsi as Args[]) : []
      const options = raw
        .map((o) => ({ value: text(o, "nilai", 60), label: text(o, "label", 80), description: text(o, "keterangan", 120) || undefined }))
        .filter((o) => o.value && o.label)
        .slice(0, 4)
      if (options.length < 2) return { ok: false, error: "butuh 2 sampai 4 opsi dengan nilai dan label" }
      const answer = await ask(session, {
        header: text(args, "judul", 30) || "Pilihan",
        question: text(args, "pertanyaan", 160) || "Silakan pilih",
        options,
      })
      if (!answer) return CANCELLED
      return { ok: true, nilai: answer.value, label: answer.label }
    }

    case TOOL.createAccount: {
      if (!guest) return { ok: false, error: "Hanya untuk tamu landing." }
      if (data.accountEmail) return { ok: true, sudah_dibuat: true, email: data.accountEmail }
      if (!data.paid || !data.plan) return { ok: false, error: "Pembayaran belum lunas; akun dibuat setelah lunas." }
      const missing = [!data.name && "nama", !data.email && "email", !data.phone && "nomor WhatsApp"].filter(Boolean)
      if (missing.length) return { ok: false, data_kurang: missing }
      setStage("account")
      voice().patch({ mood: "thinking" })
      const company = data.company || data.name
      const { account, tempPassword } = useAccountStore.getState().provision({
        id: prepared.accountId,
        name: company,
        personName: data.name,
        email: data.email,
        phone: data.phone,
      })
      data.accountEmail = account.email

      let emailSent = false
      try {
        const res = await fetch("/api/voice/email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ to: account.email, personName: data.name, businessName: company, planName: getPlan(data.plan).name, password: tempPassword }),
        })
        emailSent = Boolean(((await res.json()) as { sent?: boolean }).sent)
      } catch {
        emailSent = false
      }
      if (current !== session) return CANCELLED

      session.pendingAttachment = {
        type: "credentials",
        email: account.email,
        password: tempPassword,
        loginHref: `/login?email=${encodeURIComponent(account.email)}`,
        emailSent,
      }
      session.moodHint = "happy"
      await updateTicket(
        { title: `Onboarding akun · ${company}` },
        {
          stage: "account",
          label: `Akun dibuat (${account.email}), ${emailSent ? "kata sandi sementara dikirim ke email" : "email kredensial belum terkirim"}`,
        }
      )
      return {
        ok: true,
        email: account.email,
        email_terkirim: emailSent,
        catatan: "Kata sandi sementara hanya tampil di kartu di layar; jangan diucapkan.",
      }
    }

    case TOOL.openPage: {
      if (guest) return { ok: false, error: "Hanya untuk klien yang sudah login." }
      const path = PAGE_PATH[text(args, "halaman")]
      if (!path) return { ok: false, error: "halaman tidak dikenal" }
      return navigate(path) ? { ok: true } : { ok: false, error: "halaman tidak bisa dibuka dari sini" }
    }

    case TOOL.saveSummary: {
      if (currentTicket()?.report) return { ok: true, catatan: "Ringkasan kendala sudah tersimpan di tiket; tidak diubah." }
      setStage("summary")
      const existing = currentTicket()?.summary ?? summary({})
      const sentiment = SENTIMENTS.includes(args.sentimen as Sentiment) ? (args.sentimen as Sentiment) : "neutral"
      await updateTicket(
        {
          summary: {
            overview: text(args, "ringkasan", 1200) || existing.overview,
            needs: text(args, "kebutuhan") || existing.needs,
            obstacles: text(args, "kendala") || existing.obstacles,
            nextAction: text(args, "tindak_lanjut") || existing.nextAction,
            sentiment,
          },
        },
        { stage: "summary", label: "Ringkasan sesi disimpan" }
      )
      return { ok: true }
    }

    case TOOL.answerPopup: {
      const question = voice().question
      const pending = session.waitingExecution
      const pendingKey = session.waitingKey
      if (!question || !pending || !pendingKey) return { ok: false, error: "Tidak ada popup yang sedang menunggu jawaban." }
      const raw = text(args, "nilai", 200)
      if (!raw) return { ok: false, error: "nilai kosong" }
      const lower = raw.toLowerCase()
      const option = question.options.find((o) => o.value.toLowerCase() === lower || o.label.toLowerCase() === lower)
      let answer: QuestionAnswer
      if (option) answer = { value: option.value, label: option.label, custom: false }
      else if (question.revise || question.other) {
        const kind = question.other?.kind ?? "text"
        if (kind === "email" && !EMAIL_RE.test(raw)) return { ok: false, error: "Format email tidak valid; minta pelanggan mengulang atau mengetik di layar." }
        const digits = raw.replace(/D/g, "")
        if (kind === "phone" && (digits.length < 10 || digits.length > 14)) {
          return { ok: false, error: "Nomor telepon harus 10-14 digit; minta pelanggan mengulang atau mengetik di layar." }
        }
        answer = { value: raw, label: raw, custom: raw !== (question.options[0]?.value ?? "") }
      } else {
        return { ok: false, error: `Pilihan tidak dikenal. Opsi yang ada: ${question.options.map((o) => `${o.value} (${o.label})`).join("; ")}` }
      }
      // Hasil popup dikembalikan lewat tool ini, bukan lewat pesan [HASIL ...]
      session.takenOver.add(pendingKey)
      session.waitingKey = null
      session.waitingExecution = null
      answerQuestion(answer)
      const result = await pending
      return { ...result, dijawab_lisan: true }
    }

    case TOOL.endSession: {
      session.ending = true
      if (session.agentSpokeSinceUser) {
        // Salam penutup sudah diucapkan: tutup setelah suaranya selesai, tanpa memancing ucapan lagi
        void finishAfterSpeech(session)
        return NO_RESPONSE
      }
      // Belum berpamitan: minta satu salam penutup, sesi ditutup setelah giliran itu selesai
      session.endAfterTurn = true
      setTimeout(() => void finishAfterSpeech(session), 12_000)
      return { ok: true, instruksi: "Ucapkan SATU kalimat salam penutup singkat sekarang, tanpa pertanyaan. Setelah itu sesi ditutup otomatis." }
    }

    default:
      return { ok: false, error: `tool tidak dikenal: ${name}` }
  }
}

async function runToolCalls(session: Session, calls: FunctionCall[]) {
  closeAgentMessage(session)
  const responses: { id: string; name: string; response: ToolResult }[] = []
  for (const call of calls) {
    // Model kadang memanggil tool popup yang sama lagi selagi popup-nya masih tampil: jangan buka ulang
    const key = `${call.name}:${JSON.stringify(call.args ?? {})}`
    if (session.waitingKey === key) {
      responses.push({
        id: call.id,
        name: call.name,
        response: { ok: true, status: "menunggu_pelanggan", catatan: `Popup yang sama masih tampil. Tunggu pesan [HASIL ${call.name}].` },
      })
      continue
    }
    // Popup lain masih menunggu: jangan tumpuk popup baru (popup lama akan tertinggal di layar)
    if (session.waitingKey && POPUP_TOOLS.has(call.name)) {
      responses.push({
        id: call.id,
        name: call.name,
        response: {
          ok: false,
          error: `Popup sebelumnya masih menunggu jawaban. Bila pelanggan sudah menjawab secara lisan, panggil ${TOOL.answerPopup} dulu; bila belum, minta pelanggan memilih di layar.`,
        },
      })
      continue
    }
    session.activeCalls.add(call.id)
    console.info("[voice] tool", call.name, call.args ?? {})
    if (!session.audio?.isPlaying()) voice().patch({ mood: "thinking" })

    const waiting = new Promise<string>((resolve) => {
      session.onWaiting = resolve
    })
    const execution = executeTool(session, call.name, call.args ?? {}).catch(
      (error: unknown): ToolResult => ({ ok: false, error: error instanceof Error ? error.message : String(error) })
    )
    const first = await Promise.race([
      execution.then((result) => ({ done: true as const, result })),
      waiting.then((shown) => ({ done: false as const, shown })),
    ])
    session.onWaiting = null
    if (current !== session) return
    // Dibatalkan agen (toolCallCancellation): jangan kirim jawaban
    if (!session.activeCalls.delete(call.id)) continue

    if (first.done) {
      if (first.result === NO_RESPONSE) continue
      if (first.result.ok === false) console.info("[voice] tool gagal, popup tidak tampil:", call.name, first.result)
      responses.push({ id: call.id, name: call.name, response: first.result })
      continue
    }

    // Popup/jendela pembayaran tampil: jawab sekarang supaya Mbee bisa mengantar pelanggan sambil menunggu,
    // lalu kirim hasil akhirnya sebagai pesan sistem setelah pelanggan selesai di layar.
    send(session, {
      toolResponse: {
        functionResponses: [
          {
            id: call.id,
            name: call.name,
            response: {
              ok: true,
              status: "menunggu_pelanggan",
              tampil_di_layar: first.shown,
              instruksi: `${
                // Kalimat pengantar cukup sekali per popup: bila Mbee sudah bicara sebelum memanggil tool, jangan diulang
                session.agentSpokeSinceUser
                  ? "Popup sudah tampil dan kamu SUDAH mengarahkan pelanggan ke layar. JANGAN mengucapkan apa pun lagi sekarang; diam dan tunggu."
                  : "Ucapkan SATU kalimat singkat yang mengarahkan pelanggan ke layar, lalu diam dan tunggu."
              } Bila pelanggan menjawab secara LISAN (mis. "iya", "benar", menyebut pilihan), LANGSUNG panggil ${TOOL.answerPopup} dengan nilai opsi yang dipilih, jangan menyuruh memilih di layar lagi. Bila pelanggan memilih di layar, hasilnya datang sebagai pesan [HASIL ${call.name}].`,
            },
          },
        ],
      },
    })
    session.waitingKey = key
    session.waitingExecution = execution
    void execution.then((result) => {
      if (session.waitingKey === key) {
        session.waitingKey = null
        session.waitingExecution = null
      }
      // Sudah dijawab lisan lewat jawab_popup: hasilnya sudah dikembalikan di sana
      if (session.takenOver.delete(key)) return
      if (current !== session || result.dibatalkan === true) return
      session.agentSpokeSinceUser = false
      send(session, {
        clientContent: {
          turns: [{ role: "user", parts: [{ text: `[HASIL ${call.name}] ${JSON.stringify(result)}` }] }],
          turnComplete: true,
        },
      })
    })
  }
  if (responses.length) send(session, { toolResponse: { functionResponses: responses } })
}

// ─── Siklus sesi ─────────────────────────────────────────────────────────────

/** Pelanggan sedang bicara (dari level mic relatif terhadap bising ruangan, atau dari transkripsi). */
function markUserVoice(session: Session) {
  const { turn } = session
  turn.lastVoiceAt = Date.now()
  turn.awaitingReply = true
  turn.streamEndSent = false
  turn.slowNotified = false
}

function trackMicLevel(session: Session, rms: number) {
  const { turn } = session
  // Lantai bising ruangan: turun cepat saat hening, naik pelan saat ada suara
  turn.noiseFloor = rms < turn.noiseFloor ? turn.noiseFloor * 0.9 + rms * 0.1 : turn.noiseFloor * 0.995 + rms * 0.005
  if (rms > Math.max(0.02, turn.noiseFloor * 3)) markUserVoice(session)
}

/** Mbee mulai menjawab (suara, transkrip, atau tool call): giliran pelanggan selesai. */
function markReply(session: Session) {
  session.turn.awaitingReply = false
}

/**
 * Cadangan bila Gemini belum menutup giliran setelah pelanggan diam: kirim audioStreamEnd supaya Gemini
 * langsung memproses, tampilkan ekspresi berpikir, dan beri tahu bila jawaban lama karena koneksi.
 */
function checkTurn(session: Session) {
  const { turn } = session
  if (current !== session || !turn.awaitingReply || voice().muted) return
  const quietFor = Date.now() - turn.lastVoiceAt
  if (!turn.streamEndSent && quietFor > USER_DONE_MS) {
    turn.streamEndSent = true
    send(session, { realtimeInput: { audioStreamEnd: true } })
    if (!session.audio?.isPlaying() && !voice().question) voice().patch({ mood: "thinking" })
    console.info("[voice] pelanggan selesai bicara, menunggu jawaban Mbee")
  }
  if (turn.streamEndSent && !turn.slowNotified && quietFor > SLOW_REPLY_MS) {
    turn.slowNotified = true
    console.info("[voice] jawaban Mbee lambat (> 9 detik)")
    toast.info(`${ASSISTANT_NAME} masih memproses`, {
      description: "Koneksi ke layanan AI sedang lambat. Tunggu sebentar, atau ulangi ucapan Anda.",
    })
  }
}

function onPlayback(session: Session, playing: boolean) {
  if (current !== session) return
  if (playing) voice().patch({ talking: true, mood: session.moodHint ?? "speaking" })
  else voice().patch({ talking: false, mood: voice().question ? "listening" : session.ending ? "happy" : "listening" })
}

function handleMessage(session: Session, message: ServerMessage) {
  if (current !== session) return

  if (message.setupComplete && !session.ready) {
    session.ready = true
    void (async () => {
      const created = await ticketRepository.create(session.prepared.ticket)
      if (current !== session) return
      voice().patch({ callStatus: "active", ticketId: created.id, mood: "listening", startedAt: Date.now() })
      session.audio?.setCapturing(!voice().muted)
      session.turn.timer = setInterval(() => checkTurn(session), 300)
      send(session, { clientContent: { turns: [{ role: "user", parts: [{ text: kickoffText(session.prepared) }] }], turnComplete: true } })
    })()
  }

  const content = message.serverContent
  if (content) {
    if (content.inputTranscription?.text) {
      markUserVoice(session)
      appendUser(session, content.inputTranscription.text)
    }
    if (content.outputTranscription?.text) {
      markReply(session)
      appendAgent(session, content.outputTranscription.text)
    }
    for (const part of content.modelTurn?.parts ?? []) {
      if (part.inlineData?.data) {
        markReply(session)
        session.audio?.enqueue(part.inlineData.data)
      }
    }
    if (content.interrupted) {
      // Pelanggan memotong: buang audio yang belum terputar
      session.audio?.clearPlayback()
      closeAgentMessage(session)
    }
    if (content.turnComplete) {
      closeAgentMessage(session)
      closeUserMessage(session)
      if (session.endAfterTurn && session.agentSpokeSinceUser) void finishAfterSpeech(session)
    }
  }

  if (message.toolCall?.functionCalls?.length) {
    markReply(session)
    void runToolCalls(session, message.toolCall.functionCalls)
  }

  if (message.toolCallCancellation?.ids?.length) {
    // Jawaban tool yang dibatalkan tidak dikirim. Popup yang sedang tampil TIDAK ditutup: popup selalu milik
    // tool yang sudah dijawab "menunggu_pelanggan", jadi pembatalan tool lain tidak boleh menghilangkannya.
    for (const id of message.toolCallCancellation.ids) session.activeCalls.delete(id)
    console.info("[voice] tool call dibatalkan Gemini", message.toolCallCancellation.ids)
  }

  if (message.goAway) toast.warning("Sesi Voice AI akan segera berakhir", { description: "Batas waktu sesi Gemini Live hampir habis." })
}

function teardown(session: Session) {
  if (session.turn.timer) clearInterval(session.turn.timer)
  session.turn.timer = null
  session.cancelAsk?.()
  cancelQuestion()
  session.unsubscribe?.()
  session.unsubscribe = null
  if (session.ws) {
    session.ws.onclose = null
    session.ws.onmessage = null
    if (session.ws.readyState === WebSocket.OPEN || session.ws.readyState === WebSocket.CONNECTING) session.ws.close(1000)
  }
  session.audio?.close()
  const checkout = usePaymentStore.getState().checkout
  if (checkout?.source === "voice") finishCheckout({ status: "cancelled", invoiceId: checkout.invoiceId })
}

function finalizeMessages() {
  voice().patch({ messages: voice().messages.map((m) => ({ ...m, streaming: false })) })
}

/** Gagal sebelum sesi aktif: kembali ke keadaan awal dan beri tahu penyebabnya. */
function fail(session: Session, title: string, description: string) {
  if (current !== session) return
  current = null
  teardown(session)
  voice().patch({ callStatus: "idle", mood: "confused", talking: false })
  setTimeout(() => {
    if (!current) voice().patch({ mood: "idle" })
  }, 2500)
  toast.error(title, { description, duration: 8000 })
}

/** Agen memanggil akhiri_sesi: tunggu ucapan penutup selesai, lalu tutup sesi dengan rapi. */
async function finishAfterSpeech(session: Session) {
  await new Promise((r) => setTimeout(r, 700))
  await session.audio?.drain()
  if (current !== session) return
  current = null
  flushAttachment(session)
  teardown(session)
  finalizeMessages()
  voice().patch({ callStatus: "ended", mood: "happy", talking: false })
  toast.success("Percakapan selesai", { description: `Tim ${PLATFORM_NAME} akan menindaklanjuti lewat WhatsApp.` })
  setTimeout(() => {
    if (!current && voice().callStatus === "ended") voice().patch({ mood: "idle" })
  }, 2500)
}

/** Koneksi tertutup tanpa diminta (jaringan, token kedaluwarsa, setup ditolak). */
async function onClose(session: Session, event: CloseEvent) {
  if (current !== session) return
  const reason = event.reason ? event.reason.slice(0, 200) : `kode ${event.code}`
  if (!session.ready) {
    fail(session, "Gagal terhubung ke Voice AI", `Gemini Live menolak sesi (${reason}). Coba lagi, atau pakai mode simulasi.`)
    return
  }
  current = null
  flushAttachment(session)
  teardown(session)
  finalizeMessages()
  voice().patch({ callStatus: "ended", mood: "idle", talking: false })
  await updateTicket({}, { stage: voice().stage ?? "greeting", label: `Sesi Voice AI terputus (${reason})` })
  toast.error("Koneksi Voice AI terputus", { description: `Data yang sudah terkumpul tetap tersimpan untuk ${PLATFORM_TEAM}.` })
}

export async function startLiveCall(): Promise<void> {
  if (current) await endLiveCall()
  voice().resetSession()
  voice().patch({ open: true, callStatus: "connecting", mood: "thinking" })

  const prepared = prepareSession(voice().mode)
  if (!prepared) {
    voice().patch({ callStatus: "idle", mood: "idle" })
    toast.error("Sesi akun tidak ditemukan", { description: "Silakan masuk lagi." })
    return
  }

  const session: Session = {
    prepared,
    ws: null,
    audio: null,
    unsubscribe: null,
    data: {
      name: prepared.ticket.name,
      email: prepared.ticket.email,
      phone: prepared.ticket.phone,
      company: prepared.ticket.companyName,
      plan: null,
      upgradeFrom: null,
      periodEnd: null,
      paid: false,
      accountEmail: null,
    },
    agentMessageId: null,
    userMessageId: null,
    pendingAttachment: null,
    moodHint: null,
    activeCalls: new Set(),
    cancelAsk: null,
    onWaiting: null,
    waitingKey: null,
    waitingExecution: null,
    takenOver: new Set(),
    ready: false,
    endAfterTurn: false,
    agentSpokeSinceUser: false,
    turn: { timer: null, awaitingReply: false, lastVoiceAt: 0, noiseFloor: 0.01, streamEndSent: false, slowNotified: false },
    ending: false,
  }
  current = session

  // 1. Mikrofon dulu, selagi masih dalam klik pengguna (izin mic + kebijakan autoplay audio)
  try {
    session.audio = await LiveAudio.open({
      onChunk: (data, rms) => {
        trackMicLevel(session, rms)
        send(session, { realtimeInput: { audio: { data, mimeType: "audio/pcm;rate=16000" } } })
      },
      onPlayback: (playing) => onPlayback(session, playing),
    })
  } catch (error) {
    const denied = error instanceof DOMException && (error.name === "NotAllowedError" || error.name === "SecurityError")
    fail(
      session,
      "Mikrofon tidak bisa dipakai",
      denied ? "Izinkan akses mikrofon di browser, lalu coba lagi. Bisa juga pakai mode simulasi." : "Mikrofon tidak ditemukan atau sedang dipakai aplikasi lain."
    )
    return
  }
  if (current !== session) return session.audio.close()
  session.audio.setCapturing(false)

  session.unsubscribe = useVoiceStore.subscribe((state, prev) => {
    if (state.muted === prev.muted || !session.ready) return
    session.audio?.setCapturing(!state.muted)
    // Beri tahu Gemini aliran audio berhenti supaya giliran pelanggan ditutup
    if (state.muted) send(session, { realtimeInput: { audioStreamEnd: true } })
  })

  // 2. Token sementara + konfigurasi dari server (API key tidak pernah sampai ke browser)
  let config: SessionConfig
  try {
    const res = await fetch("/api/voice/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: prepared.mode }),
    })
    const body = (await res.json()) as Partial<SessionConfig> & { error?: string }
    if (!res.ok || !body.url || !body.setup) throw new Error(body.error ?? `HTTP ${res.status}`)
    config = { url: body.url, setup: body.setup }
  } catch (error) {
    fail(session, "Gagal membuat sesi Voice AI", `${error instanceof Error ? error.message : "Server tidak merespons"}. Coba lagi, atau pakai mode simulasi.`)
    return
  }
  if (current !== session) return

  // 3. Hubungkan ke Gemini Live
  const ws = new WebSocket(config.url)
  ws.binaryType = "arraybuffer" // pesan diproses berurutan (Blob.text() bisa selesai tidak berurutan)
  session.ws = ws
  const decoder = new TextDecoder()
  ws.onopen = () => ws.send(JSON.stringify({ setup: config.setup }))
  ws.onmessage = (event: MessageEvent<string | ArrayBuffer>) => {
    try {
      const raw = typeof event.data === "string" ? event.data : decoder.decode(event.data)
      handleMessage(session, JSON.parse(raw) as ServerMessage)
    } catch (error) {
      console.warn("[voice] pesan Gemini tidak bisa diproses", error)
    }
  }
  ws.onclose = (event) => void onClose(session, event)

  setTimeout(() => {
    if (current === session && !session.ready) {
      fail(session, "Gagal terhubung ke Voice AI", "Gemini Live tidak merespons. Periksa koneksi internet, atau pakai mode simulasi.")
    }
  }, CONNECT_TIMEOUT_MS)
}

/** Mengakhiri sesi Live kapan saja (tombol Akhiri, keluar akun). Tiket tetap tersimpan. */
export async function endLiveCall(): Promise<void> {
  const session = current
  if (!session) return
  current = null
  const { callStatus, ticketId, stage } = voice()
  const wasRunning = callStatus === "connecting" || callStatus === "active"
  flushAttachment(session)
  teardown(session)
  finalizeMessages()
  voice().patch({ callStatus: wasRunning ? "ended" : callStatus, mood: "idle", talking: false, question: null })

  if (wasRunning && ticketId) {
    await ticketRepository.update(ticketId, {}, { stage: stage ?? "greeting", label: "Sesi diakhiri sebelum selesai" })
    toast.info("Sesi diakhiri", { description: `Data yang sudah terkumpul tetap tersimpan untuk ${PLATFORM_TEAM}.` })
  }
}
