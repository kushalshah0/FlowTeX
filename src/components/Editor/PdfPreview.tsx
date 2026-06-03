"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { compileLatex } from "@/lib/compile"
import type { ProjectFile } from "@/types"

interface PdfPreviewProps {
  files: ProjectFile[]
}

export function PdfPreview({ files }: PdfPreviewProps) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [logs, setLogs] = useState<string[]>([])
  const [compiling, setCompiling] = useState(false)
  const pdfRef = useRef<string | null>(null)
  const compilingRef = useRef(false)

  const handleCompile = useCallback(async (e: CustomEvent) => {
    const { content } = e.detail
    if (!content || compilingRef.current) return

    compilingRef.current = true
    setCompiling(true)
    const ts = Date.now()
    setLogs((prev) => [...prev, "Compiling..."])

    try {
      const result = await compileLatex(files, content)

      if (result.pdf) {
        if (pdfRef.current) URL.revokeObjectURL(pdfRef.current)
        const url = URL.createObjectURL(new Blob([result.pdf], { type: "application/pdf" }))
        pdfRef.current = url
        setPdfUrl(url)
      }

      const elapsed = ((Date.now() - ts) / 1000).toFixed(1)
      setLogs((prev) => [
        ...prev,
        ...result.log.split("\n").filter(Boolean).slice(-5),
        `Done in ${elapsed}s`,
      ])
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Compilation failed"
      setLogs((prev) => [...prev, `Error: ${message}`])
    }

    compilingRef.current = false
    setCompiling(false)
  }, [files])

  useEffect(() => {
    window.addEventListener("compile-latex", handleCompile as unknown as EventListener)
    return () => {
      window.removeEventListener("compile-latex", handleCompile as unknown as EventListener)
      if (pdfRef.current) URL.revokeObjectURL(pdfRef.current)
    }
  }, [handleCompile])

  return (
    <div className="flex h-full flex-col bg-muted/10">
      <div className="flex items-center justify-between border-b px-3 py-1.5">
        <span className="text-xs text-muted-foreground">Preview</span>
        {compiling && (
          <span className="text-xs text-muted-foreground animate-pulse">
            Compiling...
          </span>
        )}
      </div>
      <div className="flex-1">
        {pdfUrl ? (
          <iframe
            src={pdfUrl}
            className="h-full w-full"
            title="PDF Preview"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">No preview yet</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Compile your LaTeX to see the PDF (Cmd/Ctrl + Enter)
              </p>
            </div>
          </div>
        )}
      </div>
      {logs.length > 0 && (
        <div className="max-h-32 overflow-y-auto border-t bg-background p-2">
          {logs.map((log, i) => (
            <p key={i} className="font-mono text-xs text-muted-foreground">
              {log}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}
