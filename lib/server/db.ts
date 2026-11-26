import "server-only"

import postgres from "postgres"

/**
 * Koneksi Postgres (Supabase) dari server saja. Kredensial di DATABASE_URL, tidak pernah ke browser.
 *
 * - Lokal: pooler Supabase port 5432 (session mode) boleh.
 * - Vercel: pakai port 6543 (transaction mode). `prepare: false` wajib untuk mode ini.
 *
 * Semua tabel ada di schema `mbee`, terpisah dari tabel proyek lain di database yang sama.
 */
type Sql = postgres.Sql

const globalForDb = globalThis as unknown as { mbeeSql?: Sql; mbeeSchemaReady?: Promise<void> }

function createClient(): Sql {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error("DATABASE_URL belum diisi (lihat .env.example).")
  const local = /@(localhost|127\.0\.0\.1)[:/]/.test(url)
  return postgres(url, {
    prepare: false,
    ssl: local ? false : "require",
    max: 5,
    idle_timeout: 20,
    connect_timeout: 10,
    onnotice: () => {},
  })
}

/** Satu klien per proses (dev server memakai ulang klien yang sama setelah hot reload). */
export const sql: Sql = globalForDb.mbeeSql ?? (globalForDb.mbeeSql = createClient())

const SCHEMA = /* sql */ `
create schema if not exists mbee;

create table if not exists mbee.accounts (
  id text primary key,
  role text not null check (role in ('client', 'admin')),
  name text not null,
  person_name text not null,
  email text not null unique,
  password_hash text not null,
  phone text,
  home text not null,
  allowed_paths text[] not null default '{}',
  source text not null check (source in ('seed', 'voice_ai')),
  must_change_password boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists mbee.tickets (
  id text primary key,
  title text not null default '',
  template text not null,
  priority text,
  assignee text,
  account_id text,
  name text not null default '',
  email text not null default '',
  phone text not null default '',
  company_name text not null default '',
  products text[] not null default '{}',
  plan_id text,
  summary jsonb not null default '{}'::jsonb,
  issue_status text not null default 'open',
  payment_method text,
  payment_status text,
  amount integer not null default 0,
  source text not null default 'manual',
  due_date timestamptz,
  journey jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
-- Laporan kendala klien dan balasan admin (ditambahkan setelah tabel pertama dibuat)
alter table mbee.tickets add column if not exists report jsonb;
alter table mbee.tickets add column if not exists replies jsonb not null default '[]'::jsonb;
create index if not exists tickets_updated_at_idx on mbee.tickets (updated_at desc);
create index if not exists tickets_account_idx on mbee.tickets (account_id);

create table if not exists mbee.invoices (
  id text primary key,
  account_id text not null,
  plan_id text not null,
  amount integer not null,
  status text not null check (status in ('pending', 'paid', 'failed', 'cancelled')),
  method text,
  channel text,
  failure_reason text,
  upgrade_from text,
  created_at timestamptz not null default now(),
  paid_at timestamptz,
  period_start timestamptz,
  period_end timestamptz
);
create index if not exists invoices_account_idx on mbee.invoices (account_id);

create table if not exists mbee.meta (
  key text primary key,
  value text not null
);

-- Hanya diakses server lewat DATABASE_URL. RLS tanpa policy menutup akses lewat API publik Supabase.
alter table mbee.accounts enable row level security;
alter table mbee.tickets enable row level security;
alter table mbee.invoices enable row level security;
alter table mbee.meta enable row level security;
`

/**
 * Membuat tabel bila belum ada dan mengisi data contoh sekali (ditandai di mbee.meta),
 * supaya tidak perlu langkah migrasi manual. Dijalankan sekali per proses.
 */
export function ensureDatabase(): Promise<void> {
  if (!globalForDb.mbeeSchemaReady) {
    globalForDb.mbeeSchemaReady = (async () => {
      await sql.unsafe(SCHEMA)
      const { seedIfEmpty } = await import("@/lib/server/seed")
      await seedIfEmpty()
    })().catch((error) => {
      globalForDb.mbeeSchemaReady = undefined
      throw error
    })
  }
  return globalForDb.mbeeSchemaReady
}
