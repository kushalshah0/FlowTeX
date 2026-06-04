"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowRight, Users, FileText, BookOpen, Eye, EyeOff } from "lucide-react"
import { ThemeToggle } from "@/components/ThemeToggle"

export default function LoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || "Invalid credentials")
        return
      }

      const { role } = await res.json()
      router.push(role === "admin" ? "/admin/users" : "/dashboard")
    } catch {
      setError("Connection error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen">
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>
      {/* Left — brand */}
      <div className="relative hidden w-1/2 flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 p-12 text-white md:flex">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.03),transparent_70%)]" />
        <div className="pointer-events-none absolute -top-40 -right-40 h-80 w-80 rounded-full bg-gradient-to-br from-primary/20 to-transparent blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-gradient-to-tr from-blue-500/10 to-transparent blur-3xl" />

        <div className="relative z-10 text-center">
          <h1 className="mb-3 text-4xl font-bold tracking-tight">FlowTex</h1>
          <p className="mx-auto max-w-sm text-sm leading-relaxed text-zinc-400">
            Compile LaTeX in real-time, see the PDF instantly, edit together with your team.
          </p>
          <div className="mt-10 grid grid-cols-3 gap-6 text-center">
            <div>
              <Users className="mx-auto mb-2 h-5 w-5 text-zinc-400" />
              <div className="text-sm font-semibold text-white">Real-time</div>
              <div className="mt-1 text-xs text-zinc-500">Sync via CRDT</div>
            </div>
            <div>
              <FileText className="mx-auto mb-2 h-5 w-5 text-zinc-400" />
              <div className="text-sm font-semibold text-white">LaTeX</div>
              <div className="mt-1 text-xs text-zinc-500">TeXLive 2026</div>
            </div>
            <div>
              <BookOpen className="mx-auto mb-2 h-5 w-5 text-zinc-400" />
              <div className="text-sm font-semibold text-white">PDF</div>
              <div className="mt-1 text-xs text-zinc-500">Live Preview</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right — form */}
      <div className="flex w-full items-center justify-center bg-background p-8 md:w-1/2">
        <div className="w-full max-w-sm">
          <div className="mb-8 md:hidden">
            <h1 className="text-2xl font-bold">FlowTex</h1>
            <p className="mt-1 text-sm text-muted-foreground">Collaborative LaTeX editor</p>
          </div>

          <h2 className="text-lg font-semibold">Sign in</h2>
          <p className="mt-1 mb-6 text-sm text-muted-foreground">
            Enter your credentials to continue
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Username</label>
              <Input
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="h-10"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Password</label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-10 pr-9"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}

            <Button type="submit" className="h-10 w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign in"}
              {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
