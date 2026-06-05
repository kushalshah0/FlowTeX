import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/api-auth"
import { cookies } from "next/headers"

const TEXLIVE_API = "https://latex.ytotech.com/builds/sync"
const INCLUDEGRAPHICS_RE = /\\includegraphics(?:\[[^\]]*\])?\{([^}]+)\}/g

async function resolveAssets(projectId: string): Promise<Map<string, ArrayBuffer>> {
  const supabase = createClient(await cookies())
  const { data: assets } = await supabase
    .from("project_files")
    .select("file_name, storage_url")
    .eq("project_id", projectId)
    .eq("type", "asset")

  if (!assets) return new Map()

  const results = new Map<string, ArrayBuffer>()
  for (const asset of assets) {
    if (!asset.storage_url) continue
    try {
      const res = await fetch(asset.storage_url)
      if (res.ok) {
        results.set(asset.file_name, await res.arrayBuffer())
      }
    } catch {
      // skip unresolvable assets
    }
  }
  return results
}

export async function POST(request: NextRequest) {
  const session = await requireAuth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json()
  const { content, files, project_id } = body as {
    content: string
    files?: { name: string; content: string }[]
    project_id?: string
  }

  const resources: Record<string, unknown>[] = [
    { main: true, content },
  ]

  if (files) {
    for (const f of files) {
      if (f.name !== "main.tex") {
        resources.push({ path: f.name, content: f.content })
      }
    }
  }

  if (project_id) {
    const assetMap = await resolveAssets(project_id)
    const refs = new Set<string>()
    let match: RegExpExecArray | null
    while ((match = INCLUDEGRAPHICS_RE.exec(content)) !== null) {
      const ref = match[1]
      refs.add(ref)
      const withExt = ref.includes(".") ? ref : `${ref}.pdf`
      refs.add(withExt)
    }

    for (const ref of refs) {
      const buffer = assetMap.get(ref)
      if (buffer) {
        resources.push({ path: ref, content: Buffer.from(buffer).toString("base64"), encoding: "base64" })
      }
    }
  }

  const res = await fetch(TEXLIVE_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      compiler: "pdflatex",
      resources,
      options: {
        compiler: {
          bibliography: false,
          halt_on_error: false,
          silent: false,
          force: true,
        },
        response: {
          log_files_on_failure: true,
          commands: false,
        },
      },
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Compilation failed" }))
    return NextResponse.json(err, { status: 422 })
  }

  const pdf = await res.arrayBuffer()
  return new NextResponse(pdf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Length": pdf.byteLength.toString(),
    },
  })
}
