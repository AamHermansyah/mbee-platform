"use client"

import { ChevronDown, FlaskConical, Mic, MicOff, Phone, PhoneOff, RotateCcw, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { AnimatePresence, motion } from "motion/react"
import { useEffect, useRef, useState } from "react"

import { BrandMark } from "@/components/shared/brand"
import { AvatarStage, MOOD_LABEL } from "@/components/voice/avatar-stage"
import { QuestionPrompt } from "@/components/voice/question-prompt"
import { Transcript } from "@/components/voice/transcript"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { ASSISTANT_NAME, PLATFORM_NAME } from "@/lib/constants/brand"
import { loadSavedEngine, useVoiceStore, type AvatarMood, type VoiceEngine, type VoiceMode } from "@/lib/stores/voice-store"
import { cn } from "@/lib/utils"
import { answerQuestion, endCall, registerNavigator, startCall } from "@/lib/voice/session"

/**
 * Widget Voice AI: asisten umum Mbee Platform. Salah satu tugasnya membantu onboarding klien,
 * tetapi tampilannya tetap netral (avatar, transkrip, kontrol), tanpa langkah/stepper.
 */

const MOODS: AvatarMood[] = ["idle", "listening", "thinking", "speaking", "happy", "confused"]

function useCallDuration(startedAt: number | null, running: boolean) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!running) return
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [running])
  if (!startedAt) return "00:00"
  const seconds = Math.max(0, Math.floor((now - startedAt) / 1000))
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`
}

/** Menu pengaturan demo: mesin percakapan (Live AI / simulasi) dan uji ekspresi avatar. */
function DemoSettings() {
  const moodOverride = useVoiceStore((s) => s.moodOverride)
  const setMoodOverride = useVoiceStore((s) => s.setMoodOverride)
  const engine = useVoiceStore((s) => s.engine)
  const setEngine = useVoiceStore((s) => s.setEngine)
  const callStatus = useVoiceStore((s) => s.callStatus)
  const running = callStatus === "connecting" || callStatus === "active"
  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button variant={moodOverride ? "secondary" : "ghost"} size="icon-sm" aria-label="Pengaturan demo">
              <FlaskConical />
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent>Pengaturan demo</TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Mode percakapan{running ? " (berlaku di sesi berikutnya)" : ""}
        </DropdownMenuLabel>
        <DropdownMenuRadioGroup value={engine} onValueChange={(v) => setEngine(v as VoiceEngine)}>
          <DropdownMenuRadioItem value="live">Live AI (suara asli)</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="simulation">Simulasi naskah</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs text-muted-foreground">Uji ekspresi avatar</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup
          value={moodOverride ?? "auto"}
          onValueChange={(v) => setMoodOverride(v === "auto" ? null : (v as AvatarMood))}
        >
          <DropdownMenuRadioItem value="auto">Otomatis (ikut percakapan)</DropdownMenuRadioItem>
          {MOODS.map((mood) => (
            <DropdownMenuRadioItem key={mood} value={mood}>
              {MOOD_LABEL[mood]}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function SpeedToggle() {
  const speed = useVoiceStore((s) => s.speed)
  const setSpeed = useVoiceStore((s) => s.setSpeed)
  return (
    <div role="radiogroup" aria-label="Kecepatan simulasi" className="flex gap-0.5 rounded-full border border-border bg-white p-0.5">
      {([1, 2] as const).map((value) => (
        <button
          key={value}
          type="button"
          role="radio"
          aria-checked={speed === value}
          onClick={() => setSpeed(value)}
          className={cn(
            "rounded-full px-2 py-0.5 text-[11px] font-medium transition-colors duration-150",
            speed === value ? "bg-primary text-primary-foreground" : "text-slate-600 hover:bg-muted"
          )}
        >
          {value}×
        </button>
      ))}
    </div>
  )
}

function CallControls() {
  const callStatus = useVoiceStore((s) => s.callStatus)
  const muted = useVoiceStore((s) => s.muted)
  const setMuted = useVoiceStore((s) => s.setMuted)
  const startedAt = useVoiceStore((s) => s.startedAt)
  const running = callStatus === "connecting" || callStatus === "active"
  const duration = useCallDuration(startedAt, callStatus === "active")

  if (!running) {
    return (
      <Button className="h-10 w-full" onClick={() => void startCall()}>
        {callStatus === "ended" ? <RotateCcw /> : <Phone />}
        {callStatus === "ended" ? "Mulai lagi" : "Mulai bicara"}
      </Button>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <span className="flex items-center gap-1.5 text-xs font-medium text-slate-700 tabular-nums">
        <span className="size-2 animate-pulse rounded-full bg-red-500" aria-hidden />
        {callStatus === "connecting" ? "Menghubungkan…" : duration}
      </span>
      <div className="ml-auto flex items-center gap-2">
        <Button
          variant="outline"
          size="icon-lg"
          onClick={() => setMuted(!muted)}
          aria-pressed={muted}
          aria-label={muted ? "Nyalakan mikrofon" : "Matikan mikrofon"}
          className={cn(muted && "border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100")}
        >
          {muted ? <MicOff /> : <Mic />}
        </Button>
        <Button size="lg" className="bg-red-600 px-3 text-white hover:bg-red-700" onClick={() => void endCall()}>
          <PhoneOff /> Akhiri
        </Button>
      </div>
    </div>
  )
}

function VoicePanel() {
  const setOpen = useVoiceStore((s) => s.setOpen)
  const callStatus = useVoiceStore((s) => s.callStatus)
  const mood = useVoiceStore((s) => s.mood)
  const talking = useVoiceStore((s) => s.talking)
  const moodOverride = useVoiceStore((s) => s.moodOverride)
  const muted = useVoiceStore((s) => s.muted)
  const messages = useVoiceStore((s) => s.messages)
  const question = useVoiceStore((s) => s.question)
  const engine = useVoiceStore((s) => s.engine)
  const running = callStatus === "active" || callStatus === "connecting"
  const scrollRef = useRef<HTMLDivElement>(null)
  const questionId = question?.id

  // Drawer pertanyaan muncul: geser transkrip ke bawah supaya pesan terakhir tidak tertutup drawer yang diperkecil
  useEffect(() => {
    const el = scrollRef.current
    if (questionId && el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" })
  }, [questionId])

  const shownMood = moodOverride ?? mood
  const shownTalking = moodOverride ? moodOverride === "speaking" : talking

  return (
    <motion.div
      role="dialog"
      aria-label="Asisten Voice AI"
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 16, scale: 0.98 }}
      transition={{ duration: 0.2 }}
      className="fixed right-2 bottom-2 z-50 flex h-[min(640px,calc(100dvh-1rem))] w-[calc(100vw-1rem)] flex-col overflow-hidden rounded-xl border bg-white shadow-xl sm:right-5 sm:bottom-5 sm:h-[min(640px,calc(100dvh-2.5rem))] sm:w-[400px]"
    >
      <header className="flex items-center gap-2.5 border-b px-3.5 py-2.5">
        <BrandMark />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-slate-900">{ASSISTANT_NAME} · Voice AI</p>
          <p className="text-[10px] font-semibold tracking-wide text-primary">{engine === "live" ? "LIVE AI" : "MODE SIMULASI"}</p>
        </div>
        <div className="flex items-center gap-1">
          {engine === "simulation" && <SpeedToggle />}
          <DemoSettings />
          <Button variant="ghost" size="icon-sm" onClick={() => setOpen(false)} aria-label={running ? "Perkecil panel" : "Tutup panel"}>
            {running ? <ChevronDown /> : <X />}
          </Button>
        </div>
      </header>

      <div className="flex shrink-0 flex-col items-center bg-[#eef7f8] px-4 pt-5 pb-3">
        <AvatarStage mood={shownMood} talking={shownTalking} />
        {muted && <p className="mt-1 text-[11px] font-medium text-amber-700">Mikrofon mati, {ASSISTANT_NAME} menunggu Anda.</p>}
      </div>

      <div className="relative min-h-0 flex-1">
        {/* Ruang di bawah transkrip selama drawer pertanyaan tampil, supaya pesan terakhir tidak tertutup */}
        <div ref={scrollRef} className="custom-scrollbar h-full overflow-y-auto bg-white" style={question ? { paddingBottom: 76, scrollPaddingBottom: 76 } : undefined}>
          <Transcript messages={messages} />
        </div>
        <AnimatePresence>
          {question && <QuestionPrompt key={question.id} question={question} onAnswer={answerQuestion} />}
        </AnimatePresence>
      </div>

      <div className="border-t px-3 py-2.5">
        <CallControls />
      </div>
    </motion.div>
  )
}

function Launcher() {
  const setOpen = useVoiceStore((s) => s.setOpen)
  const callStatus = useVoiceStore((s) => s.callStatus)
  const mood = useVoiceStore((s) => s.mood)
  const talking = useVoiceStore((s) => s.talking)
  const running = callStatus === "active" || callStatus === "connecting"
  const [hint, setHint] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setHint(true), 1200)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="fixed right-4 bottom-4 z-40 flex items-end gap-3 sm:right-5 sm:bottom-5">
      <AnimatePresence>
        {hint && !running && (
          <motion.div
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 8 }}
            className="relative mb-2 hidden max-w-60 rounded-xl border border-border bg-white py-2.5 pr-8 pl-3 shadow-md sm:block"
          >
            <p className="text-xs font-semibold text-slate-900">Halo! Saya {ASSISTANT_NAME} 👋</p>
            <p className="text-[11px] text-slate-600">Asisten Voice AI {PLATFORM_NAME}. Ada yang bisa saya bantu?</p>
            <button
              type="button"
              onClick={() => setHint(false)}
              className="absolute top-1.5 right-1.5 rounded-full p-1 text-slate-500 hover:bg-muted"
              aria-label="Tutup sapaan"
            >
              <X className="size-3" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={running ? "Buka sesi Voice AI yang sedang berjalan" : "Buka asisten Voice AI"}
        className="group relative rounded-full bg-white shadow-lg outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
      >
        <AvatarStage mood={running ? mood : "idle"} talking={running && talking} size="sm" />
        {running && (
          <span className="absolute -top-1 -left-1 rounded-full bg-red-600 px-1.5 py-0.5 text-[9px] font-bold text-white">LIVE</span>
        )}
      </button>
    </div>
  )
}

/**
 * mode "guest" dipasang di landing (pengunjung tanpa login), "member" di dashboard klien.
 * Mode menentukan naskah yang diputar saat panggilan dimulai.
 */
export function VoiceWidget({ mode }: { mode: VoiceMode }) {
  const open = useVoiceStore((s) => s.open)
  const router = useRouter()

  useEffect(() => {
    useVoiceStore.setState({ mode })
  }, [mode])

  // Pilihan mesin terakhir (Live AI / simulasi) di browser ini
  useEffect(() => {
    useVoiceStore.setState({ engine: loadSavedEngine() })
  }, [])

  // Voice AI bisa memindahkan halaman (mis. ke Riwayat Penagihan setelah bayar, atau ke halaman masuk)
  useEffect(() => {
    registerNavigator((path) => router.push(path))
    return () => registerNavigator(null)
  }, [router])

  return <AnimatePresence>{open ? <VoicePanel key="panel" /> : <Launcher key="launcher" />}</AnimatePresence>
}
