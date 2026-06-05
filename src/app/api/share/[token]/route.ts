import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params

  const supabase = createClient(await cookies())
  const { data, error } = await supabase
    .from("project_shares")
    .select("*, projects(name, owner_id)")
    .eq("token", token)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: "Share link not found" }, { status: 404 })
  }

  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    return NextResponse.json({ error: "Share link has expired" }, { status: 410 })
  }

  return NextResponse.json({
    project_id: data.project_id,
    role: data.role,
    project_name: (data.projects as Record<string, unknown>).name,
  })
}
