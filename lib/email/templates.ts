import { PLATFORM_NAME } from "@/lib/constants/brand"
import { ISSUE_CATEGORY_LABEL, ISSUE_STATUS_LABEL, PRIORITY_LABEL, URGENCY_RESPONSE_LABEL } from "@/lib/constants/ticket"
import type { IssueCategory, IssueStatus, Priority } from "@/lib/types"

/**
 * Template email Mbee Platform (gaya Flat Minimal: kartu putih berborder di atas latar abu, tombol rounded-full).
 * Setiap email punya versi teks biasa dan HTML.
 */

const BRAND_COLOR = "#017b89" // --primary hsl(186 99% 27%)
const TEAM = `Tim ${PLATFORM_NAME}`

export interface Email {
  subject: string
  text: string
  html: string
}

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] ?? c)
}

const URGENCY_COLOR: Record<Priority, { bg: string; border: string; text: string }> = {
  urgent: { bg: "#fff1f2", border: "#fecdd3", text: "#be123c" },
  high: { bg: "#fff7ed", border: "#fed7aa", text: "#c2410c" },
  medium: { bg: "#fffbeb", border: "#fde68a", text: "#b45309" },
  low: { bg: "#ecfdf5", border: "#a7f3d0", text: "#047857" },
}

const STATUS_COLOR: Record<IssueStatus, string> = { open: "#D67B3F", on_progress: "#D4A327", resolved: "#168A72" }

function pill(label: string, colors: { bg: string; border: string; text: string }): string {
  return `<span style="display:inline-block;border:1px solid ${colors.border};background:${colors.bg};color:${colors.text};border-radius:999px;padding:2px 10px;font-size:12px;font-weight:600">${escapeHtml(label)}</span>`
}

function urgencyPill(priority: Priority): string {
  return pill(PRIORITY_LABEL[priority], URGENCY_COLOR[priority])
}

function statusPill(status: IssueStatus): string {
  const color = STATUS_COLOR[status]
  return `<span style="display:inline-block;border:1px solid ${color}55;background:${color}14;color:#0f172a;border-radius:999px;padding:2px 10px;font-size:12px;font-weight:600"><span style="display:inline-block;width:8px;height:8px;border-radius:999px;background:${color};margin-right:6px"></span>${escapeHtml(ISSUE_STATUS_LABEL[status])}</span>`
}

/** Baris tabel info; value berupa HTML yang sudah aman (pakai escapeHtml untuk teks). */
function rows(items: [string, string][]): string {
  const cells = items
    .map(
      ([label, valueHtml], i) =>
        `<tr><td style="padding:10px 16px;${i < items.length - 1 ? "border-bottom:1px solid #e5e7eb;" : ""}width:150px;font-size:12px;color:#64748b;vertical-align:top">${escapeHtml(label)}</td>` +
        `<td style="padding:10px 16px;${i < items.length - 1 ? "border-bottom:1px solid #e5e7eb;" : ""}font-size:14px;color:#0f172a">${valueHtml}</td></tr>`
    )
    .join("")
  return `<table cellpadding="0" cellspacing="0" style="width:100%;border:1px solid #e5e7eb;border-radius:8px;border-collapse:separate;margin:18px 0">${cells}</table>`
}

function quote(html: string): string {
  return `<div style="border-left:3px solid ${BRAND_COLOR};background:#f8fafc;border-radius:0 8px 8px 0;padding:12px 16px;margin:16px 0;font-size:14px;line-height:1.6;color:#0f172a;white-space:pre-wrap">${html}</div>`
}

function button(href: string, label: string): string {
  return `<p style="text-align:center;margin:24px 0 8px"><a href="${escapeHtml(href)}" style="background:${BRAND_COLOR};color:#fff;text-decoration:none;padding:12px 28px;border-radius:999px;display:inline-block;font-weight:600">${escapeHtml(label)}</a></p>
  <p style="font-size:12px;color:#64748b;text-align:center;word-break:break-all;margin:0 0 18px">Atau buka: ${escapeHtml(href)}</p>`
}

function layout(title: string, body: string): string {
  return `<!doctype html><html><body style="margin:0;background:#f4f6f8;font-family:Poppins,Helvetica,Arial,sans-serif;color:#0f172a">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 12px">
<table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">
<tr><td style="padding:24px 28px;border-bottom:1px solid #e5e7eb">
  <span style="display:inline-block;width:32px;height:32px;border-radius:999px;background:${BRAND_COLOR};color:#fff;text-align:center;line-height:32px;font-weight:700;font-size:15px">M</span>
  <span style="margin-left:10px;font-size:17px;font-weight:600;vertical-align:middle">${escapeHtml(PLATFORM_NAME)}</span>
</td></tr>
<tr><td style="padding:28px;font-size:14px;line-height:1.65">
  <p style="margin:0 0 6px;font-size:20px;font-weight:600">${escapeHtml(title)}</p>
  ${body}
  <p style="margin-bottom:0">Salam hangat,<br><b>${escapeHtml(TEAM)}</b></p>
</td></tr>
<tr><td style="padding:14px 28px;background:#f8fafc;font-size:11px;color:#94a3b8;text-align:center">Email otomatis dari ${escapeHtml(PLATFORM_NAME)} · mohon tidak membalas email ini</td></tr>
</table></td></tr></table></body></html>`
}

const SIGN_OFF = `\nSalam,\n${TEAM}\n`

// ─── Kredensial akun (setelah pembayaran di landing) ─────────────────────────

export function credentialsEmail(input: { personName: string; businessName: string; planName: string; email: string; password: string; loginUrl: string }): Email {
  const { personName, businessName, planName, email, password, loginUrl } = input
  const subject = `Akun ${PLATFORM_NAME} Anda sudah siap`
  const text = `Halo ${personName},

Terima kasih, pembayaran paket ${planName} untuk ${businessName} sudah kami terima. Akun ${PLATFORM_NAME} Anda sudah dibuat.

Email               : ${email}
Kata sandi sementara: ${password}

Masuk ke dashboard: ${loginUrl}

Demi keamanan, Anda wajib mengganti kata sandi sementara saat pertama masuk. Jangan bagikan email ini kepada siapa pun.
${SIGN_OFF}`
  const html = layout(
    "Akun Anda sudah siap",
    `<p>Halo <b>${escapeHtml(personName)}</b>,</p>
  <p>Terima kasih, pembayaran paket <b>${escapeHtml(planName)}</b> untuk <b>${escapeHtml(businessName)}</b> sudah kami terima. Akun ${escapeHtml(PLATFORM_NAME)} Anda sudah dibuat.</p>
  ${rows([
    ["Email", `<b>${escapeHtml(email)}</b>`],
    ["Kata sandi sementara", `<b style="font-family:Consolas,Menlo,monospace">${escapeHtml(password)}</b>`],
  ])}
  ${button(loginUrl, "Masuk ke Dashboard")}
  <p style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:10px 14px;font-size:13px">Demi keamanan, Anda <b>wajib mengganti kata sandi sementara</b> saat pertama masuk. Jangan bagikan email ini kepada siapa pun.</p>`
  )
  return { subject, text, html }
}

// ─── Tiket kendala ───────────────────────────────────────────────────────────

export interface TicketEmailData {
  id: string
  title: string
  personName: string
  businessName: string
  priority: Priority
  category: IssueCategory
  summary: string
  /** Batas waktu respons (ISO), opsional. */
  dueLabel?: string
}

function ticketRows(t: TicketEmailData, extra: [string, string][] = []): string {
  return rows([
    ["Nomor tiket", `<b style="font-family:Consolas,Menlo,monospace">${escapeHtml(t.id)}</b>`],
    ["Judul", escapeHtml(t.title)],
    ["Kategori", escapeHtml(ISSUE_CATEGORY_LABEL[t.category])],
    ["Tingkat urgensi", urgencyPill(t.priority)],
    ...extra,
  ])
}

/** Email 1: tiket kendala diterima (setelah klien melapor ke Mbee). */
export function ticketCreatedEmail(t: TicketEmailData, dashboardUrl: string): Email {
  const response = URGENCY_RESPONSE_LABEL[t.priority]
  const subject = `Tiket ${t.id} diterima: ${t.title}`
  const text = `Halo ${t.personName},

Kendala ${t.businessName} sudah kami terima dan diteruskan ke tim kami.

Nomor tiket     : ${t.id}
Judul           : ${t.title}
Kategori        : ${ISSUE_CATEGORY_LABEL[t.category]}
Tingkat urgensi : ${PRIORITY_LABEL[t.priority]}
Target respons  : ${response}${t.dueLabel ? ` (paling lambat ${t.dueLabel})` : ""}

Ringkasan kendala:
${t.summary}

Balasan tim akan kami kirim ke email ini. Untuk menambahkan informasi, bicara lagi dengan Mbee di dashboard dan sebutkan nomor tiket ${t.id}.
${SIGN_OFF}`
  const html = layout(
    "Tiket kendala Anda sudah kami terima",
    `<p>Halo <b>${escapeHtml(t.personName)}</b>,</p>
  <p>Kendala <b>${escapeHtml(t.businessName)}</b> sudah kami terima dan diteruskan ke tim kami.</p>
  ${ticketRows(t, [["Target respons", `${escapeHtml(response)}${t.dueLabel ? `<br><span style="font-size:12px;color:#64748b">paling lambat ${escapeHtml(t.dueLabel)}</span>` : ""}`]])}
  <p style="margin:0;font-size:12px;color:#64748b">Ringkasan kendala</p>
  ${quote(escapeHtml(t.summary))}
  <p>Balasan tim akan kami kirim ke email ini. Untuk menambahkan informasi, bicara lagi dengan Mbee di dashboard dan sebutkan nomor tiket <b>${escapeHtml(t.id)}</b>.</p>
  ${button(dashboardUrl, "Buka Dashboard")}`
  )
  return { subject, text, html }
}

/** Email 2: balasan admin. Bila Gemini menilai kendala selesai, email ini sekaligus pemberitahuan selesai. */
export function ticketReplyEmail(t: TicketEmailData, reply: { author: string; message: string; status: IssueStatus }, dashboardUrl: string): Email {
  const resolved = reply.status === "resolved"
  const subject = resolved ? `Tiket ${t.id} selesai: ${t.title}` : `Balasan tiket ${t.id}: ${t.title}`
  const text = `Halo ${t.personName},

${reply.author} dari ${TEAM} membalas tiket ${t.id}:

${reply.message}

Status tiket: ${ISSUE_STATUS_LABEL[reply.status]}${resolved ? "\nKendala ini kami nyatakan selesai. Bila masih terjadi, laporkan lagi ke Mbee di dashboard dan sebutkan nomor tiket ini." : "\nTim kami masih menangani kendala ini dan akan mengabari lewat email."}
${SIGN_OFF}`
  const html = layout(
    resolved ? "Kendala Anda sudah selesai" : "Ada balasan untuk tiket Anda",
    `<p>Halo <b>${escapeHtml(t.personName)}</b>,</p>
  <p><b>${escapeHtml(reply.author)}</b> dari ${escapeHtml(TEAM)} membalas tiket <b>${escapeHtml(t.id)}</b>:</p>
  ${quote(escapeHtml(reply.message))}
  ${ticketRows(t, [["Status", statusPill(reply.status)]])}
  <p>${
    resolved
      ? "Kendala ini kami nyatakan <b>selesai</b>. Bila masih terjadi, laporkan lagi ke Mbee di dashboard dan sebutkan nomor tiket ini."
      : "Tim kami masih menangani kendala ini dan akan mengabari Anda lewat email."
  }</p>
  ${button(dashboardUrl, "Buka Dashboard")}`
  )
  return { subject, text, html }
}

/** Email 3: tiket ditandai selesai tanpa balasan (mis. admin memindahkan kartu ke Resolved). */
export function ticketResolvedEmail(t: TicketEmailData, dashboardUrl: string): Email {
  const subject = `Tiket ${t.id} selesai: ${t.title}`
  const text = `Halo ${t.personName},

Tiket ${t.id} (${t.title}) sudah kami nyatakan selesai.

Ringkasan kendala:
${t.summary}

Bila kendala masih terjadi, laporkan lagi ke Mbee di dashboard dan sebutkan nomor tiket ${t.id}.
${SIGN_OFF}`
  const html = layout(
    "Tiket Anda sudah selesai",
    `<p>Halo <b>${escapeHtml(t.personName)}</b>,</p>
  <p>Tiket <b>${escapeHtml(t.id)}</b> sudah kami nyatakan selesai.</p>
  ${ticketRows(t, [["Status", statusPill("resolved")]])}
  <p style="margin:0;font-size:12px;color:#64748b">Ringkasan kendala</p>
  ${quote(escapeHtml(t.summary))}
  <p>Bila kendala masih terjadi, laporkan lagi ke Mbee di dashboard dan sebutkan nomor tiket <b>${escapeHtml(t.id)}</b>.</p>
  ${button(dashboardUrl, "Buka Dashboard")}`
  )
  return { subject, text, html }
}
