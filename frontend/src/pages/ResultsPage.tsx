import type { ReactNode } from 'react'

import { Card } from '@/components/common/Card'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { SectionHeader } from '@/components/common/SectionHeader'
import { Spinner } from '@/components/common/Spinner'
import type { SetupPayload } from '@/types/setup'
import type { AnalysisResults, ResultsAvailability } from '@/types/results'
import { CompositionPieChart } from '@/components/results/CompositionPieChart'
import { UniformityChart } from '@/components/results/UniformityChart'
import { AnnotatedGrainViewer } from '@/components/results/AnnotatedGrainViewer'
import { formatPercent, isValidPercent } from '@/components/results/validation'
import { ReportPanel } from '@/components/results/ReportPanel'

export interface ResultsPageProps {
  /** Setup data associated with this analysis; may be null if unavailable. */
  setup: SetupPayload | null
  /** Results supplied by a real analysis source; null = none exist yet. */
  results: AnalysisResults | null
  /** True only for the development-only preview mechanism. */
  isDevPreview?: boolean
  /** Navigate back to the setup screen (Rescan). */
  onRescan: () => void
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
 * Renders one future-measurement section with an honest state: loading
 * spinner, unavailable empty state, genuine error, or real content via
 * `renderAvailable` (Phase 5+). Never invents data.
 */
function ResultSection({
  title,
  description,
  availability,
  errorTitle,
  errorMessage,
  renderAvailable,
}: {
  title: string
  description: string
  availability: ResultsAvailability
  errorTitle?: string
  errorMessage?: string
  renderAvailable?: () => ReactNode
}) {
  return (
    <Card className="p-4 sm:p-5">
      <SectionHeader as="h2" title={title} description={description} />
      <div className="mt-2">
        {availability === 'loading' && (
          <div className="flex items-center gap-2 px-1 py-4 text-body text-ink-muted">
            <Spinner size="sm" className="text-primary-600" />
            Awaiting analysis data…
          </div>
        )}
        {availability === 'unavailable' && (
          <EmptyState
            title="Not available yet"
            description="This section will fill in once real analysis data is supplied by the backend."
            className="py-6"
          />
        )}
        {availability === 'error' && (
          <ErrorState
            title={errorTitle ?? 'Analysis error'}
            message={
              errorMessage ??
              'No genuine analysis data could be loaded for this section.'
            }
            className="py-2"
          />
        )}
        {availability === 'available' && renderAvailable?.()}
      </div>
    </Card>
  )
}

/**
 * Resolves the honest display state of one section given the whole results
 * payload: overall loading wins, missing results mean unavailable, and an
 * absent section inherits the payload-level availability.
 */
function sectionAvailability(
  results: AnalysisResults | null,
  section:
    | 'composition'
    | 'quality'
    | 'uniformity'
    | 'image'
    | null,
): ResultsAvailability {
  if (results === null) return 'unavailable'
  if (results.availability === 'loading') return 'loading'
  if (section === null) return 'unavailable'
  const value = results[section]
  if (value === undefined) return 'unavailable'
  return value.availability
}

/**
 * Results screen structure: sample information plus placeholders for the
 * four future measurement sections. Arrival at #results is NOT treated as
 * proof of a completed analysis — without real results every section shows
 * its honest unavailable state.
 */
export function ResultsPage({
  setup,
  results,
  isDevPreview = false,
  onRescan,
}: ResultsPageProps) {
  return (
    <div className="mx-auto w-full max-w-2xl space-y-3">
      <SectionHeader
        as="h1"
        title="Analysis Results"
        description="Review the measurements and quality observations for your sample."
        className="mb-1"
      />

      {isDevPreview && (
        <Card className="border-primary-200 bg-primary-50 p-3 sm:p-4">
          <p className="text-helper text-primary-700">
            Development preview: no analysis has run or completed. This screen
            is reachable through a development-only control so the route can be
            verified before backend integration.
          </p>
        </Card>
      )}

      <Card className="p-4 sm:p-5">
        <SectionHeader
          as="h2"
          title="Sample Information"
          description="Captured from the analysis setup."
        />
        {setup === null ? (
          <EmptyState
            title="Sample details unavailable"
            description="The setup record for this analysis could not be found in this session. The sections below will still populate when real analysis data is connected."
            className="py-6"
          />
        ) : (
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
        )}
      </Card>

      <ResultSection
        title="Crop Composition"
        description="Distribution of grain categories detected in the sample — for example whole, broken, and defective grains, as supported by the analysis pipeline."
        availability={sectionAvailability(results, 'composition')}
        errorTitle="Composition error"
        errorMessage={results?.errorMessage}
        renderAvailable={() => (
          <CompositionPieChart
            data={results?.composition}
            availability={results?.composition?.availability ?? 'unavailable'}
            errorMessage={results?.errorMessage}
          />
        )}
      />

      <ResultSection
        title="Grain Quality Observations"
        description="Detected grain defects and other quality observations identified by the analysis."
        availability={sectionAvailability(results, 'quality')}
        errorTitle="Observations error"
        errorMessage={results?.errorMessage}
        renderAvailable={() => {
          const observations = results?.quality?.observations
          if (observations === undefined || observations.length === 0) {
            return (
              <EmptyState
                title="No observations supplied"
                description="The analysis completed but supplied no quality observations."
                className="py-4"
              />
            )
          }
          return (
            <ul className="divide-y divide-border">
              {observations.map((o) => (
                <li
                  key={o.id}
                  className="flex items-baseline justify-between gap-4 py-2"
                >
                  <span className="text-label font-medium text-ink">{o.name}</span>
                  <span className="text-label tabular-nums text-ink-secondary">
                    {o.count !== undefined ? `${o.count}` : null}
                    {o.count !== undefined && o.percent !== undefined ? ' · ' : null}
                    {o.percent !== undefined && isValidPercent(o.percent)
                      ? formatPercent(o.percent)
                      : null}
                    {o.count === undefined &&
                    (o.percent === undefined || !isValidPercent(o.percent))
                      ? 'No value supplied'
                      : null}
                  </span>
                </li>
              ))
            }
          </ul>
          )
        }}
      />

      <ResultSection
        title="Uniformity and Measurements"
        description="Grain-size consistency, dimensions, and uniformity measurements drawn from the analysis."
        availability={sectionAvailability(results, 'uniformity')}
        errorTitle="Measurements error"
        errorMessage={results?.errorMessage}
        renderAvailable={() => (
          <UniformityChart
            data={results?.uniformity}
            availability={results?.uniformity?.availability ?? 'unavailable'}
            errorMessage={results?.errorMessage}
          />
        )}
      />

      <ResultSection
        title="Annotated Grain Image"
        description="The original grain image with detected grain boundaries drawn over it — the analysis pipeline supplies both when acquisition is connected."
        availability={sectionAvailability(results, 'image')}
        errorTitle="Image error"
        errorMessage={results?.errorMessage}
        renderAvailable={() => (
          <AnnotatedGrainViewer
            data={results?.image}
            availability={results?.image?.availability ?? 'unavailable'}
            errorMessage={results?.errorMessage}
          />
        )}
      />

      <Card className="p-4 sm:p-5">
        <SectionHeader
          as="h2"
          title="Reports & New Analysis"
          description="Choose a report type, download it when generation is connected, or start a new analysis."
        />
        <div className="mt-3">
          <ReportPanel results={results} setup={setup} onRescan={onRescan} />
        </div>
      </Card>
    </div>
  )
}
