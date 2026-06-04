"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const HARDCODED_USER = "admin"
const HARDCODED_PASS = "password"

export default function LoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const router = useRouter()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (username === HARDCODED_USER && password === HARDCODED_PASS) {
      document.cookie = "auth_token=flowtex_demo; path=/; max-age=86400"
      router.push("/dashboard")
    } else {
      setError("Invalid credentials")
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Sign in to NexusTeX</CardTitle>
          <p className="text-sm text-muted-foreground">Collaborative LaTeX editor</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-3">
            <Input
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            <Button type="submit" className="w-full">
              Sign in
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Demo: admin / password
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
