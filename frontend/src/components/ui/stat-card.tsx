import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./card"
import { cn } from "../../lib/utils"

type StatCardProps = {
  label: string
  value: string | number
  description?: string
  badge?: React.ReactNode
  trend?: string
  trendVariant?: "up" | "down" | "neutral"
  className?: string
}

export function StatCard({ label, value, description, badge, trend, trendVariant = "neutral", className }: StatCardProps) {
  const trendColor =
    trendVariant === "up" ? "text-green-600" : trendVariant === "down" ? "text-red-600" : "text-gray-500"

  return (
    <Card className={cn("h-full border-gray-200 bg-white", className)}>
      <CardHeader className="gap-2">
        <CardTitle className="text-xs font-semibold uppercase tracking-wide text-gray-600">{label}</CardTitle>
        {description && <CardDescription className="text-xs text-gray-600">{description}</CardDescription>}
      </CardHeader>
      <CardContent className="flex items-end justify-between gap-4">
        <div>
          <div className="text-3xl font-semibold text-black">{value}</div>
          {trend && <div className={cn("mt-1 text-xs", trendColor)}>{trend}</div>}
        </div>
        {badge && <div className="shrink-0">{badge}</div>}
      </CardContent>
    </Card>
  )
}
