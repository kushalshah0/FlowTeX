import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { hashPassword, decodeSession } from "@/lib/auth"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  const cookieStore = await cookies()
  const authCookie = cookieStore.get("auth_token")
  if (!authCookie) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const session = decodeSession(authCookie.value)
  if (!session || session.r !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { username, password, role } = await request.json()
  if (!username || !password) {
    return NextResponse.json({ error: "Username and password required" }, { status: 400 })
  }

  const { hash, salt } = hashPassword(password)
  const supabase = createClient(cookieStore)
  const { data, error } = await supabase
    .from("users")
    .insert({ username, password_hash: hash, password_salt: salt, role: role || "user" })
    .select("id, username, role, created_at")
    .single()

  if (error) {
    if (error.code === "23505") return NextResponse.json({ error: "Username already exists" }, { status: 409 })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
