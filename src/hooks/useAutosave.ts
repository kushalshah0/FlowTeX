"use client"

import { useEffect, useRef, useState } from "react"

type SaveStatus = "saved" | "saving" | "unsaved"

interface UseAutosaveOptions {
  content: string
  onSave: (content: string) => Promise<void>
  delay?: number
}

export function useAutosave({ content, onSave, delay = 5000 }: UseAutosaveOptions) {
  const [status, setStatus] = useState<SaveStatus>("saved")
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastSavedRef = useRef(content)
  const isSavingRef = useRef(false)

  useEffect(() => {
    if (content === lastSavedRef.current) return
    setStatus("unsaved")

    if (timerRef.current) clearTimeout(timerRef.current)

    timerRef.current = setTimeout(async () => {
      if (isSavingRef.current) return
      isSavingRef.current = true
      setStatus("saving")

      try {
        await onSave(content)
        lastSavedRef.current = content
        setStatus("saved")
      } catch {
        setStatus("unsaved")
      }

      isSavingRef.current = false
    }, delay)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [content, onSave, delay])

  return { status }
}
