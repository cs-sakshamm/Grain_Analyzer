# API Contract — Grain Analyzer (Proposed)

> **Status: proposal.** No backend implements these endpoints yet. This document is
> the agreed target contract for the future analysis service (Phase 7+). Nothing in
> the frontend assumes these endpoints exist; without `VITE_API_BASE_URL` the app
> runs in an explicit disconnected state.

All endpoints are versioned under `/api/v1`. JSON bodies are UTF-8. Errors use a
consistent envelope:

```json
{ "error": { "code": "validation_error", "message": "Human-readable summary." } }
```

| Status | Meaning |
| ------ | ------- |
| 400 | Request validation failed (`validation_error`) |
| 404 | Unknown analysis id (`not_found`) |
| 409 | Analysis not in a state that allows the operation (`conflict`) |
| 422 | Semantically invalid payload (`unprocessable`) |
| 500 | Unexpected server failure (`internal_error`) |
| 503 | Service unavailable (analyzer offline) (`service_unavailable`) |

---

## A. Start analysis

`POST /api/v1/analysis`

Request:

```json
{
  "crop": "paddy",
  "lot_number": "LOT-2026-0142",
  "sample_weight_g": 100.0,
  "moisture_pct": 17.5
}
```

Validation rules:

- `crop`: enum `paddy | rice` (required)
- `lot_number`: non-empty string, trimmed (required)
- `sample_weight_g`: finite number > 0 (required)
- `moisture_pct`: finite number, 0 ≤ x ≤ 100 (required)

Responses:

- `202 Accepted` — analysis accepted.

```json
{
  "analysis_id": "a1b2c3d4-…",   // genuinely server-generated, opaque to the client
  "status": "queued"
}
```

- `400`/`422` — validation error envelope.
- `503` — analyzer not accepting samples:

```json
{ "error": { "code": "service_unavailable", "message": "Analyzer is not accepting samples." } }
```

The client must never synthesize an `analysis_id`. If this endpoint fails or is
unconfigured, the frontend shows an explicit disconnected/error state instead of
proceeding to processing.

## B. Analysis status

`GET /api/v1/analysis/{analysis_id}/status`

Response `200`:

```json
{
  "analysis_id": "a1b2c3d4-…",
  "status": "processing",          // queued | processing | completed | failed
  "progress": 42.0,                // optional; genuine backend-reported 0–100
  "message": "Grading batch 3/7",  // optional
  "error": {                       // optional; only when status = failed
    "code": "image_capture_failed",
    "message": "No usable frame from the sample tray."
  }
}
```

Progress semantics:

- `progress` is a **backend-measured** percentage (0–100, finite). The frontend
  renders it only when supplied and valid; otherwise it shows an indeterminate
  spinner. The frontend never derives progress from elapsed time and never
  increments locally.
- `queued`/`processing` → keep polling. `completed`/`failed` → terminal; stop.

## C. Analysis results

`GET /api/v1/analysis/{analysis_id}/results`

Only return fields the pipeline genuinely produced — absent sections are omitted
rather than zero-filled.

```json
{
  "analysis_id": "a1b2c3d4-…",
  "composition": {
    "categories": [
      { "id": "whole", "name": "Whole grains", "count": 812, "percent": 81.2 },
      { "id": "broken", "name": "Broken grains", "count": 143, "percent": 14.3 }
    ],
    "total_grains": 1000,
    "unit": "grains"
  },
  "quality": {
    "observations": [
      { "id": "discolored", "name": "Discolored", "count": 45, "percent": 4.5 }
    ]
  },
  "uniformity": {
    "measurements": [
      {
        "id": "length",
        "name": "Grain length",
        "unit": "mm",
        "distribution": [{ "bin_start": 5.0, "bin_end": 5.5, "count": 120 }]
      }
    ]
  },
  "image": {
    "image_url": "/media/analysis/a1b2c3d4/original.png",
    "coordinate_space": "pixel",   // "pixel" or "normalized" — declared, never guessed
    "image_width": 4032,
    "image_height": 3024,
    "polygons": [
      { "id": "g1", "category_id": "whole", "points": [[10, 12], [52, 14], [40, 60]] }
    ],
    "caption": "Original tray image with grain boundaries"
  }
}
```

Coordinate system requirements:

- `coordinate_space` must be present whenever `polygons` are returned.
- `pixel`: integer/float coordinates in **original-image pixel space**; the client
  scales overlays against `image_width`/`image_height` (or the image's natural
  size). Image dimensions must accompany polygon data.
- `normalized`: coordinates in 0..1 relative to image width/height.
- No other coordinate spaces are supported; the client rejects undeclared ones.

Validation rules the client enforces before rendering:

- counts: finite, ≥ 0; percentages: finite, 0–100; weighted sums must be
  consistent with `total_grains` (partition) unless per-category percentages are
  supplied and total ~100.
- bin edges: finite, `bin_end ≥ bin_start`; counts finite, ≥ 0.
- results belong to the requesting `analysis_id` (field must match).

Errors: `404` unknown analysis, `409` results not ready (`conflict`), `500`.

## D. Report download

`GET /api/v1/analysis/{analysis_id}/report?type={report_type}`

`type` ∈ `complete | composition | uniformity | detailed`.

Responses:

- `200` with `Content-Type: application/pdf` and a non-empty genuine PDF body.
- `404` unknown analysis; `422` unsupported `type`; `409` report not yet
  producible (missing dependent results); `503` generation service down.
- Any non-PDF response is treated as an error by the client — never saved as a
  download.

---

## Frontend behavior when the backend is absent

- `VITE_API_BASE_URL` unset → all integration points surface the explicit state
  "Analysis service is not connected yet." No request is made (not even to the
  dev server origin).
- Network/HTTP/parse failures always surface as errors; the client never
  fabricates fallback data, progress, or results.
