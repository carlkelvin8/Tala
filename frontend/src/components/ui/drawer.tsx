import * as React from "react"
import { createPortal } from "react-dom"
import { cn } from "../../lib/utils"

type DrawerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  children: React.ReactNode
  className?: string
}

export function Drawer({ open, onOpenChange, title, children, className }: DrawerProps) {
  React.useEffect(() => {
    if (!open) return
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onOpenChange(false)
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [open, onOpenChange])

  if (!open || typeof document === "undefined") {
    return null
  }

  return createPortal(
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-slate-900/40" onClick={() => onOpenChange(false)} />
      <div
        className={cn(
          "absolute right-0 top-0 h-full w-[90%] max-w-md bg-white shadow-xl",
          "animate-in slide-in-from-right-5 duration-200",
          className
        )}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4">
            <div className="text-sm font-semibold text-slate-900">{title ?? "Menu"}</div>
            <button className="text-sm text-slate-500 hover:text-slate-700" onClick={() => onOpenChange(false)}>
              Close
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">{children}</div>
        </div>
      </div>
    </div>,
    document.body
  )
}
