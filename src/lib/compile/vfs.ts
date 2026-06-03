import type { ProjectFile } from "@/types"

/**
 * Parse LaTeX source to find \includegraphics and \bibliography references
 */
export function parseLatexReferences(source: string): string[] {
  const refs: string[] = []

  const includegraphicsRegex = /\\includegraphics(?:\[.*?\])?\{([^}]+)\}/g
  let match
  while ((match = includegraphicsRegex.exec(source)) !== null) {
    const filename = match[1].trim()
    const basename = filename.split("/").pop() || filename
    refs.push(basename)
  }

  const bibliographyRegex = /\\bibliography\{([^}]+)\}/g
  while ((match = bibliographyRegex.exec(source)) !== null) {
    const bibname = match[1].trim()
    refs.push(`${bibname}.bib`)
  }

  return [...new Set(refs)]
}
