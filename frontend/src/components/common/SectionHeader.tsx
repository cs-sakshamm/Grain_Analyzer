import type { ReactNode } from 'react'

import { cn } from '@/utils/cn'

export interface SectionHeaderProps {
  /** Heading text. */
  title: string
  /** Optional supporting line rendered below the title. */
  description?: string
  /** Optional content (e.g. buttons) aligned to the right. */
  actions?: ReactNode
  /** Heading level; use h1 for the page title, h2/h3 for sections. */
  as?: 'h1' | 'h2' | 'h3'
  className?: string
}

const HEADING_CLASSES = {
  h1: 'text-page-title font-semibold text-ink',
  h2: 'text-section-title font-semibold text-ink',
  h3: 'text-card-title font-semibold text-ink',
} as const

/** Page or section heading with optional description and actions. */
export function SectionHeader({
  title,
  description,
  actions,
  as = 'h2',
  className,
}: SectionHeaderProps) {
  const Heading = as
  return (
    <div className={cn('flex flex-wrap items-start justify-between gap-4', className)}>
      <div>
        <Heading className={HEADING_CLASSES[as]}>{title}</Heading>
        {description && (
          <p className="mt-0.5 max-w-2xl text-body text-ink-muted">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </div>
  )
}
