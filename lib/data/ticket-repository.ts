import { toast } from "sonner"

import { useTicketStore } from "@/lib/stores/ticket-store"
import type { JourneyEvent, Ticket, TicketInput } from "@/lib/types"

/**
 * Satu-satunya pintu untuk membaca dan mengubah tiket. Data ada di Supabase (tabel mbee.tickets)
 * lewat /api/tickets; store menyimpan salinannya untuk tampilan. Tool Voice AI dan kanban admin
 * memanggil fungsi yang sama.
 */

let lastSaveErrorAt = 0

/** Gagal menyimpan perubahan tiket tidak boleh menghentikan percakapan Voice AI; cukup beri tahu sekali. */
function reportSaveError(error: unknown) {
  console.warn("[tiket] gagal menyimpan:", error instanceof Error ? error.message : error)
  if (Date.now() - lastSaveErrorAt < 10_000) return
  lastSaveErrorAt = Date.now()
  toast.error("Perubahan tiket belum tersimpan", { description: "Koneksi ke database bermasalah. Coba lagi sebentar." })
}

export const ticketRepository = {
  async list(): Promise<Ticket[]> {
    return useTicketStore.getState().tickets
  },

  async get(id: string): Promise<Ticket | undefined> {
    return useTicketStore.getState().tickets.find((t) => t.id === id)
  },

  /** Nomor tiket dibuat server. Melempar error bila database tidak bisa diakses. */
  async create(input: TicketInput): Promise<Ticket> {
    return useTicketStore.getState().create(input)
  },

  async update(
    id: string,
    patch: Partial<TicketInput>,
    event?: Omit<JourneyEvent, "at">
  ): Promise<Ticket | undefined> {
    try {
      return await useTicketStore.getState().update(id, patch, event)
    } catch (error) {
      reportSaveError(error)
      return undefined
    }
  },

  async remove(id: string): Promise<void> {
    try {
      await useTicketStore.getState().remove(id)
    } catch (error) {
      reportSaveError(error)
    }
  },

  /** "Pulihkan data contoh": tiket, tagihan, dan akun dari Voice AI di database kembali ke awal. */
  async resetToSample(): Promise<void> {
    await useTicketStore.getState().reset()
  },
}

/** Hook baca untuk komponen: daftar tiket yang selalu terbaru. */
export function useTickets(): Ticket[] {
  return useTicketStore((state) => state.tickets)
}

export function useTicket(id: string | null | undefined): Ticket | undefined {
  return useTicketStore((state) => (id ? state.tickets.find((t) => t.id === id) : undefined))
}

export function useTicketsHydrated(): boolean {
  return useTicketStore((state) => state.hydrated)
}

/** Tiket onboarding terbaru milik akun klien (dipakai halaman Mulai). */
export function useLatestOnboardingTicket(accountId: string | undefined): Ticket | undefined {
  return useTicketStore((state) =>
    accountId
      ? state.tickets
          .filter((t) => t.accountId === accountId && t.template === "onboarding_payment")
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]
      : undefined
  )
}
