import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
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
    <div className={cn("min-h-screen bg-gray-50 flex items-center justify-center p-6", className)}>
      <div className="w-full max-w-md">
        <div className="mb-10 text-center">
          <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-lg bg-black">
            <span className="text-xl font-bold text-white">KT</span>
          </div>
          <h1 className="text-3xl font-bold text-black mb-3">{title}</h1>
          <p className="text-base text-gray-600">{description}</p>
        </div>
        
        <Card className="border-gray-200 bg-white shadow-sm">
          <CardContent className="pt-8 pb-8 px-8">
            {children}
          </CardContent>
        </Card>
        
        {footer && (
          <div className="mt-8 text-center">
            {footer}
          </div>
        )}
        
        <div className="mt-8 text-center text-xs text-gray-500">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </div>
      </div>
    </div>
  )
}