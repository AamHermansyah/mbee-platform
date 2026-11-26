import { CreditCard, Rocket, Ticket, type LucideIcon } from "lucide-react"

import type { Role } from "@/lib/auth/accounts"

/**
 * Menu sidebar per peran. Hanya menu yang dipakai di skenario lomba:
 * klien (Mbee Cafe) → Mulai + Penagihan, admin internal mimin → Tiket.
 * Riwayat penagihan tidak punya menu sendiri (sama seperti mimin): dibuka dari halaman Penagihan.
 * Label dan grup mengikuti i18n/id.json mimin-workflow.
 */
export interface NavItem {
  id: string
  label: string
  href: string
  icon: LucideIcon
}

export interface NavGroup {
  id: string
  label: string
  items: NavItem[]
}

export const NAV_BY_ROLE: Record<Role, NavGroup[]> = {
  client: [
    {
      id: "onboarding",
      label: "Onboarding",
      items: [{ id: "get-started", label: "Mulai", href: "/dashboard/get-started", icon: Rocket }],
    },
    {
      id: "admin",
      label: "Admin",
      items: [{ id: "billing", label: "Penagihan", href: "/dashboard/billing", icon: CreditCard }],
    },
  ],
  admin: [
    {
      id: "communication",
      label: "Komunikasi",
      items: [{ id: "ticket", label: "Tiket", href: "/dashboard/ticket", icon: Ticket }],
    },
  ],
}

/** Item menu yang cocok dengan path saat ini (prefix terpanjang). */
export function findNavItem(role: Role, pathname: string): NavItem | undefined {
  return NAV_BY_ROLE[role]
    .flatMap((g) => g.items)
    .filter((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))
    .sort((a, b) => b.href.length - a.href.length)[0]
}
