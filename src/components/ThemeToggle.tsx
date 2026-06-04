"use client"

import { useState, useEffect } from "react"
import { MoonStar, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const [dark, setDark] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const isDark = document.documentElement.classList.contains("dark")
    setDark(isDark)
  }, [])

  const toggle = () => {
    const next = !dark
    setDark(next)
    document.documentElement.classList.toggle("dark", next)
    localStorage.setItem("theme", next ? "dark" : "light")
  }

  if (!mounted) {
    return <div className="h-9 w-9" />
  }

  return (
    <Button variant="ghost" size="icon" onClick={toggle} title={dark ? "Light mode" : "Dark mode"}>
      <div className="relative h-4 w-4">
        <Sun
          className={`absolute inset-0 h-4 w-4 transition-all duration-300 ${
            dark ? "rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100"
          }`}
        />
        <MoonStar
          className={`absolute inset-0 h-4 w-4 transition-all duration-300 ${
            dark ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-0 opacity-0"
          }`}
        />
      </div>
    </Button>
  )
}
