"use client"

import GetStartedClient from "@/components/get-started/get-started-client"
import type { RequiredMenu } from "@/components/get-started/required-menu"

/**
 * Pengganti `app/(dashboard)/get-started/page.tsx` mimin-workflow. Di mimin daftar menu wajib
 * diambil dari backend (getRequiredMenu); demo ini tanpa backend, jadi daftarnya kosong dan
 * langkah berbasis menu (AI agent, saluran, tim) belum selesai sampai dilewati.
 */
const MENUS: RequiredMenu[] = []

export function GetStartedPage() {
  return <GetStartedClient menus={MENUS} />
}
