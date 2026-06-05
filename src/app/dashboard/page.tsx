"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, FileText, Trash2, Users, MoreHorizontal, Pencil, Share2 } from "lucide-react"
import { Navbar } from "@/components/Navbar"
import { ShareDialog } from "@/components/Editor/ShareDialog"
import type { Project } from "@/types"

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState("")
  const [open, setOpen] = useState(false)
  const [menuProjectId, setMenuProjectId] = useState<string | null>(null)
  const [renameProjectId, setRenameProjectId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState("")
  const [shareProjectId, setShareProjectId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    Promise.all([
      fetch("/api/projects").then((r) => r.json()),
      fetch("/api/auth/me").then((r) => r.json()),
    ]).then(([projectsData, me]) => {
      if (Array.isArray(projectsData)) setProjects(projectsData)
      if (me.id) setUserId(me.id)
    }).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuProjectId(null)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  const createProject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim()) return
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim() }),
    })
    const project = await res.json()
    if (project.id) {
      setProjects((prev) => [project, ...prev])
      setOpen(false)
      setNewName("")
      router.push(`/editor/${project.id}`)
    }
  }

  const renameProject = async (projectId: string) => {
    if (!renameValue.trim()) return
    const res = await fetch(`/api/projects/${projectId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: renameValue.trim() }),
    })
    if (res.ok) {
      const updated = await res.json()
      setProjects((prev) => prev.map((p) => p.id === projectId ? updated : p))
    }
    setRenameProjectId(null)
    setRenameValue("")
  }

  const deleteProject = async (projectId: string) => {
    const res = await fetch(`/api/projects/${projectId}`, { method: "DELETE" })
    if (res.ok) {
      setProjects((prev) => prev.filter((p) => p.id !== projectId))
    }
    setDeleteId(null)
  }

  const owned = projects.filter((p) => !p.owner_id || p.owner_id === userId)
  const shared = projects.filter((p) => p.owner_id && p.owner_id !== userId)

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Projects</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Project
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={createProject}>
              <DialogHeader>
                <DialogTitle>Create Project</DialogTitle>
                <DialogDescription>
                  Give your LaTeX project a name
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <Input
                  placeholder="Project name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  autoFocus
                />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={!newName.trim()}>
                  Create
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
          Loading...
        </div>
      ) : projects.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No projects yet</CardTitle>
            <CardDescription>
              Create your first LaTeX project to get started
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="space-y-8">
          {owned.length > 0 && (
            <div>
              <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                My Projects
              </h3>
              <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {owned.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    isOwner
                    menuOpen={menuProjectId === project.id}
                    isRenaming={renameProjectId === project.id}
                    renameValue={renameValue}
                    isDeleting={deleteId === project.id}
                    onOpen={() => router.push(`/editor/${project.id}`)}
                    onMenuToggle={() => setMenuProjectId(menuProjectId === project.id ? null : project.id)}
                    onStartRename={() => { setRenameProjectId(project.id); setRenameValue(project.name); setMenuProjectId(null) }}
                    onRenameChange={setRenameValue}
                    onRenameSubmit={() => renameProject(project.id)}
                    onRenameCancel={() => setRenameProjectId(null)}
                    onShare={() => { setShareProjectId(project.id); setMenuProjectId(null) }}
                    onShowDelete={() => { setDeleteId(project.id); setMenuProjectId(null) }}
                    onDelete={() => deleteProject(project.id)}
                    onHideDelete={() => setDeleteId(null)}
                    menuRef={menuRef}
                  />
                ))}
              </div>
            </div>
          )}

          {shared.length > 0 && (
            <div>
              <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Users className="h-4 w-4" />
                Shared with me
              </h3>
              <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {shared.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    isOwner={false}
                    menuOpen={false}
                    isRenaming={false}
                    renameValue=""
                    isDeleting={false}
                    onOpen={() => router.push(`/editor/${project.id}`)}
                    onMenuToggle={() => {}}
                    onStartRename={() => {}}
                    onRenameChange={() => {}}
                    onRenameSubmit={() => {}}
                    onRenameCancel={() => {}}
                    onShare={() => {}}
                    onShowDelete={() => {}}
                    onDelete={() => {}}
                    onHideDelete={() => {}}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {shareProjectId && (
        <ShareDialog
          projectId={shareProjectId}
          open={true}
          onOpenChange={(open) => { if (!open) setShareProjectId(null) }}
        />
      )}
      </div>
    </div>
  )
}

function ProjectCard({
  project, isOwner, menuOpen, isRenaming, renameValue, isDeleting,
  onOpen, onMenuToggle, onStartRename, onRenameChange, onRenameSubmit, onRenameCancel,
  onShare, onShowDelete, onDelete, onHideDelete, menuRef,
}: {
  project: Project
  isOwner: boolean
  menuOpen: boolean
  isRenaming: boolean
  renameValue: string
  isDeleting: boolean
  onOpen: () => void
  onMenuToggle: () => void
  onStartRename: () => void
  onRenameChange: (v: string) => void
  onRenameSubmit: () => void
  onRenameCancel: () => void
  onShare: () => void
  onShowDelete: () => void
  onDelete: () => void
  onHideDelete: () => void
  menuRef?: React.RefObject<HTMLDivElement | null>
}) {
  return (
    <Card className="transition-colors hover:border-ring">
      <CardHeader className="cursor-pointer p-3 pb-0" onClick={onOpen}>
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="truncate">{project.name}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3">
        <div className="flex items-center justify-between">
          <p className="truncate text-xs text-muted-foreground">
            Created {new Date(project.created_at).toLocaleDateString()}
          </p>

          {isOwner && isRenaming ? (
            <form
              onSubmit={(e) => { e.preventDefault(); onRenameSubmit() }}
              className="flex items-center gap-1"
            >
              <Input
                value={renameValue}
                onChange={(e) => onRenameChange(e.target.value)}
                className="h-7 w-28 text-xs"
                autoFocus
                onBlur={onRenameCancel}
                onKeyDown={(e) => e.key === "Escape" && onRenameCancel()}
              />
              <Button type="submit" size="icon" variant="ghost" className="h-7 w-7 shrink-0">
                <Pencil className="h-3 w-3" />
              </Button>
            </form>
          ) : isOwner && isDeleting ? (
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={(e) => { e.stopPropagation(); onDelete() }}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); onHideDelete() }}>
                <Trash2 className="h-3.5 w-3.5 opacity-50" />
              </Button>
            </div>
          ) : isOwner && (
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground"
                onClick={(e) => { e.stopPropagation(); onMenuToggle() }}
              >
                <MoreHorizontal className="h-3.5 w-3.5" />
              </Button>
              {menuOpen && (
                <div
                  ref={menuRef}
                  className="absolute right-0 top-full z-50 mt-1 w-36 rounded-md border bg-popover p-1 shadow-md"
                >
                  <button
                    className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-xs hover:bg-accent"
                    onClick={(e) => { e.stopPropagation(); onStartRename() }}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Rename
                  </button>
                  <button
                    className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-xs hover:bg-accent"
                    onClick={(e) => { e.stopPropagation(); onShare() }}
                  >
                    <Share2 className="h-3.5 w-3.5" />
                    Share
                  </button>
                  <div className="my-1 h-px bg-border" />
                  <button
                    className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-xs text-destructive hover:bg-accent"
                    onClick={(e) => { e.stopPropagation(); onShowDelete() }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
