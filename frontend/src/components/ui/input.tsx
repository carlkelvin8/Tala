import * as React from "react"
import { cn } from "../../lib/utils"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={cn(
        "flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900",
        "placeholder:text-slate-400",
        "transition-colors duration-150",
        "focus-visible:outline-none focus-visible:border-slate-400 focus-visible:ring-4 focus-visible:ring-slate-900/[0.06]",
        "disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400 disabled:border-slate-200",
        "aria-invalid:border-rose-400 aria-invalid:ring-4 aria-invalid:ring-rose-500/10",
        className
      )}
      {...props}
    />
  )
})
Input.displayName = "Input"
