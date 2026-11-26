import "server-only"

import type postgres from "postgres"

import type { DemoAccount } from "@/lib/auth/accounts"
import { jakartaDateKey } from "@/lib/format"
import { ensureDatabase, sql } from "@/lib/server/db"
import { hashPassword, verifyPassword } from "@/lib/server/password"
import type { Invoice } from "@/lib/stores/billing-store"
import type { IssueReport, JourneyEvent, Ticket, TicketInput, TicketReply } from "@/lib/types"

/**
 * Query data Mbee Platform di Supabase (schema `mbee`). Dipanggil route handler di app/api/*.
 * Kolom snake_case di database, objek camelCase di aplikasi.
 */

type Row = Record<string, unknown>
type Tx = postgres.Sql | postgres.TransactionSql

const iso = (value: unknown): string => (value instanceof Date ? value.toISOString() : String(value))
const isoOrNull = (value: unknown): string | null => (value == null ? null : iso(value))

// ── Tiket ──────────────────────────────────────────────────────────────────────

/** Kolom yang boleh diubah lewat PATCH (id, waktu, dan log diatur server). */
const TICKET_COLUMNS = {
  title: "title",
  template: "template",
  priority: "priority",
  assignee: "assignee",
  accountId: "account_id",
  name: "name",
  email: "email",
  phone: "phone",
  companyName: "company_name",
  products: "products",
  planId: "plan_id",
  issueStatus: "issue_status",
  paymentMethod: "payment_method",
  paymentStatus: "payment_status",
  amount: "amount",
  source: "source",
  dueDate: "due_date",
} as const satisfies Partial<Record<keyof TicketInput, string>>

function rowToTicket(row: Row): Ticket {
  return {
    id: row.id as string,
    title: row.title as string,
    template: row.template as Ticket["template"],
    priority: row.priority as Ticket["priority"],
    assignee: row.assignee as string | null,
    accountId: row.account_id as string | null,
    name: row.name as string,
    email: row.email as string,
    phone: row.phone as string,
    companyName: row.company_name as string,
    products: (row.products as Ticket["products"]) ?? [],
    planId: row.plan_id as Ticket["planId"],
    summary: row.summary as Ticket["summary"],
    issueStatus: row.issue_status as Ticket["issueStatus"],
    paymentMethod: row.payment_method as Ticket["paymentMethod"],
    paymentStatus: row.payment_status as Ticket["paymentStatus"],
    amount: Number(row.amount ?? 0),
    source: row.source as Ticket["source"],
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at),
    dueDate: isoOrNull(row.due_date),
    journey: (row.journey as JourneyEvent[]) ?? [],
    ...(row.report ? { report: row.report as IssueReport } : {}),
    replies: (row.replies as TicketReply[]) ?? [],
  }
}

const json = (tx: Tx, value: unknown) => tx.json(value as postgres.JSONValue)

function pickTicketColumns(tx: Tx, input: Partial<TicketInput>): Row {
  const row: Row = {}
  for (const [key, column] of Object.entries(TICKET_COLUMNS)) {
    const value = input[key as keyof typeof TICKET_COLUMNS]
    if (value !== undefined) row[column] = value
  }
  // Kolom jsonb: diganti utuh (balasan dikirim sebagai daftar lengkap)
  if (input.report !== undefined) row.report = input.report ? json(tx, input.report) : null
  if (input.replies !== undefined) row.replies = json(tx, input.replies ?? [])
  return row
}

/** Baris lengkap untuk insert (dipakai juga oleh seed). */
export function ticketToRow(tx: Tx, ticket: Ticket): Row {
  return {
    ...pickTicketColumns(tx, ticket),
    id: ticket.id,
    summary: json(tx, ticket.summary),
    journey: json(tx, ticket.journey),
    created_at: ticket.createdAt,
    updated_at: ticket.updatedAt,
  }
}

/** Nomor berurutan per hari (zona Jakarta) di dalam transaksi + advisory lock, supaya tidak dobel antar perangkat. */
async function nextSequentialId(tx: Tx, table: "tickets" | "invoices", prefix: string, width: number): Promise<string> {
  await tx`select pg_advisory_xact_lock(hashtext(${`mbee.${table}`}))`
  const rows =
    table === "tickets"
      ? await tx`select id from mbee.tickets where id like ${`${prefix}%`}`
      : await tx`select id from mbee.invoices where id like ${`${prefix}%`}`
  const last = rows.map((r) => Number(String(r.id).slice(prefix.length)) || 0).reduce((max, n) => Math.max(max, n), 0)
  return `${prefix}${String(last + 1).padStart(width, "0")}`
}

export async function listTickets(): Promise<Ticket[]> {
  await ensureDatabase()
  const rows = await sql`select * from mbee.tickets order by updated_at desc`
  return rows.map(rowToTicket)
}

export async function createTicket(input: TicketInput): Promise<Ticket> {
  await ensureDatabase()
  return sql.begin(async (tx) => {
    const now = new Date()
    const ticket: Ticket = {
      ...input,
      id: await nextSequentialId(tx, "tickets", `TKT-${jakartaDateKey(now)}-`, 3),
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      journey: input.journey ?? [],
    }
    const [row] = await tx`insert into mbee.tickets ${tx(ticketToRow(tx, ticket))} returning *`
    return rowToTicket(row)
  })
}

/**
 * Ringkasan digabung (summary || patch) dan log ditambahkan di database, supaya perubahan dari
 * Voice AI dan admin yang berjalan bersamaan tidak saling menimpa.
 */
export async function updateTicket(
  id: string,
  patch: Partial<TicketInput>,
  event?: Omit<JourneyEvent, "at">
): Promise<Ticket | undefined> {
  await ensureDatabase()
  const columns = { ...pickTicketColumns(sql, patch), updated_at: new Date().toISOString() }
  const summaryPatch = patch.summary ? sql`, summary = summary || ${sql.json(patch.summary as unknown as postgres.JSONValue)}` : sql``
  const journeyAppend = event
    ? sql`, journey = journey || ${sql.json([{ ...event, at: new Date().toISOString() }] as unknown as postgres.JSONValue)}`
    : sql``
  const [row] = await sql`
    update mbee.tickets set ${sql(columns)} ${summaryPatch} ${journeyAppend}
    where id = ${id}
    returning *
  `
  return row ? rowToTicket(row) : undefined
}

export async function deleteTicket(id: string): Promise<void> {
  await ensureDatabase()
  await sql`delete from mbee.tickets where id = ${id}`
}

// ── Tagihan ────────────────────────────────────────────────────────────────────

function rowToInvoice(row: Row): Invoice {
  return {
    id: row.id as string,
    accountId: row.account_id as string,
    planId: row.plan_id as Invoice["planId"],
    amount: Number(row.amount ?? 0),
    status: row.status as Invoice["status"],
    method: row.method as Invoice["method"],
    channel: row.channel as string | null,
    failureReason: row.failure_reason as string | null,
    upgradeFrom: row.upgrade_from as Invoice["upgradeFrom"],
    createdAt: iso(row.created_at),
    paidAt: isoOrNull(row.paid_at),
    periodStart: isoOrNull(row.period_start),
    periodEnd: isoOrNull(row.period_end),
  }
}

const INVOICE_COLUMNS = {
  status: "status",
  method: "method",
  channel: "channel",
  failureReason: "failure_reason",
  paidAt: "paid_at",
  periodStart: "period_start",
  periodEnd: "period_end",
} as const satisfies Partial<Record<keyof Invoice, string>>

export async function listInvoices(accountId?: string | null): Promise<Invoice[]> {
  await ensureDatabase()
  const rows = accountId
    ? await sql`select * from mbee.invoices where account_id = ${accountId} order by created_at desc`
    : await sql`select * from mbee.invoices order by created_at desc`
  return rows.map(rowToInvoice)
}

export async function createInvoice(input: Pick<Invoice, "accountId" | "planId" | "amount" | "upgradeFrom">): Promise<Invoice> {
  await ensureDatabase()
  return sql.begin(async (tx) => {
    const now = new Date()
    const id = await nextSequentialId(tx, "invoices", `INV/${jakartaDateKey(now)}/`, 4)
    const [row] = await tx`
      insert into mbee.invoices (id, account_id, plan_id, amount, status, upgrade_from, created_at)
      values (${id}, ${input.accountId}, ${input.planId}, ${Math.round(input.amount)}, 'pending', ${input.upgradeFrom ?? null}, ${now.toISOString()})
      returning *
    `
    return rowToInvoice(row)
  })
}

export async function updateInvoice(id: string, patch: Partial<Invoice>): Promise<Invoice | undefined> {
  await ensureDatabase()
  const columns: Row = {}
  for (const [key, column] of Object.entries(INVOICE_COLUMNS)) {
    const value = patch[key as keyof typeof INVOICE_COLUMNS]
    if (value !== undefined) columns[column] = value
  }
  if (Object.keys(columns).length === 0) {
    const [row] = await sql`select * from mbee.invoices where id = ${id}`
    return row ? rowToInvoice(row) : undefined
  }
  const [row] = await sql`update mbee.invoices set ${sql(columns)} where id = ${id} returning *`
  return row ? rowToInvoice(row) : undefined
}

// ── Akun ───────────────────────────────────────────────────────────────────────

/** Data akun yang boleh sampai ke browser (tanpa hash kata sandi). */
function rowToAccount(row: Row): DemoAccount {
  return {
    id: row.id as string,
    role: row.role as DemoAccount["role"],
    name: row.name as string,
    personName: row.person_name as string,
    email: row.email as string,
    phone: (row.phone as string | null) ?? undefined,
    home: row.home as string,
    allowedPaths: (row.allowed_paths as string[]) ?? [],
    source: row.source as DemoAccount["source"],
    mustChangePassword: Boolean(row.must_change_password),
    createdAt: iso(row.created_at),
  }
}

export async function listAccounts(): Promise<DemoAccount[]> {
  await ensureDatabase()
  const rows = await sql`select * from mbee.accounts order by (source = 'seed') desc, created_at desc`
  return rows.map(rowToAccount)
}

export async function emailTaken(email: string): Promise<boolean> {
  await ensureDatabase()
  const [row] = await sql`select 1 from mbee.accounts where email = ${email.trim().toLowerCase()}`
  return Boolean(row)
}

export async function authenticate(email: string, password: string): Promise<DemoAccount | undefined> {
  await ensureDatabase()
  const [row] = await sql`select * from mbee.accounts where email = ${email.trim().toLowerCase()}`
  if (!row || !(await verifyPassword(password, row.password_hash as string))) return undefined
  return rowToAccount(row)
}

export interface NewAccountInput {
  id: string
  name: string
  personName: string
  email: string
  phone: string
  home: string
  allowedPaths: string[]
  tempPassword: string
}

/** null bila email sudah dipakai akun lain. */
export async function createVoiceAccount(input: NewAccountInput): Promise<DemoAccount | null> {
  await ensureDatabase()
  const passwordHash = await hashPassword(input.tempPassword)
  const [row] = await sql`
    insert into mbee.accounts (id, role, name, person_name, email, password_hash, phone, home, allowed_paths, source, must_change_password)
    values (${input.id}, 'client', ${input.name}, ${input.personName}, ${input.email.trim().toLowerCase()}, ${passwordHash},
            ${input.phone}, ${input.home}, ${input.allowedPaths}, 'voice_ai', true)
    on conflict do nothing
    returning *
  `
  return row ? rowToAccount(row) : null
}

export type ChangePasswordResult = { ok: true; account: DemoAccount } | { ok: false; error: string; status: number }

export async function changePassword(id: string, password: string): Promise<ChangePasswordResult> {
  await ensureDatabase()
  const [row] = await sql`select * from mbee.accounts where id = ${id}`
  if (!row) return { ok: false, error: "Akun tidak ditemukan.", status: 404 }
  if (await verifyPassword(password, row.password_hash as string)) {
    return { ok: false, error: "Kata sandi baru harus berbeda dari kata sandi sementara.", status: 400 }
  }
  const passwordHash = await hashPassword(password)
  const [updated] = await sql`
    update mbee.accounts set password_hash = ${passwordHash}, must_change_password = false, updated_at = now()
    where id = ${id}
    returning *
  `
  return { ok: true, account: rowToAccount(updated) }
}
