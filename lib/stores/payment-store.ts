import { create } from "zustand"

import { planPrice, upgradePrice, type PlanId } from "@/lib/constants/plans"
import { useBillingStore } from "@/lib/stores/billing-store"
import type { PaymentMethod } from "@/lib/types"

/**
 * Checkout langganan lewat dialog simulasi payment gateway (tanpa tab baru).
 * openCheckout() membuat invoice "pending", membuka dialog, lalu menunggu hasil.
 * Dipakai oleh halaman Penagihan dan oleh Voice AI (yang mengecek hasilnya).
 */
export type PaymentOutcome =
  | { status: "paid"; invoiceId: string; method: PaymentMethod; channel: string; amount: number }
  | { status: "failed"; invoiceId: string; method: PaymentMethod; channel: string; amount: number; reason: string }
  | { status: "cancelled"; invoiceId: string }

export interface CheckoutSession {
  invoiceId: string
  accountId: string
  planId: PlanId
  /** Jumlah yang dibayar hari ini: harga paket, atau selisih harga bila upgrade. */
  amount: number
  /** Paket aktif sebelumnya bila ini upgrade. */
  upgradeFrom: PlanId | null
  source: "voice" | "billing"
}

interface PaymentState {
  checkout: CheckoutSession | null
}

export const usePaymentStore = create<PaymentState>()(() => ({ checkout: null }))

let resolveCheckout: ((outcome: PaymentOutcome) => void) | null = null

export function openCheckout(
  accountId: string,
  planId: PlanId,
  source: CheckoutSession["source"],
  upgradeFrom: PlanId | null = null
): Promise<PaymentOutcome> {
  // Checkout lama yang belum selesai dianggap batal
  const previous = usePaymentStore.getState().checkout
  if (previous) finishCheckout({ status: "cancelled", invoiceId: previous.invoiceId })

  const amount = upgradeFrom ? (upgradePrice(upgradeFrom, planId) ?? planPrice(planId)) : planPrice(planId)
  const invoice = useBillingStore.getState().createInvoice(accountId, planId, amount, upgradeFrom)
  usePaymentStore.setState({ checkout: { invoiceId: invoice.id, accountId, planId, amount, upgradeFrom, source } })
  return new Promise((resolve) => {
    resolveCheckout = resolve
  })
}

/** Dipanggil dialog setelah hasil tampil 3 detik (atau saat ditutup sebelum bayar). */
export function finishCheckout(outcome: PaymentOutcome) {
  const billing = useBillingStore.getState()
  if (outcome.status === "paid") {
    const now = new Date()
    const end = new Date(now)
    end.setMonth(end.getMonth() + 1)
    const paidInvoice = billing.invoices.find((i) => i.id === outcome.invoiceId)
    // Upgrade: paket baru berlaku sekarang, tetapi masa berlaku tetap sampai akhir periode yang sudah dibayar
    const keptEnd = paidInvoice?.upgradeFrom
      ? billing.invoices
          .filter((i) => i.accountId === paidInvoice.accountId && i.status === "paid" && i.periodEnd && i.id !== paidInvoice.id)
          .sort((a, b) => (b.periodEnd ?? "").localeCompare(a.periodEnd ?? ""))[0]?.periodEnd
      : null
    billing.updateInvoice(outcome.invoiceId, {
      status: "paid",
      method: outcome.method,
      channel: outcome.channel,
      paidAt: now.toISOString(),
      periodStart: now.toISOString(),
      periodEnd: keptEnd && keptEnd > now.toISOString() ? keptEnd : end.toISOString(),
    })
  } else if (outcome.status === "failed") {
    billing.updateInvoice(outcome.invoiceId, {
      status: "failed",
      method: outcome.method,
      channel: outcome.channel,
      failureReason: outcome.reason,
    })
  } else {
    billing.updateInvoice(outcome.invoiceId, { status: "cancelled", failureReason: "Dibatalkan sebelum dibayar" })
  }

  usePaymentStore.setState({ checkout: null })
  const resolve = resolveCheckout
  resolveCheckout = null
  resolve?.(outcome)
}

/** Alasan gagal per metode (simulasi), diucapkan Voice AI. */
export const FAILURE_REASON: Record<PaymentMethod, string> = {
  qris: "kode QRIS kedaluwarsa sebelum pembayaran diterima",
  virtual_account: "transfer ke Virtual Account tidak diterima sampai batas waktu",
  ewallet: "saldo e-wallet tidak mencukupi",
  credit_card: "kartu ditolak oleh bank penerbit",
  bank_transfer: "transfer belum diterima",
}
