import type {
  IssueCategory,
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

/**
 * Tingkat urgensi tiket kendala = prioritas tiket (4 tingkat seperti platform asli), ditentukan Gemini.
 * Target respons tim per tingkat (CONTOH, belum SLA resmi).
 */
export const URGENCY_RESPONSE_HOURS: Record<Priority, number> = { urgent: 1, high: 4, medium: 24, low: 48 }

export const URGENCY_RESPONSE_LABEL: Record<Priority, string> = {
  urgent: "maksimal 1 jam",
  high: "maksimal 4 jam",
  medium: "maksimal 1×24 jam",
  low: "maksimal 2×24 jam",
}

/** Kriteria urgensi untuk Gemini (prompt Voice AI) dan untuk ditampilkan ke admin. */
export const URGENCY_CRITERIA: Record<Priority, string> = {
  urgent:
    "layanan berhenti total sehingga pelanggan klien tidak bisa dilayani sama sekali, pembayaran terpotong tetapi paket tidak aktif, atau dugaan masalah keamanan/akses akun",
  high: "fitur utama terganggu sebagian (mis. sebagian chat WhatsApp tidak masuk, chatbot sering salah atau lambat), berdampak ke banyak pelanggan dan belum ada jalan keluar",
  medium: "mengganggu tetapi masih ada cara lain atau dampaknya terbatas, termasuk menanyakan status proses (mis. verifikasi WhatsApp Business)",
  low: "pertanyaan cara pakai, permintaan kecil, atau masalah tampilan yang tidak menghambat usaha",
}

/** Batas waktu respons dari waktu laporan. */
export function responseDueDate(priority: Priority, from = new Date()): string {
  return new Date(from.getTime() + URGENCY_RESPONSE_HOURS[priority] * 3_600_000).toISOString()
}

export const ISSUE_CATEGORY_LABEL: Record<IssueCategory, string> = {
  whatsapp: "WhatsApp & saluran",
  chatbot: "Chatbot AI",
  billing: "Tagihan & paket",
  account: "Akun & login",
  other: "Lainnya",
}

export const ISSUE_CATEGORIES = Object.keys(ISSUE_CATEGORY_LABEL) as IssueCategory[]

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
