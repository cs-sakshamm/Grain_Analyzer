import { useCallback, useState } from 'react'

import type { AnalysisResults } from '@/types/results'

/**
 * session storage keys owned by the analysis integration. Rescan clears
 * exactly these keys and nothing else.
 */
const ANALYSIS_ID_KEY = 'grain-analyzer.analysis-id'
const RESULTS_KEY = 'grain-analyzer.analysis-results'

/**
 * Holds the analysis integration state: the server-issued analysis id (only
 * ever obtained from POST /analysis — never invented) and results that have
 * actually been fetched and validated. Session-scoped so a refresh on
 * #processing or #results does not lose the current analysis context.
 */
export function useAnalysisSession() {
  const [analysisId, setAnalysisId] = useState<string | null>(() => {
    try {
      return window.sessionStorage.getItem(ANALYSIS_ID_KEY)
    } catch {
      return null
    }
  })
  const [results, updateResults] = useState<AnalysisResults | null>(() => {
    try {
      const raw = window.sessionStorage.getItem(RESULTS_KEY)
      return raw === null ? null : (JSON.parse(raw) as AnalysisResults)
    } catch {
      return null
    }
  })

  const setAnalysis = useCallback((id: string) => {
    try {
      window.sessionStorage.setItem(ANALYSIS_ID_KEY, id)
    } catch {
      // In-memory state still covers this session.
    }
    setAnalysisId(id)
  }, [])

  const setResults = useCallback((next: AnalysisResults | null) => {
    try {
      if (next === null) {
        window.sessionStorage.removeItem(RESULTS_KEY)
      } else {
        window.sessionStorage.setItem(RESULTS_KEY, JSON.stringify(next))
      }
    } catch {
      // In-memory state still covers this session.
    }
    updateResults(next)
  }, [])

  /** Clears only the analysis-owned session keys, preserving other data. */
  const clear = useCallback(() => {
    try {
      window.sessionStorage.removeItem(ANALYSIS_ID_KEY)
      window.sessionStorage.removeItem(RESULTS_KEY)
    } catch {
      // Ignore; same rationale as the setters.
    }
    setAnalysisId(null)
    updateResults(null)
  }, [updateResults])

  return { analysisId, results, setAnalysis, setResults, clear }
}
