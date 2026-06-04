import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const cookieStore = await cookies()
  const authCookie = cookieStore.get("auth_token")
  if (!authCookie || authCookie.value !== "flowtex_demo") return unauthorized()

  const supabase = createClient(cookieStore)
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
  const cookieStore = await cookies()
  const authCookie = cookieStore.get("auth_token")
  if (!authCookie || authCookie.value !== "flowtex_demo") return unauthorized()

  const body = await request.json()
  const supabase = createClient(cookieStore)
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
  const cookieStore = await cookies()
  const authCookie = cookieStore.get("auth_token")
  if (!authCookie || authCookie.value !== "flowtex_demo") return unauthorized()

  const body = await request.json()
  if (!body.file_id) {
    return NextResponse.json({ error: "file_id is required" }, { status: 400 })
  }

  const supabase = createClient(cookieStore)
  const { data, error } = await supabase
    .from("project_files")
    .update({ content: body.content, updated_at: new Date().toISOString() })
    .eq("id", body.file_id)
    .eq("project_id", id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
