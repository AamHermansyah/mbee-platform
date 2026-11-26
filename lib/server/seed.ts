import "server-only"

import type postgres from "postgres"

import { DEMO_ACCOUNTS } from "@/lib/auth/accounts"
import { sql } from "@/lib/server/db"
import { hashPassword } from "@/lib/server/password"

const SEEDED_KEY = "seeded_v1"

type Tx = postgres.TransactionSql

async function insertSeedAccounts(tx: Tx) {
  for (const account of DEMO_ACCOUNTS) {
    const passwordHash = await hashPassword(account.password)
    await tx`
      insert into mbee.accounts (id, role, name, person_name, email, password_hash, phone, home, allowed_paths, source, must_change_password)
      values (${account.id}, ${account.role}, ${account.name}, ${account.personName}, ${account.email}, ${passwordHash},
              ${account.phone ?? null}, ${account.home}, ${account.allowedPaths}, 'seed', false)
      on conflict (id) do update set
        role = excluded.role, name = excluded.name, person_name = excluded.person_name, email = excluded.email,
        password_hash = excluded.password_hash, phone = excluded.phone, home = excluded.home,
        allowed_paths = excluded.allowed_paths, source = 'seed', must_change_password = false, updated_at = now()
    `
  }
}

/** Isi akun demo (login klien dan admin) sekali saja. Tiket tidak diisi data contoh: papan mulai dari data asli. */
export async function seedIfEmpty(): Promise<void> {
  await sql.begin(async (tx) => {
    await tx`select pg_advisory_xact_lock(hashtext('mbee.seed'))`
    const [done] = await tx`select 1 from mbee.meta where key = ${SEEDED_KEY}`
    if (done) return
    await insertSeedAccounts(tx)
    await tx`insert into mbee.meta (key, value) values (${SEEDED_KEY}, ${new Date().toISOString()})`
  })
}
