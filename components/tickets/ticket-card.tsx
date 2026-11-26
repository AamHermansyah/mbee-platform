"use client"

import { AudioLines, Calendar, Pencil, Trash, User } from "lucide-react"

import { PaymentStatusBadge, PriorityTag } from "@/components/tickets/ticket-badges"
import { ISSUE_STATUS_COLOR, TEMPLATE_LABEL } from "@/lib/constants/ticket"
import { formatDate, formatDateTime } from "@/lib/format"
import type { Ticket } from "@/lib/types"
import { cn } from "@/lib/utils"

/**
 * Kartu tiket kanban, struktur dari mimin ticket-card.tsx:
 * baris atas (prioritas + tanggal), judul, deskripsi 2 baris, footer (penanggung jawab, batas waktu, aksi).
 * Tambahan untuk template Onboarding & Pembayaran: chip status bayar.
 */
export function TicketCard({
  ticket,
  selected,
  live,
  onOpen,
  onEdit,
  onDelete,
}: {
  ticket: Ticket
  selected: boolean
  live: boolean
  onOpen: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const description = ticket.summary.overview || ticket.summary.needs || (live ? "Voice AI sedang mengumpulkan data…" : "—")
  const resolved = ticket.issueStatus === "resolved"

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter") onOpen()
      }}
      className={cn(
        "relative w-full cursor-pointer space-y-2.5 rounded-xl border border-l-[3px] p-2.5 transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
        selected ? "border-primary bg-muted" : "border-border bg-white hover:border-primary/50"
      )}
      style={{ borderLeftColor: ISSUE_STATUS_COLOR[ticket.issueStatus] }}
    >
      {resolved && (
        // Overlay garis miring untuk status selesai (CompletedTicketOverlay di mimin)
        <span
          className="pointer-events-none absolute inset-0 rounded-xl opacity-30"
          style={{ backgroundImage: "repeating-linear-gradient(45deg, transparent 0 8px, #e5e7eb 8px 9px)" }}
          aria-hidden
        />
      )}

      <div className="relative flex w-full items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          {ticket.priority && <PriorityTag priority={ticket.priority} />}
          {live && <span className="rounded-full bg-red-600 px-1.5 py-0.5 text-[9px] font-bold text-white">LIVE</span>}
        </div>
        <span className="text-[11px] text-muted-foreground tabular-nums">{formatDate(ticket.createdAt)}</span>
      </div>

      <div className="relative space-y-1">
        <p className="text-sm leading-snug font-semibold break-words text-foreground">{ticket.title}</p>
        <p className="line-clamp-2 text-xs leading-normal break-words text-muted-foreground">{description}</p>
      </div>

      <div className="relative flex flex-wrap items-center gap-1.5">
        <span className="font-mono text-[10px] text-slate-500">{ticket.id}</span>
        <span className="text-[10px] text-slate-400" aria-hidden>·</span>
        <span className="flex items-center gap-1 text-[10px] text-slate-500">
          {ticket.source === "voice_ai" && <AudioLines className="size-3" />}
          {TEMPLATE_LABEL[ticket.template]}
        </span>
      </div>

      <div className="relative flex flex-wrap items-center gap-2 border-t border-border pt-2">
        <span className="flex items-center gap-1 rounded-full border border-border bg-white px-2 py-0.5">
          <User className="size-3 text-muted-foreground" />
          <span className="max-w-[90px] truncate text-[11px] font-medium">{ticket.assignee ?? "Belum ditugaskan"}</span>
        </span>
        {ticket.template === "onboarding_payment" && ticket.paymentStatus && (
          <PaymentStatusBadge status={ticket.paymentStatus} />
        )}
        {ticket.dueDate && (
          <span className="flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">
            <Calendar className="size-3" /> {formatDateTime(ticket.dueDate)}
          </span>
        )}
        <div className="ml-auto flex gap-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onEdit()
            }}
            className="rounded-md p-1 text-muted-foreground hover:bg-muted"
            aria-label={`Ubah tiket ${ticket.id}`}
          >
            <Pencil className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
            className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-rose-600"
            aria-label={`Hapus tiket ${ticket.id}`}
          >
            <Trash className="size-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
