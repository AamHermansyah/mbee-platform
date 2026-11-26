import localFont from "next/font/local"

/**
 * Poppins disimpan lokal supaya build tetap jalan tanpa internet.
 * Dipakai root layout (app) untuk seluruh dashboard, dan root layout (site)
 * supaya widget Voice AI di landing tetap memakai font platform.
 */
export const poppins = localFont({
  src: [
    { path: "./poppins-latin-300-normal.woff2", weight: "300", style: "normal" },
    { path: "./poppins-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "./poppins-latin-500-normal.woff2", weight: "500", style: "normal" },
    { path: "./poppins-latin-600-normal.woff2", weight: "600", style: "normal" },
    { path: "./poppins-latin-700-normal.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-sans",
  display: "swap",
})
