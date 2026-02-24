import * as React from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./card"
import { cn } from "../../lib/utils"
import { ChevronDown, ChevronUp } from "lucide-react"

type SectionCardProps = {
  title: string
  description?: string
  actions?: React.ReactNode
  footer?: React.ReactNode
  children: React.ReactNode
  className?: string
  contentClassName?: string
  collapsible?: boolean
  defaultCollapsed?: boolean
}

export function SectionCard({ 
  title, 
  description, 
  actions, 
  footer, 
  children, 
  className, 
  contentClassName,
  collapsible = false,
  defaultCollapsed = false
}: SectionCardProps) {
  const [isCollapsed, setIsCollapsed] = React.useState(defaultCollapsed)

  return (
    <Card className={className}>
      <CardHeader 
        className={cn(
          "flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between",
          collapsible && "cursor-pointer hover:bg-slate-50"
        )}
        onClick={collapsible ? () => setIsCollapsed(!isCollapsed) : undefined}
      >
        <div className="flex items-center gap-2 flex-1">
          <div className="space-y-1 flex-1">
            <CardTitle className="flex items-center gap-2">
              {title}
              {collapsible && (
                isCollapsed ? (
                  <ChevronDown className="h-4 w-4 text-slate-500" />
                ) : (
                  <ChevronUp className="h-4 w-4 text-slate-500" />
                )
              )}
            </CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
        </div>
        {actions && <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>{actions}</div>}
      </CardHeader>
      {!isCollapsed && (
        <>
          <CardContent className={cn("space-y-4", contentClassName)}>{children}</CardContent>
          {footer && <CardFooter>{footer}</CardFooter>}
        </>
      )}
    </Card>
  )
}
