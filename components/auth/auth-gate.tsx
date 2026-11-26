"use client"

import { LoaderCircle } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import { useEffect } from "react"

import { AppShell } from "@/components/layout/app-shell"
import { canAccess, NEW_PASSWORD_PATH } from "@/lib/auth/accounts"
import { subscribeAccountSync } from "@/lib/stores/account-store"
import { hydrateSession, useCurrentAccount, useSessionStore } from "@/lib/stores/session-store"
import { hydrateBilling, subscribeBillingSync } from "@/lib/stores/billing-store"
import { hydrateTickets, subscribeTicketSync } from "@/lib/stores/ticket-store"

export function FullPageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background" role="status">
      <LoaderCircle className="size-6 animate-spin text-primary" />
      <span className="sr-only">Memuat…</span>
    </div>
  )
}

/** Memuat sesi + tiket, lalu mengarahkan ke login, ganti kata sandi, atau halaman sesuai peran. */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const hydrated = useSessionStore((s) => s.hydrated)
  const account = useCurrentAccount()

  useEffect(() => {
    void hydrateSession()
    void hydrateTickets()
    void hydrateBilling()
    const unsubscribeTickets = subscribeTicketSync()
    const unsubscribeBilling = subscribeBillingSync()
    const unsubscribeAccounts = subscribeAccountSync()
    return () => {
      unsubscribeTickets()
      unsubscribeBilling()
      unsubscribeAccounts()
    }
  }, [])

  const allowed = !!account && !account.mustChangePassword && canAccess(account, pathname)

  useEffect(() => {
    if (!hydrated) return
    if (!account) router.replace("/login")
    // Akun dari Voice AI masih memakai kata sandi sementara: wajib diganti dulu
    else if (account.mustChangePassword) router.replace(NEW_PASSWORD_PATH)
    // "/dashboard" dan path lain di luar hak akses diarahkan ke beranda peran
    else if (!canAccess(account, pathname)) router.replace(account.home)
  }, [hydrated, account, pathname, router])

  if (!hydrated || !account || !allowed) return <FullPageLoader />
  return <AppShell account={account}>{children}</AppShell>
}
