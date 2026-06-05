"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/ThemeToggle"
import { LogOut, ChevronLeft, FileCode } from "lucide-react"
import { getSessionUser } from "@/lib/session"

interface NavbarProps {
  title?: string
  subtitle?: string
  showBack?: boolean
  backHref?: string
}

export function Navbar({ title = "FlowTex", subtitle, showBack, backHref = "/dashboard" }: NavbarProps) {
  const [name, setName] = useState("")
  const router = useRouter()

  useEffect(() => {
    setName(getSessionUser().name)
  }, [])

  const handleSignOut = () => {
    document.cookie = "auth_token=; path=/; max-age=0"
    router.push("/login")
  }

  return (
    <header className="flex items-center justify-between border-b bg-background px-4 py-3">
      <div className="flex items-center gap-3">
        {showBack && (
          <Button variant="ghost" size="icon" onClick={() => router.push(backHref)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}
        <div className="flex items-center gap-2">
          <FileCode className="h-4 w-4 text-primary" />
          <div>
            <span className="text-sm font-semibold">{title}</span>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">{name}</span>
        <ThemeToggle />
        <Button variant="ghost" size="icon" onClick={handleSignOut}>
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  )
}
