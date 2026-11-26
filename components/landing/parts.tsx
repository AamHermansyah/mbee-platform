import type { CSSProperties } from "react"

import { BrandWordmark } from "@/components/shared/brand"

/** Kalimat aksi utama: sama persis di nav, hero, dan penutup (copy.md aturan 5). */
export const MAIN_ACTION = "Bicara dengan Mbee"

/** Panah gambar dari kit (svg.m-arrow): batangnya memanjang dan kepalanya bergeser 3px saat hover. */
export function Arrow() {
  return (
    <svg className="m-arrow" viewBox="0 0 12 12" aria-hidden="true">
      <path className="m-arrow__stem" d="M1 6h8" />
      <path className="m-arrow__head" d="M4.5 2.5 8 6l-3.5 3.5" />
    </svg>
  )
}

/** Tombol aksi utama. Klik ditangani LandingRuntime (openVoiceAssistant). */
export function VoiceButton({ className = "" }: { className?: string }) {
  return (
    <button type="button" className={`btn btn--primary ${className}`.trim()} data-voice-open="">
      {MAIN_ACTION}
      <Arrow />
    </button>
  )
}

/** Logo klien (BrandWordmark) di dalam tautan logo kit; huruf logo tetap Poppins seperti di aplikasi. */
export function LogoLink({ className = "nav__logo" }: { className?: string }) {
  return (
    <a className={`${className} mb-logo`} href="#top" aria-label="Mbee Platform, ke atas halaman">
      <BrandWordmark />
    </a>
  )
}

/** style={{ "--h": 2 }} tanpa keluhan TypeScript. */
export function vars(values: Record<string, string | number>): CSSProperties {
  return values as CSSProperties
}
