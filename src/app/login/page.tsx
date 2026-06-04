"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowRight } from "lucide-react"

export default function LoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
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

      router.push("/dashboard")
    } catch {
      setError("Connection error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Left — form */}
      <div className="flex w-full items-center justify-center bg-background p-8 md:w-1/2">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight">FlowTex</h1>
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
              <Input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-10"
              />
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

      {/* Right — rendered PDF page */}
      <div className="relative hidden w-1/2 items-center justify-center overflow-hidden bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 md:flex">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(255,255,255,0.03),transparent_70%)]" />
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-gradient-to-br from-primary/20 to-transparent blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-gradient-to-tr from-blue-500/10 to-transparent blur-3xl" />

        <div className="relative z-10 flex flex-col items-center gap-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs text-zinc-400">
            Real-time collaboration · Live preview · TeXLive 2026
          </div>

          {/* Stacked pages */}
          <div className="relative h-[380px] w-72">
            {/* Back page */}
            <div className="absolute top-2 left-2 aspect-[210/297] w-full rotate-6 rounded-sm border border-white/5 bg-white/80 p-6 shadow-lg">
              <div className="text-[9px] text-zinc-300">
                <div className="text-center text-xs font-bold tracking-tight">References</div>
              </div>
            </div>

            {/* Front page */}
            <div className="absolute inset-0 aspect-[210/297] w-full -rotate-2 rounded-sm bg-white p-6 shadow-2xl shadow-black/40 transition-transform hover:rotate-0">
              <div className="h-full text-[9px] leading-normal text-black">
                <div className="mb-2 text-center text-xs font-bold tracking-tight">
                  A Simple Document
                </div>
                <div className="mb-1 text-[8px] font-semibold">John Doe</div>
                <div className="mb-3 text-[8px] font-semibold text-zinc-400">
                  {"\\today"}
                </div>
                <div className="mb-1.5 text-[8px] font-semibold">1 Introduction</div>
                <p className="mb-2 text-[7.5px] leading-relaxed text-zinc-600">
                  This is a collaborative LaTeX document. Multiple users can
                  edit simultaneously with real-time sync.
                </p>
                <div className="mb-1.5 text-[8px] font-semibold">2 Method</div>
                <p className="mb-2 text-[7.5px] leading-relaxed text-zinc-600">
                  The system uses Yjs CRDT for conflict-free replication and
                  compiles via TeXLive 2026.
                </p>
                <div className="mt-4 rounded border border-zinc-200 p-2">
                  <div className="mb-1 text-[7px] font-semibold text-zinc-400">
                    Compiled with FlowTex
                  </div>
                  <div className="flex items-center gap-1 text-[7px] text-zinc-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    Build succeeded (0.4s)
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
