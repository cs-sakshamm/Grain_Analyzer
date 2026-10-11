import type { CropId } from './crop'

/**
 * Setup information captured on the Analysis Setup screen.
 * This is the payload Phase 3 will consume when the processing step is
 * implemented. No fake or example values are introduced anywhere in Phase 2.
 */
export interface SetupPayload {
  crop: CropId
  lotNumber: string
  sampleWeight: number
  moisture: number
}

/** For convenience, the payload plus a stable label for screen navigation. */
export type CurrentSetup = SetupPayload

/**
 * Lifecycle of the processing stage. Phase 3 sets these honestly: without a
 * backend only 'not_connected' is ever shown. 'queued'/'processing'/'completed'
 * /'failed' become reachable when a genuine processing source exists.
 */
export type ProcessingStatus =
  | 'not_connected'
  | 'queued'
  | 'processing'
  | 'completed'
  | 'failed'

/**
 * What the Processing screen renders. An optional numeric progress may be
 * supplied later by the real backend; the UI never fabricates one.
 */
export interface ProcessingStateInfo {
  status: ProcessingStatus
  /** Human-readable line shown with the status, e.g. an API-provided message. */
  message?: string
  /** Genuine progress 0–100 when (and only when) a real source provides it. */
  progressPercent?: number
}
