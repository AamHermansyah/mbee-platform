import { create } from "zustand"

import type { IssueCategory, Priority } from "@/lib/types"

/**
 * Bukti tiket kendala yang baru dikirim lewat Voice AI. Tampil sebagai dialog terpisah
 * (seperti hasil "Pembayaran Berhasil!"), bukan lampiran di transkrip, supaya mudah dibaca.
 */
export interface TicketReceipt {
  ticketId: string
  title: string
  category: IssueCategory
  priority: Priority
  responseLabel: string
  summary: string
  email: string
  emailSent: boolean
}

interface TicketReceiptState {
  receipt: TicketReceipt | null
}

export const useTicketReceiptStore = create<TicketReceiptState>()(() => ({ receipt: null }))

export function showTicketReceipt(receipt: TicketReceipt) {
  useTicketReceiptStore.setState({ receipt })
}

export function closeTicketReceipt() {
  useTicketReceiptStore.setState({ receipt: null })
}
