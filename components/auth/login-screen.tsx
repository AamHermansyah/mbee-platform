"use client"

import { Eye, EyeOff, Info, Lock, Mail } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { toast } from "sonner"

import { FullPageLoader } from "@/components/auth/auth-gate"
import { AccountAvatar } from "@/components/layout/account-switcher"
import { BrandWordmark } from "@/components/shared/brand"
import { RiveAvatar } from "@/components/voice/rive-avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DEMO_ACCOUNTS, landingPathFor, type SeedAccount } from "@/lib/auth/accounts"
import { ASSISTANT_NAME, PLATFORM_NAME } from "@/lib/constants/brand"
import { hydrateSession, useCurrentAccount, useSessionStore } from "@/lib/stores/session-store"

export const AUTH_INPUT = "h-12 rounded-lg border-2 border-primary/30 pl-10 text-sm focus-visible:border-primary focus-visible:ring-0"
export const AUTH_ICON = "pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-primary/30 group-focus-within:text-primary"

/** Ilustrasi kanan: avatar Voice AI (mimin memakai ilustrasi robot di posisi ini). Dipakai juga halaman ganti kata sandi. */
export function AuthIllustration() {
  const [active, setActive] = useState(false)
  return (
    <div className="hidden flex-col items-center gap-5 md:flex">
      <div
        className="relative size-[320px] overflow-hidden rounded-full bg-[#6c47b8] ring-8 ring-primary/10"
        onMouseEnter={() => setActive(true)}
        onMouseLeave={() => setActive(false)}
      >
        <div className="absolute inset-0" style={{ transform: "scale(1.76)" }}>
          <RiveAvatar active={active} />
        </div>
      </div>
      <p className="max-w-xs text-center text-sm text-slate-600">
        Kenalan dengan <span className="font-semibold text-primary">{ASSISTANT_NAME}</span>, asisten Voice AI {PLATFORM_NAME} yang siap membantu Anda.
      </p>
    </div>
  )
}

export function LoginScreen() {
  const router = useRouter()
  const hydrated = useSessionStore((s) => s.hydrated)
  const account = useCurrentAccount()
  const login = useSessionStore((s) => s.login)
  // Tautan "Masuk ke Dashboard" dari Voice AI di landing membawa email akun yang baru dibuat
  const invitedEmail = useSearchParams().get("email") ?? ""

  const [email, setEmail] = useState(invitedEmail)
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    void hydrateSession()
  }, [])

  useEffect(() => {
    if (hydrated && account) router.replace(landingPathFor(account))
  }, [hydrated, account, router])

  const [signingIn, setSigningIn] = useState(false)

  const signIn = async (mail: string, pass: string) => {
    if (signingIn) return
    setSigningIn(true)
    setError("")
    let result
    try {
      result = await login(mail, pass)
    } catch {
      setError("Server tidak bisa dihubungi. Coba lagi sebentar.")
      return
    } finally {
      setSigningIn(false)
    }
    if (!result) {
      setError("Email atau kata sandi salah.")
      return
    }
    toast.success(`Masuk sebagai ${result.name}`)
    router.replace(landingPathFor(result))
  }

  const signInAsDemo = (demo: SeedAccount) => {
    setEmail(demo.email)
    setPassword(demo.password)
    setError("")
    void signIn(demo.email, demo.password)
  }

  if (!hydrated || account) return <FullPageLoader />

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-card py-10">
      {/* Latar sama seperti login mimin: dua cahaya buram */}
      <div className="absolute -top-24 -left-10 aspect-video w-[400px] rotate-45 rounded-full bg-primary blur-[200px]" aria-hidden />
      <div className="absolute right-10 -bottom-10 aspect-square w-[300px] rounded-full bg-red-500 blur-[300px]" aria-hidden />

      <div className="relative grid w-full max-w-5xl grid-cols-1 items-center gap-4 px-4 sm:px-6 md:grid-cols-2 lg:gap-10">
        <div className="w-full min-w-0 overflow-hidden rounded-xl bg-white shadow-lg ring-1 ring-border md:max-w-md">
          <div className="bg-primary px-5 py-6 text-left text-primary-foreground sm:px-8 sm:py-8">
            <h1 className="mb-2 flex flex-wrap items-center gap-2.5 text-xl font-medium sm:text-2xl">
              Selamat Datang di
              <BrandWordmark variant="light" />
            </h1>
            <p className="text-sm sm:text-base">Masuk ke Akun Kamu</p>
          </div>

          <form
            className="grid grid-cols-1 gap-4 p-5 sm:p-7"
            onSubmit={(e) => {
              e.preventDefault()
              void signIn(email, password)
            }}
          >
            <div className="grid gap-1.5">
              <Label htmlFor="email" className="text-sm font-medium">Email</Label>
              <div className="group relative">
                <Mail className={AUTH_ICON} />
                <Input
                  id="email"
                  type="email"
                  autoComplete="username"
                  placeholder="nama@perusahaan.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={AUTH_INPUT}
                  required
                />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="password" className="text-sm font-medium">Kata sandi</Label>
              <div className="group relative">
                <Lock className={AUTH_ICON} />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Masukkan kata sandi"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`${AUTH_INPUT} pr-11`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute top-1/2 right-3 -translate-y-1/2 rounded p-1 text-slate-500 hover:text-slate-800"
                  aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  className="text-sm text-primary hover:underline"
                  onClick={() => toast.info("Lupa kata sandi belum tersedia di versi demo.")}
                >
                  Lupa kata sandi?
                </button>
              </div>
            </div>

            {invitedEmail && (
              <p className="flex gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-slate-700">
                <Info className="mt-0.5 size-3.5 shrink-0 text-primary" />
                <span>
                  Akun ini dibuat {ASSISTANT_NAME} setelah pembayaran. Masukkan kata sandi sementara yang dikirim ke email
                  Anda, lalu buat kata sandi baru.
                </span>
              </p>
            )}

            {error && (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
                {error}
              </p>
            )}

            <Button type="submit" className="h-12 w-full text-base font-semibold" disabled={signingIn}>
              {signingIn ? "Memeriksa…" : "Masuk"}
            </Button>

            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="h-px flex-1 bg-border" />
              Atau masuk dengan akun demo
              <span className="h-px flex-1 bg-border" />
            </div>

            <div className="grid grid-cols-1 gap-2">
              {DEMO_ACCOUNTS.map((demo) => (
                <button
                  key={demo.id}
                  type="button"
                  onClick={() => signInAsDemo(demo)}
                  className="flex min-h-14 w-full min-w-0 items-center gap-3 rounded-lg py-2 border-2 border-primary/20 px-3 text-left transition-colors duration-150 hover:border-primary/50 hover:bg-muted"
                >
                  <AccountAvatar account={demo} className="size-9" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-slate-900">
                      {demo.name}
                      <span className="ml-1.5 text-xs font-normal text-slate-500">
                        {demo.role === "client" ? "· klien terdaftar" : "· admin internal"}
                      </span>
                    </span>
                    {/* email dan kata sandi turun baris di layar sempit, tidak terpotong */}
                    <span className="block text-xs break-all text-slate-500">
                      {demo.email} / <span className="whitespace-nowrap">{demo.password}</span>
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </form>
        </div>

        <AuthIllustration />
      </div>
    </div>
  )
}
