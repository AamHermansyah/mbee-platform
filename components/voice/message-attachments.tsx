"use client"

import { Check, Clock, Copy, KeyRound, LogIn, Mail, MailX, Ticket as TicketIcon } from "lucide-react"
import { toast } from "sonner"

import { PriorityTag } from "@/components/tickets/ticket-badges"
import { Button } from "@/components/ui/button"
import { getPlan, type PlanId } from "@/lib/constants/plans"
import { formatRupiah } from "@/lib/format"
import type { MessageAttachment } from "@/lib/stores/voice-store"

/** Kartu paket layanan (gaya plan-card halaman Penagihan, versi ringkas). */
function PlanAttachment({ planId }: { planId: PlanId }) {
  const plan = getPlan(planId)
  const Icon = plan.icon
  return (
    <div className="mt-1.5 rounded-lg border border-primary bg-white p-2.5 ring-1 ring-primary">
      <div className="flex items-center gap-2">
        <span className="flex size-7 items-center justify-center rounded-lg border bg-white">
          <Icon className="size-3.5 text-primary" />
        </span>
        <p className="flex-1 text-xs font-semibold text-slate-900">Paket {plan.name}</p>
        <p className="text-xs font-semibold text-slate-900 tabular-nums">
          {plan.monthlyPrice === null ? (
            "Custom"
          ) : (
            <>
              {formatRupiah(plan.monthlyPrice)}
              <span className="text-[10px] font-normal text-slate-500">/bln</span>
            </>
          )}
        </p>
      </div>
      <ul className="mt-2 grid grid-cols-2 gap-x-2 gap-y-0.5">
        {plan.features.slice(0, 6).map((feature) => (
          <li key={feature} className="flex items-center gap-1 text-[10px] text-slate-700">
            <Check className="size-3 shrink-0 text-primary" /> {feature}
          </li>
        ))}
      </ul>
    </div>
  )
}

/**
 * Akun yang dibuat sistem setelah pembayaran di landing.
 * Kata sandi sementara juga "dikirim" ke email (simulasi backend), dan wajib diganti saat pertama masuk.
 */
function CredentialsAttachment({
  email,
  password,
  loginHref,
  emailSent = true,
}: {
  email: string
  password: string
  loginHref: string
  emailSent?: boolean
}) {
  const copy = (value: string, what: string) => {
    void navigator.clipboard
      ?.writeText(value)
      .then(() => toast.success(`${what} disalin`))
      .catch(() => toast.info(`Salin ${what.toLowerCase()} secara manual.`))
  }

  return (
    <div className="mt-1.5 space-y-2 rounded-lg border border-primary bg-white p-2.5 ring-1 ring-primary">
      <p className="text-xs font-semibold text-slate-900">Akun Mbee Platform Anda</p>
      <dl className="space-y-1.5">
        {[
          { label: "Email", value: email, icon: Mail },
          { label: "Kata sandi sementara", value: password, icon: KeyRound },
        ].map((row) => (
          <div key={row.label} className="flex items-center gap-2 rounded-md border border-border bg-muted/40 px-2 py-1.5">
            <row.icon className="size-3.5 shrink-0 text-primary" />
            <div className="min-w-0 flex-1">
              <dt className="text-[10px] text-slate-500">{row.label}</dt>
              <dd className="truncate font-mono text-xs font-semibold text-slate-900">{row.value}</dd>
            </div>
            <Button variant="ghost" size="icon-xs" onClick={() => copy(row.value, row.label)} aria-label={`Salin ${row.label.toLowerCase()}`}>
              <Copy />
            </Button>
          </div>
        ))}
      </dl>
      <p className="text-[10px] leading-snug text-slate-600">
        {emailSent ? "Detail ini juga dikirim ke email Anda." : "Email belum terkirim, salin detail ini sekarang."} Kata sandi
        sementara wajib diganti saat pertama masuk.
      </p>
      {/* Tab baru: sesi Voice AI dan kartu akun di landing tetap terbuka (bisa salin ulang kata sandinya).
          <a>, bukan next/link: dashboard memakai root layout lain, jadi tetap muat halaman penuh. */}
      <Button asChild size="sm" className="w-full">
        <a href={loginHref} target="_blank" rel="noopener noreferrer">
          <LogIn /> Masuk ke Dashboard
        </a>
      </Button>
    </div>
  )
}

/** Email sudah terdaftar: kartu kecil dengan tombol masuk (tab baru). */
function LoginAttachment({ email, loginHref }: { email: string; loginHref: string }) {
  return (
    <div className="mt-1.5 space-y-2 rounded-lg border border-primary bg-white p-2.5 ring-1 ring-primary">
      <p className="text-xs font-semibold text-slate-900">Akun sudah terdaftar</p>
      <div className="flex items-center gap-2 rounded-md border border-border bg-muted/40 px-2 py-1.5">
        <Mail className="size-3.5 shrink-0 text-primary" />
        <p className="min-w-0 flex-1 truncate font-mono text-xs font-semibold text-slate-900">{email}</p>
      </div>
      <Button asChild size="sm" className="w-full">
        <a href={loginHref} target="_blank" rel="noopener noreferrer">
          <LogIn /> Masuk ke Dashboard
        </a>
      </Button>
    </div>
  )
}

/**
 * Tiket kendala yang baru diteruskan ke tim. Gayanya sama dengan kartu akun setelah pembayaran:
 * nomor tiket bisa disalin, urgensi (ditentukan Gemini), target respons, dan status email konfirmasi.
 */
function TicketAttachment({ ticketId, title, priority, responseLabel, email, emailSent }: Extract<MessageAttachment, { type: "ticket" }>) {
  const copyId = () => {
    void navigator.clipboard
      ?.writeText(ticketId)
      .then(() => toast.success("Nomor tiket disalin"))
      .catch(() => toast.info("Salin nomor tiket secara manual."))
  }

  return (
    <div className="mt-1.5 space-y-2 rounded-lg border border-primary bg-white p-2.5 ring-1 ring-primary">
      <div>
        <p className="text-xs font-semibold text-slate-900">Tiket Kendala Terkirim</p>
        <p className="text-[10px] leading-snug text-slate-600">{title}</p>
      </div>
      <dl className="space-y-1.5">
        <div className="flex items-center gap-2 rounded-md border border-border bg-muted/40 px-2 py-1.5">
          <TicketIcon className="size-3.5 shrink-0 text-primary" />
          <div className="min-w-0 flex-1">
            <dt className="text-[10px] text-slate-500">No. tiket</dt>
            <dd className="truncate font-mono text-xs font-semibold text-slate-900">{ticketId}</dd>
          </div>
          <Button variant="ghost" size="icon-xs" onClick={copyId} aria-label="Salin nomor tiket">
            <Copy />
          </Button>
        </div>
        <div className="flex items-center gap-2 rounded-md border border-border bg-muted/40 px-2 py-1.5">
          <Clock className="size-3.5 shrink-0 text-primary" />
          <div className="min-w-0 flex-1">
            <dt className="text-[10px] text-slate-500">Target respons</dt>
            <dd className="truncate text-xs font-semibold text-slate-900">{responseLabel}</dd>
          </div>
          <PriorityTag priority={priority} />
        </div>
      </dl>
      <p className="flex items-start gap-1.5 text-[10px] leading-snug text-slate-600">
        {emailSent ? <Mail className="mt-px size-3 shrink-0 text-primary" /> : <MailX className="mt-px size-3 shrink-0 text-amber-600" />}
        {emailSent ? `Konfirmasi dan balasan tim dikirim ke ${email}.` : "Email konfirmasi gagal terkirim, tim akan menghubungi lewat WhatsApp."}
      </p>
    </div>
  )
}

export function MessageAttachmentView({ attachment }: { attachment: MessageAttachment }) {
  if (attachment.type === "credentials") return <CredentialsAttachment {...attachment} />
  if (attachment.type === "login") return <LoginAttachment {...attachment} />
  if (attachment.type === "ticket") return <TicketAttachment {...attachment} />
  return <PlanAttachment planId={attachment.planId} />
}
