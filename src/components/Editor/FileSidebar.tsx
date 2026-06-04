"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Plus, FileCode, X, Pencil, Trash2, Check, Copy } from "lucide-react"
import type { ProjectFile } from "@/types"

interface FileSidebarProps {
  files: ProjectFile[]
  activeFile: ProjectFile | null
  onSelect: (file: ProjectFile) => void
  onAddFile: (name: string) => void
  onRenameFile?: (fileId: string, newName: string) => void
  onDeleteFile?: (fileId: string) => void
  onBack: () => void
  onClose?: () => void
}

export function FileSidebar({ files, activeFile, onSelect, onAddFile, onRenameFile, onDeleteFile, onBack, onClose }: FileSidebarProps) {
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState("")
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState("")
  const [showDeleteId, setShowDeleteId] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim()) return
    const name = newName.endsWith(".tex") ? newName.trim() : `${newName.trim()}.tex`
    onAddFile(name)
    setNewName("")
    setAdding(false)
  }

  const handleRenameSubmit = (fileId: string) => {
    if (!renameValue.trim()) return setRenamingId(null)
    const name = renameValue.endsWith(".tex") ? renameValue.trim() : `${renameValue.trim()}.tex`
    onRenameFile?.(fileId, name)
    setRenamingId(null)
  }

  const handleDelete = (fileId: string) => {
    if (files.length <= 1) return
    onDeleteFile?.(fileId)
    setShowDeleteId(null)
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
              <FileRow
                key={file.id}
                file={file}
                isActive={activeFile?.id === file.id}
                isRenaming={renamingId === file.id}
                renameValue={renameValue}
                showDelete={showDeleteId === file.id}
                isOnlyFile={files.length <= 1}
                onSelect={() => onSelect(file)}
                onStartRename={() => { setRenamingId(file.id); setRenameValue(file.file_name.replace(/\.tex$/, "")) }}
                onRenameChange={setRenameValue}
                onRenameSubmit={() => handleRenameSubmit(file.id)}
                onRenameCancel={() => setRenamingId(null)}
                onShowDelete={() => setShowDeleteId(file.id)}
                onHideDelete={() => setShowDeleteId(null)}
                onDelete={() => handleDelete(file.id)}
              />
            ))}
          </div>
        )}
        {assetFiles.length > 0 && (
          <div>
            <p className="mb-1 px-2 text-xs font-medium text-muted-foreground">Assets</p>
            {assetFiles.map((file) => (
              <FileRow
                key={file.id}
                file={file}
                isActive={activeFile?.id === file.id}
                isRenaming={renamingId === file.id}
                renameValue={renameValue}
                showDelete={showDeleteId === file.id}
                isOnlyFile={files.length <= 1}
                onSelect={() => onSelect(file)}
                onStartRename={() => { setRenamingId(file.id); setRenameValue(file.file_name) }}
                onRenameChange={setRenameValue}
                onRenameSubmit={() => handleRenameSubmit(file.id)}
                onRenameCancel={() => setRenamingId(null)}
                onShowDelete={() => setShowDeleteId(file.id)}
                onHideDelete={() => setShowDeleteId(null)}
                onDelete={() => handleDelete(file.id)}
              />
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

function FileRow({
  file, isActive, isRenaming, renameValue, showDelete, isOnlyFile,
  onSelect, onStartRename, onRenameChange, onRenameSubmit, onRenameCancel,
  onShowDelete, onHideDelete, onDelete,
}: {
  file: ProjectFile
  isActive: boolean
  isRenaming: boolean
  renameValue: string
  showDelete: boolean
  isOnlyFile: boolean
  onSelect: () => void
  onStartRename: () => void
  onRenameChange: (v: string) => void
  onRenameSubmit: () => void
  onRenameCancel: () => void
  onShowDelete: () => void
  onHideDelete: () => void
  onDelete: () => void
}) {
  if (isRenaming) {
    return (
      <form
        onSubmit={(e) => { e.preventDefault(); onRenameSubmit() }}
        className="flex items-center gap-1 rounded-md px-2 py-1"
      >
        <Input
          value={renameValue}
          onChange={(e) => onRenameChange(e.target.value)}
          className="h-7 text-xs"
          autoFocus
          onBlur={onRenameCancel}
          onKeyDown={(e) => e.key === "Escape" && onRenameCancel()}
        />
        <Button type="submit" size="icon" variant="ghost" className="h-7 w-7 shrink-0">
          <Check className="h-3 w-3" />
        </Button>
      </form>
    )
  }

  return (
    <div
      className={`group flex items-center rounded-md px-2 py-1.5 text-sm transition-colors ${
        isActive ? "bg-accent text-accent-foreground" : "hover:bg-accent/50"
      }`}
    >
      <button className="flex min-w-0 flex-1 items-center gap-2 text-left" onClick={onSelect}>
        <FileCode className="h-4 w-4 shrink-0 text-muted-foreground" />
        <span className="truncate">{file.file_name}</span>
      </button>
      <div className="ml-auto flex shrink-0 items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onStartRename} title="Rename">
          <Pencil className="h-3 w-3" />
        </Button>
        {!isOnlyFile && (
          <>
            {showDelete ? (
              <div className="flex items-center gap-0.5">
                <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={onDelete} title="Confirm delete">
                  <Check className="h-3 w-3" />
                </Button>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onHideDelete} title="Cancel">
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={onShowDelete} title="Delete">
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  )
}