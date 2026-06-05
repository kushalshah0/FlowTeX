"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, FileCode, FileText, FileImage, File, Folder, ChevronRight, ChevronDown, X, Pencil, Trash2, Check, Upload, MoreHorizontal, FilePlus, FolderPlus } from "lucide-react"
import type { ProjectFile } from "@/types"

interface FileSidebarProps {
  files: ProjectFile[]
  activeFile: ProjectFile | null
  onSelect: (file: ProjectFile) => void
  onAddFile: (name: string) => void
  onRenameFile?: (fileId: string, newName: string) => void
  onDeleteFile?: (fileId: string) => void
  onClose?: () => void
  projectId?: string
  onUpload?: (file: ProjectFile) => void
}

interface TreeNode {
  name: string
  children: Map<string, TreeNode>
  file: ProjectFile | null
}

function buildTree(files: ProjectFile[]): TreeNode {
  const root: TreeNode = { name: "", children: new Map(), file: null }
  for (const f of files) {
    const parts = f.file_name.split("/")
    let node = root
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]
      const isFile = i === parts.length - 1
      if (!node.children.has(part)) {
        node.children.set(part, {
          name: part,
          children: new Map(),
          file: isFile ? f : null,
        })
      }
      node = node.children.get(part)!
    }
  }
  return root
}

function flattenAndSort(node: TreeNode): TreeNode[] {
  const dirs: TreeNode[] = []
  const files: TreeNode[] = []
  for (const child of node.children.values()) {
    if (child.children.size > 0) {
      dirs.push(child)
    } else {
      files.push(child)
    }
  }
  dirs.sort((a, b) => a.name.localeCompare(b.name))
  files.sort((a, b) => a.name.localeCompare(b.name))
  return [...dirs, ...files]
}

function collectFiles(node: TreeNode): ProjectFile[] {
  const result: ProjectFile[] = []
  if (node.file) result.push(node.file)
  for (const child of node.children.values()) {
    result.push(...collectFiles(child))
  }
  return result
}

export function FileSidebar({ files, activeFile, onSelect, onAddFile, onRenameFile, onDeleteFile, onClose, projectId, onUpload }: FileSidebarProps) {
  const [addingPrefix, setAddingPrefix] = useState<string | null>(null)
  const [newName, setNewName] = useState("")
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState("")
  const [showDeleteId, setShowDeleteId] = useState<string | null>(null)
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const [uploading, setUploading] = useState(false)
  const [menuFolderPath, setMenuFolderPath] = useState<string | null>(null)
  const [renamingFolderPath, setRenamingFolderPath] = useState<string | null>(null)
  const [folderRenameValue, setFolderRenameValue] = useState("")
  const [deletingFolderPath, setDeletingFolderPath] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuFolderPath(null)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim()) return
    const prefix = addingPrefix || ""
    const fullPath = prefix + (newName.endsWith(".tex") ? newName.trim() : `${newName.trim()}.tex`)
    onAddFile(fullPath)
    setNewName("")
    setAddingPrefix(null)
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

  const tree = buildTree(files)
  const sorted = flattenAndSort(tree)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, folderPrefix?: string) => {
    const file = e.target.files?.[0]
    if (!file || !projectId) return
    setUploading(true)
    const formData = new FormData()
    const fileName = (folderPrefix || "") + file.name
    formData.append("file", file)
    formData.append("file_name", fileName)
    try {
      const res = await fetch(`/api/projects/${projectId}/assets`, {
        method: "POST",
        body: formData,
      })
      if (res.ok) {
        const data = await res.json()
        onUpload?.(data)
      }
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const handleFolderUpload = (folderPath: string) => {
    setUploadFolderPrefix(folderPath)
    fileInputRef.current?.click()
  }

  const [uploadFolderPrefix, setUploadFolderPrefix] = useState<string | null>(null)

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleUpload(e, uploadFolderPrefix || undefined)
    setUploadFolderPrefix(null)
  }

  const toggleCollapsed = (path: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(path)) next.delete(path)
      else next.add(path)
      return next
    })
  }

  const getFolderFiles = (node: TreeNode): ProjectFile[] => {
    return collectFiles(node)
  }

  const handleFolderRename = (node: TreeNode, oldPath: string) => {
    const newName = folderRenameValue.trim()
    if (!newName) return
    const files = getFolderFiles(node)
    const parentPath = oldPath.includes("/") ? oldPath.substring(0, oldPath.lastIndexOf("/") + 1) : ""
    for (const f of files) {
      const relativePath = f.file_name.startsWith(oldPath + "/") ? f.file_name.slice((oldPath + "/").length) : (f.file_name === oldPath ? "" : f.file_name)
      const newFileName = parentPath + newName + (relativePath ? "/" + relativePath : "")
      onRenameFile?.(f.id, newFileName)
    }
    setRenamingFolderPath(null)
    setFolderRenameValue("")
  }

  const handleFolderDelete = (node: TreeNode) => {
    const folderFiles = getFolderFiles(node)
    for (const f of folderFiles) {
      onDeleteFile?.(f.id)
    }
    setDeletingFolderPath(null)
  }

  const startAddInFolder = (prefix: string) => {
    setAddingPrefix(prefix)
    setNewName("")
    setMenuFolderPath(null)
  }

  const getFolderPathPrefix = (nodePath: string): string => {
    return nodePath + "/"
  }

  const imageExts = new Set(["png", "jpg", "jpeg", "gif", "svg", "webp", "bmp", "ico"])

  function FilePreview({ file, name }: { file: ProjectFile; name: string }) {
    const ext = name.split(".").pop()?.toLowerCase() || ""
    if (file.type === "asset" && imageExts.has(ext) && file.storage_url) {
      return (
        <img
          src={file.storage_url}
          alt={name}
          className="h-5 w-5 shrink-0 rounded object-cover"
        />
      )
    }
    if (ext === "tex" || ext === "cls" || ext === "sty") {
      return <FileCode className="h-4 w-4 shrink-0 text-muted-foreground" />
    }
    if (ext === "bib") {
      return <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
    }
    if (imageExts.has(ext) || ext === "pdf") {
      return <FileImage className="h-4 w-4 shrink-0 text-muted-foreground" />
    }
    return <File className="h-4 w-4 shrink-0 text-muted-foreground" />
  }

  const renderNode = (node: TreeNode, depth: number, path: string) => {
    const isDir = node.children.size > 0 || (!node.file && node.children.size > 0)
    const isCollapsed = collapsed.has(path)

    if (isDir) {
      const children = flattenAndSort(node)
      const isMenuOpen = menuFolderPath === path
      const isRenaming = renamingFolderPath === path
      const isDeleting = deletingFolderPath === path
      const prefix = getFolderPathPrefix(path)

      if (isRenaming) {
        return (
          <div key={path}>
            <form
              onSubmit={(e) => { e.preventDefault(); handleFolderRename(node, path) }}
              className="flex items-center gap-2 rounded-md px-2 py-1.5"
              style={{ paddingLeft: `${8 + depth * 16}px` }}
            >
              <Folder className="h-4 w-4 shrink-0 text-muted-foreground" />
              <Input
                value={folderRenameValue}
                onChange={(e) => setFolderRenameValue(e.target.value)}
                className="h-7 text-xs"
                autoFocus
                onBlur={() => setRenamingFolderPath(null)}
                onKeyDown={(e) => e.key === "Escape" && setRenamingFolderPath(null)}
              />
              <Button type="submit" size="icon" variant="ghost" className="h-6 w-6 shrink-0">
                <Check className="h-3 w-3" />
              </Button>
            </form>
            {!isCollapsed && children.map((c) => renderNode(c, depth + 1, `${path}/${c.name}`))}
          </div>
        )
      }

      return (
        <div key={path}>
          <div className="group relative">
            <button
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent/50"
              style={{ paddingLeft: `${8 + depth * 16}px` }}
              onClick={() => toggleCollapsed(path)}
            >
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
              )}
              <Folder className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="truncate text-sm">{node.name}</span>
            </button>
            <div className="absolute right-0 top-0 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={(e) => { e.stopPropagation(); setMenuFolderPath(isMenuOpen ? null : path) }}
              >
                <MoreHorizontal className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {isMenuOpen && (
            <div
              ref={menuRef}
              className="absolute z-50 w-44 rounded-md border bg-popover p-1 shadow-md"
              style={{ marginLeft: `${8 + depth * 16 + 20}px`, marginTop: "-2px" }}
            >
              <button
                className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-xs hover:bg-accent"
                onClick={(e) => { e.stopPropagation(); startAddInFolder(prefix) }}
              >
                <FilePlus className="h-3.5 w-3.5" />
                New File
              </button>
              <button
                className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-xs hover:bg-accent"
                onClick={(e) => { e.stopPropagation(); startAddInFolder(`${prefix}subfolder/`); setMenuFolderPath(null) }}
              >
                <FolderPlus className="h-3.5 w-3.5" />
                New Subfolder
              </button>
              <button
                className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-xs hover:bg-accent"
                onClick={(e) => {
                  e.stopPropagation()
                  setMenuFolderPath(null)
                  setUploadFolderPrefix(prefix)
                  setTimeout(() => fileInputRef.current?.click(), 0)
                }}
              >
                <Upload className="h-3.5 w-3.5" />
                Upload Asset
              </button>
              <div className="my-1 h-px bg-border" />
              <button
                className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-xs hover:bg-accent"
                onClick={(e) => {
                  e.stopPropagation()
                  setRenamingFolderPath(path)
                  setFolderRenameValue(node.name)
                  setMenuFolderPath(null)
                }}
              >
                <Pencil className="h-3.5 w-3.5" />
                Rename
              </button>
              {isDeleting ? (
                <div className="flex items-center gap-1 px-2 py-1">
                  <button
                    className="flex items-center gap-2 rounded-sm px-2 py-1 text-xs text-destructive hover:bg-accent"
                    onClick={(e) => { e.stopPropagation(); handleFolderDelete(node) }}
                  >
                    <Check className="h-3.5 w-3.5" />
                    Confirm
                  </button>
                  <button
                    className="flex items-center gap-2 rounded-sm px-2 py-1 text-xs hover:bg-accent"
                    onClick={(e) => { e.stopPropagation(); setDeletingFolderPath(null) }}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-xs text-destructive hover:bg-accent"
                  onClick={(e) => { e.stopPropagation(); setDeletingFolderPath(path); setMenuFolderPath(null) }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </button>
              )}
            </div>
          )}

          {!isCollapsed && children.map((c) => renderNode(c, depth + 1, `${path}/${c.name}`))}
        </div>
      )
    }

    const file = node.file as ProjectFile

    if (renamingId === file.id) {
      return (
        <form
          key={file.id}
          onSubmit={(e) => { e.preventDefault(); handleRenameSubmit(file.id) }}
          className="flex items-center gap-1 rounded-md px-2 py-1"
          style={{ paddingLeft: `${8 + depth * 16}px` }}
        >
          <Input
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            className="h-7 text-xs"
            autoFocus
            onBlur={() => setRenamingId(null)}
            onKeyDown={(e) => e.key === "Escape" && setRenamingId(null)}
          />
          <Button type="submit" size="icon" variant="ghost" className="h-7 w-7 shrink-0">
            <Check className="h-3 w-3" />
          </Button>
        </form>
      )
    }

    return (
      <div
        key={file.id}
        className={`group flex items-center rounded-md px-2 py-1.5 text-sm transition-colors ${
          activeFile?.id === file.id ? "bg-accent text-accent-foreground" : "hover:bg-accent/50"
        }`}
        style={{ paddingLeft: `${8 + depth * 16}px` }}
      >
        <button className="flex min-w-0 flex-1 items-center gap-2 text-left" onClick={() => onSelect(file)}>
          <FilePreview file={file} name={node.name} />
          <span className="truncate">{node.name}</span>
        </button>
        <div className="ml-auto flex shrink-0 items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { setRenamingId(file.id); setRenameValue(node.name.replace(/\.tex$/, "")) }} title="Rename">
            <Pencil className="h-3 w-3" />
          </Button>
          {files.length > 1 && (
            <>
              {showDeleteId === file.id ? (
                <div className="flex items-center gap-0.5">
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => handleDelete(file.id)} title="Confirm delete">
                    <Check className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowDeleteId(null)} title="Cancel">
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => setShowDeleteId(file.id)} title="Delete">
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col bg-muted/30">
      <div className="flex items-center border-b px-3 py-2">
        <span className="text-sm font-medium">Files</span>
        <div className="ml-auto flex items-center gap-1">
          {addingPrefix !== null ? (
            <form onSubmit={handleSubmit} className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground truncate max-w-24">{addingPrefix}</span>
              <Input
                placeholder="filename.tex"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="h-7 w-28 text-xs"
                autoFocus
                onKeyDown={(e) => e.key === "Escape" && setAddingPrefix(null)}
                onBlur={() => { if (!newName.trim()) setAddingPrefix(null) }}
              />
              <Button type="submit" size="icon" variant="ghost" className="h-6 w-6 shrink-0">
                <Check className="h-3 w-3" />
              </Button>
            </form>
          ) : (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setAddingPrefix("")}
                title="Add File"
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
              {projectId && (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={onFileInputChange}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    disabled={uploading}
                    onClick={() => {
                      setUploadFolderPrefix("")
                      fileInputRef.current?.click()
                    }}
                    title="Upload Asset"
                  >
                    <Upload className="h-3.5 w-3.5" />
                  </Button>
                </>
              )}
              {onClose && (
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {sorted.map((node) => renderNode(node, 0, node.name))}
      </div>
    </div>
  )
}
