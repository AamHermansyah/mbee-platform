import { PLANS, type PlanId } from "@/lib/constants/plans"
import { handle, jsonError, readJson, str } from "@/lib/server/http"
import { createInvoice, listInvoices } from "@/lib/server/repository"

/** GET /api/invoices[?accountId=]: riwayat tagihan. POST /api/invoices: tagihan "pending" baru, nomor dibuat server. */
export const dynamic = "force-dynamic"

const PLAN_IDS = new Set<string>(PLANS.map((p) => p.id))

export const GET = handle(async (request: Request) => {
  const accountId = new URL(request.url).searchParams.get("accountId")
  return Response.json({ invoices: await listInvoices(accountId) })
})

export const POST = handle(async (request: Request) => {
  const body = await readJson(request)
  const accountId = str(body.accountId, 80)
  const planId = str(body.planId, 40)
  const upgradeFrom = str(body.upgradeFrom, 40) || null
  const amount = Number(body.amount)
  if (!accountId || !PLAN_IDS.has(planId) || !Number.isFinite(amount) || amount < 0) return jsonError("Data tagihan tidak valid.", 400)
  if (upgradeFrom && !PLAN_IDS.has(upgradeFrom)) return jsonError("Paket sebelumnya tidak valid.", 400)
  const invoice = await createInvoice({ accountId, planId: planId as PlanId, amount, upgradeFrom: upgradeFrom as PlanId | null })
  return Response.json({ invoice }, { status: 201 })
})
