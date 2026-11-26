import { handle, readJson } from "@/lib/server/http"
import { createTicket, listTickets } from "@/lib/server/repository"
import type { TicketInput } from "@/lib/types"

/** GET /api/tickets: semua tiket (kanban admin). POST /api/tickets: buat tiket, nomor dibuat server. */
export const dynamic = "force-dynamic"

export const GET = handle(async () => Response.json({ tickets: await listTickets() }))

export const POST = handle(async (request: Request) => {
  const input = await readJson<TicketInput>(request)
  return Response.json({ ticket: await createTicket(input) }, { status: 201 })
})
