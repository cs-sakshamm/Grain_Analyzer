# API layer

This directory is reserved for the frontend API layer that will communicate with the
grain-analysis backend. **Nothing is implemented here in Phase 1** — the frontend runs
with no backend dependency.

## Planned contract (conceptual, not implemented)

- `POST /analysis` — start an analysis run
- `GET /analysis/{id}/status` — poll processing status
- `GET /analysis/{id}/results` — fetch completed results
- `GET /analysis/{id}/report` — download the generated report

## Rules until backend integration begins

- No network clients, no fake responses, no fixtures in this directory.
- Result types will be defined once the backend contract is known.
