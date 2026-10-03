import type { Crop } from '@/types/crop'

/**
 * Crops supported by the analyzer, defined centrally so the rest of the
 * application never hardcodes crop identifiers. New crops are added here only.
 */
export const SUPPORTED_CROPS: readonly Crop[] = [
  { id: 'paddy', name: 'Paddy' },
  { id: 'rice', name: 'Rice' },
]
