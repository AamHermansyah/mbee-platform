"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import type { Role } from "@/lib/auth/accounts"
import { NAV_BY_ROLE, findNavItem, type NavItem } from "@/lib/constants/nav"
import { cn } from "@/lib/utils"

function SidebarItem({
  item,
  active,
  collapsed,
  onNavigate,
}: {
  item: NavItem
  active: boolean
  collapsed: boolean
  onNavigate?: () => void
}) {
  const Icon = item.icon

  if (collapsed) {
    return (
      <div className="flex w-full justify-center">
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              href={item.href}
              aria-label={item.label}
              aria-current={active ? "page" : undefined}
              // size-9 + shrink-0 + aspect-square: tetap kotak 36×36 walau ruang sidebar menyempit
              className={cn(
                "grid aspect-square size-9 shrink-0 place-items-center rounded-xl outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-primary/50 motion-reduce:transition-none",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="size-4" />
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right">{item.label}</TooltipContent>
        </Tooltip>
      </div>
    )
  }

  return (
    <div className="w-full px-4">
      <Link
        href={item.href}
        onClick={onNavigate}
        aria-current={active ? "page" : undefined}
        className={cn(
          "relative flex w-full items-center rounded-full px-3 py-2 outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-primary/50 motion-reduce:transition-none",
          active
            ? "bg-primary text-primary-foreground hover:bg-primary/95"
            : "text-foreground hover:bg-muted hover:text-foreground"
        )}
      >
        <span className="flex w-full items-center gap-2">
          <Icon className="size-4 shrink-0" />
          <span className="flex-1 truncate text-xs font-medium whitespace-nowrap">{item.label}</span>
        </span>
      </Link>
    </div>
  )
}

export function SidebarNav({
  role,
  collapsed,
  onNavigate,
}: {
  role: Role
  collapsed: boolean
  onNavigate?: () => void
}) {
  const pathname = usePathname()
  const activeId = findNavItem(role, pathname)?.id

  return (
    <nav aria-label="Menu utama" className="custom-scrollbar flex flex-auto flex-col gap-1 overflow-x-hidden overflow-y-auto pt-2 pb-4">
      {NAV_BY_ROLE[role].map((group, index) => (
        <div key={group.id} className="flex flex-col gap-1">
          {!collapsed && (
            <p className={cn("px-5 pt-4 pb-1 text-[11px] font-medium tracking-wide text-muted-foreground", index === 0 && "pt-0")}>
              {group.label}
            </p>
          )}
          {group.items.map((item) => (
            <SidebarItem
              key={item.id}
              item={item}
              active={item.id === activeId}
              collapsed={collapsed}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      ))}
    </nav>
  )
}
