/* eslint-disable @next/next/no-sync-scripts */
import type { Metadata, Viewport } from "next"

import "../globals.css"
import "./landing.css"
import { poppins } from "../fonts/poppins"

/**
 * Root layout landing publik mbee.io (terpisah dari root layout aplikasi di app/(app)).
 * Dibangun dengan skill design-taste-frontend: kit-nya disalin apa adanya ke public/assets dan
 * dimuat sebagai file biasa. Deal halaman ini (tertulis juga di komentar page.tsx):
 * software · hero collage · palet merek klien (start.mjs brand) · Instrument Sans + DM Mono ·
 * nav-mega · footer-statement · close-word · rhythm space · tombol arrow · lit ground sky.
 */

const TITLE = "Mbee Platform: chatbot dan Voice AI untuk layanan pelanggan"
const DESCRIPTION =
  "Mbee Platform menjawab chat WhatsApp, Instagram, email, web, dan telepon pelanggan 24 jam, lalu meneruskannya ke staf Anda saat dibutuhkan."

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    type: "website",
    title: TITLE,
    description: "Chat dan telepon pelanggan dijawab 24 jam, dari pesan pertama sampai urusan selesai.",
    images: [{ url: "/share.jpg", width: 1440, height: 900 }],
  },
  twitter: { card: "summary_large_image" },
  icons: { icon: [{ url: "/assets/mbee-mark.svg", type: "image/svg+xml" }] },
  // <link rel="canonical" href="https://mbee.io/"> menyusul saat domain mbee.io sudah aktif
  other: { "page-type": "software", "site-kind": "software" },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f6f7f9",
}

/* the :root block exactly as `start.mjs brand` printed it (html:root so it wins over layout.css's
   :root wherever Next puts its own stylesheets), plus the dealt pairing's faces, served from
   public/assets/fonts so the build works offline */
const PALETTE = `
@font-face { font-family: "Instrument Sans"; font-style: normal; font-weight: 400 700; font-stretch: 75% 100%; font-display: swap;
  src: url(/assets/fonts/instrument-sans-latin-var.woff2) format("woff2"); }
@font-face { font-family: "DM Mono"; font-style: normal; font-weight: 400; font-display: swap;
  src: url(/assets/fonts/dm-mono-latin-400.woff2) format("woff2"); }
@font-face { font-family: "DM Mono"; font-style: normal; font-weight: 500; font-display: swap;
  src: url(/assets/fonts/dm-mono-latin-500.woff2) format("woff2"); }
html:root {
  --p-bg: #f6f7f9; --p-surface: #eaecee; --p-ink: #282c34; --p-muted: #63676e;
  --p-accent: #017b89; --p-accent-ink: #f6f7f9; --p-action: #017b89; --p-action-ink: #f6f7f9;
  --p-inv-bg: #282c34; --p-inv-surface: #343840; --p-inv-ink: #f6f7f9; --p-inv-muted: #a1a3a8;
  --p-inv-accent: #f6f7f9; --p-inv-accent-ink: #282c34; --p-inv-action: #f6f7f9; --p-inv-action-ink: #282c34;
  --font-display: "Instrument Sans", system-ui, sans-serif;
  --font-text: "Instrument Sans", system-ui, sans-serif;
  --font-mono: "DM Mono", ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace;
  --display-weight: 500;
  --display-tracking: -0.028em;
  --display-tracking-xl: -0.036em;
  --display-stretch: 96%;
  --ly-scale: 1.04;
}`

const KIT_CSS = [
  "/assets/system.css",
  "/assets/ui/cards.css",
  "/assets/motion/motion.css",
  "/assets/backgrounds/backgrounds.css",
  "/assets/layout/layout.css",
  "/assets/icons/icon.css",
  "/assets/ui/base.css",
  "/assets/ui/window/fragment.css",
  "/assets/ui/chat/fragment.css",
  "/assets/ui/voice/fragment.css",
  "/assets/ui/notify/fragment.css",
  "/assets/ui/checklist/fragment.css",
  "/assets/diagrams/diagram.css",
]

const MOMENTS = ["/assets/moments/moments.js", "/assets/moments/lib.js", "/assets/moments/pinned-chapters/moment.js", "/assets/moments/counter-rolls/moment.js"]

export default function SiteRootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="id"
      className={poppins.variable}
      data-type="software"
      data-radius="soft"
      data-ground="sky"
      data-buttons="arrow"
      data-motion=""
      suppressHydrationWarning
    >
      <head>
        <link rel="preload" href="/assets/fonts/instrument-sans-latin-var.woff2" as="font" type="font/woff2" crossOrigin="" />
        {KIT_CSS.map((href) => (
          <link key={href} rel="stylesheet" href={href} />
        ))}
        <style dangerouslySetInnerHTML={{ __html: PALETTE }} />
        {/* the hero's entrance: the words wait for motion.js instead of flashing (motion.md) */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "document.documentElement.classList.add('m-enter');setTimeout(()=>document.documentElement.classList.add('m-enter-done'),700)",
          }}
        />
        <script src="/assets/backgrounds/backgrounds.js" />
        <script
          dangerouslySetInnerHTML={{
            __html:
              "document.documentElement.classList.add('mo-js');setTimeout(()=>document.documentElement.classList.add('mo-safe'),2500)",
          }}
        />
        {MOMENTS.map((href) => (
          <link key={href} rel="modulepreload" href={href} />
        ))}
      </head>
      <body>{children}</body>
    </html>
  )
}
