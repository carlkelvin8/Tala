import { RefreshCw } from "lucide-react"
import { cn } from "../../lib/utils"

interface RefreshIndicatorProps {
  isRefetching: boolean
  className?: string
}

export function RefreshIndicator({ isRefetching, className }: RefreshIndicatorProps) {
  if (!isRefetching) return null
  
  return (
    <div className={cn("flex items-center gap-2 text-xs text-slate-500", className)}>
      <RefreshCw className="h-3 w-3 animate-spin" />
      <span>Updating...</span>
    </div>
  )
}
