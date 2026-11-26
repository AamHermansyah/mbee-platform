import {
  ISSUE_STATUS_COLOR,
  ISSUE_STATUS_LABEL,
  PAYMENT_STATUS_LABEL,
  PRIORITY_LABEL,
  PRIORITY_TONE,
  SENTIMENT_LABEL,
} from "@/lib/constants/ticket"
import type { IssueStatus, PaymentStatus, Priority, Sentiment } from "@/lib/types"
import { cn } from "@/lib/utils"

/** Label prioritas (SolidPriorityTag di mimin). */
export function PriorityTag({ priority, className }: { priority: Priority; className?: string }) {
  return (
    <span
      className={cn(
        "rounded-full border px-2 py-0.5 text-[11px] leading-4 font-semibold whitespace-nowrap capitalize",
        PRIORITY_TONE[priority],
        className
      )}
    >
      {PRIORITY_LABEL[priority]}
    </span>
  )
}

/** Pill status dengan warna kolom kanban (detail-ticket-sheet mimin). */
export function StatusPill({ status, className }: { status: IssueStatus; className?: string }) {
  const color = ISSUE_STATUS_COLOR[status]
  return (
    <span
      className={cn("inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium whitespace-nowrap text-slate-800", className)}
      style={{
        backgroundColor: `color-mix(in srgb, ${color} 10%, white)`,
        borderColor: `color-mix(in srgb, ${color} 30%, white)`,
      }}
    >
      <span className="size-2 rounded-full" style={{ backgroundColor: color }} />
      {ISSUE_STATUS_LABEL[status]}
    </span>
  )
}

const PAYMENT_TONE: Record<PaymentStatus, { box: string; dot: string }> = {
  unpaid: { box: "border-slate-200 bg-slate-50 text-slate-700", dot: "bg-slate-400" },
  pending: { box: "border-amber-200 bg-amber-50 text-amber-800", dot: "bg-amber-500" },
  paid: { box: "border-green-200 bg-green-50 text-green-800", dot: "bg-green-600" },
  failed: { box: "border-red-200 bg-red-50 text-red-800", dot: "bg-red-500" },
  expired: { box: "border-slate-200 bg-slate-100 text-slate-700", dot: "bg-slate-500" },
}

/** Status pembayaran: selalu titik + teks, bukan warna saja. */
export function PaymentStatusBadge({ status, className }: { status: PaymentStatus; className?: string }) {
  const tone = PAYMENT_TONE[status]
  return (
    <span className={cn("inline-flex w-fit items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium whitespace-nowrap", tone.box, className)}>
      <span className={cn("size-1.5 rounded-full", tone.dot)} />
      {PAYMENT_STATUS_LABEL[status]}
    </span>
  )
}

const SENTIMENT_DOT: Record<Sentiment, string> = {
  positive: "bg-sentiment-positive",
  neutral: "bg-sentiment-neutral",
  negative: "bg-sentiment-negative",
}

export function SentimentBadge({ sentiment, className }: { sentiment: Sentiment; className?: string }) {
  return (
    <span className={cn("inline-flex w-fit items-center gap-1.5 rounded-full border border-border bg-white px-2 py-0.5 text-[11px] font-medium whitespace-nowrap text-slate-700", className)}>
      <span className={cn("size-1.5 rounded-full", SENTIMENT_DOT[sentiment])} />
      {SENTIMENT_LABEL[sentiment]}
    </span>
  )
}
