import "server-only"

import { randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto"
import { promisify } from "node:util"

const scrypt = promisify(scryptCb) as (password: string, salt: Buffer, keylen: number) => Promise<Buffer>

/** Hash kata sandi format "scrypt$<salt hex>$<hash hex>". Kata sandi asli tidak pernah disimpan. */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16)
  const hash = await scrypt(password, salt, 32)
  return `scrypt$${salt.toString("hex")}$${hash.toString("hex")}`
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, saltHex, hashHex] = stored.split("$")
  if (scheme !== "scrypt" || !saltHex || !hashHex) return false
  const expected = Buffer.from(hashHex, "hex")
  const actual = await scrypt(password, Buffer.from(saltHex, "hex"), expected.length)
  return actual.length === expected.length && timingSafeEqual(actual, expected)
}
