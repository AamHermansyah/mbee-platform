"use client"

import { PaymentDialog } from "@/components/billing/payment-dialog"
import { DesktopSidebar, MobileSidebar } from "@/components/layout/app-sidebar"
import { Topbar } from "@/components/layout/topbar"
import { TicketReceiptDialog } from "@/components/tickets/ticket-receipt-dialog"
import { VoiceWidget } from "@/components/voice/voice-widget"
import type { DemoAccount } from "@/lib/auth/accounts"
import { useSidebarStore } from "@/lib/stores/sidebar-store"
import { cn } from "@/lib/utils"

/** Kerangka halaman mimin: sidebar + topbar + konten (app/(dashboard)/_layouts di mimin-workflow). */
export function AppShell({ account, children }: { account: DemoAccount; children: React.ReactNode }) {
  const expandedPinned = useSidebarStore((s) => s.pinned && !s.collapsed)

  return (
    <div className="flex w-full flex-col bg-background">
      <DesktopSidebar account={account} />
      <MobileSidebar account={account} />
      <div
        className={cn(
          "flex min-h-screen flex-col transition-all duration-300 md:gap-4 md:pt-4 md:pl-16",
          expandedPinned && "md:pl-56"
        )}
      >
        <Topbar account={account} />
        <main className="relative h-full flex-1 p-4 md:px-6 md:pt-0">{children}</main>
      </div>
      {/* Asisten Voice AI + dialog pembayaran tersedia untuk akun klien */}
      {account.role === "client" && (
        <>
          <VoiceWidget mode="member" />
          <PaymentDialog />
          <TicketReceiptDialog />
        </>
      )}
    </div>
  )
}
