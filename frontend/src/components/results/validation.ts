/**
 * Shared validation helpers for visualization data. Every chart component
 * validates its props before rendering: invalid or inconsistent data must
 * produce an error/unavailable state, never a misleading chart.
 */

export function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

/** Valid counts are finite and non-negative. */
export function isValidCount(value: unknown): value is number {
  return isFiniteNumber(value) && value >= 0
}

/** Valid percentages are finite and within 0–100 inclusive. */
export function isValidPercent(value: unknown): value is number {
  return isFiniteNumber(value) && value >= 0 && value <= 100
}

/** Uniformly formats a percent value for display; keeps underlying intact. */
export function formatPercent(value: number): string {
  return `${new Intl.NumberFormat(undefined, {
    maximumFractionDigits: 1,
  }).format(value)}%`
}

/**
 * Checks whether category counts form a valid partition of `totalGrains`:
 * every count valid and the sum exactly equal to the total. Only then may
 * the pie chart treat categories as mutually exclusive slices. A tolerance
 * of zero keeps the contract strict — a mismatch is surfaced, not hidden.
 */
export function isExclusivePartition(
  counts: number[],
  totalGrains: number,
): boolean {
  if (counts.length === 0 || !isValidCount(totalGrains)) return false
  const sum = counts.reduce((acc, n) => acc + n, 0)
  return isValidCount(sum) && sum === totalGrains
}

/**
 * Derives percentages from a valid partition. Returns null if the data is
 * not a valid partition (overlapping or incomplete categories), so the
 * caller can show an error state instead of a normalized chart.
 */
export function derivePercentages(counts: number[]): number[] | null {
  const sum = counts.reduce((acc, n) => acc + n, 0)
  if (!isValidCount(sum) || sum === 0) return null
  return counts.map((n) => (n / sum) * 100)
}
