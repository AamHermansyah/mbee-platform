import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"

import { SEED_TICKETS } from "@/lib/data/seed-tickets"
import { jakartaDateKey } from "@/lib/format"
import type { JourneyEvent, Ticket, TicketInput } from "@/lib/types"

const TICKET_STORAGE_KEY = "mbee-platform-tickets-v3"

interface TicketState {
  tickets: Ticket[]
  /** true setelah data dari localStorage dimuat di browser. */
  hydrated: boolean
  create: (input: TicketInput) => Ticket
  update: (
    id: string,
    patch: Partial<TicketInput>,
    event?: Omit<JourneyEvent, "at">
  ) => Ticket | undefined
  remove: (id: string) => void
  reset: () => void
}

function nextTicketId(tickets: Ticket[], now: Date): string {
  const prefix = `TKT-${jakartaDateKey(now)}-`
  const lastSeq = tickets
    .filter((t) => t.id.startsWith(prefix))
    .map((t) => Number(t.id.slice(prefix.length)))
    .reduce((max, seq) => Math.max(max, seq), 0)
  return `${prefix}${String(lastSeq + 1).padStart(3, "0")}`
}

export const useTicketStore = create<TicketState>()(
  persist(
    (set, get) => ({
      tickets: SEED_TICKETS,
      hydrated: false,

      create: (input) => {
        const now = new Date()
        const ticket: Ticket = {
          ...input,
          id: nextTicketId(get().tickets, now),
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
          journey: input.journey ?? [],
        }
        set({ tickets: [ticket, ...get().tickets] })
        return ticket
      },

      update: (id, patch, event) => {
        let updated: Ticket | undefined
        const now = new Date().toISOString()
        set({
          tickets: get().tickets.map((ticket) => {
            if (ticket.id !== id) return ticket
            updated = {
              ...ticket,
              ...patch,
              summary: patch.summary ? { ...ticket.summary, ...patch.summary } : ticket.summary,
              journey: event ? [...ticket.journey, { ...event, at: now }] : ticket.journey,
              updatedAt: now,
            }
            return updated
          }),
        })
        return updated
      },

      remove: (id) => set({ tickets: get().tickets.filter((t) => t.id !== id) }),

      reset: () => set({ tickets: SEED_TICKETS }),
    }),
    {
      name: TICKET_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ tickets: state.tickets }),
      // Dimuat manual oleh hydrateTickets() setelah mount supaya render server dan render pertama di browser sama.
      skipHydration: true,
    }
  )
)

/** Muat tiket dari localStorage sekali per halaman. */
export async function hydrateTickets(): Promise<void> {
  if (useTicketStore.getState().hydrated) return
  await useTicketStore.persist.rehydrate()
  useTicketStore.setState({ hydrated: true })
}

/**
 * Sinkron antar tab: tab admin langsung melihat perubahan yang dibuat
 * Voice AI di tab Mbee Cafe (event "storage" hanya terkirim ke tab lain).
 */
export function subscribeTicketSync(): () => void {
  const onStorage = (event: StorageEvent) => {
    if (event.key === TICKET_STORAGE_KEY) void useTicketStore.persist.rehydrate()
  }
  window.addEventListener("storage", onStorage)
  return () => window.removeEventListener("storage", onStorage)
}
