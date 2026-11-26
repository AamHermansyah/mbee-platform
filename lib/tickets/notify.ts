import { formatDateTime } from "@/lib/format"
import type { TicketEmailData } from "@/lib/email/templates"
import type { IssueStatus, Ticket } from "@/lib/types"

/**
 * Helper browser untuk tiket kendala: kirim email ke klien (/api/tickets/email) dan minta Gemini
 * menentukan status sesudah balasan admin (/api/tickets/classify-reply).
 */

export interface SendResult {
  sent: boolean
  detail?: string
}

function emailData(ticket: Ticket): TicketEmailData {
  return {
    id: ticket.id,
    title: ticket.title.replace(/\s·\s[^·]+$/, ""), // tanpa akhiran " · Nama Usaha"
    personName: ticket.name || ticket.companyName,
    businessName: ticket.companyName,
    priority: ticket.priority ?? "medium",
    category: ticket.report?.category ?? "other",
    summary: ticket.summary.overview || ticket.summary.obstacles || ticket.title,
    dueLabel: ticket.dueDate ? formatDateTime(ticket.dueDate) : undefined,
  }
}

export async function sendTicketEmail(
  kind: "created" | "reply" | "resolved",
  ticket: Ticket,
  reply?: { author: string; message: string; status: IssueStatus }
): Promise<SendResult> {
  if (!ticket.email) return { sent: false, detail: "tiket tidak punya email klien" }
  try {
    const res = await fetch("/api/tickets/email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind, to: ticket.email, ticket: emailData(ticket), reply }),
    })
    const body = (await res.json()) as { sent?: boolean; detail?: string }
    return { sent: Boolean(body.sent), detail: body.detail }
  } catch {
    return { sent: false, detail: "server tidak merespons" }
  }
}

export interface ReplyClassification {
  status: Exclude<IssueStatus, "open">
  reason: string
}

/** null bila Gemini tidak tersedia; pemanggil memakai status cadangan. */
export async function classifyReply(ticket: Ticket, message: string): Promise<ReplyClassification | null> {
  try {
    const res = await fetch("/api/tickets/classify-reply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ticket: {
          title: ticket.title,
          summary: [ticket.summary.overview, ticket.summary.obstacles].filter(Boolean).join(" "),
          priority: ticket.priority,
          status: ticket.issueStatus,
        },
        history: (ticket.replies ?? []).map((r) => ({ author: r.author, message: r.message })),
        reply: message,
      }),
    })
    if (!res.ok) return null
    const body = (await res.json()) as { status?: string; reason?: string }
    return { status: body.status === "resolved" ? "resolved" : "on_progress", reason: body.reason ?? "—" }
  } catch {
    return null
  }
}
