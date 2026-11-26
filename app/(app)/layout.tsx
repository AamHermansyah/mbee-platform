import type { Metadata } from "next"

import "../globals.css"
import { poppins } from "../fonts/poppins"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

/**
 * Root layout aplikasi (login, ganti kata sandi, dan /dashboard/*).
 * Landing "/" punya root layout sendiri di app/(site) supaya CSS-nya tidak bercampur.
 */
export const metadata: Metadata = {
  title: "Mbee Platform",
  description: "Demo onboarding Voice AI untuk Mbee Cafe di Mbee Platform.",
}

export default function AppRootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="id" className={cn("antialiased font-sans", poppins.variable)}>
      <body>
        <TooltipProvider delayDuration={100}>{children}</TooltipProvider>
        <Toaster position="top-center" />
      </body>
    </html>
  )
}
