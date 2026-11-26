import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

/** Porting dari mimin-workflow `app/(dashboard)/(home)/_components/dashboard-skeleton.tsx`. */

// Skeleton bawaan (bg-primary/10) bertinta teal; di tema flat dibuat abu netral
export function Bone({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <Skeleton className={cn("bg-slate-200", className)} {...props} />
}
