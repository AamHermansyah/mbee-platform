"use client"

import "./voice-scope.css"

import { PaymentDialog } from "@/components/billing/payment-dialog"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { VoiceWidget } from "@/components/voice/voice-widget"

/**
 * Voice AI untuk pengunjung landing "/" (tanpa login): launcher kanan bawah, panel percakapan,
 * dan dialog pembayaran. Tiket, tagihan, dan akun baru langsung disimpan ke database, jadi tampil di kanban admin.
 * Landing tidak memuat data lain (tiket/tagihan/akun orang lain tidak perlu ada di browser pengunjung).
 *
 * Dipasang sekali di landing. Tombol CTA lain di landing cukup memanggil
 * openVoiceAssistant() dari "@/lib/voice/session".
 */
export function GuestVoiceAssistant() {
  return (
    <TooltipProvider delayDuration={100}>
      <div className="mbee-voice-scope font-sans">
        <VoiceWidget mode="guest" />
        <PaymentDialog />
      </div>
      <Toaster position="top-center" />
    </TooltipProvider>
  )
}
