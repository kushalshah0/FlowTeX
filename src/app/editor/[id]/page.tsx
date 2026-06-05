"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { Panel, Group as PanelGroup, Separator } from "react-resizable-panels"
import { FileSidebar } from "@/components/Editor/FileSidebar"
import { CodeEditor } from "@/components/Editor/CodeEditor"
import { AssetPreview } from "@/components/Editor/AssetPreview"
import { PdfPreview } from "@/components/Editor/PdfPreview"
import { Button } from "@/components/ui/button"
import { Menu, FileCode, Eye, Share2 } from "lucide-react"
import { Navbar } from "@/components/Navbar"
import { ShareDialog } from "@/components/Editor/ShareDialog"
import type { ProjectFile } from "@/types"

const DEFAULT_TEX = `\\documentclass{article}
\\usepackage{amsmath}

\\title{Hello, FlowTex!}
\\author{User}

\\begin{document}
\\maketitle

\\section{Introduction}
This is a collaborative LaTeX document.
Edit me and press Ctrl+Enter to compile!

\\end{document}
`

type ViewMode = "editor" | "preview"

export default function EditorPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const [files, setFiles] = useState<ProjectFile[]>([])
  const [activeFile, setActiveFile] = useState<ProjectFile | null>(null)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>("editor")
  const [isDesktop, setIsDesktop] = useState(true)
  const [shareOpen, setShareOpen] = useState(false)
  const saveTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())
  const latestContent = useRef<Map<string, string>>(new Map())

  useEffect(() => {
    fetch(`/api/projects/${id}/files`)
      .then((res) => res.json())
      .then(async (data) => {
        if (Array.isArray(data) && data.length > 0) {
          setFiles(data)
          setActiveFile(data[0])
        } else {
          const res = await fetch(`/api/projects/${id}/files`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ file_name: "main.tex", content: DEFAULT_TEX }),
          })
          const file = await res.json()
          if (file.id) {
            setFiles([file])
            setActiveFile(file)
          }
        }
      })
      .finally(() => setLoading(false))
  }, [id])

  const handleAddFile = useCallback(async (name: string) => {
    const res = await fetch(`/api/projects/${id}/files`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ file_name: name, content: "" }),
    })
    const file = await res.json()
    if (file.id) {
      setFiles((prev) => [...prev, file])
      setActiveFile(file)
    }
  }, [id])

  const handleRenameFile = useCallback(async (fileId: string, newName: string) => {
    const res = await fetch(`/api/projects/${id}/files`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ file_id: fileId, file_name: newName }),
    })
    if (!res.ok) return
    const updated = await res.json()
    setFiles((prev) => prev.map((f) => f.id === fileId ? { ...f, file_name: updated.file_name } : f))
    setActiveFile((prev) => prev?.id === fileId ? { ...prev, file_name: updated.file_name } : prev)
  }, [id])

  const handleDeleteFile = useCallback(async (fileId: string) => {
    const res = await fetch(`/api/projects/${id}/files`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ file_id: fileId }),
    })
    if (!res.ok) return
    setFiles((prev) => {
      const next = prev.filter((f) => f.id !== fileId)
      if (activeFile?.id === fileId) setActiveFile(next[0] ?? null)
      return next
    })
  }, [id, activeFile])

  const handleFileUpdate = useCallback((fileId: string, content: string) => {
    latestContent.current.set(fileId, content)

    const existing = saveTimers.current.get(fileId)
    if (existing) clearTimeout(existing)

    const timer = setTimeout(async () => {
      const savedContent = latestContent.current.get(fileId)
      if (savedContent === undefined) return
      await fetch(`/api/projects/${id}/files`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ file_id: fileId, content: savedContent }),
      })
      saveTimers.current.delete(fileId)
    }, 3000)

    saveTimers.current.set(fileId, timer)
  }, [id])

  const handleUpload = useCallback((file: ProjectFile) => {
    setFiles((prev) => [...prev, file])
  }, [])

  useEffect(() => {
    return () => {
      for (const timer of saveTimers.current.values()) {
        clearTimeout(timer)
      }
      saveTimers.current.clear()
    }
  }, [])

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)")
    setIsDesktop(mq.matches)
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches)
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center text-sm text-muted-foreground">
        Loading...
      </div>
    )
  }

  if (!activeFile) {
    return (
      <div className="flex h-screen items-center justify-center text-sm text-muted-foreground">
        No files
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col">
      <Navbar showBack>
        <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs" onClick={() => setShareOpen(true)}>
          <Share2 className="h-3.5 w-3.5" />
          Share
        </Button>
      </Navbar>
      <ShareDialog projectId={id} open={shareOpen} onOpenChange={setShareOpen} />
      <div className="relative flex-1 min-h-0">
        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div className="absolute inset-y-0 left-0 z-10 w-64 bg-background border-r shadow-xl">
              <FileSidebar
                files={files}
                activeFile={activeFile}
                onSelect={(f) => { setActiveFile(f); setSidebarOpen(false) }}
                onAddFile={(name) => { handleAddFile(name); setSidebarOpen(false) }}
                onRenameFile={handleRenameFile}
                onDeleteFile={handleDeleteFile}
                onClose={() => setSidebarOpen(false)}
                projectId={id}
                onUpload={handleUpload}
              />
            </div>
            <div className="absolute inset-0 bg-black/30" onClick={() => setSidebarOpen(false)} />
          </div>
        )}

        {/* Desktop layout */}
        <div className="hidden h-full md:flex">
          <div className="w-64 shrink-0 border-r">
            <FileSidebar
              files={files}
              activeFile={activeFile}
              onSelect={setActiveFile}
              onAddFile={handleAddFile}
              onRenameFile={handleRenameFile}
              onDeleteFile={handleDeleteFile}
              projectId={id}
              onUpload={handleUpload}
            />
          </div>
          <PanelGroup orientation="horizontal">
            <Panel defaultSize={55} minSize={30}>
              {activeFile.type === "asset" ? (
                <AssetPreview key={activeFile.id} file={activeFile} />
              ) : (
                <CodeEditor
                  key={activeFile.id}
                  file={activeFile}
                  onUpdate={handleFileUpdate}
                  active={isDesktop}
                />
              )}
            </Panel>
            <Separator className="group flex w-[5px] cursor-col-resize items-center justify-center bg-transparent hover:bg-muted/50 active:bg-muted transition-colors">
              <div className="h-8 w-[2px] rounded-full bg-border group-hover:bg-ring transition-colors" />
            </Separator>
            <Panel defaultSize={45} minSize={20}>
              <PdfPreview files={files} projectId={id} />
            </Panel>
          </PanelGroup>
        </div>

        {/* Mobile layout */}
        <div className="flex h-full flex-col md:hidden">
          <div className="flex items-center border-b px-2 py-1.5 shrink-0">
            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
              <Menu className="h-4 w-4" />
            </Button>
            <span className="ml-2 text-sm font-medium truncate">{activeFile.file_name}</span>
            <div className="ml-auto flex items-center gap-0.5">
              <Button
                variant={viewMode === "editor" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("editor")}
                className="h-7 w-7 p-0"
              >
                <FileCode className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant={viewMode === "preview" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("preview")}
                className="h-7 w-7 p-0"
              >
                <Eye className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          <div className="flex-1 min-h-0">
            {viewMode === "editor" && activeFile.type === "asset" ? (
              <AssetPreview key={activeFile.id} file={activeFile} />
            ) : viewMode === "editor" ? (
              <CodeEditor
                key={activeFile.id}
                file={activeFile}
                onUpdate={handleFileUpdate}
                active={!isDesktop && viewMode === "editor"}
              />
            ) : (
              <PdfPreview files={files} projectId={id} />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
