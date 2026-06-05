"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { EditorView, basicSetup } from "codemirror"
import { EditorState } from "@codemirror/state"
import { keymap } from "@codemirror/view"
import * as Y from "yjs"
import YPartyKitProvider from "y-partykit/provider"
import { yCollab } from "y-codemirror.next"
import { getSessionUser } from "@/lib/session"
import type { ProjectFile } from "@/types"

const PARTYKIT_HOST = process.env.NEXT_PUBLIC_PARTYKIT_HOST || "flowtex.kushalshah0.partykit.dev"

interface CodeEditorProps {
  file: ProjectFile
  onUpdate: (fileId: string, content: string) => void
  active?: boolean
}

export function CodeEditor({ file, onUpdate, active = true }: CodeEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)
  const sessionId = useRef(`tab-${Math.random().toString(36).slice(2, 9)}`)
  const [onlineUsers, setOnlineUsers] = useState<Array<{ id: string; name: string; color: string }>>([])
  const awarenessRef = useRef<any>(null)
  const ydocRef = useRef<Y.Doc | null>(null)

  useEffect(() => {
    if (!active || !editorRef.current) return

    const getCookie = (name: string) => {
      const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`))
      return match ? decodeURIComponent(match[2]) : ""
    }
    const authToken = getCookie("auth_token")

    const sessionUser = getSessionUser()
    const ydoc = new Y.Doc()
    ydocRef.current = ydoc
    const ytext = ydoc.getText("content")
    const provider = new YPartyKitProvider(PARTYKIT_HOST, `file-${file.id}`, ydoc, {
      params: { auth: authToken },
    })
    awarenessRef.current = provider.awareness

    const id = sessionId.current
    provider.awareness.setLocalState({
      name: sessionUser.name,
      color: sessionUser.color,
      id,
      user: {
        name: sessionUser.name,
        color: sessionUser.color,
      },
    })

    const onAwarenessChange = () => {
      const local = ydoc.clientID
      const states = Array.from(provider.awareness.getStates().entries())
      const seen = new Set<string>()
      const users: Array<{ id: string; name: string; color: string }> = []
      for (const [clientID, s] of states) {
        if (clientID === local) continue
        if (!s.name || !s.id || seen.has(s.name)) continue
        seen.add(s.name)
        users.push({ id: s.id, name: s.name, color: s.color })
      }
      setOnlineUsers(users)
    }
    provider.awareness.on("change", onAwarenessChange)
    onAwarenessChange()

    provider.on("sync", (synced: boolean) => {
      if (synced) {
        if (ytext.toString() === "") {
          ytext.insert(0, file.content || "\n".repeat(20))
        }
      }
    })
    provider.on("connection-error", (event: any) => {
      console.error("PartyKit connection error:", event)
    })

    const dispatchCompile = () => {
      const content = ytext.toString()
      window.dispatchEvent(new CustomEvent("compile-latex", {
        detail: { file, content },
      }))
    }

    const state = EditorState.create({
      doc: ytext.toString(),
      extensions: [
        basicSetup,
        keymap.of([
          {
            key: "Mod-Enter",
            run: () => {
              dispatchCompile()
              return true
            },
          },
        ]),
        yCollab(ytext, provider.awareness),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            onUpdate(file.id, update.state.doc.toString())
          }
        }),
      ],
    })

    const view = new EditorView({ state, parent: editorRef.current })
    viewRef.current = view

    const triggerCompile = () => dispatchCompile()
    window.addEventListener("request-compile", triggerCompile)

    const goToLine = (e: Event) => {
      const { line } = (e as CustomEvent).detail
      if (!line || !viewRef.current) return
      const v = viewRef.current
      const d = v.state.doc
      if (line < 1 || line > d.lines) return
      v.dispatch({
        selection: { anchor: d.line(line).from },
        scrollIntoView: true,
      })
      v.focus()
    }
    window.addEventListener("goto-line", goToLine)

    return () => {
      view.destroy()
      viewRef.current = null
      awarenessRef.current = null
      ydocRef.current = null
      provider.awareness.setLocalState(null)
      provider.awareness.off("change", onAwarenessChange)
      provider.destroy()
      ydoc.destroy()
      window.removeEventListener("request-compile", triggerCompile)
      window.removeEventListener("goto-line", goToLine)
    }
  }, [file.id, file.file_name, active])

  const goToUserCursor = useCallback((targetName: string) => {
    const v = viewRef.current
    const awareness = awarenessRef.current
    const ydoc = ydocRef.current
    if (!v || !awareness || !ydoc) return

    const states = Array.from(awareness.getStates() as Map<number, any>)
    for (const [, state] of states) {
      if (state.name !== targetName || !state.cursor?.head) continue
      const abs = Y.createAbsolutePositionFromRelativePosition(state.cursor.head, ydoc)
      if (!abs) continue
      v.dispatch({
        selection: { anchor: abs.index },
        scrollIntoView: true,
      })
      v.focus()
      return
    }
  }, [])

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b px-3 py-1.5">
        <span className="text-xs text-muted-foreground">{file.file_name}</span>
        {onlineUsers.length > 0 && (
          <div className="ml-auto flex items-center gap-1.5">
            {onlineUsers.map((u, i) => (
              <span
                key={i}
                className="flex cursor-pointer items-center gap-1 rounded-full px-1.5 py-0.5 text-[11px] leading-none"
                style={{ backgroundColor: u.color + "20", color: u.color }}
                onClick={() => goToUserCursor(u.name)}
                title={`Go to ${u.name}'s cursor`}
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: u.color }}
                />
                {u.name}
              </span>
            ))}
          </div>
        )}
      </div>
      <div ref={editorRef} className="flex-1 overflow-auto" />
      <style>{`
        .cm-ySelectionInfo { opacity: 1 !important; }
        .cm-ySelectionCaret:hover > .cm-ySelectionInfo { opacity: 1 !important; }
      `}</style>
    </div>
  )
}
