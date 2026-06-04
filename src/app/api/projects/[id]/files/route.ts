import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/api-auth"
import { cookies } from "next/headers"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await requireAuth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const supabase = createClient(await cookies())
  const { data, error } = await supabase
    .from("project_files")
    .select("*")
    .eq("project_id", id)
    .order("file_name", { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await requireAuth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json()
  const supabase = createClient(await cookies())
  const { data, error } = await supabase
    .from("project_files")
    .insert({
      project_id: id,
      file_name: body.file_name,
      content: body.content ?? "",
      type: body.type ?? "tex",
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await requireAuth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json()
  if (!body.file_id) {
    return NextResponse.json({ error: "file_id is required" }, { status: 400 })
  }

  const supabase = createClient(await cookies())
  const updateFields: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (body.content !== undefined) updateFields.content = body.content
  if (body.file_name !== undefined) updateFields.file_name = body.file_name

  const { data, error } = await supabase
    .from("project_files")
    .update(updateFields)
    .eq("id", body.file_id)
    .eq("project_id", id)
    .select()
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
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json()
  if (!body.file_id) {
    return NextResponse.json({ error: "file_id is required" }, { status: 400 })
  }

  const supabase = createClient(await cookies())
  const { error } = await supabase
    .from("project_files")
    .delete()
    .eq("id", body.file_id)
    .eq("project_id", id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
