import { create } from "zustand"

/** Sama seperti mimin: tertutup bawaan, melebar saat di-hover, bisa disematkan. */
interface SidebarState {
  collapsed: boolean
  pinned: boolean
  mobileOpen: boolean
  setCollapsed: (collapsed: boolean) => void
  setPinned: (pinned: boolean) => void
  setMobileOpen: (open: boolean) => void
}

export const useSidebarStore = create<SidebarState>()((set) => ({
  collapsed: true,
  pinned: false,
  mobileOpen: false,
  setCollapsed: (collapsed) => set({ collapsed }),
  setPinned: (pinned) => set({ pinned, collapsed: !pinned }),
  setMobileOpen: (mobileOpen) => set({ mobileOpen }),
}))
