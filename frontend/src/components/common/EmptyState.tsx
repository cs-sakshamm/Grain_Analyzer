import type { ReactNode } from 'react'

import { cn } from '@/utils/cn'

export interface EmptyStateProps {
  /** Short heading, e.g. "No data available". */
  title: string
  /** Optional explanation of why the view is empty. */
  description?: string
  /** Optional call to action, e.g. a Button. */
  action?: ReactNode
  className?: string
}

/** Shown when a view has no data to display yet. */
export function EmptyState({ title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center px-6 py-12 text-center',
        className,
      )}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-10 w-10 text-ink-disabled"
      >
        <path d="M21 8v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8" />
        <path d="M3 8 5 4h14l2 4" />
        <path d="M3 8h6a3 3 0 0 0 6 0h6" />
      </svg>
      <h3 className="mt-4 text-card-title font-semibold text-ink">{title}</h3>
      {description && (
        <p className="mt-1.5 max-w-sm text-helper text-ink-muted">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
