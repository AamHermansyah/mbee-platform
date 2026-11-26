"use client"

import { CircleQuestionMark, Sparkles } from "lucide-react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"

import { RiveAvatar } from "@/components/voice/rive-avatar"
import type { AvatarMood } from "@/lib/stores/voice-store"
import { cn } from "@/lib/utils"

/**
 * Opsi B: avatar.riv dipakai apa adanya (pose diam / pose aktif), lalu ekspresi
 * dibangun dari efek di sekitarnya: cincin, gelembung, gelombang suara, dan gerak kepala.
 */

// Skala supaya lingkaran ungu di artboard (≈57% lebar) memenuhi wadah bulat.
const ARTBOARD_CROP_SCALE = 1.76

const MOOD_RING: Record<AvatarMood, string> = {
  idle: "#d4d8de",
  listening: "#017b89",
  thinking: "#64748b",
  speaking: "#017b89",
  happy: "#16a34a",
  confused: "#f59e0b",
}

export const MOOD_LABEL: Record<AvatarMood, string> = {
  idle: "Siap membantu",
  listening: "Mendengarkan…",
  thinking: "Sedang berpikir…",
  speaking: "Berbicara",
  happy: "Senang membantu!",
  confused: "Hmm, ada kendala",
}

const SIZE = {
  sm: { box: 56, ring: 4 },
  lg: { box: 168, ring: 6 },
}

function SpeakingBars({ color }: { color: string }) {
  const reduce = useReducedMotion()
  const bars = [0.45, 0.8, 1, 0.7, 0.9, 0.55, 0.75]
  return (
    <div className="flex h-6 items-end gap-1" aria-hidden>
      {bars.map((peak, i) => (
        <motion.span
          key={i}
          className="w-1 rounded-full"
          style={{ backgroundColor: color, height: 24, originY: 1 }}
          initial={{ scaleY: 0.2 }}
          animate={reduce ? { scaleY: peak * 0.6 } : { scaleY: [0.2, peak, 0.35, peak * 0.8, 0.2] }}
          transition={reduce ? undefined : { duration: 0.9 + i * 0.07, repeat: Infinity, ease: "easeInOut", delay: i * 0.05 }}
        />
      ))}
    </div>
  )
}

export function AvatarStage({
  mood,
  talking,
  size = "lg",
  className,
}: {
  mood: AvatarMood
  talking: boolean
  size?: "sm" | "lg"
  className?: string
}) {
  const reduce = useReducedMotion()
  const { box, ring } = SIZE[size]
  const color = MOOD_RING[mood]
  const poseActive = talking || mood === "listening" || mood === "speaking" || mood === "happy"
  const big = size === "lg"

  // Gerak kepala ringan per ekspresi
  const headMotion = reduce
    ? {}
    : mood === "confused"
      ? { rotate: -6, y: 0, scale: 1 }
      : mood === "happy"
        ? { rotate: 0, y: [0, -6, 0], scale: 1 }
        : talking
          ? { rotate: 0, y: [0, -2, 0], scale: 1 }
          : mood === "idle"
            ? { rotate: 0, y: 0, scale: [1, 1.02, 1] }
            : { rotate: 0, y: 0, scale: 1 }

  const headTransition = reduce
    ? undefined
    : mood === "happy"
      ? { duration: 0.6, repeat: 2 }
      : talking
        ? { duration: 0.45, repeat: Infinity }
        : mood === "idle"
          ? { duration: 3.2, repeat: Infinity, ease: "easeInOut" as const }
          : { type: "spring" as const, stiffness: 200, damping: 14 }

  return (
    <div className={cn("relative flex flex-col items-center", className)}>
      <div className="relative" style={{ width: box + ring * 4, height: box + ring * 4 }}>
        {/* Cincin denyut saat mendengarkan */}
        {!reduce &&
          (mood === "listening" || (talking && big)) &&
          [0, 0.6].map((delay) => (
            <motion.span
              key={`pulse-${delay}`}
              className="absolute inset-0 rounded-full border-2"
              style={{ borderColor: color }}
              initial={{ scale: 0.85, opacity: 0.55 }}
              animate={{ scale: 1.25, opacity: 0 }}
              transition={{ duration: 1.6, repeat: Infinity, delay, ease: "easeOut" }}
              aria-hidden
            />
          ))}

        {/* Cincin putus-putus berputar saat berpikir */}
        {mood === "thinking" && (
          <motion.svg
            viewBox="0 0 100 100"
            className="absolute inset-0"
            animate={reduce ? undefined : { rotate: 360 }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "linear" }}
            aria-hidden
          >
            <circle cx="50" cy="50" r="48" fill="none" stroke={color} strokeWidth="2" strokeDasharray="6 8" strokeLinecap="round" />
          </motion.svg>
        )}

        {/* Cincin utama berwarna sesuai ekspresi */}
        <motion.div
          className="absolute rounded-full"
          style={{ inset: ring, borderWidth: ring, borderStyle: "solid" }}
          animate={{ borderColor: color }}
          transition={{ duration: 0.3 }}
          aria-hidden
        />

        {/* Avatar Rive dipotong bulat */}
        <motion.div
          className="absolute overflow-hidden rounded-full bg-[#6c47b8]"
          style={{ inset: ring * 2 }}
          animate={headMotion}
          transition={headTransition}
        >
          <div className="absolute inset-0" style={{ transform: `scale(${ARTBOARD_CROP_SCALE})` }}>
            <RiveAvatar active={poseActive} />
          </div>
        </motion.div>

        {/* Gelembung pikiran / tanda tanya / kilau */}
        <AnimatePresence>
          {big && mood === "thinking" && (
            <motion.div
              key="thinking"
              className="absolute -top-1 -right-3 flex items-center gap-1 rounded-full border border-border bg-white px-2.5 py-1.5 shadow-sm"
              initial={{ opacity: 0, scale: 0.6, y: 6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.6 }}
              aria-hidden
            >
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className="size-1.5 rounded-full bg-slate-500"
                  animate={reduce ? undefined : { y: [0, -3, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                />
              ))}
            </motion.div>
          )}
          {big && mood === "confused" && (
            <motion.div
              key="confused"
              className="absolute -top-1 -right-2 flex size-9 items-center justify-center rounded-full border border-amber-200 bg-amber-50 text-amber-600 shadow-sm"
              initial={{ opacity: 0, scale: 0.4, rotate: -20 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.4 }}
              aria-hidden
            >
              <CircleQuestionMark className="size-5" />
            </motion.div>
          )}
          {big && mood === "happy" &&
            [
              { x: -18, y: 8, delay: 0, s: 22 },
              { x: box + 2, y: 18, delay: 0.15, s: 18 },
              { x: box - 10, y: -10, delay: 0.3, s: 14 },
            ].map((spark, i) => (
              <motion.span
                key={`spark-${i}`}
                className="absolute text-green-600"
                style={{ left: spark.x, top: spark.y }}
                initial={{ opacity: 0, scale: 0 }}
                animate={reduce ? { opacity: 1, scale: 1 } : { opacity: [0, 1, 1, 0.8], scale: [0, 1.2, 1, 1], rotate: [0, 15, 0, 0] }}
                exit={{ opacity: 0, scale: 0 }}
                transition={{ duration: 0.8, delay: spark.delay }}
                aria-hidden
              >
                <Sparkles style={{ width: spark.s, height: spark.s }} />
              </motion.span>
            ))}
        </AnimatePresence>
      </div>

      {big && (
        <div className="mt-2 flex h-6 items-center justify-center">
          {talking ? (
            <SpeakingBars color={color} />
          ) : (
            <span className="flex items-center gap-1.5 rounded-full border border-border bg-white px-2.5 py-0.5 text-[11px] font-medium text-slate-700">
              <span className="size-1.5 rounded-full" style={{ backgroundColor: color }} />
              {MOOD_LABEL[mood]}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
