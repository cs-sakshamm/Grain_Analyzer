import type { AnalysisResults, ResultsAvailability } from './results'
import type { SetupPayload } from './setup'

/**
 * The four report products, matching the product plan. Each definition
 * describes intended content only — availability is computed from what the
 * current analysis actually supplies.
 */
export type ReportTypeId = 'complete' | 'composition' | 'uniformity' | 'detailed'

export interface ReportTypeDefinition {
  id: ReportTypeId
  /** Human-readable report name. */
  name: string
  /** What the report is intended to contain (definition, not a claim). */
  description: string
  /**
   * Which result sections the report requires. A report is only genuinely
   * downloadable when every required section is 'available'.
   */
  requiredSections: Array<keyof Omit<AnalysisResults, 'availability' | 'errorMessage'>>
}

export const REPORT_TYPES: readonly ReportTypeDefinition[] = [
  {
    id: 'complete',
    name: 'Complete Report',
    description:
      'All available analysis sections and the supporting sample information in one document.',
    requiredSections: ['composition', 'quality', 'uniformity'],
  },
  {
    id: 'composition',
    name: 'Composition Report',
    description:
      'Grain-category counts and percentages supported by the actual composition results.',
    requiredSections: ['composition'],
  },
  {
    id: 'uniformity',
    name: 'Uniformity Report',
    description:
      'Actual uniformity measurements, distributions, and units with supporting sample information.',
    requiredSections: ['uniformity'],
  },
  {
    id: 'detailed',
    name: 'Detailed Analysis Report',
    description:
      'Detailed measurements, defect observations, composition, uniformity, and annotated imagery.',
    requiredSections: ['composition', 'quality', 'uniformity', 'image'],
  },
]

/**
 * Typed boundary for report generation. Phase 6 ships NO implementation:
 * the real generator arrives with backend integration (Phase 7), so every
 * report is presently unavailable and the UI says so. The interface keeps
 * the screen decoupled from routing/state and ready for the real source.
 */
export interface ReportGenerator {
  /** Best-effort check that the given report can currently be produced. */
  isAvailable: (report: ReportTypeId, results: AnalysisResults | null) => boolean
  /**
   * Generates the report. Resolves with a genuine, ready-to-download PDF
   * blob — the UI must never receive a fabricated or empty stand-in.
   */
  generate: (
    report: ReportTypeId,
    context: { setup: SetupPayload; results: AnalysisResults },
  ) => Promise<Blob>
}

/**
 * Phase 6 state: report generation is not connected yet. No implementation
 * exists, so no report can be downloaded regardless of data. The UI shows
 * the definitions and explicit unavailability instead of fake downloads.
 */
export const REPORT_GENERATION_STATUS: 'not_connected' | 'ready' | 'unavailable' =
  'not_connected'

/**
 * Computes the honest availability of each report option from the current
 * results, combined with the generation capability status. Returns the
 * section-derived availability for display regardless of generator status.
 */
export function reportSectionAvailability(
  definition: ReportTypeDefinition,
  results: AnalysisResults | null,
): ResultsAvailability {
  if (results === null) return 'unavailable'
  if (results.availability === 'loading') return 'loading'
  if (results.availability === 'error') return 'error'
  const states = definition.requiredSections.map(
    (section) => results[section]?.availability ?? 'unavailable',
  )
  if (states.some((s) => s === 'loading')) return 'loading'
  if (states.some((s) => s === 'error')) return 'error'
  if (states.every((s) => s === 'available')) return 'available'
  return 'unavailable'
}
