"use client"

import { useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { PLANS, planPrice, type PlanId } from "@/lib/constants/plans"
import { PRODUCTS } from "@/lib/constants/products"
import {
  ASSIGNEES,
  ISSUE_STATUSES,
  PAYMENT_METHOD_LABEL,
  PAYMENT_METHODS,
  PAYMENT_STATUS_LABEL,
  PAYMENT_STATUSES,
  PRIORITIES,
  PRIORITY_LABEL,
  SENTIMENT_LABEL,
  SENTIMENTS,
  TEMPLATE_LABEL,
  TEMPLATES,
} from "@/lib/constants/ticket"
import { ticketRepository } from "@/lib/data/ticket-repository"
import { formatRupiah } from "@/lib/format"
import type { Ticket, TicketInput, TicketTemplate } from "@/lib/types"
import { cn } from "@/lib/utils"

const EMPTY: TicketInput = {
  title: "",
  template: "general",
  priority: "medium",
  assignee: null,
  accountId: null,
  name: "",
  email: "",
  phone: "",
  companyName: "",
  products: [],
  planId: null,
  summary: { overview: "", needs: "", obstacles: "", nextAction: "", sentiment: "neutral" },
  issueStatus: "open",
  paymentMethod: null,
  paymentStatus: null,
  amount: 0,
  source: "manual",
  dueDate: null,
}

function toInput(ticket: Ticket): TicketInput {
  return {
    title: ticket.title,
    template: ticket.template,
    priority: ticket.priority,
    assignee: ticket.assignee,
    accountId: ticket.accountId,
    name: ticket.name,
    email: ticket.email,
    phone: ticket.phone,
    companyName: ticket.companyName,
    products: ticket.products,
    planId: ticket.planId,
    summary: ticket.summary,
    issueStatus: ticket.issueStatus,
    paymentMethod: ticket.paymentMethod,
    paymentStatus: ticket.paymentStatus,
    amount: ticket.amount,
    source: ticket.source,
    dueDate: ticket.dueDate,
  }
}

function Field({ label, htmlFor, children, className }: { label: string; htmlFor?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label htmlFor={htmlFor} className="text-xs font-medium text-slate-700">
        {label}
      </Label>
      {children}
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <p className="pt-1 text-xs font-semibold text-slate-900 sm:col-span-2">{children}</p>
}

export function TicketFormDialog({
  open,
  onOpenChange,
  ticket,
  onSaved,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Kosong = tiket baru. */
  ticket?: Ticket
  onSaved?: (ticket: Ticket) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] gap-0 overflow-hidden p-0 sm:max-w-2xl">
        {open && (
          <TicketForm
            key={ticket?.id ?? "new"}
            ticket={ticket}
            onDone={(saved) => {
              onOpenChange(false)
              if (saved) onSaved?.(saved)
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

function TicketForm({ ticket, onDone }: { ticket?: Ticket; onDone: (saved?: Ticket) => void }) {
  const [form, setForm] = useState<TicketInput>(() => (ticket ? toInput(ticket) : EMPTY))
  const [saving, setSaving] = useState(false)
  const set = <K extends keyof TicketInput>(key: K, value: TicketInput[K]) => setForm((f) => ({ ...f, [key]: value }))
  const setSummary = (key: keyof TicketInput["summary"], value: string) =>
    setForm((f) => ({ ...f, summary: { ...f.summary, [key]: value } }))
  const isOnboarding = form.template === "onboarding_payment"

  const changeTemplate = (template: TicketTemplate) =>
    setForm((f) =>
      template === "onboarding_payment"
        ? { ...f, template, paymentStatus: f.paymentStatus ?? "unpaid", amount: f.planId ? planPrice(f.planId) : 0 }
        : { ...f, template, planId: null, paymentMethod: null, paymentStatus: null, amount: 0 }
    )

  const toggleProduct = (id: TicketInput["products"][number]) =>
    setForm((f) => {
      const products = f.products.includes(id) ? f.products.filter((p) => p !== id) : [...f.products, id]
      return { ...f, products }
    })

  const valid = form.title.trim() && form.name.trim() && form.companyName.trim()

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!valid) return
    setSaving(true)
    try {
      const saved = ticket
        ? await ticketRepository.update(ticket.id, form, { stage: "handling", label: "Tiket diubah oleh admin" })
        : await ticketRepository.create({
            ...form,
            journey: [{ stage: "handling", label: "Tiket dibuat manual oleh admin", at: new Date().toISOString() }],
          })
      toast.success(ticket ? `Tiket ${ticket.id} diperbarui` : `Tiket ${saved?.id} dibuat`)
      onDone(saved)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="flex max-h-[calc(100dvh-2rem)] flex-col">
      <DialogHeader className="border-b px-5 pt-4 pb-3">
        <DialogTitle>{ticket ? `Ubah tiket ${ticket.id}` : "Tambah Tiket"}</DialogTitle>
        <DialogDescription>
          {ticket ? "Perubahan tercatat di log aktivitas tiket." : "Tiket onboarding biasanya dibuat otomatis oleh Voice AI."}
        </DialogDescription>
      </DialogHeader>

      <div className="custom-scrollbar grid gap-4 overflow-y-auto px-5 py-4 sm:grid-cols-2">
        <Field label="Judul *" htmlFor="f-title" className="sm:col-span-2">
          <Input id="f-title" value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Ringkas masalah atau permintaan" required />
        </Field>
        <Field label="Template">
          <Select value={form.template} onValueChange={(v) => changeTemplate(v as TicketTemplate)}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              {TEMPLATES.map((t) => <SelectItem key={t} value={t}>{TEMPLATE_LABEL[t]}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Prioritas">
          <Select value={form.priority ?? "none"} onValueChange={(v) => set("priority", v === "none" ? null : (v as TicketInput["priority"]))}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Tanpa prioritas</SelectItem>
              {PRIORITIES.map((p) => <SelectItem key={p} value={p}>{PRIORITY_LABEL[p]}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Status">
          <Select value={form.issueStatus} onValueChange={(v) => set("issueStatus", v as TicketInput["issueStatus"])}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              {ISSUE_STATUSES.map((s) => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Penanggung jawab">
          <Select value={form.assignee ?? "none"} onValueChange={(v) => set("assignee", v === "none" ? null : v)}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Belum ditugaskan</SelectItem>
              {ASSIGNEES.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>

        <SectionTitle>Informasi tambahan · {TEMPLATE_LABEL[form.template]}</SectionTitle>
        <Field label="Nama *" htmlFor="f-name">
          <Input id="f-name" value={form.name} onChange={(e) => set("name", e.target.value)} required />
        </Field>
        <Field label="Telepon" htmlFor="f-phone">
          <Input id="f-phone" value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="0812-…" inputMode="tel" />
        </Field>
        <Field label="Email" htmlFor="f-email">
          <Input id="f-email" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="nama@email.com" />
        </Field>
        <Field label="Perusahaan *" htmlFor="f-company">
          <Input id="f-company" value={form.companyName} onChange={(e) => set("companyName", e.target.value)} required />
        </Field>
        {!isOnboarding && (
        <Field label="Produk terkait" className="sm:col-span-2">
          <div className="flex flex-wrap gap-1.5">
            {PRODUCTS.map((product) => {
              const on = form.products.includes(product.id)
              return (
                <button
                  key={product.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggleProduct(product.id)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-medium transition-colors duration-150",
                    on ? "border-primary bg-primary text-primary-foreground" : "border-border bg-white text-slate-700 hover:bg-muted"
                  )}
                >
                  {product.name}
                </button>
              )
            })}
          </div>
        </Field>
        )}
        <Field label="Deskripsi / ringkasan" htmlFor="f-overview" className="sm:col-span-2">
          <Textarea id="f-overview" rows={2} value={form.summary.overview} onChange={(e) => setSummary("overview", e.target.value)} />
        </Field>
        <Field label="Kebutuhan" htmlFor="f-needs">
          <Textarea id="f-needs" rows={2} value={form.summary.needs} onChange={(e) => setSummary("needs", e.target.value)} />
        </Field>
        <Field label="Kendala" htmlFor="f-obstacles">
          <Textarea id="f-obstacles" rows={2} value={form.summary.obstacles} onChange={(e) => setSummary("obstacles", e.target.value)} />
        </Field>
        <Field label="Tindak lanjut" htmlFor="f-next">
          <Textarea id="f-next" rows={2} value={form.summary.nextAction} onChange={(e) => setSummary("nextAction", e.target.value)} />
        </Field>
        <Field label="Sentimen">
          <Select value={form.summary.sentiment} onValueChange={(v) => setSummary("sentiment", v)}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              {SENTIMENTS.map((s) => <SelectItem key={s} value={s}>{SENTIMENT_LABEL[s]}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>

        {isOnboarding && (
          <>
            <Field label="Paket layanan (bundling)" className="sm:col-span-2">
              <Select
                value={form.planId ?? "none"}
                onValueChange={(v) => {
                  const planId = v === "none" ? null : (v as PlanId)
                  setForm((f) => ({ ...f, planId, amount: planId ? planPrice(planId) : 0 }))
                }}
              >
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Belum memilih paket</SelectItem>
                  {PLANS.filter((p) => p.monthlyPrice !== null).map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} · {formatRupiah(p.monthlyPrice ?? 0)}/bln
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Metode pembayaran">
              <Select value={form.paymentMethod ?? "none"} onValueChange={(v) => set("paymentMethod", v === "none" ? null : (v as TicketInput["paymentMethod"]))}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Belum dipilih</SelectItem>
                  {PAYMENT_METHODS.map((m) => <SelectItem key={m} value={m}>{PAYMENT_METHOD_LABEL[m]}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Status pembayaran">
              <Select value={form.paymentStatus ?? "unpaid"} onValueChange={(v) => set("paymentStatus", v as TicketInput["paymentStatus"])}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PAYMENT_STATUSES.map((s) => <SelectItem key={s} value={s}>{PAYMENT_STATUS_LABEL[s]}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <p className="text-[11px] text-slate-500 sm:col-span-2">Total per bulan: {formatRupiah(form.amount)}</p>
          </>
        )}
      </div>

      <DialogFooter className="border-t px-5 py-3">
        <Button type="button" variant="outline" onClick={() => onDone()}>
          Batal
        </Button>
        <Button type="submit" disabled={!valid || saving}>
          {ticket ? "Simpan perubahan" : "Tambah Tiket"}
        </Button>
      </DialogFooter>
    </form>
  )
}
