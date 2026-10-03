import type { ReactNode } from 'react'

import { APP_CONFIG } from '@/config/app'

export interface HeaderProps {
  /** Reserved area on the right for future global actions. */
  actions?: ReactNode
}

/** Application top bar: product identity on the left, global actions on the right. */
export function Header({ actions }: HeaderProps) {
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-surface">
      <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <svg aria-hidden="true" viewBox="0 0 32 32" className="h-8 w-8">
            <rect width="32" height="32" rx="8" className="fill-primary-600" />
            <path
              d="M16 5.5c4.6 3.9 4.6 10.6 0 14.5-4.6-3.9-4.6-10.6 0-14.5Z"
              className="fill-white"
            />
            <path
              d="M16 20.5V27"
              fill="none"
              strokeWidth={2.2}
              strokeLinecap="round"
              className="stroke-white"
            />
          </svg>
          <span className="text-section-title font-semibold tracking-tight text-ink">
            {APP_CONFIG.name}
          </span>
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </header>
  )
}
