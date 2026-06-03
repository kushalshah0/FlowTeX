"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import * as pdfjs from "pdfjs-dist"
import type { PDFDocumentLoadingTask } from "pdfjs-dist"
import { compileLatex } from "@/lib/compile"
import type { ProjectFile } from "@/types"

pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs"

interface PdfPreviewProps {
  files: ProjectFile[]
}

export function PdfPreview({ files }: PdfPreviewProps) {
  const [logs, setLogs] = useState<string[]>([])
  const [compiling, setCompiling] = useState(false)
  const [hasPdf, setHasPdf] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const compilingRef = useRef(false)
  const loadingTaskRef = useRef<PDFDocumentLoadingTask | null>(null)

  const renderPdf = useCallback(async (data: ArrayBuffer) => {
    if (loadingTaskRef.current) {
      loadingTaskRef.current.destroy()
      loadingTaskRef.current = null
    }
    if (containerRef.current) {
      containerRef.current.innerHTML = ""
    }

    try {
      const loadingTask = pdfjs.getDocument({ data })
      loadingTaskRef.current = loadingTask
      const doc = await loadingTask.promise
      setHasPdf(true)

      const scale = window.devicePixelRatio > 1 ? 1.5 : 1.8
      const pages = Math.min(doc.numPages, 100)

      for (let i = 1; i <= pages; i++) {
        const page = await doc.getPage(i)
        const viewport = page.getViewport({ scale })

        const canvas = document.createElement("canvas")
        canvas.width = viewport.width
        canvas.height = viewport.height
        canvas.className = "mx-auto mb-2 rounded-sm shadow-lg"

        containerRef.current?.appendChild(canvas)

        await page.render({
          canvas,
          canvasContext: canvas.getContext("2d")!,
          viewport,
        }).promise
      }
    } catch {
      setLogs((prev) => [...prev, "Failed to render PDF"])
    }
  }, [])

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
        await renderPdf(result.pdf)
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
  }, [files, renderPdf])

  useEffect(() => {
    window.addEventListener("compile-latex", handleCompile as unknown as EventListener)
    return () => {
      window.removeEventListener("compile-latex", handleCompile as unknown as EventListener)
      if (loadingTaskRef.current) loadingTaskRef.current.destroy()
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
      <div className="flex-1 overflow-y-auto" ref={containerRef}>
        {!hasPdf && (
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
