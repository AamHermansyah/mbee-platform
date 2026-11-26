import nodemailer from "nodemailer"

import { PLATFORM_NAME } from "@/lib/constants/brand"

/**
 * Pengirim email (khusus server). Port dari email_notifier.py ("WebRTC Avatar Revised"):
 * SMTP 465 = SSL, 587 = STARTTLS; EMAIL_DRY_RUN=1 atau kredensial kosong = tidak dikirim, hanya dicatat di terminal.
 */

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

// Pengaman sederhana untuk demo: endpoint email tanpa login, jadi batasi jumlah email per proses server.
const WINDOW_MS = 10 * 60_000
const MAX_PER_WINDOW = 30
let sentTimes: number[] = []

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
    fromName: process.env.EMAIL_FROM_NAME?.trim() || `Tim ${PLATFORM_NAME}`,
    dryRun,
  }
}

export interface MailResult {
  sent: boolean
  dryRun?: boolean
  detail?: string
  /** Kode HTTP yang cocok untuk route. */
  status: number
}

export async function sendMail(mail: { to: string; subject: string; text: string; html: string; tag: string }): Promise<MailResult> {
  const now = Date.now()
  sentTimes = sentTimes.filter((t) => now - t < WINDOW_MS)
  if (sentTimes.length >= MAX_PER_WINDOW) {
    return { sent: false, detail: "batas pengiriman email demo tercapai, coba lagi nanti", status: 429 }
  }

  const cfg = config()
  if (cfg.dryRun || !cfg.username || !cfg.password || !cfg.smtpHost) {
    const reason = cfg.dryRun ? "EMAIL_DRY_RUN aktif" : "kredensial SMTP belum diisi"
    console.info(`[EMAIL] DRY RUN (${reason}) ${mail.tag} → ${mail.to}: ${mail.subject}`)
    return { sent: false, dryRun: true, detail: reason, status: 200 }
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
      to: mail.to,
      subject: mail.subject,
      text: mail.text,
      html: mail.html,
    })
    sentTimes.push(now)
    console.info(`[EMAIL] ${mail.tag} → ${mail.to}: terkirim (${info.messageId})`)
    return { sent: true, status: 200 }
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error)
    console.warn(`[EMAIL] ${mail.tag} → ${mail.to}: GAGAL ${detail}`)
    return { sent: false, detail: "server email menolak atau tidak bisa dihubungi", status: 502 }
  }
}
