"use client"

import { Bell, Check, ChevronRight, Eye, EyeOff, Globe, LogOut, Megaphone, Menu, Wallet } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useMemo, useState } from "react"
import { toast } from "sonner"

import { useLogout } from "@/components/layout/account-switcher"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import type { DemoAccount } from "@/lib/auth/accounts"
import { findNavItem } from "@/lib/constants/nav"
import { useLatestOnboardingTicket, useTickets } from "@/lib/data/ticket-repository"
import { formatDateTime, formatRupiah, initials } from "@/lib/format"
import { useSidebarStore } from "@/lib/stores/sidebar-store"
import { cn } from "@/lib/utils"

const PILL = "rounded-full border border-border bg-white"

function BreadcrumbPill({ account }: { account: DemoAccount }) {
  const pathname = usePathname()
  const item = findNavItem(account.role, pathname)
  const Icon = item?.icon
  const subPage = pathname === "/dashboard/billing/history" ? "Riwayat Penagihan" : null
  return (
    <nav aria-label="Breadcrumb" className={cn(PILL, "flex w-fit max-w-full items-center gap-1 px-3.5 py-1.5 text-sm")}>
      {subPage && item ? (
        <>
          <Link href={item.href} className="flex items-center gap-1 whitespace-nowrap text-slate-500 hover:text-slate-900">
            {Icon && <Icon className="size-4 shrink-0" />}
            {item.label}
          </Link>
          <ChevronRight className="size-3.5 text-slate-400" aria-hidden />
          <span className="font-medium whitespace-nowrap text-foreground" aria-current="page">
            {subPage}
          </span>
        </>
      ) : (
        <span className="flex items-center gap-1 font-medium whitespace-nowrap text-foreground" aria-current="page">
          {Icon && <Icon className="size-4 shrink-0" />}
          {item?.label ?? "Halaman"}
        </span>
      )}
    </nav>
  )
}

function LanguagePill() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={cn(PILL, "flex h-8 items-center gap-1.5 px-3 text-xs font-medium outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary/50")}>
        <Globe className="size-3.5" />
        ID
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem className="justify-between">
          Indonesia <Check className="size-3.5 text-primary" />
        </DropdownMenuItem>
        <DropdownMenuItem disabled>English (segera)</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/** Pill saldo: di mimin hanya tampil untuk akun B2C. */
function WalletPill() {
  const [hidden, setHidden] = useState(true)
  return (
    <div className={cn(PILL, "flex items-center gap-1 p-2 sm:py-1 sm:pr-1 sm:pl-3")}>
      <span className="flex items-center gap-2" aria-label="Saldo">
        <Wallet className="size-4" />
        <span className="hidden text-sm font-semibold tabular-nums sm:inline">{hidden ? "Rp ••••••" : formatRupiah(0)}</span>
      </span>
      <Button
        variant="ghost"
        size="icon-sm"
        className="hidden sm:inline-flex"
        onClick={() => setHidden((v) => !v)}
        aria-label={hidden ? "Tampilkan saldo" : "Sembunyikan saldo"}
      >
        {hidden ? <EyeOff /> : <Eye />}
      </Button>
    </div>
  )
}

interface NotificationItem {
  key: string
  title: string
  detail: string
  at: string
  href: string
}

function useNotifications(account: DemoAccount): NotificationItem[] {
  const tickets = useTickets()
  const ownTicket = useLatestOnboardingTicket(account.role === "client" ? account.id : undefined)

  return useMemo(() => {
    if (account.role === "admin") {
      return [...tickets]
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
        .slice(0, 6)
        .map((t) => ({
          key: t.id,
          title: `${t.id} · ${t.companyName || "Sesi Voice AI berjalan"}`,
          detail: t.journey.at(-1)?.label ?? t.title,
          at: t.updatedAt,
          href: `/dashboard/ticket?ticket_id=${t.id}`,
        }))
    }
    return [...(ownTicket?.journey ?? [])]
      .reverse()
      .slice(0, 6)
      .map((event, i) => ({
        key: `${event.at}-${i}`,
        title: event.label,
        detail: `Sesi Voice AI ${account.name}`,
        at: event.at,
        href: "/dashboard/billing/history",
      }))
  }, [account.role, account.name, tickets, ownTicket])
}

// Notifikasi sebelum waktu ini dianggap sudah dibaca (data contoh).
const INITIAL_SEEN_AT = "2026-11-25T00:00:00.000Z"

function NotificationButton({ account }: { account: DemoAccount }) {
  const items = useNotifications(account)
  const [seenAt, setSeenAt] = useState(INITIAL_SEEN_AT)
  const unread = items.filter((n) => n.at > seenAt).length

  return (
    <DropdownMenu onOpenChange={(open) => !open && setSeenAt(new Date().toISOString())}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-lg" className="relative" aria-label={`Notifikasi, ${unread} belum dibaca`}>
          <Bell className="size-5" />
          {unread > 0 && (
            <span className="absolute top-0.5 right-0.5 flex min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground">
              {unread}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 max-w-[calc(100vw-2rem)]">
        <DropdownMenuLabel>Notifikasi</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {items.length === 0 && <p className="px-2 py-3 text-xs text-muted-foreground">Belum ada notifikasi.</p>}
        {items.map((item) => (
          <DropdownMenuItem key={item.key} asChild>
            <Link href={item.href} className="flex flex-col items-start gap-0.5 py-2">
              <span className="text-xs font-medium">{item.title}</span>
              <span className="text-[11px] text-muted-foreground">
                {item.detail} · {formatDateTime(item.at)}
              </span>
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

const STATUS_OPTIONS = [
  { value: "online", label: "Online", dot: "bg-green-500" },
  { value: "busy", label: "Sibuk", dot: "bg-yellow-500" },
  { value: "offline", label: "Offline", dot: "bg-gray-400" },
] as const

function UserMenu({ account }: { account: DemoAccount }) {
  const logout = useLogout()
  const [status, setStatus] = useState<(typeof STATUS_OPTIONS)[number]["value"]>("online")
  const current = STATUS_OPTIONS.find((s) => s.value === status) ?? STATUS_OPTIONS[0]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative size-8 shrink-0 rounded-full sm:size-10" aria-label="Menu profil">
          <Avatar className="size-7 sm:size-[35px]">
            <AvatarFallback className="bg-white text-xs font-semibold text-primary">{initials(account.personName)}</AvatarFallback>
          </Avatar>
          <span className="absolute -right-0.5 -bottom-0.5" title={`Status: ${current.label}`}>
            <span className={cn("block size-3 rounded-full border-2 border-white sm:size-4", current.dot)} />
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 max-w-[calc(100vw-2rem)]">
        <div className="px-2 pt-1.5 pb-1">
          <p className="truncate text-sm font-medium">{account.personName}</p>
          <p className="truncate text-xs text-muted-foreground">{account.email}</p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs text-muted-foreground">Status</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={status} onValueChange={(v) => setStatus(v as typeof status)}>
          {STATUS_OPTIONS.map((option) => (
            <DropdownMenuRadioItem key={option.value} value={option.value} className="gap-2">
              <span className={cn("size-2 rounded-full", option.dot)} />
              {option.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onSelect={logout}>
          <LogOut /> Keluar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function Topbar({ account }: { account: DemoAccount }) {
  const setMobileOpen = useSidebarStore((s) => s.setMobileOpen)

  return (
    <header className="top-0 z-30 flex h-14 w-full items-center gap-4 border-b border-border bg-white px-4 py-3 sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 sm:py-0">
      <Button variant="outline" size="icon" className="md:hidden" onClick={() => setMobileOpen(true)} aria-label="Buka menu">
        <Menu />
      </Button>
      <div className="hidden min-w-0 overflow-hidden sm:block">
        <BreadcrumbPill account={account} />
      </div>
      <div className="flex-auto py-1">
        <div className="flex items-center justify-end gap-1 sm:gap-2">
          <div className="hidden items-center sm:flex">
            <LanguagePill />
          </div>
          {account.role === "client" && <WalletPill />}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-lg"
                aria-label="Catatan rilis"
                onClick={() => toast.info("Baru: asisten Voice AI dengan avatar interaktif.")}
              >
                <Megaphone className="size-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Catatan rilis</TooltipContent>
          </Tooltip>
          <NotificationButton account={account} />
          <UserMenu account={account} />
        </div>
      </div>
    </header>
  )
}
