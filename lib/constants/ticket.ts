import type {
  IssueStatus,
  JourneyStage,
  PaymentMethod,
  PaymentStatus,
  Priority,
  Sentiment,
  TicketTemplate,
} from "@/lib/types"

/**
 * Kolom kanban = status isu. Warna diambil dari palet status tiket mimin
 * (app/(dashboard)/ticket/_constants/color.ts).
 */
export const ISSUE_STATUSES: { id: IssueStatus; label: string; color: string; isEnd?: boolean }[] = [
  { id: "open", label: "Open", color: "#D67B3F" },
  { id: "on_progress", label: "On progress", color: "#D4A327" },
  { id: "resolved", label: "Resolved", color: "#168A72", isEnd: true },
]

export const ISSUE_STATUS_LABEL = Object.fromEntries(ISSUE_STATUSES.map((s) => [s.id, s.label])) as Record<
  IssueStatus,
  string
>

export const ISSUE_STATUS_COLOR = Object.fromEntries(ISSUE_STATUSES.map((s) => [s.id, s.color])) as Record<
  IssueStatus,
  string
>

export const TEMPLATE_LABEL: Record<TicketTemplate, string> = {
  onboarding_payment: "Onboarding & Pembayaran",
  technical: "Kendala Teknis",
  billing: "Tagihan",
  general: "Pertanyaan Umum",
}

export const TEMPLATES = Object.keys(TEMPLATE_LABEL) as TicketTemplate[]

export const PRIORITY_LABEL: Record<Priority, string> = {
  low: "Rendah",
  medium: "Sedang",
  high: "Tinggi",
  urgent: "Mendesak",
}

export const PRIORITIES: Priority[] = ["low", "medium", "high", "urgent"]

/** Warna label prioritas mengikuti SolidPriorityTag mimin. */
export const PRIORITY_TONE: Record<Priority, string> = {
  low: "border-emerald-200 bg-emerald-50 text-emerald-700",
  medium: "border-amber-200 bg-amber-50 text-amber-700",
  high: "border-orange-200 bg-orange-50 text-orange-700",
  urgent: "border-rose-200 bg-rose-50 text-rose-700",
}

/** Tim internal Mbee Platform yang bisa ditugaskan. */
export const ASSIGNEES = ["Dewi (CS)", "Fajar (Teknis)", "Lina (Finance)", "Admin Mbee"]

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  qris: "QRIS",
  virtual_account: "Virtual Account",
  ewallet: "E-wallet",
  credit_card: "Kartu kredit",
  bank_transfer: "Transfer bank",
}

export const PAYMENT_METHODS = Object.keys(PAYMENT_METHOD_LABEL) as PaymentMethod[]

export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  unpaid: "Belum bayar",
  pending: "Menunggu",
  paid: "Lunas",
  failed: "Gagal",
  expired: "Kedaluwarsa",
}

export const PAYMENT_STATUSES = Object.keys(PAYMENT_STATUS_LABEL) as PaymentStatus[]

export const SENTIMENT_LABEL: Record<Sentiment, string> = {
  positive: "Positif",
  neutral: "Netral",
  negative: "Negatif",
}

export const SENTIMENTS: Sentiment[] = ["positive", "neutral", "negative"]

export const JOURNEY_STAGE_LABEL: Record<JourneyStage, string> = {
  greeting: "Sapaan",
  discovery: "Kebutuhan",
  recommendation: "Rekomendasi",
  data: "Data & tiket",
  payment: "Pembayaran",
  account: "Pembuatan akun",
  summary: "Ringkasan",
  handling: "Penanganan",
}
