/**
 * Application-level configuration.
 * Single source of truth for product identity — never hardcode these values
 * in individual components.
 */
export const APP_CONFIG = {
  /** Product name shown in the header and document title. */
  name: 'Grain Analyzer',
  /** Workflow stages planned for upcoming phases (display only for now). */
  workflowStages: ['Setup', 'Processing', 'Results', 'Report'],
} as const
