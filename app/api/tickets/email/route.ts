import { ISSUE_CATEGORIES, PRIORITIES } from "@/lib/constants/ticket"
import { EMAIL_RE, sendMail } from "@/lib/email/mailer"
import { ticketCreatedEmail, ticketReplyEmail, ticketResolvedEmail, type TicketEmailData } from "@/lib/email/templates"
import type { IssueCategory, IssueStatus, Priority } from "@/lib/types"

/**
 * POST /api/tickets/email
 * body: { kind: "created" | "reply" | "resolved", to, ticket: TicketEmailData, reply?: { author, message, status } }
 *
 * Email tiket kendala ke klien: tiket diterima (dari Voice AI), balasan admin, dan tiket selesai.
 */

const KINDS = ["created", "reply", "resolved"] as const
const STATUSES: IssueStatus[] = ["open", "on_progress", "resolved"]

function clean(value: unknown, max = 200): string {
  return typeof value === "string" ? value.trim().slice(0, max) : ""
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
  const kind = KINDS.find((k) => k === body.kind)
  const to = clean(body.to).toLowerCase()
  const raw = (body.ticket ?? {}) as Record<string, unknown>
  const priority = PRIORITIES.find((p) => p === raw.priority) as Priority | undefined
  const category = (ISSUE_CATEGORIES.find((c) => c === raw.category) ?? "other") as IssueCategory

  const ticket: TicketEmailData = {
    id: clean(raw.id, 40),
    title: clean(raw.title, 160),
    personName: clean(raw.personName, 80) || "Pelanggan",
    businessName: clean(raw.businessName, 80),
    priority: priority ?? "medium",
    category,
    summary: clean(raw.summary, 2000),
    dueLabel: clean(raw.dueLabel, 60) || undefined,
  }
  if (!kind || !EMAIL_RE.test(to) || !ticket.id || !ticket.title) {
    return Response.json({ sent: false, detail: "data email tiket tidak lengkap" }, { status: 400 })
  }

  const dashboardUrl = `${new URL(request.url).origin}/login?email=${encodeURIComponent(to)}`
  let mail
  if (kind === "created") mail = ticketCreatedEmail(ticket, dashboardUrl)
  else if (kind === "resolved") mail = ticketResolvedEmail(ticket, dashboardUrl)
  else {
    const reply = (body.reply ?? {}) as Record<string, unknown>
    const message = clean(reply.message, 4000)
    if (!message) return Response.json({ sent: false, detail: "isi balasan kosong" }, { status: 400 })
    const status = STATUSES.find((s) => s === reply.status) ?? "on_progress"
    mail = ticketReplyEmail(ticket, { author: clean(reply.author, 80) || "Tim", message, status }, dashboardUrl)
  }

  // Pratinjau template untuk tim (tidak mengirim email)
  if (body.preview === true) return Response.json({ preview: true, ...mail })

  const result = await sendMail({ to, ...mail, tag: `tiket ${ticket.id} (${kind})` })
  return Response.json({ sent: result.sent, dryRun: result.dryRun, detail: result.detail }, { status: result.status })
}
