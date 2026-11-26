import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"

import { CLIENT_HOME, CLIENT_PATHS, DEMO_ACCOUNTS, normalizeEmail, type DemoAccount } from "@/lib/auth/accounts"

/**
 * Akun klien yang dibuat "backend" setelah pengunjung landing membayar lewat Voice AI.
 * Tahap 1: disimpan di localStorage dan disinkronkan antar tab (seperti tiket dan tagihan).
 * Tahap 2: provision() diganti panggilan API yang membuat akun dan mengirim email kredensial.
 */
const ACCOUNT_STORAGE_KEY = "mbee-platform-accounts-v1"

export interface ProvisionInput {
  id: string
  name: string
  personName: string
  email: string
  phone: string
}

export interface ProvisionResult {
  account: DemoAccount
  /** Kata sandi sementara yang "dikirim" ke email pelanggan. */
  tempPassword: string
}

interface AccountState {
  accounts: DemoAccount[]
  hydrated: boolean
  provision: (input: ProvisionInput) => ProvisionResult
  changePassword: (id: string, password: string) => DemoAccount | undefined
  reset: () => void
}

/** Kata sandi sementara yang mudah dibaca di layar, mis. "Mbee-7K4Q-29". */
function generateTempPassword(): string {
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ"
  const pick = (chars: string) => chars[Math.floor(Math.random() * chars.length)]
  const block = Array.from({ length: 4 }, (_, i) => (i % 2 === 0 ? pick("23456789") : pick(letters))).join("")
  return `Mbee-${block}-${pick("23456789")}${pick("23456789")}`
}

export const useAccountStore = create<AccountState>()(
  persist(
    (set, get) => ({
      accounts: [],
      hydrated: false,

      provision: (input) => {
        const email = normalizeEmail(input.email)
        const tempPassword = generateTempPassword()
        const account: DemoAccount = {
          id: input.id,
          role: "client",
          name: input.name,
          personName: input.personName,
          email,
          password: tempPassword,
          phone: input.phone,
          home: CLIENT_HOME,
          allowedPaths: CLIENT_PATHS,
          source: "voice_ai",
          mustChangePassword: true,
          createdAt: new Date().toISOString(),
        }
        // Voice AI sudah memastikan email belum terdaftar (ConversationContext.emailTaken) sebelum membuat akun;
        // filter ini hanya jaring pengaman. Mengulang demo: "Pulihkan data contoh" di akun admin.
        set({ accounts: [account, ...get().accounts.filter((a) => a.email !== email && a.id !== input.id)] })
        return { account, tempPassword }
      },

      changePassword: (id, password) => {
        let updated: DemoAccount | undefined
        set({
          accounts: get().accounts.map((a) => {
            if (a.id !== id) return a
            updated = { ...a, password, mustChangePassword: false }
            return updated
          }),
        })
        return updated
      },

      reset: () => set({ accounts: [] }),
    }),
    {
      name: ACCOUNT_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ accounts: state.accounts }),
      skipHydration: true,
    }
  )
)

export async function hydrateAccounts(): Promise<void> {
  if (useAccountStore.getState().hydrated) return
  await useAccountStore.persist.rehydrate()
  useAccountStore.setState({ hydrated: true })
}

export function subscribeAccountSync(): () => void {
  const onStorage = (event: StorageEvent) => {
    if (event.key === ACCOUNT_STORAGE_KEY) void useAccountStore.persist.rehydrate()
  }
  window.addEventListener("storage", onStorage)
  return () => window.removeEventListener("storage", onStorage)
}

/** Semua akun: bawaan demo + akun hasil Voice AI di landing. */
export function allAccounts(): DemoAccount[] {
  return [...DEMO_ACCOUNTS, ...useAccountStore.getState().accounts]
}

export function findAccountById(id: string | null | undefined): DemoAccount | undefined {
  if (!id) return undefined
  return allAccounts().find((a) => a.id === id)
}

export function authenticate(email: string, password: string): DemoAccount | undefined {
  const normalized = normalizeEmail(email)
  return allAccounts().find((a) => a.email === normalized && a.password === password)
}

/** ID akun baru untuk calon klien di landing; tagihan dan tiket memakai ID ini sebelum akunnya dibuat. */
export function newProspectAccountId(): string {
  return `acc-${Date.now().toString(36)}`
}
