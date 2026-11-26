import { Suspense } from "react"

import { LoginScreen } from "@/components/auth/login-screen"

export default function LoginPage() {
  // useSearchParams (?email= dari Voice AI) butuh Suspense saat build statis
  return (
    <Suspense>
      <LoginScreen />
    </Suspense>
  )
}
