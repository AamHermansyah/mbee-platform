import type { ProductId } from "@/lib/types"

/** Layanan (modul) mimin yang bisa diaktifkan di akun saat onboarding. Harga ada di paket (lib/constants/plans.ts). */
export interface Product {
  id: ProductId
  name: string
  tagline: string
}

export const PRODUCTS: Product[] = [
  {
    id: "gen_ai_chatbot",
    name: "GenAI Chatbot",
    tagline: "Menjawab pertanyaan menu dan promo 24 jam",
  },
  {
    id: "order_management",
    name: "Kelola Pesanan",
    tagline: "Terima pesanan ambil sendiri langsung dari chat",
  },
  {
    id: "omnichannel",
    name: "Omnichannel",
    tagline: "WhatsApp, Instagram, dan web dalam satu kotak masuk",
  },
  {
    id: "reservation",
    name: "Reservasi",
    tagline: "Booking meja otomatis dengan pengingat",
  },
  {
    id: "campaign_waba",
    name: "Kampanye WhatsApp",
    tagline: "Kirim promo ke pelanggan setia",
  },
  {
    id: "voice_ai",
    name: "Voice AI",
    tagline: "Agen suara untuk telepon masuk dan keluar",
  },
  {
    id: "csat",
    name: "CSAT",
    tagline: "Survei kepuasan setelah transaksi",
  },
]

const PRODUCT_MAP = new Map(PRODUCTS.map((p) => [p.id, p]))

export function getProduct(id: ProductId): Product {
  const product = PRODUCT_MAP.get(id)
  if (!product) throw new Error(`Produk tidak dikenal: ${id}`)
  return product
}
