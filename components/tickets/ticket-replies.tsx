"use client"

import { LoaderCircle, MailCheck, MailX, RotateCcw, Send, Sparkles } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import { StatusPill } from "@/components/tickets/ticket-badges"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ISSUE_STATUS_LABEL } from "@/lib/constants/ticket"
import { ticketRepository } from "@/lib/data/ticket-repository"
import { formatDateTime, initials } from "@/lib/format"
import { findAccountById } from "@/lib/stores/account-store"
import { useSessionStore } from "@/lib/stores/session-store"
import { classifyReply, sendTicketEmail } from "@/lib/tickets/notify"
import type { IssueStatus, Ticket, TicketReply } from "@/lib/types"
import { cn } from "@/lib/utils"

const MAX_LENGTH = 2000

/**
 * Balasan admin ke klien (pola ticket-comment-section mimin: daftar balasan lalu kolom di bawah).
 * Setiap balasan dikirim ke email klien. Status tiket sesudah balasan ditentukan Gemini dari isi balasan:
 * On progress bila masih ditangani, Resolved bila kendala sudah selesai (email-nya sekaligus pemberitahuan selesai).
 */
export function TicketReplies({ ticket }: { ticket: Ticket }) {
  const author = findAccountById(useSessionStore((s) => s.accountId))?.personName ?? "Admin Mbee"
  const replies = ticket.replies ?? []
  const [message, setMessage] = useState("")
  const [step, setStep] = useState<"idle" | "classify" | "email">("idle")
  const [resending, setResending] = useState<string | null>(null)
  const busy = step !== "idle"
  const canSend = !!ticket.email && message.trim().length > 0 && !busy

  const send = async () => {
    const text = message.trim()
    if (!text || !ticket.email) return

    setStep("classify")
    const decision = await classifyReply(ticket, text)
    const status: IssueStatus = decision?.status ?? "on_progress"
    const statusReason = decision?.reason ?? "Gemini sedang tidak tersedia, status diisi On progress."

    setStep("email")
    const mail = await sendTicketEmail("reply", ticket, { author, message: text, status })

    const reply: TicketReply = {
      id: `rep-${Date.now().toString(36)}`,
      author,
      message: text,
      at: new Date().toISOString(),
      status,
      statusReason,
      email: { sent: mail.sent, to: ticket.email, detail: mail.detail },
    }
    await ticketRepository.update(
      ticket.id,
      { replies: [...replies, reply], issueStatus: status },
      {
        stage: "handling",
        label: `Balasan dikirim ke klien (${mail.sent ? "email terkirim" : "email gagal"}) · status ${ISSUE_STATUS_LABEL[status]} oleh Gemini`,
      }
    )
    setStep("idle")
    setMessage("")

    const statusNote = `Status: ${ISSUE_STATUS_LABEL[status]}${decision ? "" : " (Gemini tidak tersedia)"}`
    if (mail.sent) toast.success(`Balasan terkirim ke ${ticket.email}`, { description: statusNote })
    else toast.error("Balasan tersimpan, tetapi email gagal terkirim", { description: `${mail.detail ?? "Coba kirim ulang."} ${statusNote}` })
  }

  const resend = async (reply: TicketReply) => {
    setResending(reply.id)
    const mail = await sendTicketEmail("reply", ticket, { author: reply.author, message: reply.message, status: reply.status })
    await ticketRepository.update(
      ticket.id,
      { replies: replies.map((r) => (r.id === reply.id ? { ...r, email: { ...r.email, sent: mail.sent, detail: mail.detail } } : r)) },
      { stage: "handling", label: mail.sent ? "Email balasan dikirim ulang" : "Kirim ulang email balasan gagal" }
    )
    setResending(null)
    if (mail.sent) toast.success("Email balasan terkirim")
    else toast.error("Email balasan masih gagal", { description: mail.detail })
  }

  return (
    <div className="space-y-4 p-4">
      {replies.length === 0 ? (
        <p className="text-xs text-muted-foreground">Belum ada balasan. Balasan dikirim ke email klien.</p>
      ) : (
        <ol className="space-y-4">
          {replies.map((reply) => (
            <li key={reply.id} className="flex gap-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-md border border-border text-[11px] font-semibold">
                {initials(reply.author)}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="text-sm font-semibold text-slate-900">{reply.author}</span>
                  <span className="text-[11px] text-muted-foreground tabular-nums">{formatDateTime(reply.at)}</span>
                  <StatusPill status={reply.status} />
                </div>
                <p className="mt-1 text-sm leading-relaxed break-words whitespace-pre-wrap text-slate-800">{reply.message}</p>
                <p className="mt-1.5 flex items-start gap-1.5 text-[11px] text-slate-600">
                  <Sparkles className="mt-0.5 size-3 shrink-0 text-primary" />
                  <span>Gemini: {reply.statusReason}</span>
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px]">
                  {reply.email.sent ? (
                    <span className="flex items-center gap-1.5 text-slate-600">
                      <MailCheck className="size-3 text-primary" /> Terkirim ke {reply.email.to}
                    </span>
                  ) : (
                    <>
                      <span className="flex items-center gap-1.5 text-amber-700">
                        <MailX className="size-3" /> Email gagal terkirim{reply.email.detail ? `: ${reply.email.detail}` : ""}
                      </span>
                      <Button variant="outline" size="xs" onClick={() => void resend(reply)} disabled={resending === reply.id}>
                        {resending === reply.id ? <LoaderCircle className="animate-spin" /> : <RotateCcw />} Kirim ulang
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}

      <div className="space-y-2 border-t border-border pt-4">
        <label htmlFor={`reply-${ticket.id}`} className="text-sm font-medium text-slate-900">
          Balas klien
        </label>
        {ticket.email ? (
          <>
            <div className="flex flex-col items-end gap-0.5">
              <Textarea
                id={`reply-${ticket.id}`}
                value={message}
                onChange={(e) => setMessage(e.target.value.slice(0, MAX_LENGTH))}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.ctrlKey || e.metaKey) && canSend) void send()
                }}
                placeholder={`Tulis balasan untuk ${ticket.name || ticket.companyName}…`}
                disabled={busy}
                className="min-h-24 resize-none text-sm"
              />
              <span className={cn("text-[11px] text-muted-foreground", message.length >= MAX_LENGTH && "text-destructive")}>
                {message.length}/{MAX_LENGTH}
              </span>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="flex items-center gap-1.5 text-[11px] text-slate-600">
                <Sparkles className="size-3 shrink-0 text-primary" />
                Dikirim ke {ticket.email}. Status tiket ditentukan Gemini dari isi balasan.
              </p>
              <Button size="sm" onClick={() => void send()} disabled={!canSend}>
                {busy ? <LoaderCircle className="animate-spin" /> : <Send />}
                {step === "classify" ? "Gemini menentukan status…" : step === "email" ? "Mengirim email…" : "Kirim balasan"}
              </Button>
            </div>
          </>
        ) : (
          <p className="text-xs text-muted-foreground">Tiket ini belum punya email klien, jadi balasan belum bisa dikirim.</p>
        )}
      </div>
    </div>
  )
}
