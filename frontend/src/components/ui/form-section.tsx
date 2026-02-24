import * as React from "react"
import { SectionCard } from "./section-card"

type FormSectionProps = {
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

export function FormSection({ 
  title, 
  description, 
  actions, 
  footer, 
  children, 
  className, 
  contentClassName,
  collapsible = true,
  defaultCollapsed = false
}: FormSectionProps) {
  return (
    <SectionCard
      title={title}
      description={description}
      actions={actions}
      footer={footer}
      className={className}
      contentClassName={contentClassName}
      collapsible={collapsible}
      defaultCollapsed={defaultCollapsed}
    >
      {children}
    </SectionCard>
  )
}
