import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireAuth, getUserId, checkProjectAccess, unauthorized, forbidden } from "@/lib/api-auth"
import { cookies } from "next/headers"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await requireAuth()
  if (!session) return unauthorized()

  const userId = await getUserId(session.u)
  if (!userId) return NextResponse.json({ error: "User not found" }, { status: 404 })

  const access = await checkProjectAccess(id, userId)
  if (!access) return forbidden()

  const supabase = createClient(await cookies())
  const { data, error } = await supabase
    .from("project_collaborators")
    .select("id, user_id, role, created_at, users!inner(username)")
    .eq("project_id", id)
    .order("created_at", { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await requireAuth()
  if (!session) return unauthorized()

  const userId = await getUserId(session.u)
  if (!userId) return NextResponse.json({ error: "User not found" }, { status: 404 })

  const access = await checkProjectAccess(id, userId)
  if (access !== "owner") return forbidden()

  const body = await request.json()
  if (!body.username) {
    return NextResponse.json({ error: "username is required" }, { status: 400 })
  }

  const supabase = createClient(await cookies())

  const { data: targetUser } = await supabase
    .from("users")
    .select("id")
    .eq("username", body.username)
    .single()

  if (!targetUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  const { data, error } = await supabase
    .from("project_collaborators")
    .insert({
      project_id: id,
      user_id: targetUser.id,
      role: body.role ?? "editor",
    })
    .select("id, user_id, role, created_at")
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await requireAuth()
  if (!session) return unauthorized()

  const userId = await getUserId(session.u)
  if (!userId) return NextResponse.json({ error: "User not found" }, { status: 404 })

  const access = await checkProjectAccess(id, userId)
  if (access !== "owner") return forbidden()

  const body = await request.json()
  if (!body.collaborator_id || !body.role) {
    return NextResponse.json({ error: "collaborator_id and role required" }, { status: 400 })
  }

  const supabase = createClient(await cookies())
  const { data, error } = await supabase
    .from("project_collaborators")
    .update({ role: body.role })
    .eq("id", body.collaborator_id)
    .eq("project_id", id)
    .select("id, user_id, role, created_at")
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await requireAuth()
  if (!session) return unauthorized()

  const userId = await getUserId(session.u)
  if (!userId) return NextResponse.json({ error: "User not found" }, { status: 404 })

  const access = await checkProjectAccess(id, userId)
  if (access !== "owner") return forbidden()

  const body = await request.json()
  if (!body.collaborator_id) {
    return NextResponse.json({ error: "collaborator_id is required" }, { status: 400 })
  }

  const supabase = createClient(await cookies())
  const { error } = await supabase
    .from("project_collaborators")
    .delete()
    .eq("id", body.collaborator_id)
    .eq("project_id", id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
