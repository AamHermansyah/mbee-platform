import { create } from "zustand"

import type { PlanId } from "@/lib/constants/plans"
import type { JourneyStage } from "@/lib/types"

/**
 * Ekspresi avatar. avatar.riv hanya punya input boolean "Hover/Select",
 * jadi ekspresi lain dibuat dengan efek di sekitar avatar (lihat components/voice/avatar-stage.tsx).
 */
export type AvatarMood = "idle" | "listening" | "thinking" | "speaking" | "happy" | "confused"

export type CallStatus = "idle" | "connecting" | "active" | "ended"

/**
 * guest  = pengunjung landing "/" tanpa login (diskusi → bayar → akun dibuatkan).
 * member = klien yang sudah login di dashboard.
 */
export type VoiceMode = "guest" | "member"

/** Lampiran kecil di bawah ucapan agen (Voice AI tetap jadi antarmuka utama). */
export type MessageAttachment =
  | { type: "plan"; planId: PlanId }
  /** Akun yang dibuat sistem setelah pembayaran di landing, dengan kata sandi sementara. */
  | { type: "credentials"; email: string; password: string; loginHref: string }
  /** Email yang dipakai calon klien ternyata sudah punya akun: hanya tombol masuk, tanpa kata sandi. */
  | { type: "login"; email: string; loginHref: string }

/**
 * Pertanyaan popup dari agen (mirip AskUserQuestion di Claude Code):
 * beberapa opsi + satu opsi "Lainnya" untuk mengetik jawaban sendiri.
 * Dipakai untuk hal yang rawan salah dengar, mis. ejaan nama.
 */
export interface VoiceQuestionOption {
  value: string
  label: string
  description?: string
}

export interface VoiceQuestion {
  id: string
  /** Label pendek di chip, mis. "Konfirmasi nama". */
  header: string
  question: string
  options: VoiceQuestionOption[]
  /**
   * Bila ada, tampil opsi tambahan dengan kolom isian bebas.
   * kind menentukan jenis input dan validasinya (email/telepon).
   */
  other?: { label: string; placeholder: string; kind?: "text" | "email" | "phone" }
  /**
   * Opsi "Revisi": kolom isian yang sudah terisi nilai opsi pertama (tulisan agen), jadi pengguna
   * cukup memperbaiki bagian yang salah. Tampil sebelum "Lainnya" (ketik dari nol).
   */
  revise?: { label: string; placeholder: string }
}

export interface QuestionAnswer {
  value: string
  label: string
  /** true bila pengguna mengetik sendiri lewat opsi "Lainnya". */
  custom: boolean
}

export interface VoiceMessage {
  id: string
  role: "agent" | "user"
  text: string
  at: string
  /** true selama teks masih "diucapkan" kata demi kata. */
  streaming: boolean
  attachment?: MessageAttachment
}

interface VoiceState {
  /** Diatur oleh VoiceWidget yang sedang tampil (landing = guest, dashboard = member). */
  mode: VoiceMode
  open: boolean
  callStatus: CallStatus
  mood: AvatarMood
  /** true selama agen berbicara (gelombang suara tampil). */
  talking: boolean
  /** Ekspresi paksa dari menu "Uji ekspresi"; null = ikuti percakapan. */
  moodOverride: AvatarMood | null
  /** Tahap onboarding saat ini; hanya dipakai untuk catatan tiket, tidak ditampilkan. */
  stage: JourneyStage | null
  messages: VoiceMessage[]
  ticketId: string | null
  muted: boolean
  speed: 1 | 2
  /** Waktu mulai panggilan (ms epoch) untuk timer durasi. */
  startedAt: number | null
  /** Pertanyaan popup yang sedang menunggu jawaban. */
  question: VoiceQuestion | null

  setOpen: (open: boolean) => void
  setMuted: (muted: boolean) => void
  setSpeed: (speed: 1 | 2) => void
  setMoodOverride: (mood: AvatarMood | null) => void
  patch: (partial: Partial<VoiceState>) => void
  pushMessage: (message: Omit<VoiceMessage, "id" | "at">) => string
  updateMessage: (id: string, partial: Partial<VoiceMessage>) => void
  resetSession: () => void
}

const SESSION_DEFAULTS = {
  callStatus: "idle" as CallStatus,
  mood: "idle" as AvatarMood,
  talking: false,
  stage: null as JourneyStage | null,
  messages: [] as VoiceMessage[],
  ticketId: null as string | null,
  startedAt: null as number | null,
  question: null as VoiceQuestion | null,
}

let messageSeq = 0

export const useVoiceStore = create<VoiceState>()((set, get) => ({
  mode: "member",
  open: false,
  muted: false,
  speed: 1,
  moodOverride: null,
  ...SESSION_DEFAULTS,

  setOpen: (open) => set({ open }),
  setMuted: (muted) => set({ muted }),
  setSpeed: (speed) => set({ speed }),
  setMoodOverride: (moodOverride) => set({ moodOverride }),
  patch: (partial) => set(partial),

  pushMessage: (message) => {
    messageSeq += 1
    const id = `msg-${messageSeq}`
    set({ messages: [...get().messages, { ...message, id, at: new Date().toISOString() }] })
    return id
  },

  updateMessage: (id, partial) =>
    set({ messages: get().messages.map((m) => (m.id === id ? { ...m, ...partial } : m)) }),

  resetSession: () => set({ ...SESSION_DEFAULTS }),
}))
