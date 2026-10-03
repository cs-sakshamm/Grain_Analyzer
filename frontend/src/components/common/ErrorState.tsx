import type { ReactNode } from 'react'

import { cn } from '@/utils/cn'

export interface ErrorStateProps {
  /** Short heading; defaults to a generic failure title. */
  title?: string
  /** Message explaining what went wrong. */
  message: string
  /** Optional recovery action, e.g. a retry Button. */
  action?: ReactNode
  className?: string
}

/** Shown when an operation fails. Communicates the failure without technical noise. */
export function ErrorState({
  title = 'Something went wrong',
  message,
  action,
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center rounded-xl border border-danger-border bg-danger-soft px-6 py-10 text-center',
        className,
      )}
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-surface text-danger shadow-card">
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.75}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-6 w-6"
        >
          <path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
          <path d="M12 9v4" />
          <path d="M12 17h.01" />
        </svg>
      </span>
      <h3 className="mt-4 text-card-title font-semibold text-ink">{title}</h3>
      <p className="mt-1.5 max-w-sm text-helper text-ink-secondary">{message}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
