import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { decodeSession } from "@/lib/auth"
import { cookies } from "next/headers"

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
}

function forbidden() {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 })
}

export async function GET() {
  const cookieStore = await cookies()
  const authCookie = cookieStore.get("auth_token")
  if (!authCookie) return unauthorized()
  const session = decodeSession(authCookie.value)
  if (!session || session.r !== "admin") return forbidden()

  const supabase = createClient(cookieStore)
  const { data, error } = await supabase
    .from("users")
    .select("id, username, role, created_at")
    .order("created_at", { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(request: NextRequest) {
  const cookieStore = await cookies()
  const authCookie = cookieStore.get("auth_token")
  if (!authCookie) return unauthorized()
  const session = decodeSession(authCookie.value)
  if (!session || session.r !== "admin") return forbidden()

  const { id } = await request.json()
  if (!id) return NextResponse.json({ error: "User ID required" }, { status: 400 })

  const supabase = createClient(cookieStore)
  const { error } = await supabase.from("users").delete().eq("id", id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
