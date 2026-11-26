/** Pemanggil API data (Supabase lewat route handler app/api/*) dari browser. */

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message)
  }
}

export async function api<T>(path: string, init?: { method?: string; body?: unknown }): Promise<T> {
  const res = await fetch(path, {
    method: init?.method ?? "GET",
    headers: init?.body === undefined ? undefined : { "Content-Type": "application/json" },
    body: init?.body === undefined ? undefined : JSON.stringify(init.body),
    cache: "no-store",
  })
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new ApiError(data.error ?? `Permintaan gagal (${res.status})`, res.status)
  return data
}

/** Interval polling data bersama (kanban admin, riwayat tagihan, daftar akun). */
export const POLL_MS = 2000

/**
 * Menjalankan fn setiap POLL_MS selama tab terlihat, dan langsung sekali saat tab kembali terlihat.
 * Mengganti sinkron antar tab lewat event "storage" (localStorage) di tahap sebelumnya.
 */
export function startPolling(fn: () => Promise<unknown>): () => void {
  let stopped = false
  let running = false
  const tick = () => {
    if (stopped || running || document.visibilityState !== "visible") return
    running = true
    void fn()
      .catch(() => {})
      .finally(() => {
        running = false
      })
  }
  const timer = setInterval(tick, POLL_MS)
  document.addEventListener("visibilitychange", tick)
  return () => {
    stopped = true
    clearInterval(timer)
    document.removeEventListener("visibilitychange", tick)
  }
}

/**
 * Penjaga supaya hasil polling yang berangkat sebelum perubahan lokal selesai tidak menimpa
 * perubahan itu (tampilan sempat "mundur" sesaat).
 */
export function createMutationGuard() {
  let version = 0
  let pending = 0
  return {
    /** Bungkus setiap perubahan ke server. */
    async run<T>(fn: () => Promise<T>): Promise<T> {
      pending += 1
      version += 1
      try {
        return await fn()
      } finally {
        pending -= 1
        version += 1
      }
    },
    /** Ambil data, lalu terapkan hanya bila tidak ada perubahan lokal selama pengambilan. */
    async refresh<T>(load: () => Promise<T>, apply: (data: T) => void): Promise<void> {
      const startedAt = version
      const data = await load()
      if (pending === 0 && version === startedAt) apply(data)
    },
  }
}
