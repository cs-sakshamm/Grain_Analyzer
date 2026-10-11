import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { Spinner } from '@/components/common/Spinner'
import { cn } from '@/utils/cn'
import type { Measurement, ResultsAvailability, UniformityResult } from '@/types/results'
import { isValidCount, isFiniteNumber } from './validation'

export interface UniformityChartProps {
  /** Uniformity data supplied by a real analysis source. */
  data: UniformityResult | undefined
  availability: ResultsAvailability
  /** Message supplied by a genuine analysis failure, if any. */
  errorMessage?: string
}

/**
 * One histogram rendered from a single measurement's distribution bins.
 * Bars scale relative to the largest bin count; bins with zero count are
 * rendered as thin gaps, not fabricated values.
 */
function DistributionHistogram({ measurement }: { measurement: Measurement }) {
  const { distribution, unit, name } = measurement
  if (distribution === undefined || distribution.length === 0) {
    return (
      <p className="py-2 text-helper text-ink-muted">
        No distribution data was supplied for {name.toLowerCase()}.
      </p>
    )
  }

  // Drop malformed bins up front; a partially corrupt distribution is an
  // error worth surfacing rather than silently trimming.
  const valid = distribution.every(
    (bin) =>
      isFiniteNumber(bin.binStart) &&
      isFiniteNumber(bin.binEnd) &&
      isValidCount(bin.count) &&
      bin.binEnd >= bin.binStart,
  )
  if (!valid) {
    return (
      <ErrorState
        title="Distribution data could not be validated"
        message={`The ${name.toLowerCase()} distribution contains invalid bins. No chart is shown to avoid misleading figures.`}
        className="py-2"
      />
    )
  }

  const maxCount = Math.max(...distribution.map((b) => b.count), 1)

  return (
    <figure className="m-0">
      <figcaption className="text-label font-medium text-ink-secondary">
        {name}
        {unit !== undefined ? ` (${unit})` : ''}
      </figcaption>
      <div
        role="img"
        aria-label={`${name} distribution histogram across ${distribution.length} bins`}
        className="mt-2 flex h-32 items-end gap-1"
      >
        {distribution.map((bin) => {
          const heightPercent = (bin.count / maxCount) * 100
          return (
            <div
              key={`${bin.binStart}-${bin.binEnd}`}
              className="flex h-full flex-1 flex-col justify-end"
              title={`${bin.binStart}–${bin.binEnd}${unit !== undefined ? ` ${unit}` : ''}: ${bin.count}`}
            >
              <div
                className={cn(
                  'w-full rounded-t-sm bg-primary-500 transition-none',
                  bin.count === 0 && 'bg-transparent',
                )}
                style={{ height: `${bin.count === 0 ? 2 : heightPercent}%` }}
              />
            </div>
          )
        })}
      </div>
      <div className="mt-1 flex justify-between text-helper tabular-nums text-ink-muted">
        <span>{distribution[0].binStart}</span>
        <span>{distribution[distribution.length - 1].binEnd}</span>
        {unit !== undefined ? <span>{unit}</span> : null}
      </div>
    </figure>
  )
}

/**
 * Uniformity visualization: histograms for binned distributions and a plain
 * labelled summary (never a pie chart) for scalar metrics. Measurements the
 * backend has not defined are shown as unavailable, never invented.
 */
export function UniformityChart({
  data,
  availability,
  errorMessage,
}: UniformityChartProps) {
  if (availability === 'loading') {
    return (
      <div className="flex items-center gap-2 px-1 py-4 text-body text-ink-muted">
        <Spinner size="sm" className="text-primary-600" />
        Awaiting measurement data…
      </div>
    )
  }

  if (availability === 'error') {
    return (
      <ErrorState
        title="Measurements error"
        message={errorMessage ?? 'No genuine measurement data could be loaded.'}
        className="py-2"
      />
    )
  }

  const measurements = data?.measurements
  if (availability === 'unavailable' || data === undefined || measurements === undefined) {
    return (
      <EmptyState
        title="Not available yet"
        description="Uniformity measurements will appear when real analysis integration supplies them. The analysis method will define which measurements exist."
        className="py-6"
      />
    )
  }

  if (measurements.length === 0) {
    return (
      <EmptyState
        title="No measurements supplied"
        description="The analysis completed but supplied no uniformity measurements."
        className="py-6"
      />
    )
  }

  // Malformed measurement entries (no name) invalidate the whole section.
  if (
    measurements.some(
      (m) => typeof m.name !== 'string' || m.name === '' || typeof m.id !== 'string',
    )
  ) {
    return (
      <ErrorState
        title="Measurement data could not be validated"
        message="The supplied measurements are incomplete or malformed. No visualization is shown to avoid misleading figures."
        className="py-2"
      />
    )
  }

  const distributions = measurements.filter((m) => m.distribution !== undefined)
  const scalars = measurements.filter(
    (m) => m.distribution === undefined && m.value !== undefined,
  )
  // Uniformity/quality-score-like scalars are only shown when the analysis
  // documents their meaning; the summary list makes the units explicit.
  const summaryOnly = measurements.filter(
    (m) => m.distribution === undefined && m.value === undefined,
  )

  return (
    <div className="space-y-4">
      {distributions.length > 0 && (
        <div className="space-y-4">
          {distributions.map((m) => (
            <DistributionHistogram key={m.id} measurement={m} />
          ))}
        </div>
      )}

      {scalars.length > 0 && (
        <dl className="grid gap-x-8 gap-y-0 sm:grid-cols-2">
          {scalars.map((m) => (
            <div
              key={m.id}
              className="flex items-baseline justify-between gap-4 border-b border-border py-2"
            >
              <dt className="shrink-0 text-label font-medium text-ink-secondary">
                {m.name}
              </dt>
              <dd className="text-body font-medium tabular-nums text-ink">
                {new Intl.NumberFormat(undefined, { maximumFractionDigits: 3 }).format(
                  m.value as number,
                )}
                {m.unit !== undefined ? ` ${m.unit}` : ''}
              </dd>
            </div>
          ))}
        </dl>
      )}

      {summaryOnly.length > 0 && (
        <p className="text-helper text-ink-muted">
          {summaryOnly.map((m) => m.name).join(', ')} — value not supplied by
          the analysis.
        </p>
      )}

      {distributions.length === 0 && scalars.length === 0 && (
        <EmptyState
          title="Not available yet"
          description="Measurements will appear when the analysis supplies valid data."
          className="py-4"
        />
      )}
    </div>
  )
}
