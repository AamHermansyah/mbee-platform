"use client"

import { ArrowLeft, Check, CircleCheck, CircleX, Clock, ReceiptText, Search, SearchX } from "lucide-react"
import Link from "next/link"
import { useMemo, useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { DemoAccount } from "@/lib/auth/accounts"
import { PlanCard } from "@/components/billing/billing-page"
import { getPlan, PLANS, planAvailability, planPrice, upgradePrice, type Plan } from "@/lib/constants/plans"
import { PAYMENT_METHOD_LABEL } from "@/lib/constants/ticket"
import { formatDate, formatRupiah, formatTime } from "@/lib/format"
import { useActiveSubscription, useBillingStore, useInvoices, type Invoice, type InvoiceStatus } from "@/lib/stores/billing-store"
import { openCheckout } from "@/lib/stores/payment-store"
import { cn } from "@/lib/utils"

/** Riwayat Penagihan, struktur dari mimin billing/_layouts/billing-history.tsx. */

const CARD = "relative overflow-hidden rounded-xl border bg-white shadow-[0_1px_2px_rgba(16,24,40,0.05)]"

const STATUS_BADGE: Record<InvoiceStatus, { label: string; className: string; icon: typeof Clock }> = {
  paid: { label: "DIBAYAR", className: "border-transparent bg-primary text-primary-foreground", icon: CircleCheck },
  pending: { label: "MENUNGGU", className: "border-amber-200 bg-amber-50 text-amber-700", icon: Clock },
  failed: { label: "GAGAL", className: "border-red-200 bg-red-50 text-red-700", icon: CircleX },
  cancelled: { label: "DIBATALKAN", className: "border-red-200 bg-red-50 text-red-700", icon: CircleX },
}

function StatusBadge({ status }: { status: InvoiceStatus }) {
  const badge = STATUS_BADGE[status]
  const Icon = badge.icon
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap", badge.className)}>
      <Icon className="size-3.5" /> {badge.label}
    </span>
  )
}

function SubscriptionSummary({ invoice }: { invoice: Invoice }) {
  const plan = getPlan(invoice.planId)
  const Icon = plan.icon
  return (
    <div className={cn(CARD, "space-y-4 p-4")}>
      <div className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-xl border bg-white">
          <Icon className="size-5 text-primary" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-base font-semibold text-slate-900">Paket {plan.name}</p>
          <p className="text-xs text-muted-foreground">{plan.description}</p>
        </div>
        <StatusBadge status="paid" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Mulai", value: invoice.periodStart },
          { label: "Berakhir", value: invoice.periodEnd },
        ].map((box) => (
          <div key={box.label} className="rounded-xl border border-border px-3 py-2.5">
            <p className="text-[11px] text-muted-foreground">{box.label}</p>
            <p className="text-sm font-semibold text-slate-900">{box.value ? formatDate(box.value) : "—"}</p>
          </div>
        ))}
      </div>
      <div className="flex items-end justify-between border-t border-dashed border-border pt-3">
        <div>
          <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">Tarif bulanan</p>
          <p className="text-xs text-slate-600">
            Dibayar lewat {invoice.method ? PAYMENT_METHOD_LABEL[invoice.method] : "—"}
            {invoice.channel && invoice.channel !== "QRIS" ? ` · ${invoice.channel}` : ""} · {invoice.id}
            {invoice.upgradeFrom ? ` · Upgrade dari ${getPlan(invoice.upgradeFrom).name}, bayar selisih ${formatRupiah(invoice.amount)}` : ""}
          </p>
        </div>
        <p className="text-2xl leading-none font-semibold tracking-tight text-primary tabular-nums">
          {formatRupiah(planPrice(invoice.planId))}
          <span className="text-xs font-normal text-muted-foreground">/bulan</span>
        </p>
      </div>
      <div className="border-t border-border pt-3">
        <p className="mb-2 text-xs font-semibold text-slate-900">Yang termasuk</p>
        <ul className="grid gap-1.5 sm:grid-cols-2">
          {plan.features.map((feature) => (
            <li key={feature} className="flex items-center gap-2 text-xs text-slate-700">
              <Check className="size-3.5 shrink-0 text-primary" /> {feature}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function OrdersTable({ account }: { account: DemoAccount }) {
  const invoices = useInvoices(account.id)
  const hydrated = useBillingStore((s) => s.hydrated)
  const [query, setQuery] = useState("")
  const [sort, setSort] = useState<"newest" | "oldest">("newest")

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return invoices
      .filter((i) => !q || `paket ${getPlan(i.planId).name} ${i.id}`.toLowerCase().includes(q))
      .sort((a, b) => (sort === "newest" ? b.createdAt.localeCompare(a.createdAt) : a.createdAt.localeCompare(b.createdAt)))
  }, [invoices, query, sort])

  const payAgain = async (invoice: Invoice) => {
    void useBillingStore.getState().updateInvoice(invoice.id, { status: "cancelled", failureReason: "Diganti tagihan baru" })
    const outcome = await openCheckout(account.id, invoice.planId, "billing")
    if (outcome.status === "paid") toast.success(`Paket ${getPlan(invoice.planId).name} aktif`)
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-slate-500" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari produk..."
            aria-label="Cari pesanan"
            className="rounded-full bg-white pl-8"
          />
        </div>
        <Select value={sort} onValueChange={(v) => setSort(v as typeof sort)}>
          <SelectTrigger className="w-full rounded-full bg-white sm:w-[150px]" aria-label="Urutkan">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Terbaru</SelectItem>
            <SelectItem value="oldest">Terlama</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className={CARD}>
        {rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
            <span className="flex size-9 items-center justify-center rounded-lg border bg-white text-slate-500">
              <SearchX className="size-4" />
            </span>
            <p className="text-sm font-medium text-slate-800">{hydrated ? "Tidak ada pesanan ditemukan" : "Memuat…"}</p>
            {hydrated && <p className="text-xs text-muted-foreground">Anda belum melakukan pembelian langganan apa pun.</p>}
          </div>
        ) : (
          <div className="custom-scrollbar overflow-x-auto">
            <table className="w-full min-w-[860px] text-sm">
              <thead>
                <tr className="bg-muted text-left">
                  {["Nama Produk", "Total Keseluruhan", "Status", "Tipe", "Mata Uang", "Tanggal", "Kedaluwarsa", "Aksi"].map((head, i) => (
                    <th
                      key={head}
                      className={cn(
                        "h-10 px-4 text-xs font-medium whitespace-nowrap text-muted-foreground",
                        i === 4 && "text-center",
                        i >= 5 && "text-right"
                      )}
                    >
                      {head}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((invoice) => (
                  <tr key={invoice.id} className="border-t border-border transition-colors duration-150 hover:bg-muted">
                    <td className="px-4 py-3">
                      <ul className="list-inside list-disc text-sm text-slate-900">
                        <li>
                          {invoice.upgradeFrom
                            ? `Upgrade ${getPlan(invoice.upgradeFrom).name} → ${getPlan(invoice.planId).name}`
                            : `Paket ${getPlan(invoice.planId).name} · 1 bulan`}
                        </li>
                      </ul>
                      <p className="pl-4 font-mono text-[11px] text-slate-500">{invoice.id}</p>
                    </td>
                    <td className="px-4 py-3 font-medium whitespace-nowrap tabular-nums">{formatRupiah(invoice.amount)}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={invoice.status} />
                      {invoice.failureReason && invoice.status !== "paid" && (
                        <p className="mt-1 max-w-[200px] text-[11px] text-slate-500">{invoice.failureReason}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full border border-primary bg-white px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap text-primary">
                        {invoice.upgradeFrom ? "Upgrade" : "Berlangganan"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-xs text-slate-700">IDR</td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <p className="text-sm text-slate-900">{formatDate(invoice.createdAt)}</p>
                      <p className="text-[11px] text-slate-500">{formatTime(invoice.createdAt)}</p>
                    </td>
                    <td className="px-4 py-3 text-right text-sm whitespace-nowrap text-slate-700">
                      {invoice.periodEnd ? formatDate(invoice.periodEnd) : "-"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {invoice.status === "pending" ? (
                        <Button size="sm" className="h-7 px-3 text-xs" onClick={() => void payAgain(invoice)}>
                          Bayar
                        </Button>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Semua kartu paket untuk akun yang sudah berlangganan: paket aktif ditandai, paket di bawahnya
 * tidak bisa dibeli lagi, paket di atasnya bisa di-upgrade dengan membayar selisih harga, dan masa
 * berlaku tetap sampai akhir periode berjalan.
 */
function PlansSection({ account, current }: { account: DemoAccount; current: Invoice }) {
  const choose = async (plan: Plan) => {
    if (plan.monthlyPrice === null) {
      toast.info("Paket Enterprise", { description: "Tim sales akan menghubungi Anda lewat WhatsApp untuk penawaran." })
      return
    }
    const outcome = await openCheckout(account.id, plan.id, "billing", current.planId)
    if (outcome.status === "paid") toast.success(`Upgrade berhasil, paket ${plan.name} aktif`)
    else if (outcome.status === "failed") toast.error("Pembayaran gagal", { description: `Penyebab: ${outcome.reason}. Silakan coba lagi.` })
  }

  return (
    <section className="mt-3 space-y-3 sm:mt-4" aria-labelledby="plans-h">
      <div>
        <h2 id="plans-h" className="text-sm font-semibold tracking-tight sm:text-base">
          Paket Tersedia
        </h2>
        <p className="text-xs text-muted-foreground">Naikkan paket kapan saja dengan membayar selisih harganya. Paket di bawah paket aktif tidak bisa dibeli lagi.</p>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
        {PLANS.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            availability={planAvailability(current.planId, plan.id)}
            upgradeAmount={upgradePrice(current.planId, plan.id)}
            onChoose={(p) => void choose(p)}
          />
        ))}
      </div>
    </section>
  )
}

export function BillingHistoryPage({ account }: { account: DemoAccount }) {
  const subscription = useActiveSubscription(account.id)

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-xl border bg-white">
            <ReceiptText className="size-4 text-slate-700" />
          </span>
          <h1 className="text-lg font-semibold tracking-tight sm:text-xl">Riwayat Penagihan</h1>
        </div>
        {!subscription && (
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/billing">
              <ArrowLeft /> Kembali ke Paket
            </Link>
          </Button>
        )}
      </div>

      {subscription ? (
        <Tabs defaultValue="subscription" className="gap-3">
          <TabsList className="h-auto w-fit rounded-full border bg-white p-0.5">
            <TabsTrigger value="subscription" className="h-8 rounded-full px-4 text-sm data-active:bg-primary data-active:text-primary-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Langganan
            </TabsTrigger>
            <TabsTrigger value="history" className="h-8 rounded-full px-4 text-sm data-active:bg-primary data-active:text-primary-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Riwayat
            </TabsTrigger>
          </TabsList>
          <TabsContent value="subscription">
            <SubscriptionSummary invoice={subscription} />
            <PlansSection account={account} current={subscription} />
          </TabsContent>
          <TabsContent value="history">
            <OrdersTable account={account} />
          </TabsContent>
        </Tabs>
      ) : (
        <OrdersTable account={account} />
      )}
    </div>
  )
}
