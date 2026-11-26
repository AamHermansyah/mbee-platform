"use client"

import { Eye, EyeOff, KeyRound, Lock } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { toast } from "sonner"

import { FullPageLoader } from "@/components/auth/auth-gate"
import { AUTH_ICON, AUTH_INPUT, AuthIllustration } from "@/components/auth/login-screen"
import { PasswordRequirements } from "@/components/auth/password-requirements"
import { useLogout } from "@/components/layout/account-switcher"
import { BrandWordmark } from "@/components/shared/brand"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ASSISTANT_NAME } from "@/lib/constants/brand"
import { isPasswordPolicyValid } from "@/lib/auth/password-policy"
import { useAccountStore } from "@/lib/stores/account-store"
import { hydrateSession, useCurrentAccount, useSessionStore } from "@/lib/stores/session-store"
import { cn } from "@/lib/utils"

/**
 * Ganti kata sandi wajib untuk akun yang dibuat Voice AI setelah pembayaran di landing.
 * Tampilan dan teks mengikuti app/(auth)/new-password/[token] di mimin-workflow;
 * bedanya tanpa token tautan, karena pengguna sudah masuk dengan kata sandi sementara.
 */

function PasswordField({
  id,
  label,
  value,
  onChange,
  placeholder,
  autoComplete,
  stateClass,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  placeholder: string
  autoComplete: string
  stateClass?: string
}) {
  const [show, setShow] = useState(false)
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id} className="text-sm font-medium">
        {label}
      </Label>
      <div className="group relative">
        <Lock className={AUTH_ICON} />
        <Input
          id={id}
          type={show ? "text" : "password"}
          autoComplete={autoComplete}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(AUTH_INPUT, "pr-11", stateClass)}
          required
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          className="absolute top-1/2 right-3 -translate-y-1/2 rounded p-1 text-slate-500 hover:text-slate-800"
          aria-label={show ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
        >
          {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
    </div>
  )
}

export function NewPasswordScreen() {
  const router = useRouter()
  const hydrated = useSessionStore((s) => s.hydrated)
  const account = useCurrentAccount()
  const changePassword = useAccountStore((s) => s.changePassword)
  const logout = useLogout()

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    void hydrateSession()
  }, [])

  // Halaman ini hanya untuk akun yang masih memakai kata sandi sementara
  useEffect(() => {
    if (!hydrated) return
    if (!account) router.replace("/login")
    else if (!account.mustChangePassword) router.replace(account.home)
  }, [hydrated, account, router])

  if (!hydrated || !account || !account.mustChangePassword) return <FullPageLoader />

  const isPasswordValid = isPasswordPolicyValid(password)
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isPasswordValid) return setError("Kata sandi tidak memenuhi persyaratan")
    if (!passwordsMatch) return setError("Password tidak cocok")
    if (password === account.password) return setError("Kata sandi baru harus berbeda dari kata sandi sementara.")
    changePassword(account.id, password)
    toast.success("Password berhasil diubah")
    router.replace(account.home)
  }

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-card py-10">
      <div className="absolute -top-24 -left-10 aspect-video w-[400px] rotate-45 rounded-full bg-primary blur-[200px]" aria-hidden />
      <div className="absolute right-10 -bottom-10 aspect-square w-[300px] rounded-full bg-red-500 blur-[300px]" aria-hidden />

      <div className="relative grid w-full max-w-5xl grid-cols-1 items-center gap-4 px-4 md:grid-cols-2 lg:gap-10">
        <div className="w-full overflow-hidden rounded-xl bg-white shadow-lg ring-1 ring-border md:max-w-md">
          <div className="bg-primary px-8 py-8 text-left text-primary-foreground">
            <h1 className="mb-2 flex flex-wrap items-center gap-2.5 text-2xl font-medium">
              Selamat Datang di
              <BrandWordmark variant="light" />
            </h1>
            <p className="text-sm sm:text-base">Buat Kata Sandi Baru</p>
          </div>

          <form className="grid gap-4 p-6 sm:p-7" onSubmit={handleSubmit}>
            <p className="flex gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
              <KeyRound className="mt-0.5 size-3.5 shrink-0" />
              <span>
                Akun <span className="font-semibold">{account.email}</span> masih memakai kata sandi sementara dari{" "}
                {ASSISTANT_NAME}. Buat kata sandi baru untuk melanjutkan ke dashboard.
              </span>
            </p>

            <PasswordField
              id="password"
              label="Password Baru"
              value={password}
              onChange={(v) => {
                setPassword(v)
                setError("")
              }}
              placeholder="Masukan kata sandi"
              autoComplete="new-password"
            />

            <PasswordRequirements password={password} />

            <div className="grid gap-1.5">
              <PasswordField
                id="confirmPassword"
                label="Konfirmasi Kata Sandi"
                value={confirmPassword}
                onChange={(v) => {
                  setConfirmPassword(v)
                  setError("")
                }}
                placeholder="Masukan ulang kata sandi"
                autoComplete="new-password"
                stateClass={
                  confirmPassword.length === 0
                    ? undefined
                    : passwordsMatch
                      ? "border-green-500 focus-visible:border-green-500"
                      : "border-red-300 focus-visible:border-red-500"
                }
              />
              {confirmPassword.length > 0 && !passwordsMatch && <p className="text-xs text-red-500">Password tidak cocok</p>}
            </div>

            {error && (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
                {error}
              </p>
            )}

            <Button type="submit" className="h-12 w-full text-base font-semibold" disabled={!isPasswordValid || !passwordsMatch}>
              Simpan Kata Sandi Baru
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              Bukan akun Anda?{" "}
              <button type="button" className="text-primary hover:underline" onClick={logout}>
                Keluar
              </button>
            </p>
          </form>
        </div>

        <AuthIllustration />
      </div>
    </div>
  )
}
