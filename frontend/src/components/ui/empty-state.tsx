import * as React from "react"
import { cn } from "../../lib/utils"

type EmptyStateProps = {
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export function EmptyState({ title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-slate-200 bg-white px-6 py-10 text-center", className)}>
      <div className="text-base font-semibold text-slate-900">{title}</div>
      {description && <p className="text-sm text-slate-500">{description}</p>}
      {action && <div className="pt-2">{action}</div>}
    </div>
  )
}
