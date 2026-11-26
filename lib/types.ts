import type { PlanId } from "@/lib/constants/plans"

/**
 * Model tiket mengikuti mimin: tiket bersifat umum, jenisnya ditentukan template.
 * Template "Onboarding & Pembayaran" memuat data yang dikumpulkan Voice AI:
 * id, nama, email, telepon, perusahaan, paket layanan (bundling), ringkasan isu,
 * status isu, metode bayar, dan status bayar.
 * Kode status disimpan dalam bahasa Inggris (stabil untuk API tahap 2),
 * labelnya ditampilkan dalam bahasa Indonesia lewat lib/constants/ticket.ts.
 */

export type ProductId =
  | "gen_ai_chatbot"
  | "omnichannel"
  | "order_management"
  | "reservation"
  | "campaign_waba"
  | "voice_ai"
  | "csat"

export type TicketTemplate = "onboarding_payment" | "technical" | "billing" | "general"

export type Priority = "low" | "medium" | "high" | "urgent"

export type IssueStatus = "open" | "on_progress" | "resolved"

export type PaymentMethod =
  | "qris"
  | "virtual_account"
  | "ewallet"
  | "credit_card"
  | "bank_transfer"

export type PaymentStatus = "unpaid" | "pending" | "paid" | "failed" | "expired"

export type Sentiment = "positive" | "neutral" | "negative"

/** Tahap percakapan onboarding; dipakai untuk log aktivitas tiket. */
export type JourneyStage =
  | "greeting"
  | "discovery"
  | "recommendation"
  | "data"
  | "payment"
  | "account"
  | "summary"
  | "handling"

/** Catatan Voice AI, terstruktur supaya bisa dianalisis. */
export interface IssueSummary {
  /** Ringkasan satu-dua kalimat (tampil sebagai deskripsi tiket). */
  overview: string
  needs: string
  /** Kendala yang muncul; kosong bila tidak ada. */
  obstacles: string
  nextAction: string
  sentiment: Sentiment
}

export interface JourneyEvent {
  at: string
  stage: JourneyStage
  label: string
}

export interface Ticket {
  /** Nomor tiket unik, format TKT-YYYYMMDD-NNN. */
  id: string
  title: string
  template: TicketTemplate
  priority: Priority | null
  /** Penanggung jawab dari tim mimin; null = belum ditugaskan. */
  assignee: string | null
  /** Akun klien pemilik tiket (untuk halaman Mulai klien). */
  accountId: string | null
  name: string
  email: string
  phone: string
  companyName: string
  /** Produk terkait untuk tiket umum (mis. kendala teknis Omnichannel). Kosong untuk tiket onboarding. */
  products: ProductId[]
  /** Paket layanan (bundling) yang di-onboard; template Onboarding & Pembayaran. */
  planId: PlanId | null
  summary: IssueSummary
  issueStatus: IssueStatus
  paymentMethod: PaymentMethod | null
  /** null untuk tiket tanpa pembayaran (template selain onboarding). */
  paymentStatus: PaymentStatus | null
  /** Harga paket per bulan (Rupiah). */
  amount: number
  source: "voice_ai" | "manual"
  createdAt: string
  updatedAt: string
  dueDate: string | null
  journey: JourneyEvent[]
}

/** Data yang diisi saat membuat atau mengubah tiket. */
export type TicketInput = Omit<Ticket, "id" | "createdAt" | "updatedAt" | "journey"> & {
  journey?: JourneyEvent[]
}
