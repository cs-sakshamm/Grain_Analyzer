import { useState } from 'react'

import { Button } from '@/components/common/Button'
import { Spinner } from '@/components/common/Spinner'
import { cn } from '@/utils/cn'
import type { SetupPayload } from '@/types/setup'
import type { AnalysisResults, ResultsAvailability } from '@/types/results'
import {
  REPORT_GENERATION_STATUS,
  REPORT_TYPES,
  reportSectionAvailability,
  type ReportTypeId,
} from '@/types/report'

export interface ReportPanelProps {
  /** Current analysis results; controls real availability states. */
  results: AnalysisResults | null
  /** Setup data associated with this analysis (may be null). */
  setup: SetupPayload | null
  /** Navigate back to setup, clearing prior analysis state (Rescan). */
  onRescan: () => void
}

const SECTION_AVAILABILITY_LABEL: Record<ResultsAvailability, string> = {
  available: 'Data available',
  loading: 'Data loading',
  unavailable: 'Data not available',
  error: 'Data error',
}

/**
 * Report panel on the Results screen.
 *
 * Phase 6 ships the selection and availability UI only: report generation
 * is not connected (REPORT_GENERATION_STATUS = 'not_connected'), so the
 * download control stays disabled with an explicit reason. No fake PDFs,
 * no fake links, no fabricated content. Selection is stored in local state
 * and never mutates analysis results.
 */
export function ReportPanel({ results, setup, onRescan }: ReportPanelProps) {
  const [selectedReport, setSelectedReport] = useState<ReportTypeId>('complete')
  const [downloadError, setDownloadError] = useState<string | null>(null)
  // Download attempts can only occur once a real generator exists; the
  // Phase 6 UI keeps the control disabled, so no progress state is faked.

  const selectedDefinition =
    REPORT_TYPES.find((r) => r.id === selectedReport) ?? REPORT_TYPES[0]

  const generationConnected = REPORT_GENERATION_STATUS === 'ready'

  return (
    <div className="space-y-4">
      <fieldset className="m-0 border-0 p-0">
        <legend className="text-label font-semibold uppercase tracking-wide text-ink-muted">
          Report type
        </legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="Report type">
          {REPORT_TYPES.map((report) => {
            const sectionState = reportSectionAvailability(report, results)
            const isSelected = selectedReport === report.id
            return (
              <button
                key={report.id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => {
                  setDownloadError(null)
                  setSelectedReport(report.id)
                }}
                className={cn(
                  'flex w-full flex-col gap-1 rounded-lg border p-3 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600',
                  isSelected
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-border bg-surface text-ink hover:border-primary-400',
                )}
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="text-label font-medium">{report.name}</span>
                  <span
                    className={cn(
                      'shrink-0 rounded-full px-2 py-0.5 text-meta font-medium',
                      sectionState === 'available'
                        ? 'bg-success-soft text-success'
                        : sectionState === 'loading'
                          ? 'bg-muted text-ink-muted'
                          : sectionState === 'error'
                            ? 'bg-danger-soft text-danger'
                            : 'bg-muted text-ink-muted',
                    )}
                  >
                    {SECTION_AVAILABILITY_LABEL[sectionState]}
                  </span>
                </span>
                <span className="text-helper text-ink-muted">{report.description}</span>
              </button>
            )
          })}
        </div>
      </fieldset>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button
          variant="primary"
          size="md"
          disabled={!generationConnected}
          aria-describedby="report-availability-note"
        >
          Download {selectedDefinition.name}
        </Button>
        <Button variant="secondary" size="md" onClick={onRescan}>
          Rescan — New Analysis
        </Button>
        <span id="report-availability-note" className="sr-only">
          {SECTION_AVAILABILITY_LABEL[
            reportSectionAvailability(selectedDefinition, results)
          ]}; report generation is not connected yet.
        </span>
      </div>

      {!generationConnected && (
        <p className="text-helper text-ink-muted">
          Report downloads are unavailable — report generation is not connected
          yet. The options above show which reports {setup === null ? 'will' : 'now'} have
          the analysis data they need. No file is produced until generation is
          connected.
        </p>
      )}

      {downloadError !== null && (
        <p role="alert" className="text-helper text-danger">
          {downloadError}
        </p>
      )}

      <p className="text-helper text-ink-muted">
        Rescan returns to the setup screen and clears the previous analysis
        state, so a new sample starts fresh.
      </p>
    </div>
  )
}

/**
 * Small helper preserved for future use: the panel may show a spinner while
 * a genuine generator works. Kept out of the button to avoid implying
 * activity that cannot currently occur. (Unused placeholder retained
 * intentionally for the Phase 7 integration.)
 */
export function ReportDownloadProgress() {
  return (
    <span className="inline-flex items-center gap-2 text-label text-ink-muted">
      <Spinner size="sm" className="text-primary-600" />
      Generating report…
    </span>
  )
}
