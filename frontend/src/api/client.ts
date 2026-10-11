import type { AnalysisResults } from '@/types/results'
import type { SetupPayload } from '@/types/setup'
import { ApiError, logDiagnostic } from './errors'

/**
 * API base URL configuration. The URL comes from `VITE_API_BASE_URL`; when
 * it is absent the layer is in an explicit disconnected state and makes no
 * requests at all (in particular, none to the Vite dev server origin).
 * No secrets belong in frontend env vars — this is a URL only.
 */
const ENV = import.meta.env as { readonly VITE_API_BASE_URL?: string }
export const API_BASE_URL: string | null =
  ENV.VITE_API_BASE_URL !== undefined && ENV.VITE_API_BASE_URL.trim() !== ''
    ? ENV.VITE_API_BASE_URL.trim().replace(/\/+$/, '')
    : null

export function isBackendConfigured(): boolean {
  return API_BASE_URL !== null
}

const DEFAULT_TIMEOUT_MS = 10_000

/** DOM exception name that indicates an aborted fetch. */
const ABORT_NAME = 'AbortError'

/**
 * Performs a request against the configured backend. Rejects with `ApiError`
 * for every failure mode (unconfigured, network, timeout, HTTP, malformed
 * JSON). Never fabricates fallback data.
 */
export async function request(
  path: string,
  init: { method?: 'GET' | 'POST'; body?: unknown; timeoutMs?: number } = {},
): Promise<Response> {
  if (API_BASE_URL === null) {
    throw new ApiError('backend_not_configured', 'API base URL is not configured.')
  }

  const controller = new AbortController()
  const timeout = setTimeout(
    () => controller.abort(),
    init.timeoutMs ?? DEFAULT_TIMEOUT_MS,
  )

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: init.method ?? 'GET',
      headers:
        init.body !== undefined
          ? { 'Content-Type': 'application/json' }
          : undefined,
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
      signal: controller.signal,
    })
    if (!response.ok) {
      await rejectWithHttpError(response)
    }
    return response
  } catch (error) {
    if (error instanceof ApiError) throw error
    if (error instanceof DOMException && error.name === ABORT_NAME) {
      throw new ApiError('timeout', `Request to ${path} timed out.`)
    }
    logDiagnostic(`network failure on ${path}`, error)
    throw new ApiError('network', `Request to ${path} failed.`)
  } finally {
    clearTimeout(timeout)
  }
}

/**
 * Converts a non-2xx response into a typed ApiError, draining the error
 * envelope when the server sent one. Unexpected envelope shapes still
 * surface as request/server errors rather than crashing.
 */
async function rejectWithHttpError(response: Response): Promise<never> {
  const status = response.status
  let errorCode: string | undefined
  try {
    const parsed: unknown = await response.json()
    if (
      parsed !== null &&
      typeof parsed === 'object' &&
      typeof (parsed as Record<string, unknown>).error === 'object' &&
      (parsed as Record<string, unknown>).error !== null
    ) {
      const envelope = (parsed as Record<string, unknown>).error as Record<
        string,
        unknown
      >
      if (typeof envelope.code === 'string') errorCode = envelope.code
    }
  } catch {
    // Non-JSON error body is fine; the status code carries the meaning.
  }
  if (status === 404) {
    throw new ApiError('analysis_not_found', 'Analysis not found.', {
      status,
      errorCode,
    })
  }
  if (status >= 400 && status < 500) {
    throw new ApiError('request_invalid', `Request rejected (HTTP ${status}).`, {
      status,
      errorCode,
    })
  }
  throw new ApiError('server', `Server error (HTTP ${status}).`, {
    status,
    errorCode,
  })
}

/**
 * Parses a JSON response and validates it with the supplied validator.
 * Malformed JSON or a failed validation raises `malformed_response` /
 * `invalid_data` — never a silently-typed appeasement.
 */
export async function parseJsonWith<T>(
  response: Response,
  validate: (data: unknown) => T | null,
  context: string,
): Promise<T> {
  let data: unknown
  try {
    data = await response.json()
  } catch (error) {
    logDiagnostic(`${context}: malformed JSON`, error)
    throw new ApiError('malformed_response', `${context}: malformed JSON body.`)
  }
  const validated = validate(data)
  if (validated === null) {
    logDiagnostic(`${context}: validation failed`, 'payload rejected')
    throw new ApiError('invalid_data', `${context}: response failed validation.`)
  }
  return validated
}

/**
 * Fetches a genuine PDF report as a Blob. Validates the status and content
 * type: any non-PDF answer is an error, never a fake or empty download.
 */
export async function requestPdf(
  path: string,
  apiErrorOnUnexpected: (status: number) => ApiError,
): Promise<Blob> {
  const response = await request(path)
  const contentType = response.headers.get('Content-Type') ?? ''
  if (!contentType.includes('application/pdf')) {
    logDiagnostic(`report ${path}: unexpected content type`, contentType)
    throw apiErrorOnUnexpected(response.status)
  }
  const blob = await response.blob()
  if (blob.size === 0) {
    throw new ApiError(
      'report_unavailable',
      'The server returned an empty report.',
    )
  }
  return blob
}

/**
 * Domain validators shared by the analysis functions. These run BEFORE
 * results reach the visualization components, preserving the Phase 5 rules.
 */

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function isNonNegativeCount(value: unknown): value is number {
  return isFiniteNumber(value) && value >= 0
}

function isPercent(value: unknown): value is number {
  return isFiniteNumber(value) && value >= 0 && value <= 100
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

/**
 * Validates an analysis-status payload. Returns null for anything that does
 * not satisfy the contract (bad state string, non-numeric progress, etc.).
 * Optional fields are validated only when present.
 */
export function validateStatusPayload(data: unknown): {
  analysisId: string
  status: 'queued' | 'processing' | 'completed' | 'failed'
  progress?: number
  message?: string
  errorMessage?: string
} | null {
  if (!isRecord(data)) return null
  const { analysis_id: analysisId, status, progress, message, error } = data
  if (typeof analysisId !== 'string' || analysisId === '') return null
  if (
    status !== 'queued' &&
    status !== 'processing' &&
    status !== 'completed' &&
    status !== 'failed'
  ) {
    return null
  }
  if (
    progress !== undefined &&
    (!isFiniteNumber(progress) || progress < 0 || progress > 100)
  ) {
    return null
  }
  if (message !== undefined && typeof message !== 'string') return null
  if (
    error !== undefined &&
    !(
      isRecord(error) &&
      typeof (error as Record<string, unknown>).message === 'string'
    )
  ) {
    return null
  }
  return {
    analysisId,
    status,
    progress: progress as number | undefined,
    message: message as string | undefined,
    errorMessage:
      error !== undefined
        ? ((error as Record<string, string>).message as string)
        : undefined,
  }
}

/**
 * Validates the analysis-results payload against the domain contracts:
 * composition counts/percent ranges, distribution bin sanity, image
 * dimensions when polygons exist. Rejects (returns null) any payload that
 * would produce misleading visualizations.
 */
export function validateResultsPayload(
  data: unknown,
): AnalysisResults | null {
  if (!isRecord(data)) return null
  const results: AnalysisResults = {
    availability: 'available',
    composition: undefined,
    quality: undefined,
    uniformity: undefined,
    image: undefined,
  }

  const composition = data['composition']
  if (composition !== undefined) {
    if (!isRecord(composition)) return null
    const categories = composition['categories']
    if (categories !== undefined) {
      if (!Array.isArray(categories)) return null
      for (const category of categories) {
        if (
          !isRecord(category) ||
          typeof category['id'] !== 'string' ||
          typeof category['name'] !== 'string' ||
          (category['count'] !== undefined &&
            !isNonNegativeCount(category['count'])) ||
          (category['percent'] !== undefined && !isPercent(category['percent']))
        ) {
          return null
        }
      }
      const totalGrains = composition['total_grains']
      if (totalGrains !== undefined && !isNonNegativeCount(totalGrains)) {
        return null
      }
      results.composition = {
        availability: 'available',
        categories: categories.map((category) => {
          const c = category as Record<string, unknown>
          return {
            id: c['id'] as string,
            name: c['name'] as string,
            count: c['count'] as number | undefined,
            percent: c['percent'] as number | undefined,
          }
        }),
        totalGrains: totalGrains as number | undefined,
        unit: (composition['unit'] as string | undefined) ?? undefined,
      }
    }
  }

  const quality = data['quality']
  if (quality !== undefined) {
    if (!isRecord(quality)) return null
    const observations = quality['observations']
    if (observations !== undefined) {
      if (!Array.isArray(observations)) return null
      for (const observation of observations) {
        if (
          !isRecord(observation) ||
          typeof observation['id'] !== 'string' ||
          typeof observation['name'] !== 'string' ||
          (observation['count'] !== undefined &&
            !isNonNegativeCount(observation['count'])) ||
          (observation['percent'] !== undefined &&
            !isPercent(observation['percent']))
        ) {
          return null
        }
      }
      results.quality = {
        availability: 'available',
        observations: observations.map((observation) => {
          const o = observation as Record<string, unknown>
          return {
            id: o['id'] as string,
            name: o['name'] as string,
            count: o['count'] as number | undefined,
            percent: o['percent'] as number | undefined,
            note: o['note'] as string | undefined,
          }
        }),
      }
    }
  }

  const uniformity = data['uniformity']
  if (uniformity !== undefined) {
    if (!isRecord(uniformity)) return null
    const measurements = uniformity['measurements']
    if (measurements !== undefined) {
      if (!Array.isArray(measurements)) return null
      for (const measurement of measurements) {
        if (
          !isRecord(measurement) ||
          typeof measurement['id'] !== 'string' ||
          typeof measurement['name'] !== 'string' ||
          (measurement['value'] !== undefined &&
            !isFiniteNumber(measurement['value']))
        ) {
          return null
        }
        const distribution = measurement['distribution']
        if (distribution !== undefined) {
          if (!Array.isArray(distribution)) return null
          for (const bin of distribution) {
            if (
              !isRecord(bin) ||
              !isFiniteNumber(bin['bin_start']) ||
              !isFiniteNumber(bin['bin_end']) ||
              !isNonNegativeCount(bin['count']) ||
              (bin['bin_end'] as number) < (bin['bin_start'] as number)
            ) {
              return null
            }
          }
        }
      }
      results.uniformity = {
        availability: 'available',
        measurements: measurements.map((measurement) => {
          const m = measurement as Record<string, unknown>
          const bins = m['distribution'] as
            | Array<Record<string, unknown>>
            | undefined
          return {
            id: m['id'] as string,
            name: m['name'] as string,
            unit: m['unit'] as string | undefined,
            value: m['value'] as number | undefined,
            distribution: bins?.map((bin) => ({
              binStart: bin['bin_start'] as number,
              binEnd: bin['bin_end'] as number,
              count: bin['count'] as number,
            })),
          }
        }),
      }
    }
  }

  const image = data['image']
  if (image !== undefined) {
    if (!isRecord(image)) return null
    const coordinateSpace = image['coordinate_space']
    if (
      coordinateSpace !== undefined &&
      coordinateSpace !== 'pixel' &&
      coordinateSpace !== 'normalized'
    ) {
      return null
    }
    const imageWidth = image['image_width']
    const imageHeight = image['image_height']
    if (
      (imageWidth !== undefined && !isNonNegativeCount(imageWidth)) ||
      (imageHeight !== undefined && !isNonNegativeCount(imageHeight))
    ) {
      return null
    }
    const polygons = image['polygons']
    if (polygons !== undefined) {
      if (!Array.isArray(polygons)) return null
      for (const polygon of polygons) {
        if (!isRecord(polygon) || typeof polygon['id'] !== 'string') return null
        const points = polygon['points']
        if (!Array.isArray(points)) return null
        for (const point of points) {
          if (
            !Array.isArray(point) ||
            point.length !== 2 ||
            !isFiniteNumber(point[0]) ||
            !isFiniteNumber(point[1])
          ) {
            return null
          }
        }
      }
      // Polygon data without declared dimensions or coordinate space cannot
      // be aligned; the contract makes both mandatory alongside polygons.
      if (
        coordinateSpace === undefined ||
        imageWidth === undefined ||
        imageHeight === undefined
      ) {
        return null
      }
    }
    results.image = {
      availability: 'available',
      imageUrl: image['image_url'] as string | undefined,
      coordinateSpace: coordinateSpace as 'pixel' | 'normalized' | undefined,
      imageWidth: imageWidth as number | undefined,
      imageHeight: imageHeight as number | undefined,
      polygons: polygons?.map((polygon) => {
        const p = polygon as Record<string, unknown>
        return {
          id: p['id'] as string,
          categoryId: p['category_id'] as string | undefined,
          points: (p['points'] as Array<[number, number]>) ?? [],
        }
      }),
      caption: image['caption'] as string | undefined,
    }
  }

  // Results with no supplied sections at all still validate as an empty-but
  // complete known payload (the caller decides how honest states render).
  return results
}

/**
 * Validates the full results response, enforcing that its analysis_id
 * matches the requested one before any rendering component sees the data.
 */
export function validateAnalysisResults(
  data: unknown,
  expectedAnalysisId: string,
): AnalysisResults | null {
  if (!isRecord(data) || data['analysis_id'] !== expectedAnalysisId) {
    return null
  }
  return validateResultsPayload(data)
}

/** Type guard for a valid SetupPayload conversion to the wire format. */
export function toStartAnalysisRequest(
  setup: SetupPayload,
): Record<string, unknown> {
  return {
    crop: setup.crop,
    lot_number: setup.lotNumber,
    sample_weight_g: setup.sampleWeight,
    moisture_pct: setup.moisture,
  }
}
