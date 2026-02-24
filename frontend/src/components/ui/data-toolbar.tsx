import * as React from "react"
import { cn } from "../../lib/utils"

type DataToolbarProps = {
  children?: React.ReactNode
  actions?: React.ReactNode
  className?: string
}

export function DataToolbar({ children, actions, className }: DataToolbarProps) {
  return (
    <div className={cn("flex flex-col gap-3 md:flex-row md:items-center md:justify-between", className)}>
      <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">{children}</div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}
