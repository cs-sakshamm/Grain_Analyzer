/**
 * Results model — deliberately shaped around what a real grain-analysis
 * backend will supply (Phase 7). All fields are optional; a missing field
 * means "not supplied by a genuine analysis source", never a valid zero or
 * empty measurement. No fabricated data may ever populate this schema.
 */
export type ResultsAvailability = 'unavailable' | 'loading' | 'available' | 'error'

/** A single grain category in the composition breakdown. */
export interface GrainCategory {
  /** Stable identifier, e.g. 'whole'. */
  id: string
  /** Human-readable name shown on the results screen. */
  name: string
  /** Absolute grain count. Only when the backend supplies it. */
  count?: number
  /** Share of the sample in percent. Only when the backend supplies it. */
  percent?: number
}

/**
 * Crop composition payload. `totalGrains` is the analysis's own measured
 * total; the UI derives percentages only when supplied or derivable from a
 * valid partition. Categories are assumed mutually exclusive ONLY when the
 * counts actually sum to the total — verified before charting.
 */
export interface CompositionResult {
  availability: ResultsAvailability
  categories?: GrainCategory[]
  /** Total grains measured by the analysis, when the backend provides it. */
  totalGrains?: number
  /** Unit of the count field, e.g. 'grains'. Shown in the summary. */
  unit?: string
}

/** One detected defect or quality observation. */
export interface QualityObservation {
  id: string
  name: string
  /** Occurrence count. Only when the backend supplies it. */
  count?: number
  /** Share of the sample in percent. Only when the backend supplies it. */
  percent?: number
  /** Free-text note from the analysis, if provided. */
  note?: string
}

/** Grain quality observations section payload. */
export interface QualityResult {
  availability: ResultsAvailability
  observations?: QualityObservation[]
}

/**
 * A uniformity measurement. `distribution` carries binned data (e.g. a
 * length histogram); `value` carries a single scalar (e.g. a coefficient of
 * variation). Both are optional and only meaningful when the analysis
 * supplies them with real units.
 */
export interface Measurement {
  id: string
  name: string
  /** Unit such as 'mm', '%', or 'CV'. Only when the backend supplies it. */
  unit?: string
  /** Scalar measurement value. Only when the backend supplies it. */
  value?: number
  /**
   * Binned distribution for histogram rendering. Bin edges and counts use
   * the units the analysis documents; nothing is invented by the UI.
   */
  distribution?: Array<{
    /** Lower edge of the bin, in the measurement's unit. */
    binStart: number
    /** Upper edge of the bin, in the measurement's unit. */
    binEnd: number
    /** Grain count in this bin. Only when the backend supplies it. */
    count: number
  }>
}

/** Uniformity & measurements section payload. */
export interface UniformityResult {
  availability: ResultsAvailability
  measurements?: Measurement[]
}

/**
 * Coordinate space of the polygon annotation data. Declared explicitly so
 * the viewer never assumes a convention: 'pixel' coordinates are in the
 * ORIGINAL image's pixel space (scaled against naturalWidth/naturalHeight);
 * 'normalized' coordinates are 0..1 relative to image width/height.
 */
export type PolygonCoordinateSpace = 'pixel' | 'normalized'

/** One annotated grain: a polygon of points in the declared coordinate space. */
export interface GrainPolygon {
  /** Stable identifier, e.g. matching a category id. */
  id: string
  /** Category this grain was classified as, if the analysis supplies one. */
  categoryId?: string
  /** Polygon vertices, alternating x/y in the declared coordinate space. */
  points: Array<[number, number]>
}

/** Annotated grain image shown on the results screen. */
export interface AnnotatedImageResult {
  availability: ResultsAvailability
  /** URL (or blob URL) of the ORIGINAL grain image, when acquisition exists. */
  imageUrl?: string
  /** Polygon annotations to draw over the original image. */
  polygons?: GrainPolygon[]
  /** Coordinate space of the polygon data, declared by the analysis. */
  coordinateSpace?: PolygonCoordinateSpace
  /** Original image dimensions in pixels, when the analysis supplies them. */
  imageWidth?: number
  imageHeight?: number
  /** Optional caption supplied with the real image. */
  caption?: string
}

/**
 * Complete analysis results for one sample. `availability` refers to the
 * whole payload; sections carry their own availability so partially
 * populated results can be rendered honestly.
 */
export interface AnalysisResults {
  availability: ResultsAvailability
  composition?: CompositionResult
  quality?: QualityResult
  uniformity?: UniformityResult
  image?: AnnotatedImageResult
  /** Message supplied by a genuine failure (never invented by the UI). */
  errorMessage?: string
}
