import { cn } from "@/lib/utils"

/** Logo sementara Mbee Cafe: kepala domba berbulu di atas lingkaran teal. */
export function MbeeLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      role="img"
      aria-label="Logo Mbee Cafe"
      className={cn("size-10 shrink-0 rounded-full", className)}
    >
      <circle cx="24" cy="24" r="24" fill="#017b89" />
      {/* bulu domba */}
      <g fill="#ffffff">
        <circle cx="16" cy="17" r="6" />
        <circle cx="24" cy="13.5" r="6.5" />
        <circle cx="32" cy="17" r="6" />
        <circle cx="13.5" cy="25" r="5" />
        <circle cx="34.5" cy="25" r="5" />
      </g>
      {/* telinga */}
      <ellipse cx="12" cy="29" rx="4" ry="2.2" fill="#3b2f2a" transform="rotate(-20 12 29)" />
      <ellipse cx="36" cy="29" rx="4" ry="2.2" fill="#3b2f2a" transform="rotate(20 36 29)" />
      {/* wajah */}
      <ellipse cx="24" cy="29" rx="8.5" ry="10" fill="#3b2f2a" />
      <circle cx="20.8" cy="27.5" r="1.4" fill="#ffffff" />
      <circle cx="27.2" cy="27.5" r="1.4" fill="#ffffff" />
      <path d="M21 33.5c1.8 1.4 4.2 1.4 6 0" stroke="#ffffff" strokeWidth="1.4" fill="none" strokeLinecap="round" />
      {/* jambul */}
      <circle cx="24" cy="20" r="4" fill="#ffffff" />
    </svg>
  )
}
