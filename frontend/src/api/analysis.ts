import type { AnalysisResults } from '@/types/results'
import type { ReportTypeId } from '@/types/report'
import type { SetupPayload } from '@/types/setup'
import {
  parseJsonWith,
  request,
  requestPdf,
  toStartAnalysisRequest,
  validateAnalysisResults,
  validateStatusPayload,
} from './client'
import { ApiError } from './errors'

/** A server-issued analysis handle. The client never invents one of these. */
export interface AnalysisHandle {
  analysisId: string
}

/**
 * Starts an analysis on the backend. Resolves only when the server accepted
 * the request and returned a genuine id; every failure raises ApiError.
 */
export async function startAnalysis(setup: SetupPayload): Promise<AnalysisHandle> {
  const response = await request('/api/v1/analysis', {
    method: 'POST',
    body: toStartAnalysisRequest(setup),
  })
  return parseJsonWith(
    response,
    (data) => {
      if (
        data !== null &&
        typeof data === 'object' &&
        typeof (data as Record<string, unknown>).analysis_id === 'string' &&
        ((data as Record<string, unknown>).analysis_id as string).length > 0
      ) {
        return { analysisId: (data as Record<string, unknown>).analysis_id as string }
      }
      return null
    },
    'start analysis',
  )
}

/** Latest backend-reported status for an analysis. */
export async function fetchAnalysisStatus(analysisId: string) {
  const response = await request(
    `/api/v1/analysis/${encodeURIComponent(analysisId)}/status`,
  )
  return parseJsonWith(response, validateStatusPayload, 'analysis status')
}

/**
 * Analysis results, validated against the domain contracts and checked to
 * belong to the requested analysis before being returned.
 */
export async function fetchAnalysisResults(
  analysisId: string,
): Promise<AnalysisResults> {
  const response = await request(
    `/api/v1/analysis/${encodeURIComponent(analysisId)}/results`,
  )
  return parseJsonWith(
    response,
    (data) => validateAnalysisResults(data, analysisId),
    'analysis results',
  )
}

/**
 * Downloads a genuine PDF report as a Blob. Rejects with ApiError when the
 * endpoint is unavailable, when an unexpected (non-PDF) body comes back, or
 * when the PDF body is empty. Never returns a fabricated stand-in.
 */
export async function downloadReport(
  analysisId: string,
  reportType: ReportTypeId,
): Promise<Blob> {
  const path = `/api/v1/analysis/${encodeURIComponent(analysisId)}/report?type=${encodeURIComponent(reportType)}`
  try {
    return await requestPdf(path, () => new ApiError('report_unavailable', 'The server did not return a PDF report.'))
  } catch (error) {
    if (error instanceof ApiError && error.kind === 'backend_not_configured') {
      // Surface as the more explicit report-unavailable condition.
      throw new ApiError('report_unavailable', 'Report generation is not connected yet.')
    }
    throw error
  }
}
