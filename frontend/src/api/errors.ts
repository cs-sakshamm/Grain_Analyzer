/**
 * Typed error model for the API integration layer. Each variant maps to a
 * distinct user-facing situation; the screens translate these into concise,
 * actionable messages without exposing stack traces or raw internals.
 */
export type ApiErrorKind =
  /** No VITE_API_BASE_URL configured — deliberate disconnected state. */
  | 'backend_not_configured'
  /** fetch itself failed (DNS, offline, CORS, connection refused). */
  | 'network'
  /** Request exceeded the configured timeout. */
  | 'timeout'
  /** Server answered with a 4xx validation/conflict status. */
  | 'request_invalid'
  /** Server answered with a 5xx status. */
  | 'server'
  /** Response body was not parseable as the expected shape. */
  | 'malformed_response'
  /** Response parsed but failed domain validation (e.g. bad results data). */
  | 'invalid_data'
  /** The requested analysis id does not exist (404). */
  | 'analysis_not_found'
  /** Report generation was requested but is not connected. */
  | 'report_unavailable'

export class ApiError extends Error {
  readonly kind: ApiErrorKind
  /** HTTP status when the server responded; otherwise undefined. */
  readonly status?: number
  /** Machine-readable error code from the API error envelope, when present. */
  readonly errorCode?: string

  constructor(
    kind: ApiErrorKind,
    message: string,
    options?: { status?: number; errorCode?: string },
  ) {
    super(message)
    this.name = 'ApiError'
    this.kind = kind
    this.status = options?.status
    this.errorCode = options?.errorCode
  }
}

/** Concise, actionable user-facing message per error kind. */
export function userMessageFor(error: ApiError): string {
  switch (error.kind) {
    case 'backend_not_configured':
      return 'Analysis service is not connected yet.'
    case 'network':
      return 'Could not reach the analysis service. Check the connection and try again.'
    case 'timeout':
      return 'The analysis service took too long to respond. Try again.'
    case 'request_invalid':
      return 'The request was rejected. Check the sample details and try again.'
    case 'server':
      return 'The analysis service reported an internal problem. Try again later.'
    case 'malformed_response':
    case 'invalid_data':
      return 'The analysis service returned data that could not be used.'
    case 'analysis_not_found':
      return 'This analysis could not be found. It may have expired — start a new analysis.'
    case 'report_unavailable':
      return 'Report generation is not connected yet.'
  }
}

const MAX_LOG_BODY = 300

/**
 * Development-only diagnostic logging: logs the error kind and a truncated,
 * non-sensitive response summary. Never logs request payloads or stack data
 * in production.
 */
export function logDiagnostic(context: string, error: unknown): void {
  if (!import.meta.env.DEV) return
  const summary =
    error instanceof ApiError
      ? `${error.kind}${error.status !== undefined ? ` (HTTP ${error.status})` : ''}${error.errorCode !== undefined ? ` code=${error.errorCode}` : ''}`
      : String(error).slice(0, MAX_LOG_BODY)
  // eslint-disable-next-line no-console -- dev diagnostics only
  console.debug(`[api] ${context}: ${summary}`)
}
