import { isPasswordPolicyValid } from "@/lib/auth/password-policy"
import { handle, jsonError, readJson } from "@/lib/server/http"
import { changePassword } from "@/lib/server/repository"

type IdContext = { params: Promise<{ id: string }> }

/** POST /api/accounts/:id/password  body: { password }. Ganti kata sandi sementara (wajib saat pertama masuk). */
export const POST = handle(async (request: Request, ctx: IdContext) => {
  const { id } = await ctx.params
  const { password } = await readJson<{ password?: unknown }>(request)
  if (typeof password !== "string" || !isPasswordPolicyValid(password)) return jsonError("Kata sandi tidak memenuhi persyaratan", 400)
  const result = await changePassword(id, password)
  return result.ok ? Response.json({ account: result.account }) : jsonError(result.error, result.status)
})
