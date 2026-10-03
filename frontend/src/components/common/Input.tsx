import { forwardRef, useId } from 'react'
import type { InputHTMLAttributes } from 'react'

import { cn } from '@/utils/cn'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Accessible label rendered above the field. */
  label?: string
  /** Persistent hint rendered below the field when there is no error. */
  helperText?: string
  /** Validation message; rendered instead of the helper text. */
  error?: string
}

const FIELD_BASE_CLASSES = cn(
  'h-11 w-full rounded-lg border bg-field px-3.5 text-body text-ink',
  'placeholder:text-ink-disabled transition-colors',
  'focus:outline-none focus:ring-2',
  'disabled:cursor-not-allowed disabled:bg-muted disabled:text-ink-disabled',
)

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, helperText, error, id, className, ...props }, ref) => {
    const generatedId = useId()
    const inputId = id ?? generatedId
    const messageId = `${inputId}-message`
    const message = error ?? helperText

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="mb-1.5 block text-label font-medium text-ink-secondary"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={message ? messageId : undefined}
          className={cn(
            FIELD_BASE_CLASSES,
            error
              ? 'border-danger focus:ring-danger/25'
              : 'border-border focus:border-primary-500 focus:ring-primary-500/30',
            className,
          )}
          {...props}
        />
        {message && (
          <p
            id={messageId}
            className={cn('mt-1.5 text-helper', error ? 'text-danger' : 'text-ink-muted')}
          >
            {message}
          </p>
        )}
      </div>
    )
  },
)

Input.displayName = 'Input'
