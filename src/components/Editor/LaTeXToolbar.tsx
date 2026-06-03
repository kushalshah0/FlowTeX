"use client"

import { Button } from "@/components/ui/button"
import { Bold, Italic, Table, Sigma, List, Heading } from "lucide-react"

interface LaTeXToolbarProps {
  onInsert: (snippet: string, placeholder?: string) => void
}

const snippets = [
  { label: "Bold", icon: Bold, snippet: "\\textbf{text}", placeholder: "text" },
  { label: "Italic", icon: Italic, snippet: "\\textit{text}", placeholder: "text" },
  { label: "Section", icon: Heading, snippet: "\\section{title}", placeholder: "title" },
  { label: "Math", icon: Sigma, snippet: "$equation$", placeholder: "equation" },
  { label: "Itemize", icon: List, snippet: "\\begin{itemize}\n  \\item \n\\end{itemize}", placeholder: "" },
  { label: "Table", icon: Table, snippet: "\\begin{tabular}{ccc}\n  \\hline\n   & \\\\\n  \\hline\n\\end{tabular}", placeholder: "" },
]

export function LaTeXToolbar({ onInsert }: LaTeXToolbarProps) {
  return (
    <div className="flex items-center gap-0.5 border-b px-2 py-1">
      {snippets.map((item) => (
        <Button
          key={item.label}
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          title={item.label}
          onClick={() => onInsert(item.snippet, item.placeholder)}
        >
          <item.icon className="h-3.5 w-3.5" />
        </Button>
      ))}
    </div>
  )
}
