import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireAuth, getUserId, checkProjectAccess, unauthorized, forbidden } from "@/lib/api-auth"
import { cookies } from "next/headers"

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
  if (!access || access === "viewer") return forbidden()

  const body = await request.json()
  if (!body.name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 })
  }

  const supabase = createClient(await cookies())
  const { data, error } = await supabase
    .from("projects")
    .update({ name: body.name, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(
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

  const supabase = createClient(await cookies())
  const { error } = await supabase.from("projects").delete().eq("id", id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
