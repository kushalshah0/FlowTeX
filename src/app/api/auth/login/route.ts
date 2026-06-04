import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { verifyPassword, encodeSession, hashPassword } from "@/lib/auth"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  const { username, password } = await request.json()
  if (!username || !password) {
    return NextResponse.json({ error: "Username and password required" }, { status: 400 })
  }

  // Hardcoded fallback for demo — works even if Supabase isn't set up
  if (username === "admin" && password === "password") {
    const token = encodeSession({ u: "admin", r: "admin" })
    const res = NextResponse.json({ username: "admin", role: "admin" })
    res.cookies.set("auth_token", token, { path: "/", maxAge: 86400 })
    return res
  }

  // Try Supabase — auto-seed admin if users table is empty
  try {
    const supabase = createClient(await cookies())
    const { count, error: countErr } = await supabase
      .from("users").select("*", { count: "exact", head: true })
    if (!countErr && count === 0) {
      const { hash, salt } = hashPassword("password")
      await supabase.from("users").insert({
        username: "admin", password_hash: hash, password_salt: salt, role: "admin",
      })
    }

    const { data } = await supabase
      .from("users").select("*").eq("username", username).single()

    if (data && verifyPassword(password, data.password_hash, data.password_salt)) {
      const token = encodeSession({ u: data.username, r: data.role })
      const res = NextResponse.json({ username: data.username, role: data.role })
      res.cookies.set("auth_token", token, { path: "/", maxAge: 86400 })
      return res
    }
  } catch {
    // Supabase unavailable — fallback already handled above
  }

  return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
}
