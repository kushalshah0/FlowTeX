"use client"

import { useEffect, useRef } from "react"
import { EditorView, basicSetup } from "codemirror"
import { EditorState } from "@codemirror/state"
import { keymap } from "@codemirror/view"
import type { ProjectFile } from "@/types"

interface CodeEditorProps {
  file: ProjectFile
  onUpdate: (fileId: string, content: string) => void
}

export function CodeEditor({ file, onUpdate }: CodeEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)

  useEffect(() => {
    if (!editorRef.current) return

    const dispatchCompile = () => {
      const content = viewRef.current?.state.doc.toString() || ""
      window.dispatchEvent(new CustomEvent("compile-latex", {
        detail: { file, content },
      }))
    }

    const state = EditorState.create({
      doc: file.content || "",
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

    return () => {
      view.destroy()
      viewRef.current = null
      window.removeEventListener("request-compile", triggerCompile)
    }
  }, [file.id, file.file_name])

  useEffect(() => {
    if (viewRef.current && file.content !== undefined) {
      const current = viewRef.current.state.doc.toString()
      if (current !== file.content) {
        viewRef.current.dispatch({
          changes: { from: 0, to: current.length, insert: file.content || "" },
        })
      }
    }
  }, [file.content])

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center border-b px-3 py-1.5">
        <span className="text-xs text-muted-foreground">{file.file_name}</span>
      </div>
      <div ref={editorRef} className="flex-1 overflow-auto" />
    </div>
  )
}
