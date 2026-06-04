"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"

import { Plus, Trash2, ArrowLeft } from "lucide-react"

interface User {
  id: string
  username: string
  role: string
  created_at: string
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [newUsername, setNewUsername] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [newRole, setNewRole] = useState("user")
  const [error, setError] = useState("")
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
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: newUsername, password: newPassword, role: newRole }),
    })
    if (!res.ok) {
      const data = await res.json()
      setError(data.error || "Failed to create user")
      return
    }
    setOpen(false)
    setNewUsername("")
    setNewPassword("")
    setNewRole("user")
    fetchUsers()
  }

  const deleteUser = async (id: string) => {
    if (!confirm("Delete this user?")) return
    await fetch("/api/users", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    })
    fetchUsers()
  }

  return (
    <div className="min-h-screen p-6">
      <header className="mb-8 flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">User Management</h1>
      </header>

      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{users.length} user(s)</p>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={createUser}>
              <DialogHeader>
                <DialogTitle>Add User</DialogTitle>
                <DialogDescription>Create a new user account</DialogDescription>
              </DialogHeader>
              <div className="space-y-3 py-4">
                <Input placeholder="Username" value={newUsername} onChange={(e) => setNewUsername(e.target.value)} required />
                <Input type="password" placeholder="Password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
                {error && <p className="text-sm text-destructive">{error}</p>}
              </div>
              <DialogFooter>
                <Button type="submit">Create</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">Loading...</div>
      ) : (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Users</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="px-4 py-2 font-medium">Username</th>
                  <th className="px-4 py-2 font-medium">Role</th>
                  <th className="px-4 py-2 font-medium">Created</th>
                  <th className="px-4 py-2" />
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b last:border-0">
                    <td className="px-4 py-2">{u.username}</td>
                    <td className="px-4 py-2">
                      <span className={`rounded-full px-2 py-0.5 text-[11px] ${u.role === "admin" ? "bg-amber-500/10 text-amber-500" : "bg-muted text-muted-foreground"}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-muted-foreground">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteUser(u.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
