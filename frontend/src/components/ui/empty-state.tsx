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
    <div className={cn("flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-silver/30 bg-white px-6 py-10 text-center", className)}>
      <div className="text-base font-semibold text-black">{title}</div>
      {description && <p className="text-sm text-darksilver">{description}</p>}
      {action && <div className="pt-2">{action}</div>}
    </div>
  )
}
