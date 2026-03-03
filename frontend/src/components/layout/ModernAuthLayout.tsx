import * as React from "react"
import { cn } from "../../lib/utils"
import { Shield } from "lucide-react"

type ModernAuthLayoutProps = {
  title: string
  description: string
  children: React.ReactNode
  footer?: React.ReactNode
  className?: string
}

export function ModernAuthLayout({ title, description, children, footer, className }: ModernAuthLayoutProps) {
  return (
    <div className={cn("min-h-screen bg-white", className)}>
      <div className="min-h-screen flex">
        {/* Left Side - Simple Branding */}
        <div className="hidden lg:flex lg:w-2/5 bg-slate-900 p-12 flex-col items-center justify-center">
          <div className="max-w-md text-center">
            {/* Logo */}
            <div className="flex items-center justify-center gap-3 mb-12">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white">
                <Shield className="h-5 w-5 text-slate-900" />
              </div>
              <div className="text-left">
                <h2 className="text-lg font-bold text-white">Kalasag-Tala</h2>
                <p className="text-xs text-slate-400">NSTP Command Center</p>
              </div>
            </div>

            {/* Quote */}
            <div>
              <p className="text-2xl font-light text-white leading-relaxed mb-8">
                "Empowering the next generation of leaders through service and excellence."
              </p>
              <p className="text-sm text-slate-400">
                Streamline your NSTP program with our comprehensive management platform.
              </p>
            </div>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="flex-1 flex items-center justify-center p-8 lg:p-12">
          <div className="w-full max-w-md">
            {/* Mobile Logo */}
            <div className="lg:hidden flex items-center gap-3 mb-12">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-900">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Kalasag-Tala</h2>
                <p className="text-xs text-slate-600">NSTP Command Center</p>
              </div>
            </div>

            {/* Header */}
            <div className="mb-10">
              <h1 className="text-3xl font-bold text-slate-900 mb-3">{title}</h1>
              <p className="text-slate-600">{description}</p>
            </div>

            {/* Form */}
            {children}

            {/* Footer */}
            {footer && (
              <div className="mt-8 text-center">
                {footer}
              </div>
            )}

            {/* Terms */}
            <div className="mt-8 text-center text-xs text-slate-500">
              By continuing, you agree to our{" "}
              <a href="#" className="text-slate-900 hover:underline">Terms of Service</a>
              {" "}and{" "}
              <a href="#" className="text-slate-900 hover:underline">Privacy Policy</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
