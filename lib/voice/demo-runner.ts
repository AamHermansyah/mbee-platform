import { toast } from "sonner"

import { PLATFORM_DOMAIN, PLATFORM_NAME, PLATFORM_TEAM } from "@/lib/constants/brand"
import { ticketRepository } from "@/lib/data/ticket-repository"
import { normalizeEmail } from "@/lib/auth/accounts"
import { allAccounts, findAccountById, newProspectAccountId, useAccountStore } from "@/lib/stores/account-store"
import { useBillingStore } from "@/lib/stores/billing-store"
import { finishCheckout, openCheckout, usePaymentStore } from "@/lib/stores/payment-store"
import { useSessionStore } from "@/lib/stores/session-store"
import {
  useVoiceStore,
  type MessageAttachment,
  type QuestionAnswer,
  type VoiceQuestion,
} from "@/lib/stores/voice-store"
import type { TicketInput } from "@/lib/types"
import {
  landingConversation,
  memberConversation,
  type ConversationContext,
  type MemberProfile,
} from "@/lib/voice/demo-script"

/**
 * Pemutar naskah simulasi. Berjalan di luar komponen supaya sesi tetap
 * lanjut walau panel widget ditutup atau pengguna pindah halaman.
 */

const CONNECT_MS = 1200
const THINK_MS = 650
const AGENT_WORD_MS = 165
const USER_WORD_MS = 125

class RunCancelled extends Error {}

let currentRun = 0
let pendingAnswer: { runId: number; resolve: (answer: QuestionAnswer) => void } | null = null
let navigateFn: ((path: string) => void) | null = null
let questionSeq = 0

const voice = () => useVoiceStore.getState()

/** Komponen di dalam app mendaftarkan router supaya Voice AI bisa memindahkan halaman. */
export function registerNavigator(fn: ((path: string) => void) | null) {
  navigateFn = fn
}

function ensureActive(runId: number) {
  if (runId !== currentRun) throw new RunCancelled()
}

function sleep(ms: number, runId: number): Promise<void> {
  const scaled = ms / voice().speed
  return new Promise((resolve, reject) => {
    setTimeout(() => (runId === currentRun ? resolve() : reject(new RunCancelled())), scaled)
  })
}

async function waitWhileMuted(runId: number) {
  while (voice().muted) await sleep(200, runId)
}

async function streamMessage(role: "agent" | "user", text: string, wordMs: number, runId: number, attachment?: MessageAttachment) {
  const words = text.split(" ")
  const id = voice().pushMessage({ role, text: "", streaming: true, attachment })
  for (let i = 1; i <= words.length; i++) {
    voice().updateMessage(id, { text: words.slice(0, i).join(" ") })
    await sleep(wordMs, runId)
  }
  voice().updateMessage(id, { streaming: false })
}

/** Jawaban popup dari komponen QuestionPrompt. */
export function answerQuestion(answer: QuestionAnswer) {
  const pending = pendingAnswer
  pendingAnswer = null
  voice().patch({ question: null })
  if (pending && pending.runId === currentRun) pending.resolve(answer)
}

/**
 * accountId = akun pemilik tiket dan tagihan sesi ini.
 * Tamu landing memakai ID akun calon klien; akunnya baru dibuat setelah pembayaran lunas.
 */
function createContext(runId: number, accountId: string): ConversationContext {
  return {
    async say(text, options) {
      ensureActive(runId)
      voice().patch({ mood: "thinking", talking: false })
      await sleep(THINK_MS, runId)
      voice().patch({ mood: options?.mood ?? "speaking", talking: true })
      await streamMessage("agent", text, AGENT_WORD_MS, runId, options?.attachment)
      voice().patch({ mood: "listening", talking: false })
    },

    async hear(text) {
      ensureActive(runId)
      voice().patch({ mood: "listening", talking: false })
      await waitWhileMuted(runId)
      await sleep(450, runId)
      await streamMessage("user", text, USER_WORD_MS, runId)
    },

    ask(question) {
      ensureActive(runId)
      questionSeq += 1
      const full: VoiceQuestion = { ...question, id: `q-${questionSeq}` }
      // Pastikan panel terbuka supaya popup terlihat
      voice().patch({ question: full, open: true, mood: "listening", talking: false })
      return new Promise<QuestionAnswer>((resolve) => {
        pendingAnswer = { runId, resolve }
      })
    },

    stage(stage) {
      ensureActive(runId)
      voice().patch({ stage })
    },

    async mood(mood, ms) {
      ensureActive(runId)
      voice().patch({ mood, talking: false })
      await sleep(ms, runId)
      voice().patch({ mood: "listening" })
    },

    async updateTicket(patch, event) {
      ensureActive(runId)
      const ticketId = voice().ticketId
      if (ticketId) await ticketRepository.update(ticketId, patch, event)
      await sleep(250, runId)
    },

    async pay(planId, upgradeFrom) {
      ensureActive(runId)
      voice().patch({ mood: "listening", talking: false })
      const outcome = await openCheckout(accountId, planId, "voice", upgradeFrom ?? null)
      ensureActive(runId)
      return outcome
    },

    async emailTaken(email) {
      ensureActive(runId)
      await sleep(350, runId)
      // Tahap 2: pengecekan ke backend. Akun bawaan, akun dari Voice AI, dan akun lain dengan email yang sama.
      const normalized = normalizeEmail(email)
      return allAccounts().some((a) => a.email === normalized)
    },

    async provisionAccount(input) {
      ensureActive(runId)
      // Tahap 2: panggilan API backend yang membuat akun dan mengirim email kredensial.
      const { account, tempPassword } = useAccountStore.getState().provision({ id: accountId, ...input })
      await sleep(400, runId)
      return {
        email: account.email,
        password: tempPassword,
        loginHref: `/login?email=${encodeURIComponent(account.email)}`,
      }
    },

    navigate(path) {
      ensureActive(runId)
      navigateFn?.(path)
    },
  }
}

const EMPTY_TICKET: TicketInput = {
  title: "",
  template: "onboarding_payment",
  priority: "medium",
  assignee: null,
  accountId: null,
  dueDate: null,
  planId: null,
  name: "",
  email: "",
  phone: "",
  companyName: "",
  products: [],
  summary: { overview: "", needs: "", obstacles: "", nextAction: "", sentiment: "neutral" },
  issueStatus: "open",
  paymentMethod: null,
  paymentStatus: "unpaid",
  amount: 0,
  source: "voice_ai",
}

/** Paket aktif terbaru akun (tagihan lunas yang masa berlakunya belum habis). */
function activePlanOf(accountId: string): MemberProfile["activePlan"] {
  const now = new Date().toISOString()
  const invoice = useBillingStore
    .getState()
    .invoices.filter((i) => i.accountId === accountId && i.status === "paid" && i.periodEnd && i.periodEnd > now)
    .sort((a, b) => (b.paidAt ?? "").localeCompare(a.paidAt ?? ""))[0]
  return invoice?.periodEnd ? { planId: invoice.planId, periodEnd: invoice.periodEnd } : null
}

export function isCallRunning(): boolean {
  const status = voice().callStatus
  return status === "connecting" || status === "active"
}

/** Tombol CTA (mis. di landing): buka panel sesi yang berjalan, atau mulai sesi baru. */
export function openVoiceAssistant(): void {
  if (isCallRunning()) voice().setOpen(true)
  else void startDemoCall()
}

export async function startDemoCall(): Promise<void> {
  const runId = ++currentRun
  const mode = voice().mode
  voice().resetSession()
  voice().patch({ open: true, callStatus: "connecting", mood: "thinking" })

  try {
    await sleep(CONNECT_MS, runId)

    let accountId: string
    let run: (ctx: ConversationContext) => Promise<void>
    let ticket: TicketInput

    if (mode === "guest") {
      // Pengunjung landing: belum punya akun. Tiket dan tagihan memakai ID akun calon klien.
      accountId = newProspectAccountId()
      ticket = {
        ...EMPTY_TICKET,
        title: "Calon klien · Sesi Voice AI landing",
        accountId,
        journey: [{ stage: "greeting", label: `Sesi Voice AI dimulai dari landing ${PLATFORM_DOMAIN}`, at: new Date().toISOString() }],
      }
      run = landingConversation
    } else {
      const account = findAccountById(useSessionStore.getState().accountId)
      if (!account) throw new RunCancelled()
      accountId = account.id
      const profile: MemberProfile = { personName: account.personName, accountName: account.name, activePlan: activePlanOf(account.id) }
      ticket = {
        ...EMPTY_TICKET,
        title: `Sesi Voice AI · ${account.name}`,
        accountId,
        name: account.personName,
        email: account.email,
        phone: account.phone ?? "",
        companyName: account.name,
        journey: [{ stage: "greeting", label: "Sesi Voice AI dimulai dari dashboard klien", at: new Date().toISOString() }],
      }
      run = (ctx) => memberConversation(ctx, profile)
    }

    const created = await ticketRepository.create(ticket)
    voice().patch({ callStatus: "active", ticketId: created.id, mood: "listening", startedAt: Date.now() })

    await run(createContext(runId, accountId))

    voice().patch({ callStatus: "ended", mood: "happy", talking: false })
    toast.success("Percakapan selesai", { description: `Tim ${PLATFORM_NAME} akan menindaklanjuti lewat WhatsApp.` })
    await sleep(2500, runId)
    voice().patch({ mood: "idle" })
  } catch (error) {
    if (!(error instanceof RunCancelled)) throw error
  }
}

/** Mengakhiri sesi kapan saja. Tiket tetap tersimpan dengan catatan sesi terputus. */
export async function endCall(): Promise<void> {
  const wasRunning = isCallRunning()
  currentRun += 1
  pendingAnswer = null
  const { ticketId, stage, messages } = voice()

  // Tutup dialog pembayaran yang dibuka Voice AI
  const checkout = usePaymentStore.getState().checkout
  if (checkout?.source === "voice") finishCheckout({ status: "cancelled", invoiceId: checkout.invoiceId })

  voice().patch({
    callStatus: wasRunning ? "ended" : voice().callStatus,
    mood: "idle",
    talking: false,
    question: null,
    messages: messages.map((m) => ({ ...m, streaming: false })),
  })

  if (wasRunning && ticketId) {
    await ticketRepository.update(ticketId, {}, { stage: stage ?? "greeting", label: "Sesi diakhiri sebelum selesai" })
    toast.info("Sesi diakhiri", { description: `Data yang sudah terkumpul tetap tersimpan untuk ${PLATFORM_TEAM}.` })
  }
}
