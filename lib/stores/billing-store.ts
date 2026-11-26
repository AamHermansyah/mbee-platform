import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"

import type { PlanId } from "@/lib/constants/plans"
import { jakartaDateKey } from "@/lib/format"
import type { PaymentMethod } from "@/lib/types"

/**
 * Tagihan langganan paket per akun (riwayat tagihan).
 * Setiap percobaan bayar = satu baris, supaya riwayat gagal/berhasil terlihat jelas.
 * Tahap 2: ganti dengan API billing/payment gateway.
 */
export type InvoiceStatus = "pending" | "paid" | "failed" | "cancelled"

export interface Invoice {
  /** Nomor invoice, format INV/YYYYMMDD/NNNN. */
  id: string
  accountId: string
  planId: PlanId
  amount: number
  status: InvoiceStatus
  method: PaymentMethod | null
  /** Detail metode, mis. "BCA" atau "GoPay". */
  channel: string | null
  failureReason: string | null
  /** Paket sebelumnya bila invoice ini upgrade (amount = selisih harga); null untuk langganan baru. */
  upgradeFrom: PlanId | null
  createdAt: string
  paidAt: string | null
  periodStart: string | null
  periodEnd: string | null
}

const BILLING_STORAGE_KEY = "mbee-platform-billing-v1"

interface BillingState {
  invoices: Invoice[]
  hydrated: boolean
  createInvoice: (accountId: string, planId: PlanId, amount: number, upgradeFrom?: PlanId | null) => Invoice
  updateInvoice: (id: string, patch: Partial<Invoice>) => Invoice | undefined
  reset: () => void
}

function nextInvoiceId(invoices: Invoice[], now: Date): string {
  const prefix = `INV/${jakartaDateKey(now)}/`
  const last = invoices
    .filter((i) => i.id.startsWith(prefix))
    .map((i) => Number(i.id.slice(prefix.length)))
    .reduce((max, n) => Math.max(max, n), 0)
  return `${prefix}${String(last + 1).padStart(4, "0")}`
}

export const useBillingStore = create<BillingState>()(
  persist(
    (set, get) => ({
      invoices: [],
      hydrated: false,

      createInvoice: (accountId, planId, amount, upgradeFrom = null) => {
        const now = new Date()
        const invoice: Invoice = {
          id: nextInvoiceId(get().invoices, now),
          accountId,
          planId,
          amount,
          status: "pending",
          method: null,
          channel: null,
          failureReason: null,
          upgradeFrom,
          createdAt: now.toISOString(),
          paidAt: null,
          periodStart: null,
          periodEnd: null,
        }
        set({ invoices: [invoice, ...get().invoices] })
        return invoice
      },

      updateInvoice: (id, patch) => {
        let updated: Invoice | undefined
        set({
          invoices: get().invoices.map((invoice) => {
            if (invoice.id !== id) return invoice
            updated = { ...invoice, ...patch }
            return updated
          }),
        })
        return updated
      },

      reset: () => set({ invoices: [] }),
    }),
    {
      name: BILLING_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ invoices: state.invoices }),
      skipHydration: true,
    }
  )
)

export async function hydrateBilling(): Promise<void> {
  if (useBillingStore.getState().hydrated) return
  await useBillingStore.persist.rehydrate()
  useBillingStore.setState({ hydrated: true })
}

export function subscribeBillingSync(): () => void {
  const onStorage = (event: StorageEvent) => {
    if (event.key === BILLING_STORAGE_KEY) void useBillingStore.persist.rehydrate()
  }
  window.addEventListener("storage", onStorage)
  return () => window.removeEventListener("storage", onStorage)
}

export function useInvoices(accountId: string | undefined): Invoice[] {
  return useBillingStore((s) => s.invoices).filter((i) => i.accountId === accountId)
}

/** Langganan aktif = tagihan lunas terbaru yang masa berlakunya belum habis. */
export function useActiveSubscription(accountId: string | undefined): Invoice | undefined {
  const invoices = useBillingStore((s) => s.invoices)
  return invoices
    .filter((i) => i.accountId === accountId && i.status === "paid" && i.periodEnd)
    .sort((a, b) => (b.paidAt ?? "").localeCompare(a.paidAt ?? ""))[0]
}
