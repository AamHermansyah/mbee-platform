import { cn } from "@/lib/utils"

/**
 * Tiruan tampilan komponen UI mimin-workflow yang dipakai halaman Mulai, lewat className di
 * atas komponen shadcn proyek ini (komponen bersama tidak ditambah prop). Hasil akhirnya
 * sama dengan kelas yang dihasilkan mimin setelah digabung (cva + tailwind-merge).
 */

type FlatButtonVariant = "default" | "outline" | "ghost"
type FlatButtonSize = "default" | "sm"

// <Button flat> mimin: kapsul, tanpa bayangan/gerak, transisi warna saja.
// bg-clip-border dan translate-y-0 menetralkan bg-clip-padding dan efek tekan Button proyek ini.
const FLAT_BUTTON_BASE =
  "gap-2 rounded-full bg-clip-border font-medium shadow-none transition-colors duration-150 motion-reduce:transition-none focus-visible:ring-2 focus-visible:ring-primary/50 active:not-aria-[haspopup]:translate-y-0"

const FLAT_BUTTON_SIZE: Record<FlatButtonSize, string> = {
  default: "h-9 px-4 py-2 text-sm",
  sm: "h-8 px-3 text-xs",
}

const FLAT_BUTTON_VARIANT: Record<FlatButtonVariant, string> = {
  default: "bg-primary text-primary-foreground hover:bg-primary/90",
  outline:
    "border-input bg-white text-foreground hover:bg-muted hover:text-foreground",
  ghost: "hover:bg-muted hover:text-foreground",
}

/** Kelas `<Button flat variant size>` mimin; taruh sebelum className milik pemanggil. */
export function flatButton(
  variant: FlatButtonVariant = "default",
  size: FlatButtonSize = "default"
) {
  return cn(
    FLAT_BUTTON_BASE,
    FLAT_BUTTON_SIZE[size],
    FLAT_BUTTON_VARIANT[variant]
  )
}

// Ukuran Badge mimin (shadcn lama): border terlihat, px-2.5 py-0.5, tebal semibold.
export const BADGE_BASE =
  "h-auto rounded-full border-border px-2.5 py-0.5 font-semibold"

// <DialogContent flat> mimin (SURFACE_DIALOG_CONTENT): putih solid berborder, tanpa ring.
export const SURFACE_DIALOG_CONTENT =
  "rounded-xl border bg-white text-foreground shadow-xl ring-0 duration-200"

// Tombol tutup <DialogContent flat> mimin (SURFACE_CLOSE_BUTTON di pojok kanan atas).
export const SURFACE_CLOSE_BUTTON =
  "absolute right-4 top-4 flex size-7 items-center justify-center rounded-md opacity-70 ring-offset-background transition-opacity duration-150 hover:bg-muted hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"

// <Progress flat> mimin: trek abu netral, tanpa animasi bila gerak dikurangi.
export const FLAT_PROGRESS = "bg-slate-200 *:motion-reduce:transition-none"
