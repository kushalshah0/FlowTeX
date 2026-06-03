# NexusTeX

A collaborative LaTeX editor with real-time compilation and PDF preview.

Built with Next.js, CodeMirror 6, pdf.js, and the LaTeX-On-HTTP API (TeXLive 2026).

## Features

- **Real compilation** — LaTeX compiled server-side via `latex.ytotech.com` (pdflatex, TeXLive 2026)
- **PDF preview** — Rendered client-side with pdf.js canvas; zoom, page navigation, and download
- **Code editor** — CodeMirror 6 with syntax highlighting, Ctrl+Enter to compile
- **Click-to-source** — Click on any text in the PDF preview to jump to the corresponding line in the editor
- **File management** — Add and switch between multiple `.tex` files per project
- **Log viewer** — Full-area compiler output with error highlighting
- **Responsive** — 3-pane desktop layout, tab-switching mobile layout
- **Supabase persistence** — Projects and files stored via Supabase
- **Hardcoded auth** — Demo-ready: login with `admin` / `password`

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), log in with `admin` / `password`, and start editing.

## Tech Stack

- **Framework:** Next.js 16 (Turbopack, App Router)
- **Editor:** CodeMirror 6
- **PDF:** pdf.js (pdfjs-dist v6)
- **Compiler:** LaTeX-On-HTTP API (TeXLive 2026)
- **Database:** Supabase (demo mode, RLS disabled)
- **Auth:** Cookie-based (`auth_token=nexustex_demo`)
- **Realtime:** PartyKit (`nexustex.kushalshah0.partykit.dev`)
- **Styling:** Tailwind CSS v4
