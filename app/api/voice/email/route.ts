import { EMAIL_RE, sendMail } from "@/lib/email/mailer"
import { credentialsEmail } from "@/lib/email/templates"

/**
 * POST /api/voice/email  body: { to, personName, businessName, planName, password }
 *
 * Mengirim email kredensial akun yang dibuat Voice AI setelah pembayaran lunas di landing.
 * Link masuk dibuat di server dari origin permintaan, bukan dari isian browser.
 */

function clean(value: unknown, max = 120): string {
  return typeof value === "string" ? value.trim().slice(0, max) : ""
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
  const to = clean(body.to).toLowerCase()
  const personName = clean(body.personName)
  const businessName = clean(body.businessName)
  const planName = clean(body.planName, 40)
  const password = clean(body.password, 40)
  if (!EMAIL_RE.test(to) || !personName || !password) {
    return Response.json({ sent: false, detail: "data email tidak lengkap" }, { status: 400 })
  }

  const loginUrl = `${new URL(request.url).origin}/login?email=${encodeURIComponent(to)}`
  const mail = credentialsEmail({ personName, businessName: businessName || personName, planName: planName || "-", email: to, password, loginUrl })
  const result = await sendMail({ to, ...mail, tag: "kredensial akun" })
  return Response.json({ sent: result.sent, dryRun: result.dryRun, detail: result.detail }, { status: result.status })
}
