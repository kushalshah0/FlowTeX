"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import * as pdfjs from "pdfjs-dist"
import type { PDFDocumentLoadingTask, PDFDocumentProxy } from "pdfjs-dist"
import { compileLatex } from "@/lib/compile"
import { Button } from "@/components/ui/button"
import { ZoomIn, ZoomOut, ChevronLeft, ChevronRight, Download } from "lucide-react"
import type { ProjectFile } from "@/types"

pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs"

interface PdfPreviewProps {
  files: ProjectFile[]
}

export function PdfPreview({ files }: PdfPreviewProps) {
  const [logs, setLogs] = useState<string[]>([])
  const [compiling, setCompiling] = useState(false)
  const [numPages, setNumPages] = useState(0)
  const [scale, setScale] = useState(1.5)
  const [currentPage, setCurrentPage] = useState(1)
  const compilingRef = useRef(false)
  const loadingTaskRef = useRef<PDFDocumentLoadingTask | null>(null)
  const docRef = useRef<PDFDocumentProxy | null>(null)
  const pdfDataRef = useRef<ArrayBuffer | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!docRef.current) return
    let cancelled = false

    const run = async () => {
      const doc = docRef.current
      if (!doc || cancelled) return
      const container = containerRef.current
      if (!container) return

      container.innerHTML = ""
      const count = Math.min(doc.numPages, 100)

      for (let i = 1; i <= count; i++) {
        if (cancelled) break

        try {
          const page = await doc.getPage(i)
          const viewport = page.getViewport({ scale })

          const canvas = document.createElement("canvas")
          canvas.width = viewport.width
          canvas.height = viewport.height
          canvas.className = "mx-auto mb-2 rounded-sm shadow-lg"

          container.appendChild(canvas)

          await page.render({
            canvas,
            canvasContext: canvas.getContext("2d")!,
            viewport,
          }).promise
        } catch {
          break
        }
      }

      if (!cancelled) setCurrentPage(1)
    }

    run()
    return () => { cancelled = true }
  }, [scale])

  const loadPdf = useCallback(async (data: ArrayBuffer) => {
    if (loadingTaskRef.current) {
      loadingTaskRef.current.destroy()
      loadingTaskRef.current = null
    }
    docRef.current = null
    pdfDataRef.current = null

    try {
      const loadingTask = pdfjs.getDocument({ data })
      loadingTaskRef.current = loadingTask
      const doc = await loadingTask.promise

      docRef.current = doc
      pdfDataRef.current = data
      setNumPages(doc.numPages)
    } catch {
      setLogs((prev) => [...prev, "Failed to load PDF"])
    }
  }, [])

  useEffect(() => {
    if (docRef.current && containerRef.current) {
      containerRef.current.innerHTML = ""
    }
  }, [numPages])

  const handleCompile = useCallback(async (e: CustomEvent) => {
    const { content } = e.detail
    if (!content || compilingRef.current) return

    compilingRef.current = true
    setCompiling(true)
    setNumPages(0)
    if (containerRef.current) containerRef.current.innerHTML = ""
    const ts = Date.now()
    setLogs((prev) => [...prev, "Compiling..."])

    try {
      const result = await compileLatex(files, content)

      if (result.pdf) {
        await loadPdf(result.pdf)
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
  }, [files, loadPdf])

  useEffect(() => {
    window.addEventListener("compile-latex", handleCompile as unknown as EventListener)
    return () => {
      window.removeEventListener("compile-latex", handleCompile as unknown as EventListener)
      if (loadingTaskRef.current) loadingTaskRef.current.destroy()
    }
  }, [handleCompile])

  const zoomIn = () => setScale((s) => Math.min(s + 0.2, 4))
  const zoomOut = () => setScale((s) => Math.max(s - 0.2, 0.4))
  const zoomReset = () => setScale(1.5)

  const goToPage = (num: number) => {
    const target = Math.max(1, Math.min(num, numPages))
    setCurrentPage(target)
    const container = containerRef.current
    if (container) {
      const canvas = container.querySelector<HTMLElement>(`canvas:nth-child(${target})`)
      if (canvas) canvas.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }

  const handleDownload = () => {
    if (!pdfDataRef.current) return
    const blob = new Blob([pdfDataRef.current], { type: "application/pdf" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "output.pdf"
    a.click()
    URL.revokeObjectURL(url)
  }

  const hasPdf = numPages > 0

  return (
    <div className="relative flex h-full flex-col bg-muted/10">
      {hasPdf && (
        <div className="flex items-center gap-1 border-b px-2 py-1 text-xs">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={zoomOut}>
            <ZoomOut className="h-3.5 w-3.5" />
          </Button>
          <button
            onClick={zoomReset}
            className="min-w-[48px] rounded px-1.5 py-0.5 text-center tabular-nums hover:bg-accent"
          >
            {Math.round(scale * 100)}%
          </button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={zoomIn}>
            <ZoomIn className="h-3.5 w-3.5" />
          </Button>

          <div className="mx-2 h-4 w-px bg-border" />

          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage <= 1}
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
          <span className="min-w-[64px] text-center tabular-nums text-muted-foreground">
            {currentPage} / {numPages}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage >= numPages}
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>

          <div className="ml-auto">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleDownload}>
              <Download className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
      <div className="flex-1 overflow-y-auto" ref={containerRef} />
      {!hasPdf && !compiling && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">No preview yet</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Compile your LaTeX to see the PDF (Cmd/Ctrl + Enter)
            </p>
          </div>
        </div>
      )}
      {logs.length > 0 && (
        <div className="max-h-32 shrink-0 overflow-y-auto border-t bg-background p-2">
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
