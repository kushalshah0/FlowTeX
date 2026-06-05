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
    .from("project_shares")
    .select("*")
    .eq("project_id", id)
    .order("created_at", { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await requireAuth()
  if (!session) return unauthorized()

  const userId = await getUserId(session.u)
  if (!userId) return NextResponse.json({ error: "User not found" }, { status: 404 })

  const access = await checkProjectAccess(id, userId)
  if (access !== "owner") return forbidden()

  const body = await _request.json()
  const supabase = createClient(await cookies())
  const { data, error } = await supabase
    .from("project_shares")
    .insert({
      project_id: id,
      role: body.role ?? "viewer",
      expires_at: body.expires_at ?? null,
      created_by: userId,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
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
  if (!body.share_id) {
    return NextResponse.json({ error: "share_id is required" }, { status: 400 })
  }

  const supabase = createClient(await cookies())
  const { error } = await supabase
    .from("project_shares")
    .delete()
    .eq("id", body.share_id)
    .eq("project_id", id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
