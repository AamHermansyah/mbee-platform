import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"

import type { DemoAccount } from "@/lib/auth/accounts"
import { authenticate, hydrateAccounts, useAccountStore } from "@/lib/stores/account-store"

/**
 * Sesi login demo disimpan di sessionStorage (per tab), bukan cookie.
 * Tujuannya: satu browser bisa membuka dua tab dengan akun berbeda
 * (Mbee Cafe dan admin Mbee Platform) dan melihat tiket berubah secara langsung.
 */
interface SessionState {
  accountId: string | null
  hydrated: boolean
  /** undefined bila email/kata sandi salah; melempar error bila server tidak bisa diakses. */
  login: (email: string, password: string) => Promise<DemoAccount | undefined>
  logout: () => void
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      accountId: null,
      hydrated: false,
      login: async (email, password) => {
        const account = await authenticate(email, password)
        if (account) set({ accountId: account.id })
        return account
      },
      logout: () => set({ accountId: null }),
    }),
    {
      name: "mbee-platform-session",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({ accountId: state.accountId }),
      skipHydration: true,
    }
  )
)

/** Akun yang sedang login, termasuk akun hasil Voice AI (ikut berubah saat kata sandi diganti). */
export function useCurrentAccount(): DemoAccount | undefined {
  const accountId = useSessionStore((s) => s.accountId)
  const accounts = useAccountStore((s) => s.accounts)
  if (!accountId) return undefined
  return accounts.find((a) => a.id === accountId)
}

/** Memuat sesi dari sessionStorage (dan daftar akun dari database) sekali per halaman. */
export async function hydrateSession(): Promise<void> {
  if (useSessionStore.getState().hydrated) return
  await hydrateAccounts()
  await useSessionStore.persist.rehydrate()
  useSessionStore.setState({ hydrated: true })
}
