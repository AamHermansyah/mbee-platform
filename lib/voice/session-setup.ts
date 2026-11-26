import { PLATFORM_DOMAIN } from "@/lib/constants/brand"
import { findAccountById, newProspectAccountId } from "@/lib/stores/account-store"
import { useBillingStore } from "@/lib/stores/billing-store"
import { useSessionStore } from "@/lib/stores/session-store"
import type { VoiceMode } from "@/lib/stores/voice-store"
import type { TicketInput } from "@/lib/types"
import type { MemberProfile } from "@/lib/voice/demo-script"

/**
 * Persiapan sesi Voice AI yang sama untuk kedua mesin (Live AI dan naskah simulasi):
 * akun pemilik tiket/tagihan, tiket awal, dan profil klien yang sudah login.
 */

export const EMPTY_TICKET: TicketInput = {
  title: "",
  template: "onboarding_payment",
  priority: "medium",
  assignee: null,
  accountId: null,
  dueDate: null,
  planId: null,
  name: "",
  email: "",
  phone: "",
  companyName: "",
  products: [],
  summary: { overview: "", needs: "", obstacles: "", nextAction: "", sentiment: "neutral" },
  issueStatus: "open",
  paymentMethod: null,
  paymentStatus: "unpaid",
  amount: 0,
  source: "voice_ai",
}

/** Paket aktif terbaru akun (tagihan lunas yang masa berlakunya belum habis). */
export function activePlanOf(accountId: string): MemberProfile["activePlan"] {
  const now = new Date().toISOString()
  const invoice = useBillingStore
    .getState()
    .invoices.filter((i) => i.accountId === accountId && i.status === "paid" && i.periodEnd && i.periodEnd > now)
    .sort((a, b) => (b.paidAt ?? "").localeCompare(a.paidAt ?? ""))[0]
  return invoice?.periodEnd ? { planId: invoice.planId, periodEnd: invoice.periodEnd } : null
}

export interface PreparedSession {
  mode: VoiceMode
  /** Akun pemilik tiket dan tagihan. Tamu landing memakai ID akun calon klien; akunnya dibuat setelah lunas. */
  accountId: string
  ticket: TicketInput
  /** Hanya untuk mode member. */
  profile: MemberProfile | null
  /** Data akun yang sudah login (mode member). */
  member: { email: string; phone: string } | null
}

/** null bila mode member tetapi tidak ada akun yang login di tab ini. */
export function prepareSession(mode: VoiceMode): PreparedSession | null {
  if (mode === "guest") {
    const accountId = newProspectAccountId()
    return {
      mode,
      accountId,
      profile: null,
      member: null,
      ticket: {
        ...EMPTY_TICKET,
        title: "Calon klien · Sesi Voice AI landing",
        accountId,
        journey: [{ stage: "greeting", label: `Sesi Voice AI dimulai dari landing ${PLATFORM_DOMAIN}`, at: new Date().toISOString() }],
      },
    }
  }

  const account = findAccountById(useSessionStore.getState().accountId)
  if (!account) return null
  return {
    mode,
    accountId: account.id,
    profile: { personName: account.personName, accountName: account.name, activePlan: activePlanOf(account.id) },
    member: { email: account.email, phone: account.phone ?? "" },
    ticket: {
      ...EMPTY_TICKET,
      title: `Sesi Voice AI · ${account.name}`,
      accountId: account.id,
      name: account.personName,
      email: account.email,
      phone: account.phone ?? "",
      companyName: account.name,
      journey: [{ stage: "greeting", label: "Sesi Voice AI dimulai dari dashboard klien", at: new Date().toISOString() }],
    },
  }
}
