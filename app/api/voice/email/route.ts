import nodemailer from "nodemailer"

import { PLATFORM_NAME } from "@/lib/constants/brand"

/**
 * POST /api/voice/email  body: { to, personName, businessName, planName, password }
 *
 * Mengirim email kredensial akun yang dibuat Voice AI setelah pembayaran lunas di landing.
 * Port dari email_notifier.py ("WebRTC Avatar Revised"): SMTP 465 = SSL, 587 = STARTTLS,
 * EMAIL_DRY_RUN=1 atau kredensial kosong = tidak dikirim, hanya dicatat di terminal.
 * Link masuk dibuat di server dari origin permintaan, bukan dari isian browser.
 */

const BRAND_COLOR = "#017b89" // --primary hsl(186 99% 27%)
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

// Pengaman sederhana untuk demo: endpoint ini tanpa login, jadi batasi jumlah email per proses server.
const WINDOW_MS = 10 * 60_000
const MAX_PER_WINDOW = 10
let sentTimes: number[] = []

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] ?? c)
}

function clean(value: unknown, max = 120): string {
  return typeof value === "string" ? value.trim().slice(0, max) : ""
}

function config() {
  const username = process.env.EMAIL_USERNAME?.trim() ?? ""
  const imapHost = process.env.IMAP_HOST?.trim() ?? ""
  // Sama seperti email_notifier.py: SMTP_HOST kosong → tebak dari IMAP_HOST (imap.x.com → smtp.x.com)
  const smtpHost = process.env.SMTP_HOST?.trim() || (imapHost.startsWith("imap.") ? `smtp.${imapHost.slice(5)}` : imapHost)
  const dryRun = ["1", "true", "yes"].includes((process.env.EMAIL_DRY_RUN ?? "").trim().toLowerCase())
  return {
    username,
    password: process.env.EMAIL_PASSWORD ?? "",
    smtpHost,
    smtpPort: Number(process.env.SMTP_PORT || 465),
    from: process.env.EMAIL_FROM?.trim() || username,
    fromName: process.env.EMAIL_FROM_NAME?.trim() || `Tim Onboarding ${PLATFORM_NAME}`,
    dryRun,
  }
}

function buildEmail(input: { personName: string; businessName: string; planName: string; email: string; password: string; loginUrl: string }) {
  const { personName, businessName, planName, email, password, loginUrl } = input
  const subject = `Akun ${PLATFORM_NAME} Anda sudah siap`
  const text = `Halo ${personName},

Terima kasih, pembayaran paket ${planName} untuk ${businessName} sudah kami terima. Akun ${PLATFORM_NAME} Anda sudah dibuat.

Email             : ${email}
Kata sandi sementara: ${password}

Masuk ke dashboard: ${loginUrl}

Demi keamanan, Anda wajib mengganti kata sandi sementara saat pertama masuk. Jangan bagikan email ini kepada siapa pun.

Salam,
Tim Onboarding ${PLATFORM_NAME}
`
  const row = (label: string, value: string, mono = false) =>
    `<tr><td style="padding:10px 16px;border-bottom:1px solid #e5e7eb;width:170px;font-size:12px;color:#64748b">${escapeHtml(label)}</td>` +
    `<td style="padding:10px 16px;border-bottom:1px solid #e5e7eb;font-size:14px;color:#0f172a;font-weight:600;${mono ? "font-family:Consolas,Menlo,monospace" : ""}">${escapeHtml(value)}</td></tr>`

  const html = `<!doctype html><html><body style="margin:0;background:#f4f6f8;font-family:Poppins,Helvetica,Arial,sans-serif;color:#0f172a">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 12px">
<table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">
<tr><td style="padding:24px 28px;border-bottom:1px solid #e5e7eb">
  <span style="display:inline-block;width:32px;height:32px;border-radius:999px;background:${BRAND_COLOR};color:#fff;text-align:center;line-height:32px;font-weight:700;font-size:15px">M</span>
  <span style="margin-left:10px;font-size:17px;font-weight:600;vertical-align:middle">${escapeHtml(PLATFORM_NAME)}</span>
</td></tr>
<tr><td style="padding:28px;font-size:14px;line-height:1.65">
  <p style="margin:0 0 6px;font-size:20px;font-weight:600">Akun Anda sudah siap</p>
  <p>Halo <b>${escapeHtml(personName)}</b>,</p>
  <p>Terima kasih, pembayaran paket <b>${escapeHtml(planName)}</b> untuk <b>${escapeHtml(businessName)}</b> sudah kami terima. Akun ${escapeHtml(PLATFORM_NAME)} Anda sudah dibuat.</p>
  <table cellpadding="0" cellspacing="0" style="width:100%;border:1px solid #e5e7eb;border-radius:8px;border-collapse:separate;margin:18px 0">
    ${row("Email", email)}${row("Kata sandi sementara", password, true)}
  </table>
  <p style="text-align:center;margin:24px 0 8px"><a href="${escapeHtml(loginUrl)}" style="background:${BRAND_COLOR};color:#fff;text-decoration:none;padding:12px 28px;border-radius:999px;display:inline-block;font-weight:600">Masuk ke Dashboard</a></p>
  <p style="font-size:12px;color:#64748b;text-align:center;word-break:break-all;margin:0 0 18px">Atau buka: ${escapeHtml(loginUrl)}</p>
  <p style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:10px 14px;font-size:13px">Demi keamanan, Anda <b>wajib mengganti kata sandi sementara</b> saat pertama masuk. Jangan bagikan email ini kepada siapa pun.</p>
  <p style="margin-bottom:0">Salam hangat,<br><b>Tim Onboarding ${escapeHtml(PLATFORM_NAME)}</b></p>
</td></tr>
<tr><td style="padding:14px 28px;background:#f8fafc;font-size:11px;color:#94a3b8;text-align:center">Email otomatis dari ${escapeHtml(PLATFORM_NAME)} · mohon tidak membalas email ini</td></tr>
</table></td></tr></table></body></html>`
  return { subject, text, html }
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

  const now = Date.now()
  sentTimes = sentTimes.filter((t) => now - t < WINDOW_MS)
  if (sentTimes.length >= MAX_PER_WINDOW) {
    return Response.json({ sent: false, detail: "batas pengiriman email demo tercapai, coba lagi nanti" }, { status: 429 })
  }

  const loginUrl = `${new URL(request.url).origin}/login?email=${encodeURIComponent(to)}`
  const mail = buildEmail({ personName, businessName: businessName || personName, planName: planName || "-", email: to, password, loginUrl })
  const cfg = config()

  if (cfg.dryRun || !cfg.username || !cfg.password || !cfg.smtpHost) {
    const reason = cfg.dryRun ? "EMAIL_DRY_RUN aktif" : "kredensial SMTP belum diisi"
    console.info(`[EMAIL] DRY RUN (${reason}) → ${to}: ${mail.subject}`)
    return Response.json({ sent: false, dryRun: true, detail: reason })
  }

  const transport = nodemailer.createTransport({
    host: cfg.smtpHost,
    port: cfg.smtpPort,
    secure: cfg.smtpPort === 465, // 587/25 → STARTTLS otomatis
    auth: { user: cfg.username, pass: cfg.password },
    connectionTimeout: 15_000,
    greetingTimeout: 15_000,
    socketTimeout: 30_000,
  })

  try {
    const info = await transport.sendMail({
      from: { name: cfg.fromName, address: cfg.from },
      to,
      subject: mail.subject,
      text: mail.text,
      html: mail.html,
    })
    sentTimes.push(now)
    console.info(`[EMAIL] kredensial akun → ${to}: terkirim (${info.messageId})`)
    return Response.json({ sent: true })
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error)
    console.warn(`[EMAIL] kredensial akun → ${to}: GAGAL ${detail}`)
    return Response.json({ sent: false, detail: "server email menolak atau tidak bisa dihubungi" }, { status: 502 })
  }
}
