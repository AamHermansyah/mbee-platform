"use client"

import { Check } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import type { DemoAccount } from "@/lib/auth/accounts"
import { PLATFORM_NAME, PLATFORM_TEAM } from "@/lib/constants/brand"
import { COMPARISON_ROWS, PLANS, type Plan, type PlanAvailability } from "@/lib/constants/plans"
import { formatRupiah } from "@/lib/format"
import { useActiveSubscription, useBillingStore } from "@/lib/stores/billing-store"
import { openCheckout } from "@/lib/stores/payment-store"
import { cn } from "@/lib/utils"

/**
 * Halaman Penagihan, struktur dari mimin billing-layout.tsx:
 * judul tengah → kartu paket → perbandingan fitur → kartu riwayat → kartu bantuan.
 * Pembayaran memakai dialog simulasi (mimin asli membuka tab baru ke payment gateway).
 */

const CARD = "relative overflow-hidden rounded-xl border bg-white shadow-[0_1px_2px_rgba(16,24,40,0.05)]"

/**
 * availability hanya diisi untuk akun yang sudah berlangganan (Riwayat Penagihan, tab Langganan):
 * paket aktif ditandai, paket di bawahnya dikunci, paket di atasnya bisa di-upgrade.
 */
export function PlanCard({
  plan,
  onChoose,
  availability,
  upgradeAmount,
}: {
  plan: Plan
  onChoose: (plan: Plan) => void
  availability?: PlanAvailability
  /** Selisih yang dibayar bila kartu ini upgrade dari paket aktif (null = custom). */
  upgradeAmount?: number | null
}) {
  const Icon = plan.icon
  const locked = availability === "unavailable"
  const current = availability === "current"
  const upgrade = availability === "upgrade"
  const label = current
    ? "Paket Aktif"
    : locked
      ? "Tidak Tersedia"
      : upgrade
        ? plan.monthlyPrice === null
          ? plan.buttonText
          : `Upgrade ke ${plan.name}`
        : plan.buttonText
  return (
    <div
      className={cn(
        CARD,
        "flex h-full flex-col p-4",
        (plan.highlight || current) && "border-primary ring-1 ring-primary",
        locked && "bg-muted/40"
      )}
      aria-disabled={locked || undefined}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border bg-white">
            <Icon className="size-4 text-primary" />
          </span>
          <p className="truncate text-sm font-semibold sm:text-base">{plan.name}</p>
        </div>
        {current ? (
          <span className="shrink-0 rounded-full bg-primary px-2 py-0.5 text-[11px] font-semibold text-primary-foreground">Paket Aktif</span>
        ) : (
          plan.highlight &&
          !locked && (
            <span className="shrink-0 rounded-full border border-primary bg-white px-2 py-0.5 text-[11px] font-semibold text-primary">
              Paling Populer
            </span>
          )
        )}
      </div>
      <p className="mt-2.5 text-xs text-muted-foreground sm:min-h-8">{plan.description}</p>
      <div className="mt-3 flex items-baseline gap-1.5">
        <p className="text-2xl font-semibold tracking-tight text-foreground tabular-nums">
          {plan.monthlyPrice === null ? "Custom" : formatRupiah(plan.monthlyPrice)}
        </p>
        {plan.monthlyPrice !== null && <span className="text-xs whitespace-nowrap text-muted-foreground">/bln</span>}
      </div>
      {upgrade && typeof upgradeAmount === "number" && (
        <p className="mt-1 text-xs font-medium text-primary">Upgrade cukup bayar selisih {formatRupiah(upgradeAmount)}</p>
      )}
      <Button
        variant={(availability ? upgrade : plan.highlight) ? "default" : "outline"}
        className="mt-3 h-8 w-full text-xs font-semibold"
        disabled={current || locked}
        onClick={() => onChoose(plan)}
      >
        {label}
      </Button>
      {locked && <p className="mt-1.5 text-[11px] text-muted-foreground">Di bawah paket aktif, tidak bisa dibeli lagi.</p>}
      <ul className={cn("mt-4 flex-1 space-y-2 border-t border-border pt-4", locked && "opacity-60")}>
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2">
            <Check className="mt-0.5 size-3.5 shrink-0 text-primary" />
            <span className="text-xs text-foreground">{feature}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function ComparisonTable() {
  return (
    <section className={CARD}>
      <div className="px-4 pt-3.5 pb-2">
        <h2 className="text-sm font-semibold tracking-tight sm:text-base">Perbandingan Fitur</h2>
      </div>
      <div className="custom-scrollbar overflow-x-auto">
        <table className="w-full min-w-[640px] text-left">
          <thead>
            <tr className="divide-x divide-border border-y bg-muted">
              <th className="w-[240px] px-3 py-2.5 text-xs font-semibold text-foreground">Fitur</th>
              {PLANS.map((plan) => (
                <th
                  key={plan.id}
                  className={cn(
                    "px-3 py-2.5 text-center text-xs font-semibold tracking-wide text-muted-foreground uppercase",
                    plan.highlight && "text-primary"
                  )}
                >
                  {plan.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {COMPARISON_ROWS.map((row) => (
              <tr key={row.label} className="divide-x divide-border border-b border-border transition-colors duration-150 last:border-b-0 hover:bg-muted">
                <td className="px-3 py-2.5 text-xs font-medium text-foreground">{row.label}</td>
                {PLANS.map((plan) => (
                  <td
                    key={plan.id}
                    className={cn(
                      "px-3 py-2.5 text-center text-xs text-muted-foreground",
                      plan.highlight && "font-semibold text-primary"
                    )}
                  >
                    {row.values[plan.id]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function CtaCard({ title, subtitle, action }: { title: string; subtitle: string; action: React.ReactNode }) {
  return (
    <div className={cn(CARD, "flex flex-col items-start justify-between gap-3 p-4 sm:flex-row sm:items-center")}>
      <div>
        <p className="text-sm font-semibold text-foreground sm:text-base">{title}</p>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
      {action}
    </div>
  )
}

export function BillingPage({ account }: { account: DemoAccount }) {
  const router = useRouter()
  const hydrated = useBillingStore((s) => s.hydrated)
  const subscription = useActiveSubscription(account.id)

  // Sama seperti mimin: akun yang sudah punya pesanan lunas langsung ke Riwayat Penagihan.
  useEffect(() => {
    if (hydrated && subscription) router.replace("/dashboard/billing/history")
  }, [hydrated, subscription, router])

  const choose = async (plan: Plan) => {
    if (plan.monthlyPrice === null) {
      toast.info("Paket Enterprise", { description: `Tim sales ${PLATFORM_NAME} akan menghubungi Anda lewat WhatsApp.` })
      return
    }
    const outcome = await openCheckout(account.id, plan.id, "billing")
    if (outcome.status === "paid") {
      toast.success(`Paket ${plan.name} aktif`)
      router.push("/dashboard/billing/history")
    } else if (outcome.status === "failed") {
      toast.error("Pembayaran gagal", { description: `Penyebab: ${outcome.reason}. Silakan coba lagi.` })
    }
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="mx-auto max-w-2xl space-y-1 text-center">
        <h1 className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">Siap Berkembang? Pilih Paketmu</h1>
        <p className="text-xs text-muted-foreground sm:text-sm">Harga fleksibel untuk tim dari berbagai ukuran. Tanpa biaya tersembunyi.</p>
        <p className="text-[11px] text-muted-foreground">Harga contoh untuk demo.</p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
        {PLANS.map((plan) => (
          <PlanCard key={plan.id} plan={plan} onChoose={(p) => void choose(p)} />
        ))}
      </div>

      <ComparisonTable />

      <CtaCard
        title="Riwayat Penagihan"
        subtitle="Lihat dan unduh invoice langganan Anda yang lalu"
        action={
          <Button asChild variant="outline" size="sm" className="shrink-0">
            <Link href="/dashboard/billing/history">Lihat Riwayat</Link>
          </Button>
        }
      />
      <CtaCard
        title="Masih punya pertanyaan?"
        subtitle="Tim support kami siap membantu Anda memilih paket yang tepat untuk bisnis Anda."
        action={
          <Button
            variant="outline"
            size="sm"
            className="shrink-0"
            onClick={() => toast.info("Hubungi Ahli", { description: `Di platform asli tombol ini membuka WhatsApp ${PLATFORM_TEAM}.` })}
          >
            Hubungi Ahli
          </Button>
        }
      />
    </div>
  )
}
