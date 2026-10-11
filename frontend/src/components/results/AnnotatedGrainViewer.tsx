import { useState } from 'react'

import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { Spinner } from '@/components/common/Spinner'
import type { AnnotatedImageResult, ResultsAvailability } from '@/types/results'

export interface AnnotatedGrainViewerProps {
  /** Annotated image data supplied by a real analysis source. */
  data: AnnotatedImageResult | undefined
  availability: ResultsAvailability
  /** Message supplied by a genuine analysis failure, if any. */
  errorMessage?: string
}

/**
 * Annotated grain-image viewer.
 *
 * The original image is never modified: polygons are drawn in a transparent
 * absolutely-positioned SVG overlay. The SVG uses the image's natural pixel
 * dimensions as its viewBox, so polygon coordinates scale together with the
 * image when the container resizes, and the original aspect ratio is
 * preserved.
 *
 * Coordinate handling: polygons in 'pixel' space are used as-is against
 * naturalWidth/naturalHeight; polygons in 'normalized' space are converted
 * to natural pixels by multiplying by image width/height. The coordinate
 * space is declared by the analysis and never assumed.
 */
export function AnnotatedGrainViewer({
  data,
  availability,
  errorMessage,
}: AnnotatedGrainViewerProps) {
  const [loadFailed, setLoadFailed] = useState(false)

  if (availability === 'loading') {
    return (
      <div className="flex items-center gap-2 px-1 py-4 text-body text-ink-muted">
        <Spinner size="sm" className="text-primary-600" />
        Awaiting annotated image…
      </div>
    )
  }

  if (availability === 'error') {
    return (
      <ErrorState
        title="Image error"
        message={errorMessage ?? 'No genuine annotated image could be loaded.'}
        className="py-2"
      />
    )
  }

  if (
    availability === 'unavailable' ||
    data === undefined ||
    data.imageUrl === undefined
  ) {
    return (
      <EmptyState
        title="Not available yet"
        description="The annotated grain image will appear here once image acquisition and analysis are connected. No sample imagery exists for this analysis yet."
        className="py-6"
      />
    )
  }

  if (loadFailed) {
    return (
      <ErrorState
        title="Image could not be loaded"
        message="The image file could not be retrieved. The analysis data itself is unaffected."
        className="py-2"
      />
    )
  }

  const {
    imageUrl,
    polygons = [],
    coordinateSpace = 'pixel',
    imageWidth,
    imageHeight,
    caption,
  } = data

  const unknownDimensions = imageWidth === undefined || imageHeight === undefined

  const handleImageError = () => setLoadFailed(true)

  return (
    <div className="space-y-2">
      <div className="w-full">
        {unknownDimensions && polygons.length > 0 && (
          <p className="mb-2 text-helper text-danger">
            Polygon coordinates cannot be aligned: the original image
            dimensions were not supplied by the analysis.
          </p>
        )}
        <figure className="relative m-0 inline-block max-w-full overflow-hidden rounded-lg border border-border bg-muted">
          <img
            src={imageUrl}
            alt={caption ?? 'Original grain sample image'}
            onError={handleImageError}
            className="block h-auto max-h-96 w-auto max-w-full"
            // naturalWidth/naturalHeight anchor the viewBox for pixel-space
            // polygons; the analysis may also declare imageWidth/Height.
            {...(imageWidth !== undefined && imageHeight !== undefined
              ? { width: imageWidth, height: imageHeight }
              : {})}
          />
          {polygons.length > 0 &&
            imageWidth !== undefined &&
            imageHeight !== undefined && (
              <svg
                aria-hidden="true"
                viewBox={`0 0 ${imageWidth} ${imageHeight}`}
                preserveAspectRatio="xMidYMid meet"
                className="pointer-events-none absolute inset-0 h-full w-full"
              >
                {polygons.map((polygon) => {
                  const points = polygon.points
                    .map(([x, y]) => {
                      const px =
                        coordinateSpace === 'normalized'
                          ? x * imageWidth
                          : x
                      const py =
                        coordinateSpace === 'normalized'
                          ? y * imageHeight
                          : y
                      return `${px},${py}`
                    })
                    .join(' ')
                  return (
                    <polygon
                      key={polygon.id}
                      points={points}
                      fill="none"
                      stroke="#5451df"
                      strokeWidth={Math.max(imageWidth, imageHeight) * 0.0025}
                      strokeLinejoin="round"
                    />
                  )
                })}
              </svg>
            )}
        </figure>
        {caption !== undefined && (
          <figcaption className="mt-1 text-helper text-ink-muted">{caption}</figcaption>
        )}
      </div>
    </div>
  )
}
