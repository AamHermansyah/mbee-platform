import { create } from "zustand"

import type { PlanId } from "@/lib/constants/plans"
import { api, createMutationGuard, startPolling } from "@/lib/data/api"
import type { PaymentMethod } from "@/lib/types"

/**
 * Tagihan langganan paket per akun (riwayat tagihan).
 * Setiap percobaan bayar = satu baris, supaya riwayat gagal/berhasil terlihat jelas.
 * Data ada di Supabase (tabel mbee.invoices) lewat /api/invoices; store ini salinannya untuk tampilan.
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

interface BillingState {
  invoices: Invoice[]
  hydrated: boolean
  /** Nomor invoice dibuat server. */
  createInvoice: (accountId: string, planId: PlanId, amount: number, upgradeFrom?: PlanId | null) => Promise<Invoice>
  /** Perubahan langsung tampil di layar, lalu disimpan ke server. */
  updateInvoice: (id: string, patch: Partial<Invoice>) => Promise<Invoice | undefined>
}

const guard = createMutationGuard()

function upsert(invoices: Invoice[], invoice: Invoice): Invoice[] {
  return invoices.some((i) => i.id === invoice.id) ? invoices.map((i) => (i.id === invoice.id ? invoice : i)) : [invoice, ...invoices]
}

export const useBillingStore = create<BillingState>()((set, get) => ({
  invoices: [],
  hydrated: false,

  createInvoice: (accountId, planId, amount, upgradeFrom = null) =>
    guard.run(async () => {
      const { invoice } = await api<{ invoice: Invoice }>("/api/invoices", {
        method: "POST",
        body: { accountId, planId, amount, upgradeFrom },
      })
      set({ invoices: upsert(get().invoices, invoice) })
      return invoice
    }),

  updateInvoice: (id, patch) =>
    guard.run(async () => {
      set({ invoices: get().invoices.map((invoice) => (invoice.id === id ? { ...invoice, ...patch } : invoice)) })
      try {
        const { invoice } = await api<{ invoice: Invoice }>(`/api/invoices/${encodeURIComponent(id)}`, { method: "PATCH", body: patch })
        set({ invoices: upsert(get().invoices, invoice) })
        return invoice
      } catch (error) {
        console.warn("[tagihan] gagal menyimpan:", error instanceof Error ? error.message : error)
        return get().invoices.find((i) => i.id === id)
      }
    }),
}))

const fetchInvoices = () => api<{ invoices: Invoice[] }>("/api/invoices")
const applyInvoices = ({ invoices }: { invoices: Invoice[] }) => useBillingStore.setState({ invoices })

export async function hydrateBilling(): Promise<void> {
  if (useBillingStore.getState().hydrated) return
  try {
    await guard.refresh(fetchInvoices, applyInvoices)
  } finally {
    useBillingStore.setState({ hydrated: true })
  }
}

/** Muat ulang dari server sekarang (mis. setelah "Pulihkan data contoh"). */
export async function reloadBilling(): Promise<void> {
  applyInvoices(await fetchInvoices())
}

/** Polling tiap 2 detik: pembayaran dari tab/perangkat lain ikut tampil. */
export function subscribeBillingSync(): () => void {
  return startPolling(() => guard.refresh(fetchInvoices, applyInvoices))
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
