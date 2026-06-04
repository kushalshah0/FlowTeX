import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { decodeSession, type SessionPayload } from "@/lib/auth"

export function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
}

export function forbidden() {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 })
}

export async function requireAuth(): Promise<SessionPayload | null> {
  const cookieStore = await cookies()
  const authCookie = cookieStore.get("auth_token")
  if (!authCookie) return null
  return decodeSession(authCookie.value)
}

export async function requireAdmin(): Promise<SessionPayload | null> {
  const session = await requireAuth()
  if (!session || session.r !== "admin") return null
  return session
}
