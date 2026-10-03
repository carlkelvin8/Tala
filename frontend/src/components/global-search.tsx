import { useEffect, useMemo, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  Search, CornerDownLeft, LayoutDashboard, UserPlus, Users, Grid, Plane,
  BookOpen, BookMarked, GraduationCap, Award, ClipboardCheck, Inbox, Medal,
  CalendarCheck, ScanLine, RadioTower, ClipboardList, FileBarChart, Trophy,
  Megaphone, Calendar, Clock, Shield, ScrollText, User2, History,
} from "lucide-react"
import { getStoredUser } from "../lib/auth"
import { filterNavItems } from "../lib/navigation"
import { cn } from "../lib/utils"

/* Max-level global search: every app page in one palette.
   Page visibility stays role/program filtered via filterNavItems, so no
   privilege leak. Read-only and client-side: no backend changes needed. */

type Category = "Dashboards" | "People" | "Academics" | "Tracking" | "General"

const CATEGORY_ORDER: Category[] = ["Dashboards", "People", "Academics", "Tracking", "General"]

type PageMeta = {
  description: string
  category: Category
  keywords: string[]
  icon: typeof LayoutDashboard
}

const PAGE_META: Record<string, PageMeta> = {
  "/dashboard":      { description: "Your home overview and summary", category: "Dashboards", keywords: ["home", "overview", "summary", "main"], icon: LayoutDashboard },
  "/dashboard/cwts": { description: "Civic Welfare Training Service overview", category: "Dashboards", keywords: ["home", "cwts", "overview", "summary"], icon: LayoutDashboard },
  "/dashboard/rotc": { description: "Reserved Officers Training Corps overview", category: "Dashboards", keywords: ["home", "rotc", "overview", "summary"], icon: LayoutDashboard },
  "/enrollment":     { description: "Review and approve enrollment requests", category: "People", keywords: ["enroll", "register", "admission", "approve", "pending"], icon: UserPlus },
  "/students":       { description: "Browse the student directory and profiles", category: "People", keywords: ["directory", "list", "profiles", "students list"], icon: Users },
  "/sections":       { description: "Manage class sections and blocks", category: "People", keywords: ["classes", "blocks", "class list"], icon: Grid },
  "/flights":        { description: "Manage ROTC flights", category: "People", keywords: ["rotc", "flight", "groups"], icon: Plane },
  "/users":          { description: "Manage user accounts and roles", category: "People", keywords: ["accounts", "roles", "admin", "manage users"], icon: Shield },
  "/courses/cwts":   { description: "CWTS curriculum courses", category: "Academics", keywords: ["subjects", "curriculum", "mandatory", "cwts courses"], icon: BookOpen },
  "/courses/rotc":   { description: "ROTC curriculum courses", category: "Academics", keywords: ["subjects", "curriculum", "mandatory", "rotc courses"], icon: BookOpen },
  "/materials":      { description: "Modules, lectures and learning files", category: "Academics", keywords: ["modules", "files", "learning", "lectures", "downloads"], icon: BookMarked },
  "/grades":         { description: "Encode and view student grades", category: "Academics", keywords: ["marks", "scores", "grading", "report card"], icon: GraduationCap },
  "/merits":         { description: "Assign merits, demerits and discipline notes", category: "Academics", keywords: ["demerits", "points", "discipline", "rotc merits", "awards"], icon: Award },
  "/exams":          { description: "Create exams and track attempts", category: "Academics", keywords: ["test", "quiz", "assessment", "exam results"], icon: ClipboardCheck },
  "/submissions":    { description: "Excuse letters and official documents", category: "Academics", keywords: ["documents", "excuse letter", "medical", "submit files"], icon: Inbox },
  "/certificates":   { description: "Generate completion certificates", category: "Academics", keywords: ["completion", "award", "certificate"], icon: Medal },
  "/attendance":     { description: "Attendance records and QR check-ins", category: "Tracking", keywords: ["present", "absent", "late", "records", "qr attendance", "check in"], icon: CalendarCheck },
  "/scanner":        { description: "Scan student QR codes with the camera", category: "Tracking", keywords: ["qr", "scan", "camera", "attendance scan", "qr scanner", "check in"], icon: ScanLine },
  "/live-monitor":   { description: "Watch live session activity in real time", category: "Tracking", keywords: ["live", "realtime", "monitor", "ongoing"], icon: RadioTower },
  "/training":       { description: "Monitor training day compliance", category: "Tracking", keywords: ["monitoring", "sessions", "compliance", "training day"], icon: ClipboardList },
  "/reports":        { description: "Analytics, exports and summaries", category: "Tracking", keywords: ["analytics", "export", "csv", "pdf", "statistics"], icon: FileBarChart },
  "/leaderboard":    { description: "Rankings, streaks, points and badges", category: "Tracking", keywords: ["ranking", "rank", "top students", "points", "badges", "streak"], icon: Trophy },
  "/announcements":  { description: "Post and read program announcements", category: "General", keywords: ["notices", "posts", "updates", "news"], icon: Megaphone },
  "/calendar":       { description: "Schedules, events and important dates", category: "General", keywords: ["schedule", "events", "dates"], icon: Calendar },
  "/terms":          { description: "Manage academic terms and school years", category: "General", keywords: ["semester", "academic term", "school year", "periods"], icon: Clock },
  "/profile":        { description: "Your account, avatar and settings", category: "General", keywords: ["account", "settings", "avatar", "my profile"], icon: User2 },
  "/audit-logs":     { description: "System activity and change history", category: "General", keywords: ["logs", "history", "activity", "trail"], icon: ScrollText },
}

const RECENT_KEY = "nstp_recent_searches"
const MAX_RECENT = 5

function loadRecent(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed.filter((v) => typeof v === "string").slice(0, MAX_RECENT) : []
  } catch {
    return []
  }
}

function saveRecent(path: string) {
  try {
    const next = [path, ...loadRecent().filter((p) => p !== path)].slice(0, MAX_RECENT)
    localStorage.setItem(RECENT_KEY, JSON.stringify(next))
  } catch {
    // private mode or quota — recents are best-effort only
  }
}

type SearchEntry = {
  label: string
  path: string
  description: string
  category: Category
  keywords: string[]
  icon: typeof LayoutDashboard
}

/* Rank a page against the query. Lower is better; null means no match. */
function matchScore(entry: SearchEntry, q: string): number | null {
  const label = entry.label.toLowerCase()
  const path = entry.path.toLowerCase()
  const desc = entry.description.toLowerCase()
  if (label.startsWith(q)) return 0
  if (entry.keywords.some((k) => k.startsWith(q))) return 1
  if (label.includes(q)) return 2
  if (entry.keywords.some((k) => k.includes(q))) return 3
  if (path.includes(q)) return 4
  if (desc.includes(q)) return 5
  return null
}

function Highlight({ text, query }: { text: string; query: string }) {
  const q = query.trim()
  if (!q) return <>{text}</>
  const index = text.toLowerCase().indexOf(q.toLowerCase())
  if (index < 0) return <>{text}</>
  return (
    <>
      {text.slice(0, index)}
      <mark className="rounded-sm bg-gold/40 px-0.5 text-inherit">
        {text.slice(index, index + q.length)}
      </mark>
      {text.slice(index + q.length)}
    </>
  )
}

export function GlobalSearchButton({ className }: { className?: string }) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setOpen((v) => !v)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Search pages"
        title="Search pages (Ctrl+K)"
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-lg text-darksilver transition-colors hover:bg-silver/20 hover:text-black",
          className
        )}
      >
        <Search className="h-4 w-4" />
      </button>
      {open && <GlobalSearchPalette onClose={() => setOpen(false)} />}
    </>
  )
}

function GlobalSearchPalette({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate()
  const user = getStoredUser()
  const [query, setQuery] = useState("")
  const [activeIndex, setActiveIndex] = useState(0)
  const [recent, setRecent] = useState<string[]>(loadRecent)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const activeRef = useRef<HTMLButtonElement>(null)

  // Every page the user's role/program may access, enriched with search metadata.
  const entries: SearchEntry[] = useMemo(() => {
    const items = filterNavItems(user)
    return items.map((item) => {
      const meta = PAGE_META[item.path]
      return {
        label: item.label,
        path: item.path,
        description: meta?.description ?? item.path,
        category: meta?.category ?? "General",
        keywords: meta?.keywords ?? [],
        icon: meta?.icon ?? LayoutDashboard,
      }
    })
  }, [user])

  const byPath = useMemo(() => new Map(entries.map((e) => [e.path, e])), [entries])

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return entries
    return entries
      .map((entry) => ({ entry, score: matchScore(entry, q) }))
      .filter((r): r is { entry: SearchEntry; score: number } => r.score !== null)
      .sort((a, b) => a.score - b.score || a.entry.label.localeCompare(b.entry.label))
      .map((r) => r.entry)
  }, [entries, query])

  const recentEntries = useMemo(
    () => recent.map((p) => byPath.get(p)).filter((e): e is SearchEntry => !!e),
    [recent, byPath]
  )

  // Flat list actually rendered (recents and/or grouped results) for keyboard nav.
  const flatList = useMemo(() => {
    if (query.trim()) return results
    return [...recentEntries, ...results.filter((r) => !recent.includes(r.path))]
  }, [query, results, recentEntries, recent])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    setActiveIndex(0)
  }, [query])

  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: "nearest" })
  }, [activeIndex])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [onClose])

  function goTo(path: string) {
    saveRecent(path)
    setRecent(loadRecent())
    onClose()
    navigate(path)
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      onClose()
    } else if (e.key === "ArrowDown") {
      e.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, flatList.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === "Enter") {
      const target = flatList[activeIndex]
      if (target) goTo(target.path)
    }
  }

  let cursor = 0
  function renderRow(entry: SearchEntry) {
    const index = cursor++
    const Icon = entry.icon
    const isActive = index === activeIndex
    return (
      <button
        key={entry.path}
        ref={isActive ? activeRef : undefined}
        onClick={() => goTo(entry.path)}
        onMouseEnter={() => setActiveIndex(index)}
        className={cn(
          "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
          isActive ? "bg-navy text-white" : "text-black hover:bg-silver/20"
        )}
      >
        <span className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
          isActive ? "bg-white/15" : "bg-silver/20"
        )}>
          <Icon className={cn("h-4 w-4", isActive ? "text-gold" : "text-royal")} strokeWidth={1.75} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold">
            <Highlight text={entry.label} query={query} />
          </span>
          <span className={cn("block truncate text-[11px]", isActive ? "text-white/70" : "text-darksilver")}>
            {entry.description}
          </span>
        </span>
        <CornerDownLeft className={cn("h-3.5 w-3.5 shrink-0", isActive ? "text-white/70" : "text-silver")} />
      </button>
    )
  }

  function renderGrouped() {
    return CATEGORY_ORDER.map((category) => {
      const group = results.filter((r) => r.category === category)
      if (group.length === 0) return null
      return (
        <div key={category}>
          <p className="px-3 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-widest text-darksilver">
            {category}
          </p>
          {group.map(renderRow)}
        </div>
      )
    })
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center bg-black/40 px-4 pt-24" role="dialog" aria-label="Search pages">
      <div
        ref={containerRef}
        className="w-full max-w-lg overflow-hidden rounded-2xl border border-silver/20 bg-white shadow-elevated"
      >
        <div className="flex items-center gap-2 border-b border-silver/20 px-4">
          <Search className="h-4 w-4 shrink-0 text-darksilver" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search pages, features, actions…"
            aria-label="Search pages"
            className="h-12 w-full bg-transparent text-sm text-black outline-none placeholder:text-darksilver"
          />
          <kbd className="hidden shrink-0 rounded-md bg-silver/20 px-1.5 py-0.5 text-[10px] font-semibold text-darksilver sm:block">
            ESC
          </kbd>
        </div>
        <div className="max-h-80 overflow-y-auto p-2">
          {flatList.length === 0 ? (
            <div className="px-3 py-6 text-center">
              <History className="mx-auto mb-2 h-6 w-6 text-silver" />
              <p className="text-xs text-darksilver">
                No pages match “{query}”. Try “grades”, “qr”, “ranking” or “reports”.
              </p>
            </div>
          ) : query.trim() ? (
            renderGrouped()
          ) : (
            <>
              {recentEntries.length > 0 && (
                <div>
                  <p className="px-3 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-widest text-darksilver">
                    Recent
                  </p>
                  {recentEntries.map(renderRow)}
                </div>
              )}
              {renderGrouped()}
            </>
          )}
        </div>
        <div className="flex items-center gap-4 border-t border-silver/20 px-4 py-2 text-[10px] text-darksilver">
          <span><kbd className="rounded bg-silver/20 px-1 font-semibold">↑↓</kbd> navigate</span>
          <span><kbd className="rounded bg-silver/20 px-1 font-semibold">Enter</kbd> open</span>
          <span><kbd className="rounded bg-silver/20 px-1 font-semibold">Esc</kbd> close</span>
          <span className="ml-auto">{flatList.length} page{flatList.length === 1 ? "" : "s"}</span>
        </div>
      </div>
    </div>
  )
}
