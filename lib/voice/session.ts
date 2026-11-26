import { useVoiceStore, type VoiceEngine } from "@/lib/stores/voice-store"
import { endDemoCall, startDemoCall } from "@/lib/voice/demo-runner"
import { endLiveCall, startLiveCall } from "@/lib/voice/live/live-runner"

/**
 * Pintu tunggal sesi Voice AI untuk UI (widget, CTA landing, logout).
 * Mesin dipilih saat sesi dimulai: Live AI (Gemini Live) atau naskah simulasi (cadangan demo).
 */

export { answerQuestion, registerNavigator } from "@/lib/voice/bridge"

let activeEngine: VoiceEngine | null = null

export function isCallRunning(): boolean {
  const status = useVoiceStore.getState().callStatus
  return status === "connecting" || status === "active"
}

export async function endCall(): Promise<void> {
  const engine = activeEngine
  activeEngine = null
  if (engine === "live") await endLiveCall()
  else if (engine === "simulation") await endDemoCall()
}

export async function startCall(): Promise<void> {
  await endCall()
  const engine = useVoiceStore.getState().engine
  activeEngine = engine
  if (engine === "live") await startLiveCall()
  else await startDemoCall()
}

/**
 * Ganti akun atau keluar: hentikan sesi lalu kosongkan transkrip, popup, dan tiket sesi,
 * supaya riwayat percakapan akun sebelumnya tidak tampil di akun lain.
 */
export async function resetVoiceForAccountChange(): Promise<void> {
  useVoiceStore.getState().setOpen(false)
  await endCall()
  useVoiceStore.getState().resetSession()
}

/** Tombol CTA (mis. di landing): buka panel sesi yang berjalan, atau mulai sesi baru. */
export function openVoiceAssistant(): void {
  if (isCallRunning()) useVoiceStore.getState().setOpen(true)
  else void startCall()
}
