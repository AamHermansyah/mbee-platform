"use client"

import { useEffect } from "react"

import "./voice-scope.css"

import { PaymentDialog } from "@/components/billing/payment-dialog"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { VoiceWidget } from "@/components/voice/voice-widget"
import { hydrateAccounts, subscribeAccountSync } from "@/lib/stores/account-store"
import { hydrateBilling, subscribeBillingSync } from "@/lib/stores/billing-store"
import { hydrateTickets, subscribeTicketSync } from "@/lib/stores/ticket-store"

/**
 * Voice AI untuk pengunjung landing "/" (tanpa login): launcher kanan bawah, panel percakapan,
 * dan dialog pembayaran. Tiket, tagihan, dan akun baru tetap tersinkron ke tab admin.
 *
 * Dipasang sekali di landing. Tombol CTA lain di landing cukup memanggil
 * openVoiceAssistant() dari "@/lib/voice/demo-runner".
 */
export function GuestVoiceAssistant() {
  useEffect(() => {
    void hydrateTickets()
    void hydrateBilling()
    void hydrateAccounts()
    const unsubscribers = [subscribeTicketSync(), subscribeBillingSync(), subscribeAccountSync()]
    return () => unsubscribers.forEach((unsubscribe) => unsubscribe())
  }, [])

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
