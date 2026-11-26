import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // Knowledge Voice AI dibaca dari disk oleh route token sesi; pastikan ikut ter-bundle saat deploy (Vercel).
  outputFileTracingIncludes: {
    "/api/voice/session": ["./lib/voice/live/knowledge/**/*"],
  },
}

export default nextConfig
