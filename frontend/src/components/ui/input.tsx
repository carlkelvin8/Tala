import * as React from "react"
import { cn } from "../../lib/utils"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={cn(
        "flex h-10 w-full rounded-xl border border-silver/30 bg-white px-3.5 py-2 text-sm text-black",
        "placeholder:text-darksilver",
        "transition-colors duration-150",
        "focus-visible:outline-none focus-visible:border-silver/50 focus-visible:ring-4 focus-visible:ring-navy/[0.06]",
        "disabled:cursor-not-allowed disabled:bg-white disabled:text-darksilver disabled:border-silver/30",
        "aria-invalid:border-rose-400 aria-invalid:ring-4 aria-invalid:ring-rose-500/10",
        className
      )}
      {...props}
    />
  )
})
Input.displayName = "Input"
