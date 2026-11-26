import { handle, jsonError, readJson, str } from "@/lib/server/http"
import { authenticate } from "@/lib/server/repository"

/** POST /api/auth/login  body: { email, password }. Kata sandi dicek terhadap hash di database. */
export const POST = handle(async (request: Request) => {
  const body = await readJson(request)
  const email = str(body.email, 160)
  const password = typeof body.password === "string" ? body.password.slice(0, 200) : ""
  if (!email || !password) return jsonError("Email atau kata sandi salah.", 401)
  const account = await authenticate(email, password)
  return account ? Response.json({ account }) : jsonError("Email atau kata sandi salah.", 401)
})
