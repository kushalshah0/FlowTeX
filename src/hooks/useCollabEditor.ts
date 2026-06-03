"use client"

import { useEffect, useRef } from "react"
import * as Y from "yjs"
import YPartyKitProvider from "y-partykit/provider"
import { yCollab } from "y-codemirror.next"

interface UseCollabEditorOptions {
  room: string
  username?: string
  initialDoc?: string
}

export function useCollabEditor({ room, username = "Anonymous", initialDoc }: UseCollabEditorOptions) {
  const ydocRef = useRef<Y.Doc | null>(null)
  const providerRef = useRef<YPartyKitProvider | null>(null)

  useEffect(() => {
    const ydoc = new Y.Doc()
    ydocRef.current = ydoc

    if (initialDoc) {
      const ytext = ydoc.getText("content")
      if (ytext.toString() === "") {
        ytext.insert(0, initialDoc)
      }
    }

    const host = process.env.NEXT_PUBLIC_PARTYKIT_HOST
    if (host) {
      const provider = new YPartyKitProvider(host, room, ydoc)
      providerRef.current = provider

      provider.awareness.setLocalStateField("user", {
        name: username,
        color: "#" + Math.floor(Math.random() * 16777215).toString(16),
      })
    }

    return () => {
      providerRef.current?.disconnect()
      ydoc.destroy()
    }
  }, [room, username, initialDoc])

  const getCollabExtensions = () => {
    if (!ydocRef.current) return []
    const ytext = ydocRef.current.getText("content")
    return [yCollab(ytext, providerRef.current?.awareness)]
  }

  return {
    ydoc: ydocRef,
    provider: providerRef,
    getCollabExtensions,
  }
}
