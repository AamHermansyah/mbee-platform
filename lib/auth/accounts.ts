/**
 * Akun demo (tanpa register). Data akun disimpan di Supabase (tabel mbee.accounts, kata sandi berupa hash);
 * daftar di bawah adalah akun bawaan yang di-seed ke database dan ditampilkan sebagai tombol masuk cepat.
 *
 * Ada dua jalur klien:
 * - Klien terdaftar (Mbee Cafe, akun statis di bawah): login dulu, lalu ngobrol dengan Voice AI di dashboard.
 * - Pengunjung landing "/": ngobrol tanpa login, bayar, lalu "backend" membuatkan akun dengan
 *   kata sandi sementara yang wajib diganti saat pertama masuk (lihat lib/stores/account-store.ts).
 *
 * Admin internal memantau tiket di /dashboard/ticket (kanban).
 */
export type Role = "client" | "admin"

export interface DemoAccount {
  id: string
  role: Role
  /** Nama akun/workspace yang tampil di sidebar. */
  name: string
  /** Nama orang yang login (menu profil). */
  personName: string
  email: string
  phone?: string
  home: string
  /** Path yang boleh dibuka akun ini. */
  allowedPaths: string[]
  /** "seed" = akun bawaan demo, "voice_ai" = dibuat setelah pembayaran lewat Voice AI di landing. */
  source: "seed" | "voice_ai"
  /** true selama akun masih memakai kata sandi sementara dari sistem. */
  mustChangePassword?: boolean
  createdAt?: string
}

export const CLIENT_HOME = "/dashboard/get-started"
export const CLIENT_PATHS = ["/dashboard/get-started", "/dashboard/billing"]
export const ADMIN_HOME = "/dashboard/ticket"
/** Halaman ganti kata sandi wajib untuk akun dengan kata sandi sementara. */
export const NEW_PASSWORD_PATH = "/new-password"

/** Akun bawaan + kata sandinya (sudah tercantum di README dan tombol masuk cepat halaman login). */
export interface SeedAccount extends DemoAccount {
  password: string
}

export const DEMO_ACCOUNTS: SeedAccount[] = [
  {
    id: "mbee-cafe",
    role: "client",
    name: "Mbee Cafe",
    personName: "Dimas Ardiansyah",
    email: "halo@mbeecafe.id",
    password: "mbee1234",
    phone: "0812-3456-7890",
    home: CLIENT_HOME,
    allowedPaths: CLIENT_PATHS,
    source: "seed",
  },
  {
    id: "mbee-admin",
    role: "admin",
    name: "Mbee Platform Internal",
    personName: "Admin Mbee",
    email: "admin@mbeeplatform.id",
    password: "admin1234",
    home: ADMIN_HOME,
    allowedPaths: [ADMIN_HOME],
    source: "seed",
  },
]

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export function canAccess(account: DemoAccount, pathname: string): boolean {
  return account.allowedPaths.some((p) => pathname === p || pathname.startsWith(`${p}/`))
}

/** Halaman tujuan setelah login: ganti kata sandi dulu bila masih sementara. */
export function landingPathFor(account: DemoAccount): string {
  return account.mustChangePassword ? NEW_PASSWORD_PATH : account.home
}
