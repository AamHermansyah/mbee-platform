import { toast } from "sonner"

import { PLATFORM_NAME, PLATFORM_TEAM } from "@/lib/constants/brand"
import { ticketRepository } from "@/lib/data/ticket-repository"
import { isEmailTaken, useAccountStore } from "@/lib/stores/account-store"
import { cancelPendingCheckout, finishCheckout, openCheckout, usePaymentStore } from "@/lib/stores/payment-store"
import { useVoiceStore, type MessageAttachment } from "@/lib/stores/voice-store"
import { askQuestion, cancelQuestion, navigate } from "@/lib/voice/bridge"
import { landingConversation, memberConversation, type ConversationContext } from "@/lib/voice/demo-script"
import { prepareSession } from "@/lib/voice/session-setup"

/**
 * Mesin SIMULASI (naskah tahap 1, tanpa AI). Cadangan untuk demo bila internet/kuota bermasalah;
 * mesin utama ada di lib/voice/live/. Berjalan di luar komponen supaya sesi tetap lanjut walau
 * panel widget ditutup atau pengguna pindah halaman.
 */

const CONNECT_MS = 1200
const THINK_MS = 650
const AGENT_WORD_MS = 165
const USER_WORD_MS = 125

class RunCancelled extends Error {}

let currentRun = 0

const voice = () => useVoiceStore.getState()

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
      voice().patch({ mood: "listening", talking: false })
      return askQuestion(question)
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
      // Akun bawaan dan akun dari Voice AI, dicek ke database
      const [taken] = await Promise.all([isEmailTaken(email), sleep(350, runId)])
      ensureActive(runId)
      return taken
    },

    async provisionAccount(input) {
      ensureActive(runId)
      // Akun disimpan ke database; email tidak benar-benar dikirim (mesin Live mengirim lewat SMTP).
      const { account, tempPassword } = await useAccountStore.getState().provision({ id: accountId, ...input })
      ensureActive(runId)
      await sleep(400, runId)
      return {
        email: account.email,
        password: tempPassword,
        loginHref: `/login?email=${encodeURIComponent(account.email)}`,
      }
    },

    navigate(path) {
      ensureActive(runId)
      navigate(path)
    },
  }
}

export async function startDemoCall(): Promise<void> {
  const runId = ++currentRun
  voice().resetSession()
  voice().patch({ open: true, callStatus: "connecting", mood: "thinking" })

  try {
    await sleep(CONNECT_MS, runId)

    const session = prepareSession(voice().mode)
    if (!session) throw new RunCancelled()
    const profile = session.profile
    const run =
      session.mode === "guest" || !profile
        ? landingConversation
        : (ctx: ConversationContext) => memberConversation(ctx, profile)

    const created = await ticketRepository.create(session.ticket)
    voice().patch({ callStatus: "active", ticketId: created.id, mood: "listening", startedAt: Date.now() })

    await run(createContext(runId, session.accountId))

    voice().patch({ callStatus: "ended", mood: "happy", talking: false })
    toast.success("Percakapan selesai", { description: `Tim ${PLATFORM_NAME} akan menindaklanjuti lewat WhatsApp.` })
    await sleep(2500, runId)
    voice().patch({ mood: "idle" })
  } catch (error) {
    if (error instanceof RunCancelled) return
    if (runId !== currentRun) throw error
    // Mis. tiket atau akun tidak bisa disimpan ke database: kembali ke awal dan beri tahu.
    currentRun += 1
    cancelQuestion()
    voice().patch({ callStatus: "idle", mood: "idle", talking: false })
    toast.error("Sesi Voice AI terhenti", { description: "Data tidak bisa disimpan ke database. Periksa koneksi, lalu coba lagi." })
  }
}

/** Mengakhiri sesi simulasi kapan saja. Tiket tetap tersimpan dengan catatan sesi terputus. */
export async function endDemoCall(): Promise<void> {
  const { callStatus } = voice()
  const wasRunning = callStatus === "connecting" || callStatus === "active"
  currentRun += 1
  cancelQuestion()
  const { ticketId, stage, messages } = voice()

  // Tutup dialog pembayaran yang dibuka Voice AI
  cancelPendingCheckout()
  const checkout = usePaymentStore.getState().checkout
  if (checkout?.source === "voice") finishCheckout({ status: "cancelled", invoiceId: checkout.invoiceId })

  voice().patch({
    callStatus: wasRunning ? "ended" : callStatus,
    mood: "idle",
    talking: false,
    messages: messages.map((m) => ({ ...m, streaming: false })),
  })

  if (wasRunning && ticketId) {
    await ticketRepository.update(ticketId, {}, { stage: stage ?? "greeting", label: "Sesi diakhiri sebelum selesai" })
    toast.info("Sesi diakhiri", { description: `Data yang sudah terkumpul tetap tersimpan untuk ${PLATFORM_TEAM}.` })
  }
}
