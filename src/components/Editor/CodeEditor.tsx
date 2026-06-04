"use client"

import { useEffect, useRef } from "react"
import { EditorView, basicSetup } from "codemirror"
import { EditorState } from "@codemirror/state"
import { keymap } from "@codemirror/view"
import * as Y from "yjs"
import YPartyKitProvider from "y-partykit/provider"
import { yCollab } from "y-codemirror.next"
import type { ProjectFile } from "@/types"

const PARTYKIT_HOST = process.env.NEXT_PUBLIC_PARTYKIT_HOST || "flowtex.kushalshah0.partykit.dev"

interface CodeEditorProps {
  file: ProjectFile
  onUpdate: (fileId: string, content: string) => void
}

export function CodeEditor({ file, onUpdate }: CodeEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)

  useEffect(() => {
    if (!editorRef.current) return

    const ydoc = new Y.Doc()
    const ytext = ydoc.getText("content")
    const provider = new YPartyKitProvider(PARTYKIT_HOST, `file-${file.id}`, ydoc)

    provider.on("sync", (synced: boolean) => {
      if (synced && ytext.toString() === "" && file.content) {
        ytext.insert(0, file.content)
      }
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
      provider.destroy()
      ydoc.destroy()
      window.removeEventListener("request-compile", triggerCompile)
      window.removeEventListener("goto-line", goToLine)
    }
  }, [file.id, file.file_name])

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center border-b px-3 py-1.5">
        <span className="text-xs text-muted-foreground">{file.file_name}</span>
      </div>
      <div ref={editorRef} className="flex-1 overflow-auto" />
    </div>
  )
}
