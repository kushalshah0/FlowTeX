import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/api-auth"
import { cookies } from "next/headers"

export async function GET() {
  const session = await requireAuth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const supabase = createClient(await cookies())
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const session = await requireAuth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json()
  const supabase = createClient(await cookies())
  const { data, error } = await supabase
    .from("projects")
    .insert({ name: body.name })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
