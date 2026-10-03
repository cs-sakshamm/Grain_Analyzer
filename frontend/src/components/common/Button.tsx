import type { ButtonHTMLAttributes } from 'react'

import { cn } from '@/utils/cn'

import { Spinner } from './Spinner'

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost'
export type ButtonSize = 'md' | 'lg'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual style of the button. */
  variant?: ButtonVariant
  /** Control height; both sizes keep a comfortable touchscreen hit area. */
  size?: ButtonSize
  /** Shows a spinner and blocks interaction while true. */
  loading?: boolean
}

const BASE_CLASSES = cn(
  'inline-flex select-none items-center justify-center gap-2 rounded-lg font-medium',
  'transition-colors duration-150',
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600',
  'disabled:pointer-events-none disabled:opacity-50',
)

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: 'bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800',
  secondary: cn(
    'border border-border-strong bg-surface text-ink',
    'hover:bg-muted active:bg-muted/80',
  ),
  danger: 'bg-danger text-white hover:bg-danger-strong active:bg-danger-strong',
  ghost: 'text-primary-700 hover:bg-primary-50 active:bg-primary-100',
}

const SIZE_CLASSES: Record<ButtonSize, string> = {
  md: 'h-11 px-5 text-body',
  lg: 'h-12 px-7 text-body',
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  type = 'button',
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(BASE_CLASSES, VARIANT_CLASSES[variant], SIZE_CLASSES[size], className)}
      {...props}
    >
      {loading && <Spinner size="sm" className="-ml-1" />}
      {children}
    </button>
  )
}
