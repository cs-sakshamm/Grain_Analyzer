import { useCallback, useState } from 'react'

import type { SetupPayload } from '@/types/setup'

/**
 * Session storage key for the setup payload captured on the setup screen.
 * Keeping it in sessionStorage means a page refresh on `#processing` can
 * still show what the user entered, without inventing any data.
 */
const STORAGE_KEY = 'grain-analyzer.setup-payload'

function readStored(): SetupPayload | null {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY)
    if (raw === null) return null
    const parsed: unknown = JSON.parse(raw)
    if (
      parsed !== null &&
      typeof parsed === 'object' &&
      typeof (parsed as Record<string, unknown>).lotNumber === 'string' &&
      typeof (parsed as Record<string, unknown>).sampleWeight === 'number' &&
      Number.isFinite((parsed as Record<string, unknown>).sampleWeight) &&
      typeof (parsed as Record<string, unknown>).moisture === 'number' &&
      Number.isFinite((parsed as Record<string, unknown>).moisture) &&
      ((parsed as Record<string, unknown>).crop === 'paddy' ||
        (parsed as Record<string, unknown>).crop === 'rice')
    ) {
      return parsed as SetupPayload
    }
    return null
  } catch {
    return null
  }
}

/**
 * Holds the setup payload for the current session.
 * `submit` stores a payload and records that the user submitted it; `restore`
 * is used when reloading `#processing` and no submission is in flight.
 */
export function useSetupPayload() {
  const [payload, setPayload] = useState<SetupPayload | null>(readStored)

  const submit = useCallback((next: SetupPayload) => {
    try {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch {
      // Storage can be unavailable (private mode, quota) — the in-memory
      // value still covers navigation within this session.
    }
    setPayload(next)
  }, [])

  const clear = useCallback(() => {
    try {
      window.sessionStorage.removeItem(STORAGE_KEY)
    } catch {
      // Ignore, same rationale as in `submit`.
    }
    setPayload(null)
  }, [])

  return { payload, submit, clear }
}
