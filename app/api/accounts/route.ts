import { randomInt } from "node:crypto"

import { CLIENT_HOME, CLIENT_PATHS } from "@/lib/auth/accounts"
import { handle, jsonError, readJson, str } from "@/lib/server/http"
import { createVoiceAccount, emailTaken, listAccounts } from "@/lib/server/repository"

/**
 * GET /api/accounts: daftar akun demo (tanpa kata sandi), untuk menu ganti akun.
 * GET /api/accounts?email=: { taken } saja, dipakai Voice AI sebelum pembayaran.
 * POST /api/accounts: akun klien dari Voice AI setelah lunas. Kata sandi sementara dibuat server,
 * dikembalikan sekali untuk kartu akun + email kredensial, lalu hanya hash-nya yang disimpan.
 */
export const dynamic = "force-dynamic"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Kata sandi sementara yang mudah dibaca di layar, mis. "Mbee-7K4Q-29". */
function generateTempPassword(): string {
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ"
  const digits = "23456789"
  const pick = (chars: string) => chars[randomInt(chars.length)]
  const block = Array.from({ length: 4 }, (_, i) => (i % 2 === 0 ? pick(digits) : pick(letters))).join("")
  return `Mbee-${block}-${pick(digits)}${pick(digits)}`
}

export const GET = handle(async (request: Request) => {
  const email = new URL(request.url).searchParams.get("email")
  if (email !== null) return Response.json({ taken: await emailTaken(email) })
  return Response.json({ accounts: await listAccounts() })
})

export const POST = handle(async (request: Request) => {
  const body = await readJson(request)
  const input = {
    id: str(body.id, 80),
    name: str(body.name, 120),
    personName: str(body.personName, 120),
    email: str(body.email, 160).toLowerCase(),
    phone: str(body.phone, 40),
  }
  if (!input.id || !input.name || !input.personName || !EMAIL_RE.test(input.email)) return jsonError("Data akun tidak lengkap.", 400)

  const tempPassword = generateTempPassword()
  const account = await createVoiceAccount({ ...input, home: CLIENT_HOME, allowedPaths: CLIENT_PATHS, tempPassword })
  if (!account) return jsonError("Email sudah terdaftar.", 409)
  return Response.json({ account, tempPassword }, { status: 201 })
})
