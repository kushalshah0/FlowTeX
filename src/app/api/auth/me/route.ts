import { NextResponse } from "next/server"
import { requireAuth, getUserId } from "@/lib/api-auth"

export async function GET() {
  const session = await requireAuth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const id = await getUserId(session.u)
  return NextResponse.json({ username: session.u, role: session.r, id })
}
