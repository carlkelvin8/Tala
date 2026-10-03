import { useEffect, useMemo, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Search, CornerDownLeft } from "lucide-react"
import { getStoredUser } from "../lib/auth"
import { filterNavItems } from "../lib/navigation"
import { cn } from "../lib/utils"

/* Global search button + palette.
   Searches the current user's navigation pages (already role/program
   filtered by filterNavItems, so no privilege leak). Read-only and
   client-side: no new backend endpoint required. */
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
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const pages = useMemo(() => filterNavItems(user), [user])

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return pages
    return pages.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.path.toLowerCase().includes(q)
    )
  }, [pages, query])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    setActiveIndex(0)
  }, [query])

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
    onClose()
    navigate(path)
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      onClose()
    } else if (e.key === "ArrowDown") {
      e.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, results.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === "Enter") {
      const target = results[activeIndex]
      if (target) goTo(target.path)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center bg-black/40 px-4 pt-24" role="dialog" aria-label="Search pages">
      <div
        ref={containerRef}
        className="w-full max-w-md overflow-hidden rounded-2xl border border-silver/20 bg-white shadow-elevated"
      >
        <div className="flex items-center gap-2 border-b border-silver/20 px-4">
          <Search className="h-4 w-4 shrink-0 text-darksilver" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search pages…"
            aria-label="Search pages"
            className="h-12 w-full bg-transparent text-sm text-black outline-none placeholder:text-darksilver"
          />
          <kbd className="hidden shrink-0 rounded-md bg-silver/20 px-1.5 py-0.5 text-[10px] font-semibold text-darksilver sm:block">
            ESC
          </kbd>
        </div>
        <div className="max-h-72 overflow-y-auto p-2">
          {results.length === 0 ? (
            <p className="px-3 py-6 text-center text-xs text-darksilver">
              No pages match “{query}”.
            </p>
          ) : (
            results.map((item, index) => (
              <button
                key={item.path}
                onClick={() => goTo(item.path)}
                onMouseEnter={() => setActiveIndex(index)}
                className={cn(
                  "flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-left transition-colors",
                  index === activeIndex ? "bg-navy text-white" : "text-black hover:bg-silver/20"
                )}
              >
                <span className="truncate text-sm font-medium">{item.label}</span>
                <span className={cn(
                  "flex shrink-0 items-center gap-1 text-[10px]",
                  index === activeIndex ? "text-white/70" : "text-darksilver"
                )}>
                  <CornerDownLeft className="h-3 w-3" />
                  {item.path}
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
