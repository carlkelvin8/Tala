import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../lib/utils"

const alertVariants = cva("rounded-lg border px-4 py-3 text-sm", {
  variants: {
      variant: {
        default: "border-gray-200 bg-white text-gray-700 dark:border-slate-700 dark:text-slate-300",
        success: "border-green-200 bg-green-50 text-green-800 dark:text-green-300",
        warning: "border-yellow-200 bg-yellow-50 text-yellow-800 dark:text-yellow-300",
        danger: "border-red-200 bg-red-50 text-red-800 dark:text-red-300",
        info: "border-primary-200 bg-primary-50 text-primary-800"
      }
  },
  defaultVariants: {
    variant: "default"
  }
})

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof alertVariants> {}

export function Alert({ className, variant, ...props }: AlertProps) {
  return <div role="alert" className={cn(alertVariants({ variant }), className)} {...props} />
}
