import type { ProjectFile } from "@/types"

function filesToResources(files: ProjectFile[]): { name: string; content: string }[] {
  return files.map((f) => ({ name: f.file_name, content: f.content ?? "" }))
}

export async function compileLatex(
  files: ProjectFile[],
  mainContent: string
): Promise<{ pdf: ArrayBuffer | null; log: string }> {
  const res = await fetch("/api/compile", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      content: mainContent,
      files: filesToResources(files),
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Compilation failed" }))
    return { pdf: null, log: err.error ?? "Compilation failed" }
  }

  const pdf = await res.arrayBuffer()
  return { pdf, log: "Compilation succeeded" }
}
