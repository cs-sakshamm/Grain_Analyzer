import { useCallback, useEffect, useState } from 'react'

/**
 * The frontend uses hash-based navigation (no router dependency). Only the
 * phases implemented so far are listed; a future `results` phase extends
 * this union. Unknown hashes resolve to `setup`.
 */
export type HashRoute = 'setup' | 'processing' | 'results'

const HASHES: readonly HashRoute[] = ['setup', 'processing', 'results']

function parseHash(): HashRoute {
  const raw = window.location.hash.replace(/^#/, '')
  return (HASHES as readonly string[]).includes(raw) ? (raw as HashRoute) : 'setup'
}

/**
 * Returns the current hash route and a setter. The setter maps unknown values
 * to `setup`, keeping the URL and the screen in sync.
 */
export function useHashRoute(): [HashRoute, (route: HashRoute) => void] {
  const [route, setRoute] = useState<HashRoute>(parseHash)

  useEffect(() => {
    const onHashChange = () => setRoute(parseHash())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  const navigate = useCallback((target: HashRoute) => {
    window.location.hash = `#${target}`
  }, [])

  return [route, navigate]
}
