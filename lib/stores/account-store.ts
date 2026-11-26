import { create } from "zustand"

import { DEMO_ACCOUNTS, normalizeEmail, type DemoAccount } from "@/lib/auth/accounts"
import { api, ApiError, startPolling } from "@/lib/data/api"

/**
 * Akun demo: akun bawaan (Mbee Cafe, admin) dan akun klien yang dibuat setelah pengunjung landing membayar
 * lewat Voice AI. Data ada di Supabase (tabel mbee.accounts, kata sandi berupa hash) lewat /api/accounts.
 * Store ini menyimpan daftar akun tanpa kata sandi untuk menu ganti akun dan sesi login.
 */

export interface ProvisionInput {
  id: string
  name: string
  personName: string
  email: string
  phone: string
}

export interface ProvisionResult {
  account: DemoAccount
  /** Kata sandi sementara dari server, hanya dikembalikan sekali untuk kartu akun dan email kredensial. */
  tempPassword: string
}

/** Akun bawaan tanpa kata sandi, dipakai sebelum daftar akun dari server termuat. */
const SEED_PUBLIC: DemoAccount[] = DEMO_ACCOUNTS.map((seed) => {
  const account: DemoAccount & { password?: string } = { ...seed }
  delete account.password
  return account
})

interface AccountState {
  accounts: DemoAccount[]
  hydrated: boolean
  /** Melempar error bila email sudah terdaftar atau database tidak bisa diakses. */
  provision: (input: ProvisionInput) => Promise<ProvisionResult>
  /** Mengembalikan pesan error, atau null bila berhasil. */
  changePassword: (id: string, password: string) => Promise<string | null>
}

function upsert(accounts: DemoAccount[], account: DemoAccount): DemoAccount[] {
  return accounts.some((a) => a.id === account.id) ? accounts.map((a) => (a.id === account.id ? account : a)) : [...accounts, account]
}

export const useAccountStore = create<AccountState>()((set, get) => ({
  accounts: SEED_PUBLIC,
  hydrated: false,

  provision: async (input) => {
    const result = await api<ProvisionResult>("/api/accounts", { method: "POST", body: input })
    set({ accounts: upsert(get().accounts, result.account) })
    return result
  },

  changePassword: async (id, password) => {
    try {
      const { account } = await api<{ account: DemoAccount }>(`/api/accounts/${encodeURIComponent(id)}/password`, {
        method: "POST",
        body: { password },
      })
      set({ accounts: upsert(get().accounts, account) })
      return null
    } catch (error) {
      return error instanceof ApiError ? error.message : "Kata sandi gagal disimpan. Coba lagi."
    }
  },
}))

/** Muat ulang daftar akun dari server sekarang. */
export async function reloadAccounts(): Promise<void> {
  const { accounts } = await api<{ accounts: DemoAccount[] }>("/api/accounts")
  useAccountStore.setState({ accounts, hydrated: true })
}

export async function hydrateAccounts(): Promise<void> {
  if (useAccountStore.getState().hydrated) return
  try {
    await reloadAccounts()
  } catch (error) {
    console.warn("[akun] gagal memuat daftar akun:", error instanceof Error ? error.message : error)
    useAccountStore.setState({ hydrated: true })
  }
}

/** Polling tiap 2 detik: akun baru dari Voice AI di perangkat lain ikut muncul di menu ganti akun. */
export function subscribeAccountSync(): () => void {
  return startPolling(reloadAccounts)
}

/** Login: kata sandi dicek server terhadap hash di database. */
export async function authenticate(email: string, password: string): Promise<DemoAccount | undefined> {
  try {
    const { account } = await api<{ account: DemoAccount }>("/api/auth/login", { method: "POST", body: { email, password } })
    useAccountStore.setState({ accounts: upsert(useAccountStore.getState().accounts, account) })
    return account
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return undefined
    throw error
  }
}

/** Semua akun: bawaan demo + akun hasil Voice AI di landing. */
export function allAccounts(): DemoAccount[] {
  return useAccountStore.getState().accounts
}

export function findAccountById(id: string | null | undefined): DemoAccount | undefined {
  if (!id) return undefined
  return allAccounts().find((a) => a.id === id)
}

/** Email sudah dipakai akun lain? Dicek ke database. Bila database tidak bisa diakses, pakai daftar yang sudah dimuat. */
export async function isEmailTaken(email: string): Promise<boolean> {
  const normalized = normalizeEmail(email)
  try {
    const { taken } = await api<{ taken: boolean }>(`/api/accounts?email=${encodeURIComponent(normalized)}`)
    return taken
  } catch {
    return allAccounts().some((a) => a.email === normalized)
  }
}

/** ID akun baru untuk calon klien di landing; tagihan dan tiket memakai ID ini sebelum akunnya dibuat. */
export function newProspectAccountId(): string {
  return `acc-${Date.now().toString(36)}`
}
