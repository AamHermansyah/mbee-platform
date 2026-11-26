"use client"

import { Alignment, Fit, Layout, useRive } from "@rive-app/react-canvas"
import { useEffect } from "react"

import { cn } from "@/lib/utils"

/**
 * Isi avatar.riv (diperiksa langsung dari file):
 * - state machine "State Machine 1"
 * - satu input boolean "Hover/Select" (Idle -> Hover/Select -> Idle Hover/Select)
 * - layer "Blink" yang berkedip terus.
 * Tidak ada input untuk bicara/mendengar/berpikir, jadi `active` hanya memilih pose.
 */
const STATE_MACHINE = "State Machine 1"
const INPUT_ACTIVE = "Hover/Select"
const LAYOUT = new Layout({ fit: Fit.Contain, alignment: Alignment.Center })

export function RiveAvatar({ active, className }: { active: boolean; className?: string }) {
  const { rive, RiveComponent } = useRive({
    src: "/rive/avatar.riv",
    stateMachines: STATE_MACHINE,
    autoplay: true,
    layout: LAYOUT,
  })
  useEffect(() => {
    // Input state machine diubah lewat properti `value` (API resmi Rive).
    const input = rive?.stateMachineInputs(STATE_MACHINE)?.find((i) => i.name === INPUT_ACTIVE)
    if (input) input.value = active
  }, [rive, active])

  return <RiveComponent aria-hidden className={cn("size-full", className)} />
}
