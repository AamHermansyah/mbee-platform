import { Building, Database, MessageSquare, Users, type LucideIcon } from "lucide-react"

/**
 * Paket langganan mengikuti mimin-workflow (billing/_constants/plans.ts):
 * Seed, Starter, Growth, Enterprise dengan fitur yang sama.
 * Di mimin harga datang dari backend; di sini harga CONTOH (IDR per bulan).
 */
export type PlanId = "seed" | "starter" | "growth" | "enterprise"

export interface Plan {
  id: PlanId
  name: string
  icon: LucideIcon
  description: string
  /** null = Custom (hubungi sales). */
  monthlyPrice: number | null
  buttonText: string
  highlight?: boolean
  features: string[]
}

export const PLANS: Plan[] = [
  {
    id: "seed",
    name: "Seed",
    icon: Users,
    description: "Fitur dasar untuk penggunaan pribadi",
    monthlyPrice: 499_000,
    buttonText: "Gabung Seed",
    features: ["2 Kursi", "MUV Tanpa Batas", "1 Saluran", "500 MAU", "3 Alur"],
  },
  {
    id: "starter",
    name: "Starter",
    icon: MessageSquare,
    description: "Semua yang ada di Seed, plus...",
    monthlyPrice: 1_299_000,
    buttonText: "Gabung Starter",
    features: ["5 Kursi", "MUV Tanpa Batas", "3 Saluran", "3.000 MAU", "5 Alur", "300 MAS"],
  },
  {
    id: "growth",
    name: "Growth",
    icon: Database,
    description: "Tingkatkan bisnis Anda dengan mudah",
    monthlyPrice: 2_499_000,
    buttonText: "Pilih Growth",
    highlight: true,
    features: ["10 Kursi", "MUV Tanpa Batas", "Semua Saluran Standar", "10.000 MAU", "15 Alur", "1.000 MAS"],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    icon: Building,
    description: "Disesuaikan untuk organisasi besar",
    monthlyPrice: null,
    buttonText: "Hubungi Sales",
    features: ["Kursi Kustom", "MUV Tanpa Batas", "Semua Saluran", "MAU Kustom", "Alur Tanpa Batas", "MAS Kustom"],
  },
]

const PLAN_MAP = new Map(PLANS.map((p) => [p.id, p]))

export function getPlan(id: PlanId): Plan {
  const plan = PLAN_MAP.get(id)
  if (!plan) throw new Error(`Paket tidak dikenal: ${id}`)
  return plan
}

/** Urutan paket dari terendah (Seed) ke tertinggi (Enterprise), mengikuti urutan PLANS. */
export function planRank(id: PlanId): number {
  return PLANS.findIndex((p) => p.id === id)
}

/**
 * Status sebuah paket bagi akun yang sudah berlangganan:
 * - current: paket aktif sekarang
 * - upgrade: di atas paket aktif, boleh dibeli
 * - unavailable: di bawah paket aktif, tidak bisa dibeli lagi
 */
export type PlanAvailability = "current" | "upgrade" | "unavailable"

export function planAvailability(current: PlanId, target: PlanId): PlanAvailability {
  const diff = planRank(target) - planRank(current)
  return diff === 0 ? "current" : diff > 0 ? "upgrade" : "unavailable"
}

/** Paket di atas paket aktif (urut naik). */
export function higherPlans(current: PlanId): Plan[] {
  return PLANS.filter((p) => planRank(p.id) > planRank(current))
}

/** Paket di bawah paket aktif. */
export function lowerPlans(current: PlanId): Plan[] {
  return PLANS.filter((p) => planRank(p.id) < planRank(current))
}

/**
 * Harga upgrade = selisih harga paket baru dengan paket aktif (lebih murah dari harga normal paket baru),
 * dan masa berlaku tetap sampai akhir periode berjalan. Demo tanpa prorata harian.
 * Null bila salah satu paket custom (Enterprise): lewat tim sales.
 */
export function upgradePrice(from: PlanId, to: PlanId): number | null {
  const a = getPlan(from).monthlyPrice
  const b = getPlan(to).monthlyPrice
  return a === null || b === null ? null : Math.max(0, b - a)
}

/** Harga paket berbayar (Enterprise tidak bisa dibeli lewat checkout). */
export function planPrice(id: PlanId): number {
  return getPlan(id).monthlyPrice ?? 0
}

/** Baris tabel perbandingan fitur (comparison-table mimin). */
export const COMPARISON_ROWS: { label: string; values: Record<PlanId, string> }[] = [
  { label: "Jumlah Kursi", values: { seed: "2", starter: "5", growth: "10", enterprise: "Kustom" } },
  { label: "MUV Omnichannel", values: { seed: "Tanpa batas", starter: "Tanpa batas", growth: "Tanpa batas", enterprise: "Tanpa batas" } },
  { label: "Saluran yang Terhubung", values: { seed: "1", starter: "3", growth: "Semua standar", enterprise: "Semua" } },
  { label: "MAU", values: { seed: "500", starter: "3.000", growth: "10.000", enterprise: "Kustom" } },
  { label: "NLP AI Chatbot", values: { seed: "3 alur", starter: "5 alur", growth: "15 alur", enterprise: "Tanpa batas" } },
  { label: "GenAI Chatbot (MAS)", values: { seed: "—", starter: "300", growth: "1.000", enterprise: "Kustom" } },
  { label: "Voice AI", values: { seed: "Add-on", starter: "Add-on", growth: "Add-on", enterprise: "Termasuk" } },
  { label: "Dukungan Onboarding", values: { seed: "Voice AI", starter: "Voice AI", growth: "Voice AI + tim", enterprise: "Tim khusus" } },
]
