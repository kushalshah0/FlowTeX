"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { EditorView, basicSetup } from "codemirror"
import { EditorState } from "@codemirror/state"
import { keymap } from "@codemirror/view"
import { Button } from "@/components/ui/button"
import { Play } from "lucide-react"
import type { ProjectFile } from "@/types"

interface CodeEditorProps {
  file: ProjectFile
  onUpdate: (fileId: string, content: string) => void
}

export function CodeEditor({ file, onUpdate }: CodeEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)
  const [compiling, setCompiling] = useState(false)

  useEffect(() => {
    if (!editorRef.current) return

    const state = EditorState.create({
      doc: file.content || "",
      extensions: [
        basicSetup,
        keymap.of([
          {
            key: "Mod-Enter",
            run: () => {
              handleCompile()
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

    const view = new EditorView({
      state,
      parent: editorRef.current,
    })

    viewRef.current = view

    return () => {
      view.destroy()
      viewRef.current = null
    }
  }, [file.id])

  useEffect(() => {
    if (viewRef.current && file.content !== undefined) {
      const current = viewRef.current.state.doc.toString()
      if (current !== file.content) {
        viewRef.current.dispatch({
          changes: {
            from: 0,
            to: current.length,
            insert: file.content || "",
          },
        })
      }
    }
  }, [file.content])

  const handleCompile = useCallback(() => {
    setCompiling(true)
    const content = viewRef.current?.state.doc.toString() || ""
    const event = new CustomEvent("compile-latex", {
      detail: { file, content },
    })
    window.dispatchEvent(event)
    setTimeout(() => setCompiling(false), 500)
  }, [file])

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b px-3 py-1.5">
        <span className="text-xs text-muted-foreground">{file.file_name}</span>
        <Button
          size="sm"
          variant="outline"
          className="h-7 gap-1 text-xs"
          onClick={handleCompile}
          disabled={compiling}
        >
          <Play className="h-3 w-3" />
          {compiling ? "Compiling..." : "Compile"}
        </Button>
      </div>
      <div ref={editorRef} className="flex-1 overflow-auto" />
    </div>
  )
}
