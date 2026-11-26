import { forwardRef, type HTMLAttributes } from "react"

import { cn } from "@/lib/utils"

/**
 * Porting dari mimin-workflow `app/(dashboard)/convert-file/_components/flat-surface.tsx`
 * (hanya bagian yang dipakai halaman Mulai: PanelContainer, SurfaceCard, SURFACE_PILL).
 */

/**
 * Pembungkus halaman. Tema flat minimal tidak punya panel bertint: kartu langsung berada di
 * atas latar putih halaman, jadi hanya menyediakan konteks posisi (nama dipertahankan agar
 * pemakai tidak perlu diubah).
 */
export function PanelContainer({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("relative", className)} {...props}>
      {children}
    </div>
  )
}

interface SurfaceCardProps extends HTMLAttributes<HTMLDivElement> {
  selected?: boolean
  interactive?: boolean
}

/**
 * Kartu putih berborder tipis. Saat interaktif, hover hanya menegaskan border (tanpa
 * gerak, blur, atau bayangan berwarna).
 */
export const SurfaceCard = forwardRef<HTMLDivElement, SurfaceCardProps>(
  ({ className, selected, interactive = true, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "group/flat relative flex flex-col !rounded-xl border border-border bg-white p-2.5 shadow-[0_1px_2px_rgba(16,24,40,0.05)]",
        interactive &&
          "transition-colors duration-150 motion-reduce:transition-none hover:border-primary/50",
        selected && "border-primary ring-1 ring-primary",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
)
SurfaceCard.displayName = "SurfaceCard"

// Kapsul kecil (kontrol, filter, chip): putih berborder tipis
export const SURFACE_PILL = "rounded-full border border-border bg-white"
