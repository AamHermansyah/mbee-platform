/**
 * Salinan aturan kata sandi dari mimin-workflow (lib/password-policy.ts, tiket #155).
 * Dipakai halaman ganti kata sandi wajib untuk akun dengan kata sandi sementara.
 */

export const PASSWORD_MIN_LENGTH = 12

export const COMMON_WEAK_PASSWORDS = new Set<string>([
  "password",
  "passw0rd",
  "password1",
  "qwerty",
  "qwerty123",
  "123456",
  "1234567",
  "12345678",
  "123456789",
  "1234567890",
  "111111",
  "000000",
  "abc123",
  "iloveyou",
  "admin",
  "admin123",
  "letmein",
  "welcome",
  "welcome1",
  "monkey",
  "dragon",
  "sunshine",
  "princess",
  "football",
  "mbee",
  "mbee1234",
])

/** Hanya berisi satu karakter berulang, mis. "aaaaaaaaaaaa". */
export function isSingleRepeatedCharacter(value: string): boolean {
  return value.length > 0 && new Set(value).size === 1
}

/** Deret naik/turun berurutan, mis. "123456789012" atau "abcdefghijkl". */
export function isSequentialString(value: string): boolean {
  if (value.length < 3) return false
  let ascending = true
  let descending = true
  for (let i = 1; i < value.length; i++) {
    const diff = value.charCodeAt(i) - value.charCodeAt(i - 1)
    if (diff !== 1) ascending = false
    if (diff !== -1) descending = false
  }
  return ascending || descending
}

/** Jumlah kelas karakter (huruf kecil, besar, angka, simbol) dalam kata sandi. */
export function countCharacterClasses(password: string): number {
  let classCount = 0
  if (/[a-z]/.test(password)) classCount++
  if (/[A-Z]/.test(password)) classCount++
  if (/[0-9]/.test(password)) classCount++
  if (/[^A-Za-z0-9]/.test(password)) classCount++
  return classCount
}

export function isCommonPassword(password: string): boolean {
  return COMMON_WEAK_PASSWORDS.has(password.toLowerCase())
}

export interface PasswordChecks {
  minLength: boolean
  mixedCharacters: boolean
  notWeakPattern: boolean
  notCommon: boolean
}

export function getPasswordChecks(password: string): PasswordChecks {
  return {
    minLength: password.length >= PASSWORD_MIN_LENGTH,
    mixedCharacters: countCharacterClasses(password) >= 2,
    notWeakPattern: password.length > 0 && !isSingleRepeatedCharacter(password) && !isSequentialString(password),
    notCommon: password.length > 0 && !isCommonPassword(password),
  }
}

export function isPasswordPolicyValid(password: string): boolean {
  const checks = getPasswordChecks(password)
  return checks.minLength && checks.mixedCharacters && checks.notWeakPattern && checks.notCommon
}

export type PasswordStrengthLevel = "empty" | "weak" | "fair" | "good" | "strong"

export function getPasswordStrength(password: string): { score: number; level: PasswordStrengthLevel } {
  if (!password) return { score: 0, level: "empty" }
  if (isCommonPassword(password) || isSingleRepeatedCharacter(password) || isSequentialString(password)) {
    return { score: 1, level: "weak" }
  }
  let score = 0
  if (password.length >= PASSWORD_MIN_LENGTH) score++
  if (password.length >= 16) score++
  const classes = countCharacterClasses(password)
  if (classes >= 2) score++
  if (classes >= 3) score++
  const clamped = Math.max(1, Math.min(4, score))
  const level: PasswordStrengthLevel = clamped >= 4 ? "strong" : clamped === 3 ? "good" : clamped === 2 ? "fair" : "weak"
  return { score: clamped, level }
}
