"use client"

import { useState, useEffect } from "react"
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
import { Plus, FileText } from "lucide-react"
import { Navbar } from "@/components/Navbar"
import type { Project } from "@/types"

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState("")
  const [open, setOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    fetch("/api/projects")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setProjects(data)
      })
      .finally(() => setLoading(false))
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Card
              key={project.id}
              className="cursor-pointer transition-colors hover:border-ring"
              onClick={() => router.push(`/editor/${project.id}`)}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  {project.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  Created {new Date(project.created_at).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      </div>
    </div>
  )
}
