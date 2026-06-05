import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { decodeSession, type SessionPayload } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

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

export async function getUserId(username: string): Promise<string | null> {
  try {
    const supabase = createClient(await cookies())
    const { data } = await supabase
      .from("users")
      .select("id")
      .eq("username", username)
      .single()
    return data?.id ?? null
  } catch {
    return null
  }
}

type AccessRole = "owner" | "editor" | "viewer"

export async function checkProjectAccess(
  projectId: string,
  userId: string
): Promise<AccessRole | null> {
  try {
    const supabase = createClient(await cookies())
    const { data: project } = await supabase
      .from("projects")
      .select("owner_id")
      .eq("id", projectId)
      .single()
    if (!project?.owner_id) return "owner"
    if (project.owner_id === userId) return "owner"
    const { data: collab } = await supabase
      .from("project_collaborators")
      .select("role")
      .eq("project_id", projectId)
      .eq("user_id", userId)
      .single()
    return collab?.role as AccessRole ?? null
  } catch {
    return null
  }
}
