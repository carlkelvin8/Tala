import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Badge } from "../ui/badge"
import { Separator } from "../ui/separator"

type AuthLayoutProps = {
  title: string
  description: string
  children: React.ReactNode
  footer?: React.ReactNode
  sideTitle: string
  sideDescription: string
  sideItems: string[]
}

export function AuthLayout({ title, description, children, footer, sideTitle, sideDescription, sideItems }: AuthLayoutProps) {
  return (
    <div className="bg-white">
      <div className="mx-auto max-w-sm px-4 py-6 sm:max-w-md sm:px-5 sm:py-8">
        <Card className="w-full rounded-xl border-slate-200 bg-white shadow-md">
          <CardHeader className="gap-1 px-4 py-4">
            <Badge variant="outline" className="w-fit border-slate-200 text-slate-600">
              NSTP Command Center
            </Badge>
            <CardTitle className="text-[20px] font-semibold text-slate-900 sm:text-[22px]">{title}</CardTitle>
            <CardDescription className="text-sm text-slate-500">{description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 px-4 py-4">
            {children}
            {footer && (
              <div className="space-y-4">
                <Separator className="bg-slate-100" />
                <div className="text-sm text-slate-500">{footer}</div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
