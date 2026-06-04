"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, Trash2, LogOut, Shield, UserCog, Eye, EyeOff, FileCode, Pencil } from "lucide-react"
import { ThemeToggle } from "@/components/ThemeToggle"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"

interface User {
  id: string
  username: string
  role: string
  created_at: string
}

const AVATAR_COLORS = [
  "bg-red-500", "bg-blue-500", "bg-emerald-500", "bg-amber-500",
  "bg-purple-500", "bg-pink-500", "bg-cyan-500", "bg-orange-500",
]

function avatarColor(username: string): string {
  let hash = 0
  for (let i = 0; i < username.length; i++) hash = username.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

function initials(name: string): string {
  return name.slice(0, 2).toUpperCase()
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [newUsername, setNewUsername] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [creating, setCreating] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<User | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [editUsername, setEditUsername] = useState("")
  const [editPassword, setEditPassword] = useState("")
  const [editRole, setEditRole] = useState("user")
  const [editShowPassword, setEditShowPassword] = useState(false)
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  const fetchUsers = () => {
    fetch("/api/users")
      .then((res) => {
        if (res.status === 403) router.push("/dashboard")
        return res.json()
      })
      .then((data) => {
        if (Array.isArray(data)) setUsers(data)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchUsers() }, [])

  const createUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setCreating(true)
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: newUsername, password: newPassword, role: "user" }),
    })
    if (!res.ok) {
      const data = await res.json()
      setError(data.error || "Failed to create user")
      setCreating(false)
      return
    }
    setOpen(false)
    setNewUsername("")
    setNewPassword("")
    setCreating(false)
    fetchUsers()
  }

  const confirmDeleteUser = (user: User) => {
    setDeleteTarget(user)
    setDeleteOpen(true)
  }

  const confirmEditUser = (user: User) => {
    setEditTarget(user)
    setEditUsername(user.username)
    setEditRole(user.role)
    setEditPassword("")
    setEditOpen(true)
  }

  const saveUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editTarget) return
    setError("")
    setSaving(true)
    const body: Record<string, unknown> = { id: editTarget.id }
    if (editUsername !== editTarget.username) body.username = editUsername
    if (editRole !== editTarget.role) body.role = editRole
    if (editPassword) body.password = editPassword

    if (Object.keys(body).length === 1) {
      setSaving(false)
      setEditOpen(false)
      return
    }

    const res = await fetch("/api/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      const data = await res.json()
      setError(data.error || "Failed to update user")
      setSaving(false)
      return
    }
    setSaving(false)
    setEditOpen(false)
    setEditTarget(null)
    fetchUsers()
  }

  const deleteUser = async () => {
    if (!deleteTarget) return
    await fetch("/api/users", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: deleteTarget.id }),
    })
    setDeleteOpen(false)
    setDeleteTarget(null)
    fetchUsers()
  }

  const handleSignOut = () => {
    document.cookie = "auth_token=; path=/; max-age=0"
    router.push("/login")
  }

  return (
    <div className="min-h-screen bg-muted/20">
      <header className="border-b bg-background px-6 py-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <div className="flex items-center gap-3">
            <FileCode className="h-4 w-4 text-primary" />
            <div>
              <h1 className="text-sm font-semibold">User Management</h1>
              <p className="text-xs text-muted-foreground">Manage FlowTex accounts</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" size="icon" onClick={handleSignOut} title="Sign out">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-sm text-muted-foreground">Accounts</span>
            {!loading && (
              <span className="rounded-md bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                {users.length}
              </span>
            )}
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg max-w-[calc(100vw-2rem)] rounded-lg">
              <form onSubmit={createUser}>
                <DialogHeader>
                  <DialogTitle>Add User</DialogTitle>
                  <DialogDescription>Create a new user account</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Username</label>
                    <Input placeholder="e.g. johndoe" value={newUsername} onChange={(e) => setNewUsername(e.target.value)} required />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Password</label>
                    <div className="relative">
                      <Input type={showPassword ? "text" : "password"} placeholder="Enter a password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required className="pr-9" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-0 top-0 flex h-full w-9 items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  {error && <p className="text-sm text-destructive">{error}</p>}
                </div>
                <DialogFooter className="flex-col gap-2 sm:flex-row">
                  <Button type="submit" className="w-full sm:w-auto" disabled={creating}>
                    {creating ? (
                      <span className="flex items-center gap-1.5">
                        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        Creating...
                      </span>
                    ) : "Create Account"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
            <DialogContent className="sm:max-w-sm max-w-[calc(100vw-2rem)] rounded-lg">
              <DialogHeader>
                <DialogTitle>Delete User</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete <span className="font-medium text-foreground">{deleteTarget?.username}</span>? This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="flex-col gap-2 sm:flex-row">
                <Button variant="outline" onClick={() => setDeleteOpen(false)} className="w-full sm:w-auto">Cancel</Button>
                <Button variant="destructive" onClick={deleteUser} className="w-full sm:w-auto">Delete</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={editOpen} onOpenChange={setEditOpen}>
            <DialogContent className="sm:max-w-lg max-w-[calc(100vw-2rem)] rounded-lg">
              <form onSubmit={saveUser}>
                <DialogHeader>
                  <DialogTitle>Edit User</DialogTitle>
                  <DialogDescription>Update user details for {editTarget?.username}</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Username</label>
                    <Input value={editUsername} onChange={(e) => setEditUsername(e.target.value)} required />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">New Password</label>
                    <div className="relative">
                      <Input type={editShowPassword ? "text" : "password"} placeholder="Leave blank to keep current" value={editPassword} onChange={(e) => setEditPassword(e.target.value)} className="pr-9" />
                      <button type="button" onClick={() => setEditShowPassword(!editShowPassword)} className="absolute right-0 top-0 flex h-full w-9 items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                        {editShowPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Role</label>
                    <Select value={editRole} onValueChange={setEditRole}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {error && <p className="text-sm text-destructive">{error}</p>}
                </div>
                <DialogFooter className="flex-col gap-2 sm:flex-row">
                  <Button type="button" variant="outline" onClick={() => setEditOpen(false)} className="w-full sm:w-auto">Cancel</Button>
                  <Button type="submit" className="w-full sm:w-auto" disabled={saving}>
                    {saving ? (
                      <span className="flex items-center gap-1.5">
                        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        Saving...
                      </span>
                    ) : "Save Changes"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="flex items-center justify-center rounded-xl border bg-background py-16 text-sm text-muted-foreground">
            Loading...
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border bg-background py-16">
            <UserCog className="mb-3 h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">No users yet</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border bg-background">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/30 text-left text-xs font-medium text-muted-foreground">
                  <th className="px-4 py-3 pl-5">User</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3 pr-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b last:border-0 hover:bg-muted/10 transition-colors">
                    <td className="px-4 py-3 pl-5">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium text-white ${avatarColor(u.username)}`}>
                          {initials(u.username)}
                        </div>
                        <span className="text-sm font-medium">{u.username}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                        u.role === "admin"
                          ? "bg-amber-500/10 text-amber-600"
                          : "bg-muted text-muted-foreground"
                      }`}>
                        {u.role === "admin" && <Shield className="h-3 w-3" />}
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {new Date(u.created_at).toLocaleDateString(undefined, {
                        month: "short", day: "numeric", year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3 pr-5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          onClick={() => confirmEditUser(u)}
                          title="Edit user"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        {u.role !== "admin" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => confirmDeleteUser(u)}
                            title="Delete user"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
