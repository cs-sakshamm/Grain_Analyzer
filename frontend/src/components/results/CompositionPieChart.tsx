import { useMemo } from 'react'

import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { Spinner } from '@/components/common/Spinner'
import { cn } from '@/utils/cn'
import type { CompositionResult, ResultsAvailability } from '@/types/results'
import {
  derivePercentages,
  formatPercent,
  isExclusivePartition,
  isValidCount,
  isValidPercent,
} from './validation'

export interface CompositionPieChartProps {
  /** Composition data supplied by a real analysis source. */
  data: CompositionResult | undefined
  availability: ResultsAvailability
  /** Message supplied by a genuine analysis failure, if any. */
  errorMessage?: string
}

/**
 * Restrained categorical palette reused by slices and legend entries so the
 * two stay visually consistent.
 */
const SLICE_COLORS = [
  'bg-primary-600',
  'bg-primary-400',
  'bg-primary-800',
  'bg-primary-300',
  'bg-primary-950',
]

interface ValidSlice {
  name: string
  percent: number
  count?: number
  colorClass: string
}

/**
 * Validates composition data and derives displayable slices. Percentages
 * are used in priority order:
 *   1. backend-supplied per-category percentages (all validated 0–100);
 *   2. derived from counts, only when they form an exact partition of
 *      `totalGrains`.
 * Returns null with a reason when the data is missing, invalid, or overlaps
 * so the caller can show an honest state rather than a misleading chart.
 */
function useValidatedSlices(
  data: CompositionResult | undefined,
): { slices: ValidSlice[]; totalLabel: string } | null {
  return useMemo(() => {
    const categories = data?.categories
    if (data === undefined || categories === undefined || categories.length === 0) {
      return null
    }

    const ids = new Set<string>()
    for (const category of categories) {
      if (
        typeof category.id !== 'string' ||
        category.id === '' ||
        typeof category.name !== 'string' ||
        category.name === '' ||
        ids.has(category.id)
      ) {
        return null
      }
      ids.add(category.id)
      const hasCount = category.count !== undefined
      const hasPercent = category.percent !== undefined
      if (hasCount && !isValidCount(category.count)) return null
      if (hasPercent && !isValidPercent(category.percent)) return null
      if (!hasCount && !hasPercent) return null
    }

    // Prefer backend percentages when every category supplies one.
    const allPercentSupplied = categories.every((c) => c.percent !== undefined)
    if (allPercentSupplied) {
      const percentSum = categories.reduce((acc, c) => acc + (c.percent ?? 0), 0)
      // Percentages of a partition of the sample should total ~100. A small
      // rounding tolerance is acceptable; a large mismatch indicates
      // overlapping categories and is not silently normalized.
      if (percentSum < 99 || percentSum > 101) return null
      return {
        slices: categories.map((c, i) => ({
          name: c.name,
          percent: c.percent as number,
          count: c.count,
          colorClass: SLICE_COLORS[i % SLICE_COLORS.length],
        })),
        totalLabel:
          data.totalGrains !== undefined && isValidCount(data.totalGrains)
            ? `${data.unit ?? ''} ${data.totalGrains}`.trim()
            : '',
      }
    }

    // Otherwise derive from counts, but only on a strict valid partition.
    const counts = categories.map((c) => c.count)
    if (counts.some((c) => c === undefined)) return null
    const allCounts = counts as number[]
    const total = data.totalGrains
    if (total === undefined || !isExclusivePartition(allCounts, total)) {
      return null
    }
    const derived = derivePercentages(allCounts)
    if (derived === null) return null
    return {
      slices: categories.map((c, i) => ({
        name: c.name,
        percent: derived[i],
        count: c.count,
        colorClass: SLICE_COLORS[i % SLICE_COLORS.length],
      })),
      totalLabel:
        data.unit !== undefined ? `${data.totalGrains} ${data.unit}` : `${data.totalGrains}`,
    }
  }, [data])
}

/**
 * Accessible pie chart of crop composition. Renders via a CSS conic
 * gradient so no charting dependency is needed; an SVG alternative can
 * replace the visual without changing the data flow. Screen readers get a
 * full textual description.
 */
export function CompositionPieChart({
  data,
  availability,
  errorMessage,
}: CompositionPieChartProps) {
  // Validation must run unconditionally (rules of hooks); status branching
  // below decides which of the validated results is actually rendered.
  const validated = useValidatedSlices(data)

  if (availability === 'loading') {
    return (
      <div className="flex items-center gap-2 px-1 py-4 text-body text-ink-muted">
        <Spinner size="sm" className="text-primary-600" />
        Awaiting composition data…
      </div>
    )
  }

  if (availability === 'error') {
    return (
      <ErrorState
        title="Composition error"
        message={errorMessage ?? 'No genuine composition data could be loaded.'}
        className="py-2"
      />
    )
  }

  if (availability === 'unavailable' || data === undefined) {
    return (
      <EmptyState
        title="Not available yet"
        description="Composition statistics will appear when analysis data is available."
        className="py-6"
      />
    )
  }

  if (validated === null) {
    return (
      <ErrorState
        title="Composition data could not be validated"
        message="The supplied composition results are incomplete or inconsistent (for example overlapping categories or out-of-range values). No chart is shown to avoid misleading figures."
        className="py-2"
      />
    )
  }

  const { slices, totalLabel } = validated

  // Build the conic-gradient stop list. Tailwind color classes can't be
  // referenced inside inline styles, so stop colors are mapped to concrete
  // hex values from the design tokens in index.css.
  const SLICE_HEX: Record<string, string> = {
    'bg-primary-600': '#5451df',
    'bg-primary-400': '#8b90f2',
    'bg-primary-800': '#3b38a1',
    'bg-primary-300': '#adb3f8',
    'bg-primary-950': '#212050',
  }
  let angleCursor = 0
  const stops: string[] = []
  for (const slice of slices) {
    const endAngle = angleCursor + (slice.percent / 100) * 360
    stops.push(`${SLICE_HEX[slice.colorClass] ?? '#9ca3af'} ${angleCursor}deg ${endAngle}deg`)
    angleCursor = endAngle
  }
  const gradient = `conic-gradient(${stops.join(', ')})`

  // Compose an accessible text alternative from the validated slices.
  const description = slices
    .map((s) => `${s.name}: ${formatPercent(s.percent)}${s.count !== undefined ? ` (${s.count})` : ''}`)
    .join('; ')

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-6">
      <div
        role="img"
        aria-label={`Crop composition pie chart. ${description}`}
        className={cn(
          'relative h-44 w-44 shrink-0 rounded-full border border-border shadow-card',
        )}
        style={{ background: gradient }}
      >
        {/* Hole in the middle keeps it a donut-style instrument display. */}
        <div className="absolute inset-[26%] rounded-full bg-surface shadow-inner" />
      </div>

      <ul className="w-full space-y-1.5" aria-label="Composition legend">
        {slices.map((slice) => (
          <li key={slice.name} className="flex items-center gap-2.5">
            <span
              aria-hidden="true"
              className={cn('h-3 w-3 shrink-0 rounded-sm', slice.colorClass)}
            />
            <span className="text-label font-medium text-ink">{slice.name}</span>
            <span className="ml-auto text-label tabular-nums text-ink-secondary">
              {formatPercent(slice.percent)}
              {slice.count !== undefined ? ` · ${slice.count}` : ''}
            </span>
          </li>
        ))}
      </ul>

      {totalLabel !== '' && (
        <p className="text-helper text-ink-muted">Total measured: {totalLabel}</p>
      )}
    </div>
  )
}
