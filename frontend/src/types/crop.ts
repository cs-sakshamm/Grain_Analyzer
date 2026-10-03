/** Identifier for a crop supported by the analyzer. */
export type CropId = 'paddy' | 'rice'

/** A crop the analyzer can be configured to analyse. */
export interface Crop {
  id: CropId
  name: string
}
