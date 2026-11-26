"use client"

import { CircleCheck, CircleX, Copy, CreditCard, Landmark, LoaderCircle, QrCode, ShieldCheck, Wallet } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"

import { BrandMark } from "@/components/shared/brand"
import { FakeQr } from "@/components/voice/fake-qr"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { ASSISTANT_NAME } from "@/lib/constants/brand"
import { getPlan } from "@/lib/constants/plans"
import { PAYMENT_METHOD_LABEL } from "@/lib/constants/ticket"
import { formatRupiah } from "@/lib/format"
import { FAILURE_REASON, finishCheckout, usePaymentStore, type CheckoutSession, type PaymentOutcome } from "@/lib/stores/payment-store"
import type { PaymentMethod } from "@/lib/types"
import { cn } from "@/lib/utils"

/**
 * Simulasi payment gateway di dalam dialog (mimin asli membuka invoice di tab baru).
 * Alur: pilih metode → Bayar → memproses → hasil (berhasil/gagal) → tertutup otomatis 3 detik
 * → hasil dikirim ke pemanggil (Voice AI mengecek dan menanggapinya).
 */

const METHODS: { id: Exclude<PaymentMethod, "bank_transfer">; icon: typeof QrCode; channels: string[] }[] = [
  { id: "qris", icon: QrCode, channels: ["QRIS"] },
  { id: "virtual_account", icon: Landmark, channels: ["BCA", "BNI", "BRI", "Mandiri"] },
  { id: "ewallet", icon: Wallet, channels: ["GoPay", "OVO", "DANA", "ShopeePay"] },
  { id: "credit_card", icon: CreditCard, channels: ["Visa/Mastercard"] },
]

const AUTO_CLOSE_SECONDS = 3
const PROCESSING_MS = 1600

type Stage = "form" | "processing" | "result"

const tile = (active: boolean) =>
  cn(
    "relative flex flex-col items-center gap-1 rounded-xl border px-2 py-2.5 text-center text-xs font-medium transition-colors duration-150",
    active ? "border-primary bg-muted ring-1 ring-primary" : "border-border bg-white hover:bg-muted"
  )

const chip = (active: boolean) =>
  cn(
    "rounded-full border px-3 py-1 text-xs font-medium transition-colors duration-150",
    active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-white text-slate-700 hover:bg-muted"
  )

function MethodDetail({ method, channel, setChannel, session }: { method: PaymentMethod; channel: string; setChannel: (c: string) => void; session: CheckoutSession }) {
  const channels = METHODS.find((m) => m.id === method)?.channels ?? []

  if (method === "qris") {
    return (
      <div className="flex items-center gap-4">
        <FakeQr seed={session.invoiceId} className="size-28 shrink-0 rounded-md border border-border" />
        <div className="space-y-1 text-xs text-slate-700">
          <p className="font-semibold text-slate-900">Pindai QRIS</p>
          <p>Gunakan aplikasi bank atau e-wallet apa pun.</p>
          <p className="text-slate-500">Berlaku 15 menit · QR contoh, tidak bisa dipindai.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {channels.length > 1 && (
        <div className="flex flex-wrap gap-1.5">
          {channels.map((c) => (
            <button key={c} type="button" className={chip(channel === c)} onClick={() => setChannel(c)} aria-pressed={channel === c}>
              {c}
            </button>
          ))}
        </div>
      )}
      {method === "virtual_account" && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-white px-3 py-2">
          <div>
            <p className="text-[11px] text-slate-500">Nomor Virtual Account {channel}</p>
            <p className="font-mono text-base font-semibold tracking-wider text-slate-900">8808 0812 3456 7890</p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              void navigator.clipboard?.writeText("8808081234567890")
              toast.success("Nomor VA disalin")
            }}
          >
            <Copy /> Salin
          </Button>
        </div>
      )}
      {method === "ewallet" && (
        <div className="space-y-1.5">
          <label htmlFor="ewallet-phone" className="text-xs font-medium text-slate-700">
            Nomor {channel}
          </label>
          <Input id="ewallet-phone" defaultValue="0812-3456-7890" inputMode="tel" />
        </div>
      )}
      {method === "credit_card" && (
        <div className="grid grid-cols-2 gap-2">
          <Input aria-label="Nomor kartu" defaultValue="4811 1111 1111 1114" className="col-span-2 font-mono" />
          <Input aria-label="Masa berlaku" defaultValue="12/28" className="font-mono" />
          <Input aria-label="CVV" defaultValue="123" className="font-mono" type="password" />
        </div>
      )}
    </div>
  )
}

function CheckoutBody({ session }: { session: CheckoutSession }) {
  const plan = getPlan(session.planId)
  const [stage, setStage] = useState<Stage>("form")
  const [method, setMethod] = useState<PaymentMethod>("qris")
  const [channel, setChannel] = useState("QRIS")
  const [simulateSuccess, setSimulateSuccess] = useState(true)
  const [outcome, setOutcome] = useState<PaymentOutcome | null>(null)
  const [countdown, setCountdown] = useState(AUTO_CLOSE_SECONDS)
  const finished = useRef(false)

  const finish = (result: PaymentOutcome) => {
    if (finished.current) return
    finished.current = true
    finishCheckout(result)
  }

  const pay = () => {
    setStage("processing")
    setTimeout(() => {
      const result: PaymentOutcome = simulateSuccess
        ? { status: "paid", invoiceId: session.invoiceId, method, channel, amount: session.amount }
        : { status: "failed", invoiceId: session.invoiceId, method, channel, amount: session.amount, reason: FAILURE_REASON[method] }
      setOutcome(result)
      setStage("result")
    }, PROCESSING_MS)
  }

  // Hitung mundur 3 detik setelah hasil tampil, lalu tutup dan kirim hasil ke pemanggil.
  useEffect(() => {
    if (stage !== "result" || !outcome) return
    const timer = setInterval(() => setCountdown((n) => n - 1), 1000)
    const close = setTimeout(() => finish(outcome), AUTO_CLOSE_SECONDS * 1000)
    return () => {
      clearInterval(timer)
      clearTimeout(close)
    }
  }, [stage, outcome])

  if (stage === "processing") {
    return (
      <div className="flex flex-col items-center gap-4 px-8 py-12 text-center" role="status">
        <span className="flex size-20 items-center justify-center rounded-full bg-primary/10">
          <LoaderCircle className="size-9 animate-spin text-primary" />
        </span>
        <div>
          <p className="text-lg font-semibold text-slate-900">Memproses Pembayaran...</p>
          <p className="mt-1 text-sm text-muted-foreground">Mohon tunggu sementara kami memproses pembayaran Anda. Jangan tutup jendela ini.</p>
        </div>
      </div>
    )
  }

  if (stage === "result" && outcome && outcome.status !== "cancelled") {
    const paid = outcome.status === "paid"
    return (
      <div className="flex flex-col items-center gap-4 px-6 py-10 text-center" role="status" aria-live="polite">
        <span className={cn("flex size-20 items-center justify-center rounded-full", paid ? "bg-green-100" : "bg-red-100")}>
          {paid ? <CircleCheck className="size-10 text-green-600" /> : <CircleX className="size-10 text-red-600" />}
        </span>
        <div>
          <p className={cn("text-2xl font-bold", paid ? "text-green-600" : "text-red-600")}>
            {paid ? "Pembayaran Berhasil!" : "Pembayaran Gagal"}
          </p>
          <p className="mt-1 text-sm text-slate-700">
            {paid
              ? `Selamat datang di paket ${plan.name}! Langganan Anda sekarang aktif.`
              : `Pembayaran tidak dapat diproses karena ${outcome.reason}. Tidak ada dana yang terpotong.`}
          </p>
        </div>
        <dl className="grid w-full grid-cols-2 gap-x-4 gap-y-1.5 rounded-xl bg-muted px-4 py-3 text-left text-xs">
          <dt className="text-slate-500">No. invoice</dt>
          <dd className="text-right font-mono text-slate-900">{session.invoiceId}</dd>
          <dt className="text-slate-500">Metode</dt>
          <dd className="text-right text-slate-900">
            {PAYMENT_METHOD_LABEL[outcome.method]}
            {outcome.channel !== "QRIS" ? ` · ${outcome.channel}` : ""}
          </dd>
          <dt className="text-slate-500">Total</dt>
          <dd className="text-right font-semibold text-slate-900">{formatRupiah(outcome.amount)}</dd>
        </dl>
        <div className="w-full space-y-1.5">
          <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-1000 ease-linear"
              style={{ width: `${(Math.max(countdown, 0) / AUTO_CLOSE_SECONDS) * 100}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-500">
            Jendela ini tertutup otomatis dalam {Math.max(countdown, 0)} detik
            {session.source === "voice" ? `, lalu ${ASSISTANT_NAME} mengecek pembayaran Anda.` : "."}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex max-h-[calc(100dvh-8rem)] flex-col">
      <div className="custom-scrollbar space-y-4 overflow-y-auto px-5 py-4">
        <section className="rounded-xl border border-border p-3.5">
          <p className="text-[11px] font-medium text-slate-500">Ringkasan Pesanan</p>
          <div className="mt-1 flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">
                {session.upgradeFrom ? `Upgrade ke Paket ${plan.name}` : `Paket ${plan.name}`}
              </p>
              <p className="text-xs text-slate-600">
                {session.upgradeFrom
                  ? `Dari Paket ${getPlan(session.upgradeFrom).name} · cukup bayar selisihnya · masa berlaku tetap`
                  : "Berlangganan · 1 bulan · Batalkan kapan saja"}
              </p>
            </div>
            <p className="text-sm font-medium text-slate-900 tabular-nums">{formatRupiah(session.amount)}</p>
          </div>
          <div className="mt-3 flex items-end justify-between border-t border-dashed border-border pt-3">
            <p className="text-xs text-slate-600">Dibayar Hari Ini</p>
            <p className="text-2xl font-semibold tracking-tight text-primary tabular-nums">{formatRupiah(session.amount)}</p>
          </div>
        </section>

        <section>
          <p className="mb-2 text-xs font-semibold text-slate-900">Metode pembayaran</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {METHODS.map((m) => {
              const Icon = m.icon
              return (
                <button
                  key={m.id}
                  type="button"
                  className={tile(method === m.id)}
                  aria-pressed={method === m.id}
                  onClick={() => {
                    setMethod(m.id)
                    setChannel(m.channels[0])
                  }}
                >
                  <Icon className="size-4 text-primary" />
                  {PAYMENT_METHOD_LABEL[m.id]}
                </button>
              )
            })}
          </div>
        </section>

        <section className="rounded-xl border border-border bg-background p-3.5">
          <MethodDetail method={method} channel={channel} setChannel={setChannel} session={session} />
        </section>

        <section className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-dashed border-amber-300 bg-amber-50 px-3.5 py-2.5">
          <div>
            <p className="text-xs font-semibold text-amber-900">Mode simulasi</p>
            <p className="text-[11px] text-amber-800">Pilih hasil pembayaran untuk demo.</p>
          </div>
          <div role="radiogroup" aria-label="Simulasi hasil pembayaran" className="flex gap-0.5 rounded-full border border-amber-200 bg-white p-0.5">
            {[
              { value: true, label: "Berhasil" },
              { value: false, label: "Gagal" },
            ].map((opt) => (
              <button
                key={opt.label}
                type="button"
                role="radio"
                aria-checked={simulateSuccess === opt.value}
                onClick={() => setSimulateSuccess(opt.value)}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-medium transition-colors duration-150",
                  simulateSuccess === opt.value
                    ? opt.value
                      ? "bg-green-600 text-white"
                      : "bg-red-600 text-white"
                    : "text-slate-600 hover:bg-muted"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </section>
      </div>

      <div className="flex items-center gap-2 border-t px-5 py-3">
        <p className="mr-auto hidden items-center gap-1 text-[11px] text-slate-500 sm:flex">
          <ShieldCheck className="size-3.5" /> Pembayaran aman
        </p>
        <Button variant="outline" onClick={() => finish({ status: "cancelled", invoiceId: session.invoiceId })}>
          Batal
        </Button>
        <Button className="gap-2 px-4" onClick={pay}>
          <CreditCard /> Bayar {formatRupiah(session.amount)}
        </Button>
      </div>
    </div>
  )
}

export function PaymentDialog() {
  const checkout = usePaymentStore((s) => s.checkout)

  return (
    <Dialog
      open={!!checkout}
      onOpenChange={(open) => {
        // Menutup dialog sebelum bayar = batal. Saat memproses/hasil, penutupan diatur CheckoutBody.
        if (!open && checkout) finishCheckout({ status: "cancelled", invoiceId: checkout.invoiceId })
      }}
    >
      <DialogContent
        showCloseButton={false}
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        className="gap-0 overflow-hidden p-0 sm:max-w-lg"
      >
        {checkout && (
          <>
            <div className="flex items-center gap-3 border-b px-5 py-3.5">
              <BrandMark />
              <div className="min-w-0 flex-1">
                <DialogTitle className="text-base">Pembayaran</DialogTitle>
                <DialogDescription className="font-mono text-[11px]">{checkout.invoiceId}</DialogDescription>
              </div>
              <span className="rounded bg-muted px-1.5 py-px text-[10px] font-semibold tracking-wide text-primary">SIMULASI</span>
            </div>
            <CheckoutBody key={checkout.invoiceId} session={checkout} />
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
