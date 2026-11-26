import { ensureDatabase } from "@/lib/server/db"
import { handle } from "@/lib/server/http"
import { resetToSample } from "@/lib/server/seed"

/** POST /api/data/reset: "Pulihkan data contoh" di kanban admin. Berlaku untuk semua pengguna demo. */
export const POST = handle(async () => {
  await ensureDatabase()
  await resetToSample()
  return Response.json({ ok: true })
})
