import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { verifyPassword, encodeSession } from "@/lib/auth"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  const { username, password } = await request.json()
  if (!username || !password) {
    return NextResponse.json({ error: "Username and password required" }, { status: 400 })
  }

  const supabase = createClient(await cookies())
  const { data } = await supabase
    .from("users")
    .select("*")
    .eq("username", username)
    .single()

  if (!data || !verifyPassword(password, data.password_hash, data.password_salt)) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
  }

  const token = encodeSession({ u: data.username, r: data.role })
  const res = NextResponse.json({ username: data.username, role: data.role })
  res.cookies.set("auth_token", token, { path: "/", maxAge: 86400 })
  return res
}
