import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireAuth, getUserId, unauthorized } from "@/lib/api-auth"
import { cookies } from "next/headers"

export async function GET() {
  const session = await requireAuth()
  if (!session) return unauthorized()

  const supabase = createClient(await cookies())

  // Legacy fallback: if user not in DB (hardcoded admin), return all projects
  const userId = await getUserId(session.u)
  if (!userId) {
    const { data } = await supabase
      .from("projects")
      .select("*")
      .order("created_at", { ascending: false })
    return NextResponse.json(data ?? [])
  }

  const { data: owned } = await supabase
    .from("projects")
    .select("*")
    .eq("owner_id", userId)
    .order("created_at", { ascending: false })

  const { data: collabRows } = await supabase
    .from("project_collaborators")
    .select("project_id")
    .eq("user_id", userId)

  let shared: unknown[] = []
  if (collabRows && collabRows.length > 0) {
    const ids = collabRows.map((r: { project_id: string }) => r.project_id)
    const { data: sharedProjects } = await supabase
      .from("projects")
      .select("*")
      .in("id", ids)
      .order("created_at", { ascending: false })
    shared = sharedProjects ?? []
  }

  const merged = [...(owned ?? [])]
  const ownedIds = new Set(merged.map((p: Record<string, unknown>) => p.id))
  for (const p of shared) {
    if (!ownedIds.has((p as Record<string, unknown>).id as string)) {
      merged.push(p)
    }
  }

  return NextResponse.json(merged)
}

export async function POST(request: NextRequest) {
  const session = await requireAuth()
  if (!session) return unauthorized()

  const body = await request.json()
  const supabase = createClient(await cookies())
  const userId = await getUserId(session.u)

  if (!userId) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  const { data, error } = await supabase
    .from("projects")
    .insert({ name: body.name, owner_id: userId })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
