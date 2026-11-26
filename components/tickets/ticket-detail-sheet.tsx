"use client"

import { AudioLines, EllipsisVertical, FileText, ListChecks, MessageSquareReply, Pencil, Sparkles, Ticket as TicketIcon, Trash, X } from "lucide-react"
import type { ReactNode } from "react"

import { PaymentStatusBadge, PriorityTag, SentimentBadge, StatusPill } from "@/components/tickets/ticket-badges"
import { TicketReplies } from "@/components/tickets/ticket-replies"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet"
import { getPlan } from "@/lib/constants/plans"
import { getProduct } from "@/lib/constants/products"
import { ISSUE_CATEGORY_LABEL, JOURNEY_STAGE_LABEL, PAYMENT_METHOD_LABEL, TEMPLATE_LABEL, URGENCY_RESPONSE_LABEL } from "@/lib/constants/ticket"
import { formatDateTime, formatRupiah, initials } from "@/lib/format"
import type { Ticket } from "@/lib/types"
import { cn } from "@/lib/utils"

function Section({ icon: Icon, title, children }: { icon: typeof FileText; title: string; children: ReactNode }) {
  return (
    <section className="overflow-hidden rounded-xl border border-border bg-white">
      <header className="flex items-center gap-2 border-b px-4 py-3">
        <Icon className="size-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      </header>
      {children}
    </section>
  )
}

function Field({ label, children, wide }: { label: string; children: ReactNode; wide?: boolean }) {
  return (
    <div className={cn("min-w-0", wide && "sm:col-span-2")}>
      <dt className="mb-1 text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="text-sm break-words text-slate-800">{children}</dd>
    </div>
  )
}

const dash = (value: string | null | undefined) => (value && value.trim() ? value : "—")

/** Detail tiket, struktur dari mimin detail-ticket-sheet.tsx. Status diubah lewat kanban atau Ubah. */
export function TicketDetailSheet({
  ticket,
  live,
  onOpenChange,
  onEdit,
  onDelete,
}: {
  ticket: Ticket | undefined
  live: boolean
  onOpenChange: (open: boolean) => void
  onEdit: (ticket: Ticket) => void
  onDelete: (ticket: Ticket) => void
}) {
  return (
    <Sheet open={!!ticket} onOpenChange={onOpenChange}>
      <SheetContent
        showCloseButton={false}
        onOpenAutoFocus={(e) => e.preventDefault()}
        className="custom-scrollbar max-h-full gap-0 overflow-y-auto bg-white p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-[750px]"
      >
        {ticket && (
          <>
            <header className="sticky top-0 z-50 flex items-start gap-3 border-b border-border bg-white px-4 py-3">
              <span className="rounded-lg border border-border bg-white p-2">
                <TicketIcon className="size-4 text-slate-700" />
              </span>
              <div className="min-w-0 flex-1">
                <SheetTitle className="text-base font-semibold">Detail Tiket</SheetTitle>
                <SheetDescription asChild>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    <span className="font-mono text-[11px] font-semibold text-slate-700 tabular-nums">{ticket.id}</span>
                    <StatusPill status={ticket.issueStatus} />
                    {ticket.priority && <PriorityTag priority={ticket.priority} />}
                    {live && <span className="rounded-full bg-red-600 px-1.5 py-0.5 text-[9px] font-bold text-white">LIVE</span>}
                  </div>
                </SheetDescription>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="Opsi tiket">
                    <EllipsisVertical />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={() => onEdit(ticket)}>
                    <Pencil /> Ubah
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="destructive" onSelect={() => onDelete(ticket)}>
                    <Trash /> Hapus
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <SheetClose asChild>
                <Button variant="ghost" size="icon" aria-label="Tutup">
                  <X />
                </Button>
              </SheetClose>
            </header>

            <div className="space-y-3 p-4 sm:space-y-4">
              <Section icon={FileText} title="Informasi Dasar">
                <dl className="grid grid-cols-1 gap-x-6 gap-y-4 p-4 sm:grid-cols-2">
                  <Field label="Judul" wide>
                    <span className="font-medium">{ticket.title}</span>
                  </Field>
                  <Field label="Template">{TEMPLATE_LABEL[ticket.template]}</Field>
                  <Field label="Penanggung jawab">
                    {ticket.assignee ? (
                      <span className="flex items-center gap-2">
                        <span className="flex size-6 items-center justify-center rounded-md border border-border text-[10px] font-semibold">
                          {initials(ticket.assignee)}
                        </span>
                        {ticket.assignee}
                      </span>
                    ) : (
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <span className="size-6 rounded-md border border-dashed border-border" /> Belum ditugaskan
                      </span>
                    )}
                  </Field>
                  <Field label="Deskripsi" wide>
                    {dash(ticket.summary.overview || ticket.summary.needs)}
                  </Field>
                  <Field label="Dibuat">{formatDateTime(ticket.createdAt)}</Field>
                  <Field label="Batas waktu">{ticket.dueDate ? formatDateTime(ticket.dueDate) : "—"}</Field>
                  <Field label="Sumber">
                    <span className="flex items-center gap-1.5">
                      {ticket.source === "voice_ai" && <AudioLines className="size-3.5 text-primary" />}
                      {ticket.source === "voice_ai" ? "Voice AI" : "Manual"}
                    </span>
                  </Field>
                  <Field label="Diperbarui">{formatDateTime(ticket.updatedAt)}</Field>
                </dl>
              </Section>

              <Section icon={ListChecks} title={`Informasi Tambahan · ${TEMPLATE_LABEL[ticket.template]}`}>
                <dl className="grid grid-cols-1 gap-x-6 gap-y-4 p-4 sm:grid-cols-2">
                  <Field label="Nama">{dash(ticket.name)}</Field>
                  <Field label="Email">{dash(ticket.email)}</Field>
                  <Field label="Telepon">{dash(ticket.phone)}</Field>
                  <Field label="Perusahaan">{dash(ticket.companyName)}</Field>
                  {ticket.template === "onboarding_payment" ? (
                    <Field label="Paket layanan">
                      {ticket.planId ? `${getPlan(ticket.planId).name} · ${formatRupiah(ticket.amount)}/bln` : "Belum memilih paket"}
                    </Field>
                  ) : (
                    <Field label="Produk terkait">
                      {ticket.products.length ? ticket.products.map((id) => getProduct(id).name).join(", ") : "—"}
                    </Field>
                  )}
                  {ticket.report && (
                    <>
                      <Field label="Kategori kendala">{ISSUE_CATEGORY_LABEL[ticket.report.category]}</Field>
                      <Field label="Sejak">{dash(ticket.report.since)}</Field>
                      <Field label="Tingkat urgensi" wide>
                        <span className="flex flex-wrap items-center gap-2">
                          {ticket.priority && <PriorityTag priority={ticket.priority} />}
                          {ticket.priority && <span className="text-xs text-slate-600">Target respons {URGENCY_RESPONSE_LABEL[ticket.priority]}</span>}
                        </span>
                        {ticket.report.urgencyReason && (
                          <span className="mt-1 flex items-start gap-1.5 text-xs text-slate-600">
                            <Sparkles className="mt-0.5 size-3 shrink-0 text-primary" /> Ditentukan Gemini: {ticket.report.urgencyReason}
                          </span>
                        )}
                      </Field>
                      <Field label="Dampak" wide>
                        {dash(ticket.report.impact)}
                      </Field>
                    </>
                  )}
                  <Field label="Kebutuhan" wide>
                    {dash(ticket.summary.needs)}
                  </Field>
                  <Field label="Kendala" wide>
                    {ticket.summary.obstacles || "Tidak ada"}
                  </Field>
                  <Field label="Tindak lanjut" wide>
                    {dash(ticket.summary.nextAction)}
                  </Field>
                  <Field label="Sentimen">
                    <SentimentBadge sentiment={ticket.summary.sentiment} />
                  </Field>
                  {ticket.template === "onboarding_payment" && (
                    <>
                      <Field label="Metode bayar">{ticket.paymentMethod ? PAYMENT_METHOD_LABEL[ticket.paymentMethod] : "—"}</Field>
                      <Field label="Status bayar">
                        {ticket.paymentStatus ? <PaymentStatusBadge status={ticket.paymentStatus} /> : "—"}
                      </Field>
                    </>
                  )}
                </dl>
              </Section>

              <Section icon={MessageSquareReply} title={`Balasan ke klien${ticket.replies?.length ? ` · ${ticket.replies.length}` : ""}`}>
                <TicketReplies ticket={ticket} />
              </Section>

              <Section icon={AudioLines} title="Log aktivitas">
                <div className="p-4">
                  {ticket.journey.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Belum ada aktivitas.</p>
                  ) : (
                    <ol className="relative space-y-3 border-l border-border pl-4">
                      {ticket.journey.map((event, i) => (
                        <li key={`${event.at}-${i}`} className="relative">
                          <span className="absolute top-1 -left-5.25 size-2.5 rounded-full border-2 border-white bg-primary" aria-hidden />
                          <p className="text-xs font-medium text-slate-900">{event.label}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {JOURNEY_STAGE_LABEL[event.stage]} · {formatDateTime(event.at)}
                          </p>
                        </li>
                      ))}
                    </ol>
                  )}
                </div>
              </Section>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
