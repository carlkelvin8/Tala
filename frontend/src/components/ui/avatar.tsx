import * as React from "react"
import { cn } from "../../lib/utils"

export function Avatar({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex h-9 w-9 items-center justify-center rounded-full bg-navy text-xs font-semibold text-white", className)} {...props} />
}
