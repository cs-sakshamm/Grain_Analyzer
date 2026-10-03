import { cn } from '@/utils/cn'

import { Spinner } from './Spinner'
import type { SpinnerSize } from './Spinner'

export interface LoadingIndicatorProps {
  /** Visible, accessible text describing what is happening. */
  label?: string
  size?: SpinnerSize
  className?: string
}

/** Generic "work in progress" indicator used while waiting for data or systems. */
export function LoadingIndicator({
  label = 'Loading',
  size = 'md',
  className,
}: LoadingIndicatorProps) {
  return (
    <div
      role="status"
      className={cn('flex items-center justify-center gap-3 text-ink-muted', className)}
    >
      <Spinner size={size} />
      {label && <span className="text-body">{label}</span>}
    </div>
  )
}
