const COLORS = [
  "#e06c75", "#61afef", "#98c379", "#d19a66", "#c678dd",
  "#56b6c2", "#f44747", "#569cd6", "#4ec9b0", "#dcdcaa",
  "#9cdcfe", "#ce9178", "#b5cea8", "#6a9955", "#d16969",
]

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function generateColor(): string {
  return pick(COLORS)
}

function decodeCookie(): { u?: string; r?: string } | null {
  try {
    const match = document.cookie.match(/(?:^|;\s*)auth_token=([^;]*)/)
    if (!match) return null
    const raw = atob(match[1].replace(/-/g, "+").replace(/_/g, "/"))
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export interface SessionUser {
  name: string
  color: string
}

export function getSessionUser(): SessionUser {
  if (typeof window === "undefined") return { name: "Guest", color: "#666" }

  const cookie = decodeCookie()
  if (cookie?.u) {
    return { name: cookie.u, color: pick(COLORS) }
  }

  try {
    const stored = localStorage.getItem("flowtex_user")
    if (stored) {
      const parsed = JSON.parse(stored)
      if (parsed && typeof parsed.name === "string" && typeof parsed.color === "string") {
        return parsed
      }
    }
  } catch {
    /* ignore corrupt data */
  }

  const user = { name: "Guest", color: pick(COLORS) }
  localStorage.setItem("flowtex_user", JSON.stringify(user))
  return user
}
