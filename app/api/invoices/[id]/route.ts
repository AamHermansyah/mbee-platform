import { handle, jsonError, readJson } from "@/lib/server/http"
import { updateInvoice } from "@/lib/server/repository"
import type { Invoice } from "@/lib/stores/billing-store"

type IdContext = { params: Promise<{ id: string }> }

/** PATCH /api/invoices/:id  body: sebagian Invoice (status, metode, waktu bayar, periode). */
export const PATCH = handle(async (request: Request, ctx: IdContext) => {
  // Nomor invoice memakai "/" (INV/YYYYMMDD/NNNN), jadi dikirim ter-encode di URL
  const id = decodeURIComponent((await ctx.params).id)
  const invoice = await updateInvoice(id, await readJson<Partial<Invoice>>(request))
  return invoice ? Response.json({ invoice }) : jsonError("Tagihan tidak ditemukan.", 404)
})
