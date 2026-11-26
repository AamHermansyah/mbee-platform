"use client"

import { CircleQuestionMark, Pin, PinOff } from "lucide-react"
import { useEffect, useRef } from "react"
import { toast } from "sonner"

import { AccountSwitcher } from "@/components/layout/account-switcher"
import { SidebarNav } from "@/components/layout/sidebar-nav"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet"
import type { DemoAccount } from "@/lib/auth/accounts"
import { useSidebarStore } from "@/lib/stores/sidebar-store"
import { cn } from "@/lib/utils"

function TourButton({ collapsed }: { collapsed: boolean }) {
  const onClick = () => toast.info("Tur produk belum tersedia di versi demo.")
  if (collapsed) {
    return (
      <Button variant="ghost" size="icon" onClick={onClick} aria-label="Mulai tur produk">
        <CircleQuestionMark />
      </Button>
    )
  }
  return (
    <Button variant="outline" size="sm" className="w-full justify-start" onClick={onClick}>
      <CircleQuestionMark />
      Mulai tur produk
    </Button>
  )
}

/** Sidebar desktop: w-16 tertutup, w-56 saat di-hover atau disematkan (sama dengan mimin). */
export function DesktopSidebar({ account }: { account: DemoAccount }) {
  const { collapsed, pinned, setCollapsed, setPinned } = useSidebarStore()
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => {
    if (leaveTimer.current) clearTimeout(leaveTimer.current)
  }, [])

  const onEnter = () => {
    if (leaveTimer.current) clearTimeout(leaveTimer.current)
    if (!pinned) setCollapsed(false)
  }

  const onLeave = () => {
    if (pinned) return
    leaveTimer.current = setTimeout(() => setCollapsed(true), 300)
  }

  return (
    <aside
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      className={cn(
        "fixed inset-y-0 left-0 z-50 hidden flex-col justify-between border-r bg-white pb-2 transition-all duration-300 ease-in-out md:flex",
        collapsed ? "w-16" : "w-56"
      )}
    >
      <div className="flex h-full flex-col px-1.5 py-2">
        <div className={cn("relative flex items-center gap-3.5 px-2 pt-4", collapsed ? "pb-3" : "pb-4")}>
          <AccountSwitcher account={account} collapsed={collapsed} />
          <button
            type="button"
            onClick={() => setPinned(!pinned)}
            title={pinned ? "Lepas Sematan Sidebar" : "Sematkan Sidebar"}
            className={cn(
              "group absolute top-0 right-0 flex size-6 shrink-0 items-center justify-center rounded-full outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary/50",
              collapsed && "hidden",
              pinned ? "text-primary hover:text-primary/80" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {pinned ? <Pin className="size-4" /> : <PinOff className="size-4" />}
            <span className="sr-only">Alihkan Sematan Sidebar</span>
          </button>
        </div>

        <SidebarNav role={account.role} collapsed={collapsed} />

        <div className={cn("pt-2 transition-all duration-300", collapsed ? "flex justify-center px-1.5" : "px-3.5")}>
          <TourButton collapsed={collapsed} />
        </div>
      </div>
    </aside>
  )
}

export function MobileSidebar({ account }: { account: DemoAccount }) {
  const { mobileOpen, setMobileOpen } = useSidebarStore()

  return (
    <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
      <SheetContent side="left" className="gap-0 p-0 data-[side=left]:w-64 data-[side=left]:sm:max-w-64">
        <SheetTitle className="sr-only">Menu</SheetTitle>
        <SheetDescription className="sr-only">Navigasi utama {account.name}</SheetDescription>
        <div className="flex h-full flex-col px-1.5 py-2">
          <div className="px-2 pt-4 pb-4">
            <AccountSwitcher account={account} collapsed={false} />
          </div>
          <SidebarNav role={account.role} collapsed={false} onNavigate={() => setMobileOpen(false)} />
        </div>
      </SheetContent>
    </Sheet>
  )
}
