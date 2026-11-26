import { cn } from "@/lib/utils"

/** Logo Mbee Platform: kotak teal dengan gelombang suara (Voice AI). */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" role="img" aria-label="Mbee Platform" className={cn("size-7 shrink-0", className)}>
      <rect width="32" height="32" rx="9" fill="#017b89" />
      <g fill="#ffffff">
        <rect x="6.5" y="13" width="3" height="6" rx="1.5" />
        <rect x="11.5" y="9" width="3" height="14" rx="1.5" />
        <rect x="16.5" y="11" width="3" height="10" rx="1.5" />
        <rect x="21.5" y="7" width="3" height="18" rx="1.5" />
      </g>
      <circle cx="26.5" cy="26.5" r="2.5" fill="#ffa200" />
    </svg>
  )
}

/** Logo + tulisan "mbee platform". variant "light" untuk latar gelap. */
export function BrandWordmark({ variant = "dark", className }: { variant?: "dark" | "light"; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <BrandMark className={variant === "light" ? "rounded-[9px] ring-2 ring-white/40" : undefined} />
      <span
        className={cn(
          "text-xl leading-none font-semibold tracking-tight lowercase",
          variant === "light" ? "text-white" : "text-slate-900"
        )}
      >
        mbee<span className="font-normal opacity-80"> platform</span>
      </span>
    </span>
  )
}
