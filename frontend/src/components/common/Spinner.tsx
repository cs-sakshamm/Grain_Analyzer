import { cn } from '@/utils/cn'

export type SpinnerSize = 'sm' | 'md' | 'lg'

const SPINNER_SIZES: Record<SpinnerSize, string> = {
  sm: 'h-4 w-4 border-2',
  md: 'h-6 w-6 border-2',
  lg: 'h-8 w-8 border-[3px]',
}

export interface SpinnerProps {
  size?: SpinnerSize
  className?: string
}

/**
 * Indeterminate circular spinner. Inherits its color from the parent text
 * color so it adapts to any surface.
 */
export function Spinner({ size = 'md', className }: SpinnerProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-block animate-spin rounded-full border-current border-t-transparent align-middle',
        SPINNER_SIZES[size],
        className,
      )}
    />
  )
}
