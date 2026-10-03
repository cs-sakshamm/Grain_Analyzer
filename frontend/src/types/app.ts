/**
 * High-level phases of the analysis workflow.
 *
 * The phase state machine (Setup -> Processing -> Results) is introduced in a
 * later phase; this type is the shared contract for it.
 */
export type AppPhase = 'setup' | 'processing' | 'results' | 'error'
