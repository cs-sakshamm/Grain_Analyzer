import { useEffect } from 'react'

import { AppShell } from '@/components/layout/AppShell'
import { APP_CONFIG } from '@/config/app'
import { useHashRoute } from '@/hooks/useHashRoute'
import { useSetupPayload } from '@/hooks/useSetupPayload'
import { AnalysisSetupPage } from '@/pages/AnalysisSetupPage'
import { ProcessingPage } from '@/pages/ProcessingPage'
import { ResultsPage } from '@/pages/ResultsPage'
import { isBackendConfigured } from '@/api/client'

/**
 * Development-only affordance: before a real analysis pipeline exists, the
 * Results route must still be reachable to verify its structure. This control
 * is clearly labelled in the UI (the Results page itself shows a dev-preview
 * banner) and never pretends an analysis has completed. It is strictly
 * separated from production analysis state (its `results` prop is always
 * null) and never sends fixtures to the API or report generator.
 */
const DEV_RESULTS_PREVIEW = import.meta.env.DEV

/**
 * Analysis integration switch. Phase 7 introduces the typed API client
 * (src/api/analysis.ts), but no backend exists, so the processing flow
 * stays explicitly disconnected. Flipping this to true (once the backend
 * is real) makes the processing screen consume genuine status responses —
 * the UI already renders every state honestly. The disconnected state never
 * fabricates an analysis id, progress, or results.
 */
const PROCESSING_CONNECTED = isBackendConfigured()

function App() {
  useEffect(() => {
    document.title = APP_CONFIG.name
  }, [])

  const [route, navigate] = useHashRoute()
  const { payload, submit, clear } = useSetupPayload()

  let currentPage: React.ReactNode
  switch (route) {
    case 'processing':
      currentPage = (
        <ProcessingPage
          setup={payload}
          onBackToSetup={() => navigate('setup')}
          integrationStatus={PROCESSING_CONNECTED ? 'ready' : 'not_connected'}
        />
      )
      break
    case 'results':
      // Direct navigation or refresh does not crash; without a real analysis
      // the page renders its honest unavailable states (+ dev banner).
      currentPage = (
        <ResultsPage
          setup={DEV_RESULTS_PREVIEW ? payload : null}
          results={null}
          isDevPreview={DEV_RESULTS_PREVIEW}
          onRescan={() => {
            // Rescan intentionally resets the previous analysis state so old
            // data cannot leak into a new run.
            clear()
            navigate('setup')
          }}
        />
      )
      break
    default:
      currentPage = <AnalysisSetupPage onSubmitSetup={submit} />
  }

  return <AppShell>{currentPage}</AppShell>
}

export default App
