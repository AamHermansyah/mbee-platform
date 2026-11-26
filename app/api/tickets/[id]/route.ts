import { handle, jsonError, readJson } from "@/lib/server/http"
import { deleteTicket, updateTicket } from "@/lib/server/repository"
import type { JourneyEvent, TicketInput } from "@/lib/types"

type IdContext = { params: Promise<{ id: string }> }

/** PATCH /api/tickets/:id  body: { patch, event? }. DELETE /api/tickets/:id. */
export const PATCH = handle(async (request: Request, ctx: IdContext) => {
  const { id } = await ctx.params
  const body = await readJson<{ patch?: Partial<TicketInput>; event?: Omit<JourneyEvent, "at"> }>(request)
  const ticket = await updateTicket(id, body.patch ?? {}, body.event)
  return ticket ? Response.json({ ticket }) : jsonError("Tiket tidak ditemukan.", 404)
})

export const DELETE = handle(async (_request: Request, ctx: IdContext) => {
  const { id } = await ctx.params
  await deleteTicket(id)
  return Response.json({ ok: true })
})
