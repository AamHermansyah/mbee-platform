import { useVoiceStore, type QuestionAnswer, type VoiceQuestion } from "@/lib/stores/voice-store"

/**
 * Jembatan antara mesin percakapan (Live AI atau naskah simulasi) dan UI widget:
 * - popup pertanyaan (QuestionPrompt) → jawaban dikembalikan ke mesin yang bertanya,
 * - navigasi halaman lewat router Next yang didaftarkan VoiceWidget.
 */

let pending: { resolve: (answer: QuestionAnswer) => void } | null = null
let questionSeq = 0
let navigateFn: ((path: string) => void) | null = null

/** Tampilkan popup dan tunggu jawabannya. Popup lama yang belum dijawab dibatalkan. */
export function askQuestion(question: Omit<VoiceQuestion, "id">): Promise<QuestionAnswer> {
  pending = null
  questionSeq += 1
  // Pastikan panel terbuka supaya popup terlihat
  useVoiceStore.getState().patch({ question: { ...question, id: `q-${questionSeq}` }, open: true })
  return new Promise<QuestionAnswer>((resolve) => {
    pending = { resolve }
  })
}

/** Jawaban dari komponen QuestionPrompt. */
export function answerQuestion(answer: QuestionAnswer) {
  const current = pending
  pending = null
  useVoiceStore.getState().patch({ question: null })
  current?.resolve(answer)
}

/** Tutup popup tanpa jawaban (sesi berakhir). Promise askQuestion tidak pernah selesai. */
export function cancelQuestion() {
  pending = null
  useVoiceStore.getState().patch({ question: null })
}

/** Komponen di dalam app mendaftarkan router supaya Voice AI bisa memindahkan halaman. */
export function registerNavigator(fn: ((path: string) => void) | null) {
  navigateFn = fn
}

export function navigate(path: string): boolean {
  if (!navigateFn) return false
  navigateFn(path)
  return true
}
