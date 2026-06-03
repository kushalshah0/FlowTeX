"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import * as pdfjs from "pdfjs-dist"
import type { PDFDocumentLoadingTask, PDFDocumentProxy } from "pdfjs-dist"
import { compileLatex } from "@/lib/compile"
import { Button } from "@/components/ui/button"
import { ZoomIn, ZoomOut, ChevronLeft, ChevronRight, Download, Play, Terminal, Loader2, Eye } from "lucide-react"
import type { ProjectFile } from "@/types"

pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs"

interface PdfPreviewProps {
  files: ProjectFile[]
}

interface TextItem {
  str: string
  tx: number
  ty: number
  width: number
  height: number
}

export function PdfPreview({ files }: PdfPreviewProps) {
  const [logs, setLogs] = useState<string[]>([])
  const [compiling, setCompiling] = useState(false)
  const [numPages, setNumPages] = useState(0)
  const [scale, setScale] = useState(1)
  const [editingZoom, setEditingZoom] = useState(false)
  const [zoomValue, setZoomValue] = useState("100")
  const zoomInputRef = useRef<HTMLInputElement>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [showingLogs, setShowingLogs] = useState(false)
  const compilingRef = useRef(false)
  const loadingTaskRef = useRef<PDFDocumentLoadingTask | null>(null)
  const docRef = useRef<PDFDocumentProxy | null>(null)
  const pdfDataRef = useRef<ArrayBuffer | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const textItemsRef = useRef<Record<number, TextItem[]>>({})
  const viewportHeightsRef = useRef<Record<number, number>>({})
  const sourceContentRef = useRef("")
  const scaleRef = useRef(1)
  scaleRef.current = scale

  useEffect(() => {
    if (!docRef.current) return
    let cancelled = false

    const run = async () => {
      const doc = docRef.current
      if (!doc || cancelled) return
      const container = containerRef.current
      if (!container) return

      const count = Math.min(doc.numPages, 100)
      const bufs: HTMLCanvasElement[] = []
      const newTextItems: Record<number, TextItem[]> = {}
      const newViewportHeights: Record<number, number> = {}

      for (let i = 1; i <= count; i++) {
        if (cancelled) break

        try {
          const page = await doc.getPage(i)
          const viewport = page.getViewport({ scale })

          const canvas = document.createElement("canvas")
          canvas.width = viewport.width
          canvas.height = viewport.height
          canvas.className = "mx-auto mb-2 rounded-sm shadow-lg"
          bufs.push(canvas)

          await page.render({
            canvas,
            canvasContext: canvas.getContext("2d")!,
            viewport,
          }).promise

          const vp1 = page.getViewport({ scale: 1 })
          newViewportHeights[i] = vp1.height
          const tc = await page.getTextContent()
          newTextItems[i] = tc.items.map((ti: any) => ({
            str: ti.str,
            tx: ti.transform[4],
            ty: ti.transform[5],
            width: ti.width,
            height: ti.height,
          }))
        } catch {
          break
        }
      }

      if (!cancelled && bufs.length > 0) {
        container.innerHTML = ""
        for (const c of bufs) container.appendChild(c)
        textItemsRef.current = newTextItems
        viewportHeightsRef.current = newViewportHeights
        setCurrentPage(1)
      }
    }

    run()
    return () => { cancelled = true }
  }, [scale, numPages])

  const loadPdf = useCallback(async (data: ArrayBuffer) => {
    if (loadingTaskRef.current) {
      loadingTaskRef.current.destroy()
      loadingTaskRef.current = null
    }
    docRef.current = null
    pdfDataRef.current = null

    try {
      pdfDataRef.current = data.slice(0)
      const loadingTask = pdfjs.getDocument({ data })
      loadingTaskRef.current = loadingTask
      const doc = await loadingTask.promise

      docRef.current = doc
      setNumPages(doc.numPages)
    } catch {
      setLogs((prev) => [...prev, "Failed to load PDF"])
    }
  }, [])

  const handleCompile = useCallback(async (e: CustomEvent) => {
    const { content } = e.detail
    if (!content || compilingRef.current) return

    sourceContentRef.current = content

    compilingRef.current = true
    setCompiling(true)
    const ts = Date.now()
    setNumPages(0)
    if (containerRef.current) containerRef.current.innerHTML = ""

    try {
      const result = await compileLatex(files, content)

      if (result.pdf) {
        await loadPdf(result.pdf)
      }

      if (result.log && !result.log.includes("Compilation succeeded")) {
        const lines = result.log.split("\n").filter(Boolean)
        setLogs((prev) => [...prev, ...lines.slice(-20)])
      }

      const elapsed = ((Date.now() - ts) / 1000).toFixed(1)
      setLogs((prev) => [...prev, `Compilation succeeded (${elapsed}s)`])
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Compilation failed"
      setLogs((prev) => [...prev, message])
    }

    compilingRef.current = false
    setCompiling(false)
  }, [files, loadPdf])

  useEffect(() => {
    if (logs.some((l) => /error|failed/i.test(l))) {
      setShowingLogs(true)
    }
  }, [logs])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const onClick = (e: MouseEvent) => {
      const s = scaleRef.current
      const items = textItemsRef.current
      const heights = viewportHeightsRef.current
      const source = sourceContentRef.current
      if (!source) return

      const canvas = (e.target as HTMLElement).closest("canvas")
      if (!canvas) return

      const childIndex = Array.from(container.children).indexOf(canvas)
      if (childIndex < 0) return
      const pageIdx = childIndex + 1

      const pageItems = items[pageIdx]
      const pageHeight = heights[pageIdx]
      if (!pageItems || !pageHeight) return

      const rect = canvas.getBoundingClientRect()
      const cx = e.clientX - rect.left
      const cy = e.clientY - rect.top

      const pdfX = cx / s
      const pdfY = pageHeight - cy / s

      let best: TextItem | null = null
      let bestDist = Infinity
      for (const item of pageItems) {
        const dx = item.tx - pdfX
        const dy = item.ty - pdfY
        const d = dx * dx + dy * dy
        if (d < bestDist) {
          bestDist = d
          best = item
        }
      }

      if (!best || bestDist > 400) return
      const text = best.str.trim()
      if (!text || text.length < 2) return

      const lines = source.split("\n")
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes(text)) {
          window.dispatchEvent(new CustomEvent("goto-line", { detail: { line: i + 1 } }))
          return
        }
      }
    }

    container.addEventListener("click", onClick)
    return () => container.removeEventListener("click", onClick)
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        const tag = (e.target as HTMLElement)?.tagName
        if (tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable) return
        e.preventDefault()
        setShowingLogs(false)
        window.dispatchEvent(new CustomEvent("request-compile"))
      }
    }
    window.addEventListener("compile-latex", handleCompile as unknown as EventListener)
    window.addEventListener("keydown", onKey)
    return () => {
      window.removeEventListener("compile-latex", handleCompile as unknown as EventListener)
      window.removeEventListener("keydown", onKey)
      if (loadingTaskRef.current) loadingTaskRef.current.destroy()
    }
  }, [handleCompile])

  const zoomIn = () => setScale((s) => Math.min(s + 0.2, 4))
  const zoomOut = () => setScale((s) => Math.max(s - 0.2, 0.4))
  const zoomReset = () => setScale(1)

  const commitZoom = () => {
    setEditingZoom(false)
    const pct = parseInt(zoomValue, 10)
    if (!isNaN(pct) && pct >= 10 && pct <= 400) {
      setScale(pct / 100)
    }
  }

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
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setTimeout(() => URL.revokeObjectURL(url), 10000)
  }

  const hasPdf = numPages > 0

  return (
    <div className="relative flex h-full flex-col bg-muted/10">
      <div className="flex items-center gap-1.5 border-b px-3 py-1 text-xs">
        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => { setShowingLogs(false); window.dispatchEvent(new CustomEvent("request-compile")) }}
            disabled={compiling}
            title="Compile (Cmd+Enter)"
          >
            <Play className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={`h-7 w-7 ${showingLogs ? "bg-accent" : ""}`}
            onClick={() => setShowingLogs(true)}
            title="Show logs"
          >
            <Terminal className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={`h-7 w-7 ${!showingLogs ? "bg-accent" : ""}`}
            onClick={() => setShowingLogs(false)}
            disabled={!hasPdf}
            title="Show preview"
          >
            <Eye className="h-3.5 w-3.5" />
          </Button>
        </div>

        <div className="ml-auto flex items-center gap-0.5">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={zoomOut} disabled={!hasPdf}>
            <ZoomOut className="h-3.5 w-3.5" />
          </Button>
          <input
            ref={zoomInputRef}
            type="text"
            value={editingZoom ? zoomValue : `${Math.round(scale * 100)}%`}
            readOnly={!editingZoom}
            onFocus={() => {
              if (!editingZoom) {
                setZoomValue(Math.round(scale * 100).toString())
                setEditingZoom(true)
              }
            }}
            onChange={(e) => setZoomValue(e.target.value.replace(/\D/g, "").slice(0, 3))}
            onBlur={commitZoom}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                commitZoom()
                e.currentTarget.blur()
              }
              if (e.key === "Escape") {
                setEditingZoom(false)
                setZoomValue(Math.round(scale * 100).toString())
                e.currentTarget.blur()
              }
            }}
            className={`h-7 w-[48px] rounded px-1.5 text-center tabular-nums text-xs outline-hidden ${
              editingZoom
                ? "border bg-background ring-1 ring-ring"
                : "border-none bg-transparent hover:bg-accent cursor-pointer"
            }`}
          />
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={zoomIn} disabled={!hasPdf}>
            <ZoomIn className="h-3.5 w-3.5" />
          </Button>

          <div className="mx-1.5 h-4 w-px bg-border" />

          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => goToPage(currentPage - 1)}
            disabled={!hasPdf || currentPage <= 1}
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
            disabled={!hasPdf || currentPage >= numPages}
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>

          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleDownload} disabled={!hasPdf}>
            <Download className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      <div className={`flex-1 overflow-y-auto ${showingLogs ? "hidden" : ""}`} ref={containerRef} />
      {compiling && (
        <div className={`absolute inset-0 flex items-center justify-center pointer-events-none ${showingLogs ? "hidden" : ""}`}>
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}
      {!hasPdf && !compiling && (
        <div className={`absolute inset-0 flex items-center justify-center pointer-events-none ${showingLogs ? "hidden" : ""}`}>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">No preview yet</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Compile your LaTeX to see the PDF (Cmd/Ctrl + Enter)
            </p>
          </div>
        </div>
      )}
      {showingLogs && (
        <div className="flex-1 overflow-y-auto p-4">
          {logs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No logs yet</p>
          ) : (
            <div className="space-y-1">
              {logs.map((log, i) => (
                <p
                  key={i}
                  className={`font-mono text-xs leading-relaxed ${
                    /error|failed/i.test(log)
                      ? "text-destructive"
                      : "text-muted-foreground"
                  }`}
                >
                  {log}
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
