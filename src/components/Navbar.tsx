"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/ThemeToggle"
import { LogOut, ChevronLeft, Users, FileCode } from "lucide-react"

interface NavbarProps {
  title?: string
  subtitle?: string
  showBack?: boolean
  backHref?: string
}

export function Navbar({ title = "FlowTex", subtitle, showBack, backHref = "/dashboard" }: NavbarProps) {
  const router = useRouter()

  const isAdmin = (() => {
    try {
      const m = document.cookie.match(/(?:^|;\s*)auth_token=([^;]*)/)
      if (!m) return false
      const raw = atob(m[1].replace(/-/g, "+").replace(/_/g, "/"))
      return JSON.parse(raw).r === "admin"
    } catch { return false }
  })()

  const handleSignOut = () => {
    document.cookie = "auth_token=; path=/; max-age=0"
    router.push("/login")
  }

  const compact = showBack || subtitle

  return (
    <header className={`flex items-center justify-between ${compact ? "border-b bg-background px-4 py-3" : "mb-8"}`}>
      <div className="flex items-center gap-3">
        {showBack && (
          <Button variant="ghost" size="icon" onClick={() => router.push(backHref)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}
        {compact ? (
          <div className="flex items-center gap-2">
            <FileCode className="h-4 w-4 text-primary" />
            <div>
              <span className="text-sm font-semibold">{title}</span>
              {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
            </div>
          </div>
        ) : (
          <h1 className="text-2xl font-bold">{title}</h1>
        )}
      </div>
      <div className="flex items-center gap-1">
        {isAdmin && (
          <Button variant="ghost" size="sm" onClick={() => router.push("/admin/users")}>
            <Users className="mr-1.5 h-4 w-4" />
            Users
          </Button>
        )}
        <ThemeToggle />
        <Button variant="ghost" size="icon" onClick={handleSignOut}>
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  )
}
