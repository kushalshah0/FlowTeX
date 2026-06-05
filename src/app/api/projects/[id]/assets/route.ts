import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireAuth, getUserId, checkProjectAccess, unauthorized, forbidden } from "@/lib/api-auth"
import { cookies } from "next/headers"

const BUCKET = "project-assets"

export async function POST(
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

  const formData = await request.formData()
  const file = formData.get("file") as File | null
  const fileName = formData.get("file_name") as string | null

  if (!file || !fileName) {
    return NextResponse.json({ error: "file and file_name are required" }, { status: 400 })
  }

  const supabase = createClient(await cookies())

  const storagePath = `${id}/${fileName}`
  const buffer = Buffer.from(await file.arrayBuffer())

  let uploadResult
  try {
    uploadResult = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, buffer, {
        contentType: file.type || "application/octet-stream",
        upsert: true,
      })
  } catch (e) {
    return NextResponse.json({ error: `Storage upload threw: ${(e as Error).message}` }, { status: 500 })
  }

  if (uploadResult.error) {
    return NextResponse.json({ error: `Storage error: ${uploadResult.error.message}` }, { status: 500 })
  }

  let publicUrlData
  try {
    publicUrlData = supabase.storage.from(BUCKET).getPublicUrl(storagePath)
  } catch (e) {
    return NextResponse.json({ error: `Public URL error: ${(e as Error).message}` }, { status: 500 })
  }

  let dbResult
  try {
    dbResult = await supabase
      .from("project_files")
      .insert({
        project_id: id,
        file_name: fileName,
        content: null,
        type: "asset",
        storage_url: publicUrlData.data.publicUrl,
      })
      .select()
      .single()
  } catch (e) {
    return NextResponse.json({ error: `DB insert threw: ${(e as Error).message}` }, { status: 500 })
  }

  if (dbResult.error) {
    return NextResponse.json({ error: `DB error: ${dbResult.error.message}` }, { status: 500 })
  }

  return NextResponse.json(dbResult.data, { status: 201 })
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await requireAuth()
  if (!session) return unauthorized()

  const userId = await getUserId(session.u)
  if (!userId) return NextResponse.json({ error: "User not found" }, { status: 404 })

  const access = await checkProjectAccess(id, userId)
  if (!access) return forbidden()

  const supabase = createClient(await cookies())
  const { data, error } = await supabase
    .from("project_files")
    .select("*")
    .eq("project_id", id)
    .eq("type", "asset")
    .order("file_name", { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
