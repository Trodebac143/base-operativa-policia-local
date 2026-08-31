"use client"

import type { ReactNode } from "react"
import { Collapsible as CollapsiblePrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

function Collapsible({
  ...props
}: React.ComponentProps<typeof CollapsiblePrimitive.Root>) {
  return <CollapsiblePrimitive.Root data-slot="collapsible" {...props} />
}

function CollapsibleTrigger({
  ...props
}: React.ComponentProps<typeof CollapsiblePrimitive.CollapsibleTrigger>) {
  return (
    <CollapsiblePrimitive.CollapsibleTrigger
      data-slot="collapsible-trigger"
      {...props}
    />
  )
}

function CollapsibleContent({
  ...props
}: React.ComponentProps<typeof CollapsiblePrimitive.CollapsibleContent>) {
  return (
    <CollapsiblePrimitive.CollapsibleContent
      data-slot="collapsible-content"
      {...props}
    />
  )
}

function CollapsibleSection({
  title,
  icon,
  count,
  defaultOpen = false,
  className,
  children,
}: {
  title: string
  icon?: string
  count?: number
  defaultOpen?: boolean
  className?: string
  children: ReactNode
}) {
  const visibleTitle = count == null ? title : `${title} (${count})`

  return (
    <Collapsible
      className={cn("compact-collapsible", className)}
      defaultOpen={defaultOpen}
    >
      <CollapsibleTrigger className="compact-collapsible-trigger" type="button">
        <span className="compact-collapsible-chevron" aria-hidden="true" />
        {icon && <span className="compact-collapsible-icon" aria-hidden="true">{icon}</span>}
        <span className="compact-collapsible-title">{visibleTitle}</span>
      </CollapsibleTrigger>
      <CollapsibleContent className="compact-collapsible-content" forceMount>
        <div className="compact-collapsible-content-inner">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  )
}

export { Collapsible, CollapsibleTrigger, CollapsibleContent, CollapsibleSection }
