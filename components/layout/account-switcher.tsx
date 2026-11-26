"use client"

import { Check, ChevronDown, LogOut } from "lucide-react"
import { useRouter } from "next/navigation"

import { BrandMark } from "@/components/shared/brand"
import { MbeeLogo } from "@/components/shared/mbee-logo"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DEMO_ACCOUNTS, landingPathFor, type DemoAccount } from "@/lib/auth/accounts"
import { useAccountStore } from "@/lib/stores/account-store"
import { useSessionStore } from "@/lib/stores/session-store"
import { cn } from "@/lib/utils"
import { resetVoiceForAccountChange } from "@/lib/voice/session"

export function AccountAvatar({ account, className }: { account: DemoAccount; className?: string }) {
  if (account.role === "client") return <MbeeLogo className={className} />
  return (
    <span className={cn("flex shrink-0 items-center justify-center rounded-full border border-border bg-white", className)}>
      <BrandMark className="size-[62%]" />
    </span>
  )
}

/** Keluar dari akun saat ini: hentikan sesi suara, hapus sesi tab, kembali ke login. */
export function useLogout() {
  const router = useRouter()
  return () => {
    void resetVoiceForAccountChange()
    useSessionStore.getState().logout()
    router.replace("/login")
  }
}

export function AccountSwitcher({ account, collapsed }: { account: DemoAccount; collapsed: boolean }) {
  const router = useRouter()
  const logout = useLogout()
  // Akun bawaan demo + akun yang dibuat Voice AI setelah pembayaran di landing
  const created = useAccountStore((s) => s.accounts)
  const accounts = [...DEMO_ACCOUNTS, ...created]

  const switchTo = (target: DemoAccount) => {
    if (target.id === account.id) return
    void resetVoiceForAccountChange()
    useSessionStore.setState({ accountId: target.id })
    router.replace(landingPathFor(target))
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "flex min-w-0 items-center gap-3 rounded-xl text-left outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
          collapsed ? "mx-auto" : "w-full"
        )}
        aria-label="Kelola akun"
      >
        <AccountAvatar account={account} className={collapsed ? "size-10" : "size-12"} />
        {!collapsed && (
          <span className="flex min-w-0 flex-1 flex-col justify-center">
            <span className="truncate text-sm leading-tight font-medium text-foreground">{account.name}</span>
            <span className="mt-0.5 flex items-center gap-1 truncate text-[11px] leading-tight text-muted-foreground">
              Kelola Akun
              <ChevronDown className="size-3" />
            </span>
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel className="text-xs text-muted-foreground">Akun demo</DropdownMenuLabel>
        {accounts.map((item) => (
          <DropdownMenuItem key={item.id} className="gap-2.5 py-2" onSelect={() => switchTo(item)}>
            <AccountAvatar account={item} className="size-7" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">{item.name}</span>
              <span className="block truncate text-xs text-muted-foreground">
                {item.email}
                {item.source === "voice_ai" && " · dari Voice AI"}
              </span>
            </span>
            {item.id === account.id && <Check className="size-4 text-primary" />}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onSelect={logout}>
          <LogOut /> Keluar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
