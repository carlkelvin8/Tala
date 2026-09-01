import * as React from "react"
import { cn } from "../../lib/utils"

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
        <div className="hidden lg:flex lg:w-2/5 bg-gradient-to-br from-navy via-royal to-navy p-12 flex-col items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-grid opacity-20" />
          <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-gold/10 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-royal/10 blur-3xl" />
          <div className="max-w-md text-center relative animate-fade-in">
            <div className="flex flex-col items-center gap-4 mb-12">
              <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm ring-1 ring-white/20 overflow-hidden">
                <img src="/image.png" alt="Logo" className="h-24 w-24 object-contain" />
              </div>
              <div className="text-center">
                <h2 className="text-2xl font-bold text-white tracking-tight">AviNSTeP</h2>
                <p className="text-xs text-darksilver font-medium tracking-wide uppercase mt-1">National Service Training Program Management System</p>
              </div>
            </div>
            <p className="text-3xl font-light text-white leading-relaxed mb-6 tracking-tight">
              &ldquo;Empowering the next generation of leaders through service and excellence.&rdquo;
            </p>
            <p className="text-sm text-darksilver leading-relaxed">
              Streamline your NSTP program with our comprehensive management platform.
            </p>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-8 lg:p-12">
          <div className="w-full max-w-md animate-slide-up">
            <div className="lg:hidden flex flex-col items-center gap-3 mb-12">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-navy to-royal shadow-soft overflow-hidden">
                <img src="/image.png" alt="Logo" className="h-16 w-16 object-contain" />
              </div>
              <div className="text-center">
                <h2 className="text-lg font-bold text-black tracking-tight">AviNSTeP</h2>
                <p className="text-[10px] text-darksilver font-medium tracking-wide uppercase">National Service Training Program Management System</p>
              </div>
            </div>

            <div className="mb-10">
              <h1 className="text-3xl font-bold text-black mb-2 tracking-tight">{title}</h1>
              <p className="text-darksilver">{description}</p>
            </div>

            <div className="rounded-2xl border border-silver/30 bg-white p-8 shadow-card">
              {children}
            </div>

            {footer && (
              <div className="mt-8 text-center">
                {footer}
              </div>
            )}

            <div className="mt-8 text-center text-xs text-darksilver">
              By continuing, you agree to our{" "}
              <span className="text-black/80 font-medium">Terms of Service</span>
              {" "}and{" "}
              <span className="text-black/80 font-medium">Privacy Policy</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
