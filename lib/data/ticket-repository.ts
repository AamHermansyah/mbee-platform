import { useTicketStore } from "@/lib/stores/ticket-store"
import type { JourneyEvent, Ticket, TicketInput } from "@/lib/types"

/**
 * Satu-satunya pintu untuk membaca dan mengubah tiket.
 *
 * Tahap 1: data mock di zustand + localStorage.
 * Tahap 2: isi fungsi di sini diganti panggilan API, dan tool Voice AI
 * (buat tiket, ubah tiket, catat pembayaran) memanggil fungsi yang sama.
 * Komponen UI tidak perlu diubah.
 */
export const ticketRepository = {
  async list(): Promise<Ticket[]> {
    return useTicketStore.getState().tickets
  },

  async get(id: string): Promise<Ticket | undefined> {
    return useTicketStore.getState().tickets.find((t) => t.id === id)
  },

  async create(input: TicketInput): Promise<Ticket> {
    return useTicketStore.getState().create(input)
  },

  async update(
    id: string,
    patch: Partial<TicketInput>,
    event?: Omit<JourneyEvent, "at">
  ): Promise<Ticket | undefined> {
    return useTicketStore.getState().update(id, patch, event)
  },

  async remove(id: string): Promise<void> {
    useTicketStore.getState().remove(id)
  },

  async resetToSample(): Promise<void> {
    useTicketStore.getState().reset()
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
