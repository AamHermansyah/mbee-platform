import "server-only"

/** Helper kecil untuk route handler data (app/api/tickets, invoices, accounts, auth). */

export async function readJson<T = Record<string, unknown>>(request: Request): Promise<T> {
  return ((await request.json().catch(() => ({}))) ?? {}) as T
}

export function jsonError(error: string, status: number) {
  return Response.json({ error }, { status })
}

/** Membungkus handler: error database dicatat di log server, browser hanya menerima pesan umum. */
export function handle<Args extends unknown[]>(fn: (...args: Args) => Promise<Response>) {
  return async (...args: Args): Promise<Response> => {
    try {
      return await fn(...args)
    } catch (error) {
      console.warn("[db]", error instanceof Error ? error.message : error)
      return jsonError("Database tidak bisa diakses. Coba lagi sebentar.", 503)
    }
  }
}

export const str = (value: unknown, max = 200): string => (typeof value === "string" ? value.trim().slice(0, max) : "")
