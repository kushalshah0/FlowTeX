import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

const TEXLIVE_API = "https://latex.ytotech.com/builds/sync"

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
}

export async function POST(request: NextRequest) {
  const cookieStore = await cookies()
  const authCookie = cookieStore.get("auth_token")
  if (!authCookie || authCookie.value !== "nexustex_demo") return unauthorized()

  const body = await request.json()
  const { content, files } = body as {
    content: string
    files?: { name: string; content: string }[]
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
