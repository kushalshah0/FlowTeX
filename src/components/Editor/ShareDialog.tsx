"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Copy, Link, Trash2, X } from "lucide-react"

interface Collaborator {
  id: string
  user_id: string
  username: string
  role: string
}

interface ShareLink {
  id: string
  token: string
  role: string
  expires_at: string | null
  created_at: string
}

interface ShareDialogProps {
  projectId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ShareDialog({ projectId, open, onOpenChange }: ShareDialogProps) {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([])
  const [shareLinks, setShareLinks] = useState<ShareLink[]>([])
  const [addUsername, setAddUsername] = useState("")
  const [addRole, setAddRole] = useState("editor")
  const [loading, setLoading] = useState(false)
  const [addLoading, setAddLoading] = useState(false)
  const [addError, setAddError] = useState("")

  useEffect(() => {
    if (!open) return
    setLoading(true)
    Promise.all([
      fetch(`/api/projects/${projectId}/collaborators`).then((r) => r.json()),
      fetch(`/api/projects/${projectId}/share`).then((r) => r.json()),
    ]).then(([collabs, shares]) => {
      if (Array.isArray(collabs)) setCollaborators(collabs.map((c: any) => ({ ...c, username: c.users?.username ?? "" })))
      if (Array.isArray(shares)) setShareLinks(shares)
    }).finally(() => setLoading(false))
  }, [open, projectId])

  const addCollaborator = async () => {
    if (!addUsername.trim() || addLoading) return
    setAddLoading(true)
    setAddError("")
    const res = await fetch(`/api/projects/${projectId}/collaborators`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: addUsername.trim(), role: addRole }),
    })
    if (res.ok) {
      const data = await res.json()
      setCollaborators((prev) => [...prev, { ...data, username: addUsername.trim() }])
      setAddUsername("")
    } else {
      const err = await res.json()
      setAddError(err.error || "Failed to add collaborator")
      setTimeout(() => setAddError(""), 2000)
    }
    setAddLoading(false)
  }

  const removeCollaborator = async (collabId: string) => {
    const res = await fetch(`/api/projects/${projectId}/collaborators`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ collaborator_id: collabId }),
    })
    if (res.ok) {
      setCollaborators((prev) => prev.filter((c) => c.id !== collabId))
    }
  }

  const createShareLink = async () => {
    const res = await fetch(`/api/projects/${projectId}/share`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: "viewer" }),
    })
    if (res.ok) {
      const data = await res.json()
      setShareLinks((prev) => [data, ...prev])
    }
  }

  const revokeShareLink = async (shareId: string) => {
    const res = await fetch(`/api/projects/${projectId}/share`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ share_id: shareId }),
    })
    if (res.ok) {
      setShareLinks((prev) => prev.filter((s) => s.id !== shareId))
    }
  }

  const copyShareUrl = (token: string) => {
    const url = `${window.location.origin}/share/${token}`
    navigator.clipboard.writeText(url)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share project</DialogTitle>
          <DialogDescription>Add collaborators or create a share link</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <p className="mb-2 text-sm font-medium">Collaborators</p>
            {loading ? (
              <p className="text-xs text-muted-foreground">Loading...</p>
            ) : collaborators.length === 0 ? (
              <p className="text-xs text-muted-foreground">No collaborators yet</p>
            ) : (
              <div className="space-y-1">
                {collaborators.map((c) => (
                  <div key={c.id} className="flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm">
                    <span className="flex-1 truncate">{c.username}</span>
                    <span className="text-xs text-muted-foreground">{c.role}</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => removeCollaborator(c.id)}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-end gap-2">
            <div className="flex-1">
              <Input
                placeholder="Username"
                value={addUsername}
                onChange={(e) => setAddUsername(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
            <Select value={addRole} onValueChange={setAddRole}>
              <SelectTrigger className="h-8 w-24 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="editor">Editor</SelectItem>
                <SelectItem value="viewer">Viewer</SelectItem>
              </SelectContent>
            </Select>
            <Button size="sm" className="h-8" onClick={addCollaborator} disabled={addLoading}>
              {addLoading ? "Adding..." : "Add"}
            </Button>
          </div>
          {addError && <p className="text-xs text-destructive">{addError}</p>}

          <div className="border-t pt-4">
            <p className="mb-2 text-sm font-medium">Share links</p>
            {shareLinks.length === 0 ? (
              <p className="text-xs text-muted-foreground">No share links yet</p>
            ) : (
              <div className="space-y-1">
                {shareLinks.map((s) => (
                  <div key={s.id} className="flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm">
                    <Link className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <span className="flex-1 truncate text-xs text-muted-foreground">{s.token.slice(0, 12)}...</span>
                    <span className="text-xs text-muted-foreground">{s.role}</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground" onClick={() => copyShareUrl(s.token)} title="Copy link">
                      <Copy className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => revokeShareLink(s.id)} title="Revoke">
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            <Button variant="outline" size="sm" className="mt-2 w-full text-xs" onClick={createShareLink}>
              <Link className="mr-1 h-3 w-3" />
              Create share link
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
