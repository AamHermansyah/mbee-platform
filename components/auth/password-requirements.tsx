"use client"

import { Check, X } from "lucide-react"

import { getPasswordChecks, getPasswordStrength, PASSWORD_MIN_LENGTH, type PasswordStrengthLevel } from "@/lib/auth/password-policy"
import { cn } from "@/lib/utils"

/** Salinan components/core/password-requirements.tsx mimin (teks dari i18n id.json "password_policy"). */

const STRENGTH_STYLES: Record<PasswordStrengthLevel, { bar: string; text: string; widthClass: string; label: string }> = {
  empty: { bar: "bg-gray-200", text: "text-gray-500", widthClass: "w-0", label: "" },
  weak: { bar: "bg-red-500", text: "text-red-500", widthClass: "w-1/4", label: "Lemah" },
  fair: { bar: "bg-amber-500", text: "text-amber-600", widthClass: "w-2/4", label: "Cukup" },
  good: { bar: "bg-lime-500", text: "text-lime-600", widthClass: "w-3/4", label: "Bagus" },
  strong: { bar: "bg-green-500", text: "text-green-600", widthClass: "w-full", label: "Kuat" },
}

function RequirementItem({ met, text }: { met: boolean; text: string }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      {met ? <Check className="size-3.5 shrink-0 text-green-500" /> : <X className="size-3.5 shrink-0 text-gray-500" />}
      <span className={met ? "text-green-600" : "text-gray-500"}>{text}</span>
    </div>
  )
}

export function PasswordRequirements({ password, className }: { password: string; className?: string }) {
  const checks = getPasswordChecks(password)
  const strength = STRENGTH_STYLES[getPasswordStrength(password).level]

  if (!password) return null

  return (
    <div className={cn("space-y-2 rounded-lg border bg-muted/30 p-3", className)}>
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-foreground">Syarat kata sandi</p>
          <span className={cn("text-xs font-medium", strength.text)}>{strength.label}</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
          <div className={cn("h-full rounded-full transition-all duration-300", strength.bar, strength.widthClass)} />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-2 pt-0.5 sm:grid-cols-2">
        <RequirementItem met={checks.minLength} text={`Minimal ${PASSWORD_MIN_LENGTH} karakter`} />
        <RequirementItem met={checks.mixedCharacters} text="Kombinasi huruf, angka, atau simbol" />
        <RequirementItem met={checks.notCommon} text="Bukan kata sandi umum" />
        <RequirementItem met={checks.notWeakPattern} text="Tanpa karakter berulang atau berurutan" />
      </div>
    </div>
  )
}
