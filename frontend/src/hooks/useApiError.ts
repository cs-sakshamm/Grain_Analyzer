import { useMemo } from 'react'

import { userMessageFor, type ApiError } from '@/api/errors'

/**
 * Maps an ApiError (or null) to a concise user-facing message via the
 * shared error model. Screens render `message` inside their existing
 * error states; no stack traces or raw internals are exposed.
 */
export function useApiErrorMessage(error: ApiError | null): string | null {
  return useMemo(() => (error === null ? null : userMessageFor(error)), [error])
}
