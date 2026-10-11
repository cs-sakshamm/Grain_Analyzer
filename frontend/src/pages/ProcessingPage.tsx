import { useEffect } from 'react'
import type { ReactNode } from 'react'

import { Button } from '@/components/common/Button'
import { Card } from '@/components/common/Card'
import { ErrorState } from '@/components/common/ErrorState'
import { SectionHeader } from '@/components/common/SectionHeader'
import { Spinner } from '@/components/common/Spinner'
import { APP_CONFIG } from '@/config/app'
import type { ProcessingStateInfo, SetupPayload } from '@/types/setup'

export interface ProcessingPageProps {
  /** Setup data captured on the setup screen; null triggers recovery UI. */
  setup: SetupPayload | null
  /** Navigate back to the setup screen. */
  onBackToSetup: () => void
  /**
   * Integration status supplied by the app: 'not_connected' until a real
   * backend is wired in (Phase 7 boundary — see api/analysis.ts). Driving
   * this from props means the screen can consume real status responses
   * later without redesign.
   */
  integrationStatus?: 'not_connected' | 'ready'
}

/** Crop display names; keep in sync with `config/crops.ts`. */
const CROP_NAMES: Record<SetupPayload['crop'], string> = {
  paddy: 'Paddy',
  rice: 'Rice',
}

const SAMPLE_FIELDS: Array<{
  label: string
  value: (setup: SetupPayload) => string
}> = [
  { label: 'Lot Number', value: (s) => s.lotNumber },
  { label: 'Crop', value: (s) => CROP_NAMES[s.crop] },
  {
    label: 'Sample Weight',
    value: (s) => `${new Intl.NumberFormat().format(s.sampleWeight)} g`,
  },
  { label: 'Moisture', value: (s) => `${new Intl.NumberFormat().format(s.moisture)}%` },
]

/**
 * Status panel content per lifecycle state. Phase 3 only ever reaches
 * `not_connected` (or the recovery state); the others become reachable
 * once a real processing source exists and are already styled here.
 */
const STATUS_PANEL: Record<
  ProcessingStateInfo['status'],
  { title: string; body: ReactNode }
> = {
  not_connected: {
    title: 'Analysis processing is not connected yet',
    body: (
      <p className="mt-2 text-body text-ink-muted">
        {APP_CONFIG.name} captured your sample details. The processing engine
        arrives in an upcoming phase, so no analysis is running right now. Your
        setup data is kept until then.
      </p>
    ),
  },
  queued: {
    title: 'Queued for analysis',
    body: (
      <p className="mt-2 text-body text-ink-muted">
        Waiting for the analyzer to pick up the sample.
      </p>
    ),
  },
  processing: {
    title: 'Processing',
    body: (
      <p className="mt-2 flex items-center gap-2 text-body text-ink-muted">
        <Spinner size="sm" />
        Analysing the sample…
      </p>
    ),
  },
  completed: {
    title: 'Analysis complete',
    body: (
      <p className="mt-2 text-body text-ink-muted">
        Results will appear on the results screen in an upcoming phase.
      </p>
    ),
  },
  failed: {
    title: 'Analysis failed',
    body: (
      <p className="mt-2 text-body text-ink-muted">
        The analysis could not complete. Return to setup to start again.
      </p>
    ),
  },
}

/**
 * Processing screen: shows the submitted sample information and an honest
 * view of the processing state. No simulated progress, no synthetic
 * analysis IDs, no fabricated grain statistics.
 */
export function ProcessingPage({
  setup,
  onBackToSetup,
  integrationStatus = 'not_connected',
}: ProcessingPageProps) {
  useEffect(() => {
    // Leaving the screen clears any pending polling state. With no backend
    // there are no live polls yet; this boundary is where the future
    // polling effect cleanup belongs (see docs/API_CONTRACT.md §B).
    return () => {
      /* polling cleanup anchor */
    }
  }, [])

  if (setup === null) {
    // Missing setup data (direct navigation, cleared session): offer a
    // sensible recovery path instead of crashing or showing blanks.
    return (
      <div className="mx-auto w-full max-w-2xl space-y-3">
        <SectionHeader
          as="h1"
          title="Processing Sample"
          className="mb-1"
        />
        <Card className="p-4 sm:p-5">
          <ErrorState
            title="No sample data found"
            message="The processing screen was opened without sample details — for example via a direct link or after the session was cleared. Return to setup to enter them again."
            action={
              <Button variant="primary" size="md" onClick={onBackToSetup}>
                Back to Setup
              </Button>
            }
          />
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-3">
      <SectionHeader
        as="h1"
        title="Processing Sample"
        description="The analyzer will grade this sample for grain composition and uniformity once processing begins."
        className="mb-1"
      />

      <Card className="p-4 sm:p-5">
        <SectionHeader
          as="h2"
          title="Sample Details"
          description="Captured from the setup screen."
        />
        <dl className="mt-3 grid gap-x-8 gap-y-0 sm:grid-cols-2">
          {SAMPLE_FIELDS.map((field) => (
            <div
              key={field.label}
              className="flex items-baseline justify-between gap-4 border-b border-border py-2"
            >
              <dt className="shrink-0 text-label font-medium text-ink-secondary">
                {field.label}
              </dt>
              <dd className="truncate text-body font-medium text-ink">
                {field.value(setup)}
              </dd>
            </div>
          ))}
        </dl>
      </Card>

      <Card className="p-4 sm:p-5">
        <div className="flex items-center gap-3">
          <Spinner size="md" className="shrink-0 text-primary-600" />
          <h2 className="text-section-title font-semibold text-ink">
            {integrationStatus === 'ready'
              ? STATUS_PANEL.queued.title
              : STATUS_PANEL.not_connected.title}
          </h2>
        </div>
        <div className="mt-1 pl-[calc(1.5rem+0.75rem)]">
          {integrationStatus === 'ready' ? STATUS_PANEL.queued.body : STATUS_PANEL.not_connected.body}
        </div>
      </Card>

      <div className="flex justify-start">
        <Button variant="secondary" size="md" onClick={onBackToSetup}>
          Back to Setup
        </Button>
      </div>
    </div>
  )
}
