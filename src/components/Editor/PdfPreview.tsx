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

interface PageInfo {
  num: number
  width: number
  height: number
}

export function PdfPreview({ files }: PdfPreviewProps) {
  const [logs, setLogs] = useState<string[]>([])
  const [compiling, setCompiling] = useState(false)
  const [pages, setPages] = useState<PageInfo[]>([])
  const compilingRef = useRef(false)
  const loadingTaskRef = useRef<PDFDocumentLoadingTask | null>(null)
  const renderCancelled = useRef(false)
  const canvasRefs = useRef<Map<number, HTMLCanvasElement>>(new Map())
  const drawQueue = useRef<Map<number, (canvas: HTMLCanvasElement) => Promise<void>>>(new Map())

  const renderPdf = useCallback(async (data: ArrayBuffer) => {
    if (loadingTaskRef.current) {
      loadingTaskRef.current.destroy()
      loadingTaskRef.current = null
    }

    renderCancelled.current = false
    drawQueue.current.clear()
    canvasRefs.current.clear()

    try {
      const loadingTask = pdfjs.getDocument({ data })
      loadingTaskRef.current = loadingTask
      const doc = await loadingTask.promise
      if (renderCancelled.current) return

      const scale = window.devicePixelRatio > 1 ? 1.5 : 1.8
      const count = Math.min(doc.numPages, 100)
      const pageInfos: PageInfo[] = []

      for (let i = 1; i <= count; i++) {
        const page = await doc.getPage(i)
        if (renderCancelled.current) break

        const viewport = page.getViewport({ scale })
        pageInfos.push({ num: i, width: viewport.width, height: viewport.height })

        drawQueue.current.set(i, async (canvas: HTMLCanvasElement) => {
          canvas.width = viewport.width
          canvas.height = viewport.height
          await page.render({
            canvas,
            canvasContext: canvas.getContext("2d")!,
            viewport,
          }).promise
        })
      }

      if (!renderCancelled.current) {
        setPages(pageInfos)
      }
    } catch {
      setLogs((prev) => [...prev, "Failed to render PDF"])
    }
  }, [])

  useEffect(() => {
    const queue = drawQueue.current
    for (const [num, draw] of queue) {
      const canvas = canvasRefs.current.get(num)
      if (canvas) draw(canvas)
    }
  }, [pages])

  const handleCompile = useCallback(async (e: CustomEvent) => {
    const { content } = e.detail
    if (!content || compilingRef.current) return

    compilingRef.current = true
    setCompiling(true)
    renderCancelled.current = true
    setPages([])
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
      renderCancelled.current = true
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
      <div className="flex-1 overflow-y-auto p-2">
        {pages.length > 0 ? (
          pages.map((p) => (
            <canvas
              key={p.num}
              ref={(el) => {
                if (el) canvasRefs.current.set(p.num, el)
                else canvasRefs.current.delete(p.num)
              }}
              width={p.width}
              height={p.height}
              className="mx-auto mb-2 rounded-sm shadow-lg"
            />
          ))
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
