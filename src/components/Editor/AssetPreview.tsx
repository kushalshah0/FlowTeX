"use client"

import { Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { ProjectFile } from "@/types"

interface AssetPreviewProps {
  file: ProjectFile
}

export function AssetPreview({ file }: AssetPreviewProps) {
  const ext = file.file_name.split(".").pop()?.toLowerCase() || ""
  const imageExts = new Set(["png", "jpg", "jpeg", "gif", "svg", "webp", "bmp", "ico"])

  const handleDownload = () => {
    if (!file.storage_url) return
    const a = document.createElement("a")
    a.href = file.storage_url
    a.download = file.file_name
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b px-3 py-1.5">
        <span className="text-xs text-muted-foreground">{file.file_name}</span>
        <div className="ml-auto flex items-center gap-1">
          {file.storage_url && (
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleDownload} title="Download">
              <Download className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>
      <div className="flex flex-1 items-center justify-center overflow-auto p-4">
        {imageExts.has(ext) && file.storage_url ? (
          <img
            src={file.storage_url}
            alt={file.file_name}
            className="max-h-full max-w-full rounded object-contain"
          />
        ) : ext === "pdf" && file.storage_url ? (
          <iframe
            src={file.storage_url}
            className="h-full w-full rounded border"
            title={file.file_name}
          />
        ) : file.storage_url ? (
          <div className="text-center">
            <p className="text-sm text-muted-foreground">No preview available</p>
            <Button variant="outline" size="sm" className="mt-2" onClick={handleDownload}>
              <Download className="mr-1 h-3 w-3" />
              Download {file.file_name}
            </Button>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No file URL</p>
        )}
      </div>
    </div>
  )
}
