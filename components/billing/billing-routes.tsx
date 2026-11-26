"use client"

import { BillingHistoryPage } from "@/components/billing/billing-history-page"
import { BillingPage } from "@/components/billing/billing-page"
import { useCurrentAccount } from "@/lib/stores/session-store"

// AuthGate memastikan akun klien sudah login sebelum halaman ini dirender.
export function BillingRoute() {
  const account = useCurrentAccount()
  return account ? <BillingPage account={account} /> : null
}

export function BillingHistoryRoute() {
  const account = useCurrentAccount()
  return account ? <BillingHistoryPage account={account} /> : null
}
