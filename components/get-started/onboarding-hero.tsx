import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

/** Porting dari mimin-workflow `components/shared/onboarding-hero.tsx` (tanpa perubahan). */

interface OnboardingHeroProps {
  /** Baris kecil di atas judul (ikon + label huruf kapital). */
  eyebrow?: ReactNode
  title: ReactNode
  description?: ReactNode
  /** Kapsul di kanan atas (mis. total durasi). Disembunyikan di layar kecil. */
  aside?: ReactNode
  /** Bilah progres; `null` = tidak ditampilkan, `loading` = placeholder saat data belum siap. */
  progress?: { pct: number; text: ReactNode; ariaLabel?: string } | null
  loading?: boolean
  /** Tingkat heading; default h2 (h1 hanya untuk halaman yang memang berjudul ini). */
  headingAs?: "h1" | "h2"
  className?: string
}

/**
 * Kartu pembuka onboarding: latar primary bergradasi dengan efek titik-titik halus di
 * belakangnya. Dipakai bersama oleh /get-started dan semua onboarding modul
 * (ticket, omnichannel, WhatsApp Business, commerce) lewat OnboardingShell.
 */
export function OnboardingHero({
  eyebrow,
  title,
  description,
  aside,
  progress,
  loading,
  headingAs: Heading = "h2",
  className,
}: OnboardingHeroProps) {
  return (
    <div
      className={cn(
        "relative isolate overflow-hidden rounded-2xl bg-gradient-to-br from-[#155e75] to-primary p-4 text-white sm:p-6",
        className
      )}
    >
      {/* Titik-titik: di belakang isi, tidak menangkap pointer */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.14]"
        style={{
          backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)",
          backgroundSize: "18px 18px",
        }}
      />
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          {eyebrow && (
            <div className="mb-2 flex items-center gap-1.5 text-white/80 [&_svg]:size-3.5">{eyebrow}</div>
          )}
          <Heading className="text-balance text-xl font-semibold leading-tight tracking-tight sm:text-2xl">{title}</Heading>
          {description && (
            <p className="mt-1.5 max-w-lg text-pretty text-sm leading-relaxed text-white/80">{description}</p>
          )}
        </div>
        {aside && (
          <div className="hidden shrink-0 items-center gap-1.5 rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-xs text-white sm:flex [&_svg]:size-3.5">
            {aside}
          </div>
        )}
      </div>
      {loading ? (
        <div className="mt-4 h-4 w-56 animate-pulse rounded-full bg-white/20" />
      ) : (
        progress && (
          <div className="mt-4 flex max-w-sm items-center gap-3">
            <div
              role="progressbar"
              aria-label={progress.ariaLabel}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={progress.pct}
              className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/25"
            >
              <div
                className="h-full rounded-full bg-white transition-[width] duration-700 ease-in-out motion-reduce:transition-none"
                style={{ width: `${progress.pct}%` }}
              />
            </div>
            <span className="text-xs font-semibold tabular-nums">{progress.text}</span>
          </div>
        )
      )}
    </div>
  )
}
