"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Plus, FileCode, X } from "lucide-react"
import type { ProjectFile } from "@/types"

interface FileSidebarProps {
  files: ProjectFile[]
  activeFile: ProjectFile | null
  onSelect: (file: ProjectFile) => void
  onAddFile: (name: string) => void
  onBack: () => void
  onClose?: () => void
}

export function FileSidebar({ files, activeFile, onSelect, onAddFile, onBack, onClose }: FileSidebarProps) {
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim()) return
    const name = newName.endsWith(".tex") ? newName.trim() : `${newName.trim()}.tex`
    onAddFile(name)
    setNewName("")
    setAdding(false)
  }

  const texFiles = files.filter((f) => f.type === "tex")
  const assetFiles = files.filter((f) => f.type === "asset")

  return (
    <div className="flex h-full flex-col bg-muted/30">
      <div className="flex items-center gap-2 border-b px-3 py-2">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm font-medium">Files</span>
        {onClose && (
          <Button variant="ghost" size="icon" className="ml-auto" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {texFiles.length > 0 && (
          <div className="mb-3">
            <p className="mb-1 px-2 text-xs font-medium text-muted-foreground">TeX Files</p>
            {texFiles.map((file) => (
              <button
                key={file.id}
                onClick={() => onSelect(file)}
                className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors ${
                  activeFile?.id === file.id
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-accent/50"
                }`}
              >
                <FileCode className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="truncate">{file.file_name}</span>
              </button>
            ))}
          </div>
        )}
        {assetFiles.length > 0 && (
          <div>
            <p className="mb-1 px-2 text-xs font-medium text-muted-foreground">Assets</p>
            {assetFiles.map((file) => (
              <button
                key={file.id}
                onClick={() => onSelect(file)}
                className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors ${
                  activeFile?.id === file.id
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-accent/50"
                }`}
              >
                <FileCode className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="truncate">{file.file_name}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="border-t p-2">
        {adding ? (
          <form onSubmit={handleSubmit} className="flex gap-1">
            <Input
              placeholder="file.tex"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="h-8 text-xs"
              autoFocus
            />
            <Button type="submit" size="sm" className="h-8">
              <Plus className="h-3 w-3" />
            </Button>
          </form>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-xs"
            onClick={() => setAdding(true)}
          >
            <Plus className="mr-1 h-3 w-3" />
            Add File
          </Button>
        )}
      </div>
    </div>
  )
}
