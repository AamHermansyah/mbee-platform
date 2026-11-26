"use client"

import { useEffect } from "react"

import { openVoiceAssistant } from "@/lib/voice/demo-runner"

/**
 * Dua hal di sisi klien untuk landing:
 * 1. Setiap elemen [data-voice-open] (tombol "Bicara dengan Mbee" di nav, hero, dan penutup)
 *    membuka widget Voice AI lewat openVoiceAssistant(). Satu listener untuk semua tombol,
 *    jadi markup landing tetap Server Component.
 * 2. Skrip kit design-taste-frontend (public/assets) baru dimuat SETELAH hidrasi React:
 *    kit mengubah DOM (masker kata h1, fragmen UI, diagram, momen), dan perubahan itu sebelum
 *    hidrasi akan dianggap mismatch lalu dirender ulang oleh React.
 */

const KIT_SCRIPTS = ["/assets/system.js", "/assets/motion/motion.js", "/assets/layout/layout.js", "/assets/diagrams/mount.js"]

let booted = false

function loadInOrder(sources: string[]) {
  const [src, ...rest] = sources
  if (!src) return
  const script = document.createElement("script")
  script.type = "module"
  script.src = src
  script.addEventListener("load", () => loadInOrder(rest), { once: true })
  script.addEventListener("error", () => loadInOrder(rest), { once: true })
  document.body.appendChild(script)
}

export function LandingRuntime() {
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target.closest("[data-voice-open]") : null
      if (!target) return
      event.preventDefault()
      openVoiceAssistant()
    }
    document.addEventListener("click", onClick)

    if (!booted) {
      booted = true
      requestAnimationFrame(() => loadInOrder(KIT_SCRIPTS))
    }

    return () => document.removeEventListener("click", onClick)
  }, [])

  return null
}
