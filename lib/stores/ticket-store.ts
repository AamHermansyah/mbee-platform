import { create } from "zustand"

import { api, createMutationGuard, startPolling } from "@/lib/data/api"
import type { JourneyEvent, Ticket, TicketInput } from "@/lib/types"

/**
 * Cache tiket di browser. Sumber datanya tabel mbee.tickets di Supabase (lewat /api/tickets).
 * Nomor tiket dibuat server; perubahan tampil langsung di layar lalu diganti hasil dari server.
 */
interface TicketState {
  tickets: Ticket[]
  /** true setelah daftar tiket pertama kali dimuat dari server. */
  hydrated: boolean
  create: (input: TicketInput) => Promise<Ticket>
  update: (id: string, patch: Partial<TicketInput>, event?: Omit<JourneyEvent, "at">) => Promise<Ticket | undefined>
  remove: (id: string) => Promise<void>
}

const guard = createMutationGuard()

function upsert(tickets: Ticket[], ticket: Ticket): Ticket[] {
  return tickets.some((t) => t.id === ticket.id) ? tickets.map((t) => (t.id === ticket.id ? ticket : t)) : [ticket, ...tickets]
}

export const useTicketStore = create<TicketState>()((set, get) => ({
  tickets: [],
  hydrated: false,

  create: (input) =>
    guard.run(async () => {
      const { ticket } = await api<{ ticket: Ticket }>("/api/tickets", { method: "POST", body: input })
      set({ tickets: upsert(get().tickets, ticket) })
      return ticket
    }),

  update: (id, patch, event) =>
    guard.run(async () => {
      // Tampilkan perubahan dulu supaya kanban (drag & drop) tidak menunggu jaringan
      const now = new Date().toISOString()
      set({
        tickets: get().tickets.map((ticket) =>
          ticket.id !== id
            ? ticket
            : {
                ...ticket,
                ...patch,
                summary: patch.summary ? { ...ticket.summary, ...patch.summary } : ticket.summary,
                journey: event ? [...ticket.journey, { ...event, at: now }] : ticket.journey,
                updatedAt: now,
              }
        ),
      })
      try {
        const { ticket } = await api<{ ticket: Ticket }>(`/api/tickets/${encodeURIComponent(id)}`, {
          method: "PATCH",
          body: { patch, event },
        })
        set({ tickets: upsert(get().tickets, ticket) })
        return ticket
      } catch (error) {
        await loadTickets()
        throw error
      }
    }),

  remove: (id) =>
    guard.run(async () => {
      set({ tickets: get().tickets.filter((t) => t.id !== id) })
      await api(`/api/tickets/${encodeURIComponent(id)}`, { method: "DELETE" })
    }),
}))

async function loadTickets(): Promise<void> {
  const { tickets } = await api<{ tickets: Ticket[] }>("/api/tickets")
  useTicketStore.setState({ tickets, hydrated: true })
}

/** Muat tiket dari server sekali per halaman. */
export async function hydrateTickets(): Promise<void> {
  if (useTicketStore.getState().hydrated) return
  try {
    await guard.refresh(
      () => api<{ tickets: Ticket[] }>("/api/tickets"),
      ({ tickets }) => useTicketStore.setState({ tickets })
    )
  } finally {
    useTicketStore.setState({ hydrated: true })
  }
}

/**
 * Sinkron antar tab dan perangkat: tab admin melihat tiket yang sedang diisi Voice AI di tempat lain
 * lewat polling tiap 2 detik.
 */
export function subscribeTicketSync(): () => void {
  return startPolling(() =>
    guard.refresh(
      () => api<{ tickets: Ticket[] }>("/api/tickets"),
      ({ tickets }) => useTicketStore.setState({ tickets, hydrated: true })
    )
  )
}
