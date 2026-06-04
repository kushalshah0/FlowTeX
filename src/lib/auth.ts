import { randomBytes, scryptSync, timingSafeEqual } from "crypto"

const SALT_LEN = 32
const KEY_LEN = 64

export function hashPassword(password: string): { hash: string; salt: string } {
  const salt = randomBytes(SALT_LEN).toString("hex")
  const hash = scryptSync(password, salt, KEY_LEN).toString("hex")
  return { hash, salt }
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  const derived = scryptSync(password, salt, KEY_LEN)
  const expected = Buffer.from(hash, "hex")
  if (derived.length !== expected.length) return false
  return timingSafeEqual(derived, expected)
}

export interface SessionPayload {
  u: string
  r: "admin" | "user"
}

export function encodeSession(payload: SessionPayload): string {
  return Buffer.from(JSON.stringify(payload)).toString("base64url")
}

export function decodeSession(token: string): SessionPayload | null {
  try {
    const raw = Buffer.from(token, "base64url").toString()
    const parsed = JSON.parse(raw)
    if (typeof parsed.u === "string" && (parsed.r === "admin" || parsed.r === "user")) {
      return parsed as SessionPayload
    }
    return null
  } catch {
    return null
  }
}
