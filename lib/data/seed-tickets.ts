import { planPrice, type PlanId } from "@/lib/constants/plans"
import type { IssueSummary, JourneyEvent, JourneyStage, Ticket } from "@/lib/types"

/**
 * Data contoh tiket di akun internal Mbee Platform. Tiket bersifat umum (beberapa template);
 * tiket "Onboarding & Pembayaran" berasal dari sesi Voice AI.
 * Semua nama, nomor, dan perusahaan fiktif.
 */

function log(start: string, events: [JourneyStage, string, number][]): JourneyEvent[] {
  const base = new Date(start).getTime()
  return events.map(([stage, label, minutes]) => ({ stage, label, at: new Date(base + minutes * 60_000).toISOString() }))
}

function summary(overview: string, needs: string, obstacles: string, nextAction: string, sentiment: IssueSummary["sentiment"]): IssueSummary {
  return { overview, needs, obstacles, nextAction, sentiment }
}

const ONBOARDING_LOG = (start: string, payLabel: string, upTo = 6) =>
  log(start, [
    ["greeting", "Sesi Voice AI dimulai", 0],
    ["discovery", "Kebutuhan pelanggan tercatat", 1],
    ["recommendation", "Paket layanan dipilih", 2],
    ["data", "Data pelanggan lengkap", 4],
    ["payment", payLabel, 6],
    ["summary", "Ringkasan sesi disimpan", 8],
  ]).slice(0, upTo)

function onboarding(
  base: Omit<Ticket, "template" | "amount" | "source" | "accountId" | "dueDate" | "title" | "planId" | "products"> & {
    planId: PlanId
  }
): Ticket {
  return {
    ...base,
    products: [],
    title: `Onboarding akun · ${base.companyName}`,
    template: "onboarding_payment",
    amount: planPrice(base.planId),
    source: "voice_ai",
    accountId: null,
    dueDate: null,
  }
}

export const SEED_TICKETS: Ticket[] = [
  onboarding({
    id: "TKT-20261125-004",
    priority: "medium",
    assignee: "Dewi (CS)",
    name: "Dimas Prasetyo",
    email: "dimas@kopisenja.id",
    phone: "0813-2210-4471",
    companyName: "Kopi Senja Bandung",
    planId: "growth",
    summary: summary(
      "Kedai kopi ingin menyatukan chat WhatsApp dan Instagram serta mengirim promo mingguan.",
      "Satu kotak masuk untuk 3 admin, broadcast promo setiap Jumat.",
      "",
      "Aktivasi akun dan undang 3 admin.",
      "positive"
    ),
    issueStatus: "resolved",
    paymentMethod: "virtual_account",
    paymentStatus: "paid",
    createdAt: "2026-11-25T07:12:00.000Z",
    updatedAt: "2026-11-25T09:40:00.000Z",
    journey: [
      ...ONBOARDING_LOG("2026-11-25T07:05:00.000Z", "Pembayaran VA lunas"),
      { stage: "handling", label: "Layanan diaktifkan oleh Dewi (CS)", at: "2026-11-25T09:40:00.000Z" },
    ],
  }),
  {
    id: "TKT-20261125-003",
    title: "WhatsApp tidak terhubung setelah ganti nomor",
    template: "technical",
    priority: "urgent",
    assignee: "Fajar (Teknis)",
    accountId: null,
    name: "Maria Fransiska",
    email: "maria@tokobungalily.com",
    phone: "0878-4412-0098",
    companyName: "Toko Bunga Lily",
    products: ["omnichannel"],
    summary: summary(
      "Setelah ganti nomor WhatsApp Business, pesan pelanggan tidak masuk ke kotak masuk Omnichannel.",
      "Pesan WhatsApp kembali masuk ke Omnichannel.",
      "Token WhatsApp lama masih tersimpan.",
      "Hubungkan ulang nomor baru dan uji kirim pesan.",
      "negative"
    ),
    issueStatus: "on_progress",
    paymentMethod: null,
    paymentStatus: null,
    planId: null,
    amount: 0,
    source: "voice_ai",
    createdAt: "2026-11-25T03:20:00.000Z",
    updatedAt: "2026-11-25T04:01:00.000Z",
    dueDate: "2026-11-26T10:00:00.000Z",
    journey: log("2026-11-25T03:20:00.000Z", [
      ["greeting", "Keluhan diterima Voice AI", 0],
      ["handling", "Ditugaskan ke Fajar (Teknis)", 25],
    ]),
  },
  onboarding({
    id: "TKT-20261125-002",
    priority: "medium",
    assignee: "Dewi (CS)",
    name: "Siti Rahmawati",
    email: "siti.rahma@gmail.com",
    phone: "0857-1188-2034",
    companyName: "Roti Bakar 88",
    planId: "seed",
    summary: summary(
      "Ingin menerima pesanan antar lewat WhatsApp tanpa salah catat.",
      "Form pesanan otomatis dan rekap harian.",
      "Belum punya katalog produk digital.",
      "Tim Mbee Platform bantu impor katalog dari file Excel.",
      "neutral"
    ),
    issueStatus: "on_progress",
    paymentMethod: "qris",
    paymentStatus: "paid",
    createdAt: "2026-11-25T02:31:00.000Z",
    updatedAt: "2026-11-25T03:02:00.000Z",
    journey: ONBOARDING_LOG("2026-11-25T02:25:00.000Z", "Pembayaran QRIS lunas"),
  }),
  onboarding({
    id: "TKT-20261125-001",
    priority: "high",
    assignee: null,
    name: "Hendra Gunawan",
    email: "hendra@bakmiahong.com",
    phone: "0812-7788-9012",
    companyName: "Bakmi Ahong",
    planId: "starter",
    summary: summary(
      "Restoran keluarga ingin chatbot untuk reservasi akhir pekan.",
      "Reservasi meja otomatis dan jawaban jam buka.",
      "Ragu soal biaya bulanan, minta waktu diskusi dengan partner.",
      "Kirim penawaran tertulis dan hubungi lagi 27 Nov.",
      "neutral"
    ),
    issueStatus: "open",
    paymentMethod: "virtual_account",
    paymentStatus: "pending",
    createdAt: "2026-11-25T01:10:00.000Z",
    updatedAt: "2026-11-25T01:22:00.000Z",
    journey: ONBOARDING_LOG("2026-11-25T01:02:00.000Z", "Tagihan VA dikirim", 5),
  }),
  {
    id: "TKT-20261124-002",
    title: "Minta faktur pajak bulan Oktober",
    template: "billing",
    priority: "low",
    assignee: "Lina (Finance)",
    accountId: null,
    name: "Nurul Hidayah",
    email: "finance@apoteksehat.co.id",
    phone: "0838-2290-1145",
    companyName: "Apotek Sehat Selalu",
    products: ["gen_ai_chatbot", "omnichannel"],
    summary: summary(
      "Klien meminta faktur pajak untuk tagihan langganan Oktober.",
      "Faktur pajak atas nama PT Sehat Selalu Farma.",
      "",
      "Kirim faktur ke email finance klien.",
      "neutral"
    ),
    issueStatus: "open",
    paymentMethod: null,
    paymentStatus: null,
    planId: null,
    amount: 0,
    source: "manual",
    createdAt: "2026-11-24T08:15:00.000Z",
    updatedAt: "2026-11-24T08:15:00.000Z",
    dueDate: "2026-11-28T10:00:00.000Z",
    journey: log("2026-11-24T08:15:00.000Z", [["handling", "Tiket dibuat manual", 0]]),
  },
  onboarding({
    id: "TKT-20261124-001",
    priority: "high",
    assignee: "Fajar (Teknis)",
    name: "Rudi Hartono",
    email: "rudi.laundrykilat@gmail.com",
    phone: "0815-9081-3320",
    companyName: "Laundry Kilat Jaya",
    planId: "starter",
    summary: summary(
      "Pelanggan mencoba onboarding tetapi koneksi telepon terputus dua kali.",
      "Chatbot untuk cek status cucian.",
      "Koneksi terputus, pembayaran kartu kredit gagal.",
      "CS menelepon ulang dan tawarkan QRIS.",
      "negative"
    ),
    issueStatus: "on_progress",
    paymentMethod: "credit_card",
    paymentStatus: "failed",
    createdAt: "2026-11-24T03:20:00.000Z",
    updatedAt: "2026-11-24T04:01:00.000Z",
    journey: ONBOARDING_LOG("2026-11-24T03:14:00.000Z", "Pembayaran kartu gagal", 5),
  }),
  {
    id: "TKT-20261123-002",
    title: "Chatbot salah menyebut jam buka",
    template: "technical",
    priority: "medium",
    assignee: "Fajar (Teknis)",
    accountId: null,
    name: "Hendra Gunawan",
    email: "hendra@bakmiahong.com",
    phone: "0812-7788-9012",
    companyName: "Bakmi Ahong",
    products: ["gen_ai_chatbot"],
    summary: summary(
      "GenAI Chatbot menjawab restoran buka jam 08.00, padahal buka jam 10.00.",
      "Jawaban jam buka yang benar.",
      "Basis pengetahuan belum diperbarui.",
      "Perbarui basis pengetahuan dan uji ulang.",
      "neutral"
    ),
    issueStatus: "resolved",
    paymentMethod: null,
    paymentStatus: null,
    planId: null,
    amount: 0,
    source: "manual",
    createdAt: "2026-11-23T08:44:00.000Z",
    updatedAt: "2026-11-23T10:15:00.000Z",
    dueDate: null,
    journey: log("2026-11-23T08:44:00.000Z", [
      ["handling", "Tiket dibuat manual", 0],
      ["handling", "Basis pengetahuan diperbarui", 91],
    ]),
  },
  {
    id: "TKT-20261123-001",
    title: "Cara menambah admin baru",
    template: "general",
    priority: "low",
    assignee: "Dewi (CS)",
    accountId: null,
    name: "Ayu Lestari",
    email: "ayu@saloncantik.id",
    phone: "0821-5566-7781",
    companyName: "Salon Cantik Ayu",
    products: ["reservation"],
    summary: summary(
      "Klien bertanya cara menambah admin untuk cabang baru.",
      "Panduan menambah pengguna dan hak akses.",
      "",
      "Kirim tautan panduan menu Pengguna.",
      "positive"
    ),
    issueStatus: "resolved",
    paymentMethod: null,
    paymentStatus: null,
    planId: null,
    amount: 0,
    source: "voice_ai",
    createdAt: "2026-11-23T03:10:00.000Z",
    updatedAt: "2026-11-23T03:30:00.000Z",
    dueDate: null,
    journey: log("2026-11-23T03:10:00.000Z", [
      ["greeting", "Pertanyaan diterima Voice AI", 0],
      ["handling", "Panduan dikirim", 20],
    ]),
  },
  onboarding({
    id: "TKT-20261122-001",
    priority: "low",
    assignee: null,
    name: "Bayu Saputra",
    email: "bayu@distrokaoskita.com",
    phone: "0852-6670-3389",
    companyName: "Distro Kaos Kita",
    planId: "seed",
    summary: summary(
      "Pemilik distro masih membandingkan dengan layanan lain.",
      "Broadcast koleksi baru.",
      "Belum yakin dengan biaya pesan WhatsApp.",
      "Kirim simulasi biaya per 1.000 pesan.",
      "neutral"
    ),
    issueStatus: "open",
    paymentMethod: null,
    paymentStatus: "unpaid",
    createdAt: "2026-11-22T04:50:00.000Z",
    updatedAt: "2026-11-22T05:02:00.000Z",
    journey: ONBOARDING_LOG("2026-11-22T04:44:00.000Z", "", 3),
  }),
]
