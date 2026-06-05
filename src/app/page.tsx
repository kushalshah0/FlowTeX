import { cookies } from "next/headers"
import { decodeSession } from "@/lib/auth"
import Link from "next/link"
import { ArrowRight, FileCode, GitBranch, Users, Zap, Shield, Layout, type LucideIcon } from "lucide-react"
import { ThemeToggle } from "@/components/ThemeToggle"

export const dynamic = "force-dynamic"

interface Feature {
  icon: LucideIcon
  title: string
  description: string
  color: string
}

interface Step {
  number: string
  title: string
  description: string
}

const steps: Step[] = [
  {
    number: "01",
    title: "Create an Account",
    description: "Sign up with a username and password. No email verification, no credit card — just start writing.",
  },
  {
    number: "02",
    title: "Start a Project",
    description: "Create a new project and begin writing LaTeX. Your document is automatically saved and synced.",
  },
  {
    number: "03",
    title: "Share & Collaborate",
    description: "Share the project link with teammates. Everyone can edit simultaneously with real-time sync.",
  },
]

const features: Feature[] = [
  {
    icon: Users,
    title: "Real-time Collaboration",
    description: "Multiple users can edit the same document simultaneously with Yjs CRDT-based sync. See cursors and changes as they happen.",
    color: "from-blue-500/20 to-blue-500/5 text-blue-600",
  },
  {
    icon: FileCode,
    title: "CodeMirror 6 Editor",
    description: "Full-featured code editor with syntax highlighting, bracket matching, auto-indent, and familiar keyboard shortcuts.",
    color: "from-emerald-500/20 to-emerald-500/5 text-emerald-600",
  },
  {
    icon: Zap,
    title: "Instant Compilation",
    description: "Compile to PDF with a single keystroke (Cmd+Enter). Powered by TeXLive 2026 running on remote servers.",
    color: "from-amber-500/20 to-amber-500/5 text-amber-600",
  },
  {
    icon: Layout,
    title: "Live PDF Preview",
    description: "Built-in PDF viewer renders compiled output instantly. Click any text to jump to the corresponding source line.",
    color: "from-purple-500/20 to-purple-500/5 text-purple-600",
  },
  {
    icon: GitBranch,
    title: "Project Management",
    description: "Organize your work into projects with multiple .tex files. Create, rename, and delete files as needed.",
    color: "from-rose-500/20 to-rose-500/5 text-rose-600",
  },
  {
    icon: Shield,
    title: "Secure & Private",
    description: "Password-based authentication with hashed credentials. Your documents are stored securely in the cloud.",
    color: "from-cyan-500/20 to-cyan-500/5 text-cyan-600",
  },
]

export default async function Home() {
  const cookieStore = await cookies()
  const auth = cookieStore.get("auth_token")
  const session = auth ? decodeSession(auth.value) : null

  return (
    <div className="flex min-h-screen flex-col">
      <header className="fixed inset-x-0 top-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <FileCode className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold">FlowTex</span>
          </div>
          <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            <a href="#features" className="transition-colors hover:text-foreground">Features</a>
            <a href="#how-it-works" className="transition-colors hover:text-foreground">How it Works</a>
          </nav>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            {session ? (
              <div className="flex items-center gap-4">
                <span className="text-xs text-muted-foreground">{session.u}</span>
                <Link
                  href={session.r === "admin" ? "/admin/users" : "/dashboard"}
                  className="inline-flex h-8 items-center justify-center rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
                >
                  Dashboard
                </Link>
              </div>
            ) : (
              <Link
                href="/login"
                className="inline-flex h-8 items-center justify-center rounded-md bg-primary px-4 text-xs font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden pt-28 pb-20 md:pt-36 md:pb-28 animate-fade-in">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.03),transparent_70%)]" />
          <div className="pointer-events-none absolute -top-40 left-1/2 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-gradient-to-b from-primary/5 to-transparent blur-3xl" />
          <div className="mx-auto max-w-6xl px-6">
            <div className="flex flex-col items-center gap-12 md:flex-row md:items-center">
              <div className="max-w-xl shrink-0 text-center md:text-left">
                <h1 className="text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
                  Write LaTeX together,{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60">
                    in real time
                  </span>
                </h1>
                <p className="mt-5 text-sm leading-relaxed text-muted-foreground md:text-base">
                  Compile LaTeX instantly, preview PDFs live, and collaborate with your team — all in the browser.
                  No setup, no configuration.
                </p>
                <div className="mt-8 flex items-center justify-center gap-3 md:justify-start">
                  <Link
                    href="/login"
                    className="inline-flex h-10 items-center justify-center gap-1.5 rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
                  >
                    Start Editing
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <a
                    href="#features"
                    className="inline-flex h-10 items-center justify-center rounded-md border bg-background px-6 text-sm font-medium shadow-sm transition-colors hover:bg-accent"
                  >
                    Learn More
                  </a>
                </div>
              </div>

              {/* Editor mockup */}
              <div className="w-full max-w-lg shrink-0">
                <div className="overflow-hidden rounded-xl border bg-background shadow-2xl">
                  {/* Title bar */}
                  <div className="flex items-center justify-between border-b bg-muted/30 px-4 py-2.5">
                    <div className="flex items-center gap-1.5">
                      <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
                      <div className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                      <div className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                      <div className="ml-3 rounded-md bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">main.tex</div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="flex -space-x-1.5">
                        <div className="relative z-10 h-5 w-5 rounded-full border-2 border-background bg-blue-500" title="lokesh" />
                        <div className="relative z-20 h-5 w-5 rounded-full border-2 border-background bg-emerald-500" title="imcceer" />
                        <div className="relative z-30 h-5 w-5 rounded-full border-2 border-background bg-amber-500" title="carol" />
                      </div>
                      <span className="text-[10px] text-muted-foreground">2 online</span>
                    </div>
                  </div>
                  {/* Editor body */}
                  <div className="flex">
                    <div className="hidden border-r bg-muted/20 p-3 text-[11px] leading-relaxed text-muted-foreground sm:block">
                      {Array.from({ length: 16 }, (_, i) => (
                        <div key={i} className="w-6 text-right tabular-nums">{i + 1}</div>
                      ))}
                    </div>
                    <div className="relative flex-1 p-3 font-mono text-[11px] leading-relaxed">
                      <div><span className="text-purple-600">\documentclass</span><span className="text-muted-foreground">{`{article}`}</span></div>
                      <div><span className="text-purple-600">\usepackage</span><span className="text-muted-foreground">{`{amsmath}`}</span></div>
                      <div>&nbsp;</div>
                      <div><span className="text-purple-600">\title</span><span className="text-muted-foreground">{`{Hello, FlowTex!}`}</span></div>
                      <div className="relative">
                        <span className="text-purple-600">\author</span><span className="text-muted-foreground">{`{Team}`}</span>
                        {/* Remote cursor */}
                        <span className="absolute top-0 inline-block h-4 w-[2px] bg-blue-500 animate-pulse" style={{ left: '6.5rem' }} />
                        <span className="absolute -top-5 left-[5.5rem] whitespace-nowrap rounded-t rounded-br bg-blue-500/90 px-1.5 py-[2px] text-[9px] font-medium text-white">lokesh</span>
                      </div>
                      <div>&nbsp;</div>
                      <div><span className="text-purple-600">\begin</span><span className="text-muted-foreground">{`{document}`}</span></div>
                      <div><span className="text-purple-600">\maketitle</span></div>
                      <div>&nbsp;</div>
                      <div><span className="text-purple-600">\section</span><span className="text-muted-foreground">{`{Introduction}`}</span></div>
                      <div className="relative">
                        This is a collaborative document.
                        {/* Remote cursor */}
                        <span className="absolute top-0 inline-block h-4 w-[2px] bg-emerald-500 animate-pulse" style={{ left: '11.5rem' }} />
                        <span className="absolute -top-5 left-[10rem] whitespace-nowrap rounded-t rounded-br bg-emerald-500/90 px-1.5 py-[2px] text-[9px] font-medium text-white">imcceer</span>
                      </div>
                      <div>Edit me and press <span className="rounded bg-muted px-1 text-muted-foreground">Ctrl+Enter</span> to compile!</div>
                      <div>&nbsp;</div>
                      <div><span className="text-purple-600">\end</span><span className="text-muted-foreground">{`{document}`}</span></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="border-t py-20 md:py-28 animate-fade-up">
          <div className="mx-auto max-w-6xl px-6">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
                Everything you need for LaTeX
              </h2>
              <p className="mt-3 text-sm text-muted-foreground">
                A modern editor built for collaborative document preparation.
              </p>
            </div>
            <div className="mt-14 grid gap-px overflow-hidden rounded-xl border bg-border sm:grid-cols-2 lg:grid-cols-3">
              {features.map((f) => (
                <div
                  key={f.title}
                  className="bg-background p-6 transition-colors hover:bg-muted/20"
                >
                  <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br ${f.color}`}>
                    <f.icon className="h-4 w-4" />
                  </div>
                  <h3 className="text-sm font-semibold">{f.title}</h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                    {f.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it Works */}
        <section id="how-it-works" className="border-t py-20 md:py-28">
          <div className="mx-auto max-w-6xl px-6">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
                How it Works
              </h2>
              <p className="mt-3 text-sm text-muted-foreground">
                Three simple steps to start collaborating.
              </p>
            </div>
            <div className="mt-14 grid gap-6 md:grid-cols-3">
              {steps.map((s, i) => (
                <div key={s.number} className="relative text-center">
                  {i < steps.length - 1 && (
                    <div className="absolute top-6 left-[calc(50%+2rem)] hidden h-px w-[calc(100%-4rem)] border-t border-dashed md:block" />
                  )}
                  <div className="relative mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full border bg-background text-sm font-bold tabular-nums shadow-sm">
                    {s.number}
                  </div>
                  <h3 className="text-sm font-semibold">{s.title}</h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                    {s.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

      </main>

      <footer className="border-t py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 text-center text-xs text-muted-foreground md:flex-row">
          <div className="flex items-center gap-2">
            <FileCode className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-medium text-foreground">FlowTex</span>
          </div>
          <p>&copy; {new Date().getFullYear()} FlowTex. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
