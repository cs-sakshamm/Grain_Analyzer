# Grain Analyzer — Rice Quality Analyzer Frontend

A frontend for an affordable, AI-powered grain-quality analyzer supporting two crops: **Paddy** and **Rice**. The design takes inspiration from commercial instruments (Nebulaa Innovations' MATT) while remaining an independent implementation.

**Important:** this repository currently contains the **frontend only**. It is not connected to a working AI analysis backend. You can enter sample details and navigate the analysis workflow, but no actual grain analysis, AI/ML processing, or PDF report generation runs yet — see [Current feature status](#2-current-feature-status).

The intended user workflow is:

```
Analysis Setup → Processing → Results → Download Report or Rescan
```

## Table of contents

1. [Project overview](#1-project-title-and-overview)
2. [Current feature status](#2-current-feature-status)
3. [Technology stack](#3-technology-stack)
4. [Prerequisites](#4-prerequisites)
5. [Installation](#5-installation)
6. [Environment configuration](#6-environment-configuration)
7. [Available commands](#7-available-commands)
8. [Project structure](#8-project-structure)
9. [Application workflow](#9-application-workflow)
10. [API contract](#10-api-contract)
11. [Data integrity](#11-data-integrity)
12. [Troubleshooting](#12-troubleshooting)
13. [Testing and verification](#13-testing-and-verification)
14. [Roadmap and limitations](#14-roadmap-and-limitations)
15. [Contribution and development guidance](#15-contribution-and-development-guidance)
16. [License](#16-license)

## 1. Project title and overview

The Grain Analyzer frontend is the operator interface for a desktop grain-quality
measurement instrument. A user enters sample details (lot number, sample weight,
moisture), selects the crop (**Paddy** or **Rice**), and follows the workflow
above to review grain-composition and uniformity statistics once analysis data
becomes available.

**What exists today:** the full frontend — setup form with validation, a
processing screen that honestly states the backend is not connected, a results
screen with honest empty/unavailable states, visualization components ready to
render real data, a report selector, and a typed API integration layer prepared
for a future backend.

**What does not exist today:** the analysis backend, AI/ML models, image
acquisition, and PDF generation. No fake or placeholder analysis data appears
anywhere in the app by design.

## 2. Current feature status

| Feature | Status | Notes |
| --- | --- | --- |
| Analysis Setup (lot, weight, moisture, crop) | ✅ Implemented (frontend) | Full client-side validation, accessible crop selection |
| Processing screen | ✅ Implemented (frontend) | Shows honest "not connected yet" state; sample metadata preserved |
| Hash routing (`#setup` / `#processing` / `#results`) | ✅ Implemented (frontend) | Safe on refresh, direct entry, and back/forward navigation |
| Results screen structure | ✅ Implemented (frontend) | Sections render honest unavailable states without real data |
| Composition pie/donut chart | ✅ Implemented (frontend) | Renders only from validated, genuine analysis data (none yet) |
| Uniformity visualization | ✅ Implemented (frontend) | Histogram/scalars render only from validated data (none yet) |
| Annotated grain-image viewer | ✅ Implemented (frontend) | SVG polygon overlay; requires real image + polygon data |
| Report selector (4 report types) | ✅ Implemented (frontend) | Downloads disabled — generation not connected |
| Rescan | ✅ Implemented (frontend) | Clears app-owned analysis state, returns to setup |
| API integration layer and contract | ✅ Implemented (frontend) | Typed client, runtime validation, error model; *proposed* endpoints only |
| Actual AI/ML analysis | ❌ Requires backend | No model, no analysis pipeline |
| Real processing progress | ❌ Requires backend | Frontend never fabricates progress |
| Genuine result retrieval | ❌ Requires backend | Results always come from a validated API response |
| PDF generation and downloads | ❌ Requires backend | No fake PDFs or download links |
| Camera / scanner integration | ❌ Not implemented | Out of frontend scope |

## 3. Technology stack

All dependencies live in [`frontend/package.json`](frontend/package.json).

- **React 19** — UI library; the app uses plain React state (no Redux/Zustand).
- **TypeScript (strict)** — static typing across the codebase.
- **Vite 8** — dev server and production bundler; also provides `import.meta.env` for configuration.
- **Tailwind CSS 4** — styling via utility classes; all design tokens are defined once in `src/index.css` with `@theme`.
- **Oxlint** — fast linter used by `npm run lint`.
- **Hash-based navigation** — plain `window.location.hash` via a small custom hook; no router dependency.

## 4. Prerequisites

You need **Node.js** (which includes **npm**). The project uses Vite 8, which
requires a recent Node version — verify what you have:

```bash
node --version
npm --version
```

If either command is not found, install Node.js from <https://nodejs.org>
(LTS is fine) and re-run the commands.

## 5. Installation

The package manager is **npm** (a `package-lock.json` is committed).

```bash
# 1. Clone the repository (replace the URL with your actual repository URL)
git clone <REPOSITORY-URL-HERE> grain-analyzer
cd grain-analyzer

# 2. Go to the frontend directory
cd frontend

# 3. Install dependencies
npm install

# 4. Start the development server
npm run dev
```

Vite prints a local URL (default `http://localhost:5173`). Open it in a browser.

## 6. Environment configuration

The frontend reads one optional variable: **`VITE_API_BASE_URL`** — the base URL
of the (future) grain-analysis backend.

```bash
# From the frontend directory:
cp .env.example .env.local
```

Then edit `.env.local`. Key facts:

- **Leaving it unset keeps the frontend disconnected.** The app shows an explicit
  "analysis service is not connected yet" state and makes **no** network requests.
- **Setting it does not create or start a backend.** It only tells the frontend
  where to send requests. The endpoints it calls must actually exist — see the
  [API contract](#10-api-contract); none are implemented yet.
- Vite only exposes variables prefixed with `VITE_` to client-side code.
- **Never put secrets or credentials in frontend environment variables** — they
  are bundled into the JavaScript delivered to every browser.
- No real production API URL is provided here; ask your deployment owner.

## 7. Available commands

Run these from the `frontend/` directory.

| Command | What it does |
| --- | --- |
| `npm run dev` | Starts the Vite development server with hot reload. |
| `npm run build` | Runs the TypeScript project check, then produces the production build in `dist/`. |
| `npm run typecheck` | Runs the TypeScript project check only (`tsc -b`), emitting nothing. |
| `npm run lint` | Runs oxlint across the source files. |
| `npm run preview` | Serves the production build from `dist/` locally so you can verify it. |

## 8. Project structure

```
frontend/
├── .env.example               # Environment template (documents VITE_API_BASE_URL)
├── index.html                 # Vite entry HTML
├── package.json               # Scripts and dependencies
└── src/
    ├── api/
    │   ├── README.md          # API-layer conventions
    │   ├── client.ts          # Base-URL config, request/timeout/HTTP handling, response validators
    │   ├── analysis.ts        # Typed start/status/results/report functions
    │   └── errors.ts          # Typed error model + user-facing messages
    ├── components/
    │   ├── common/            # Button, Card, SectionHeader, Input, Spinner, Empty/Error states
    │   ├── layout/            # AppShell and Header
    │   └── results/           # Visualization components (pie chart, uniformity, image viewer, report panel)
    ├── config/                # Product identity and supported crops (single source of truth)
    ├── hooks/                 # Hash routing, setup payload, analysis session, error mapping
    ├── pages/                 # AnalysisSetupPage, ProcessingPage, ResultsPage
    ├── types/                 # Setup, results, report, crop, and app-phase contracts
    ├── utils/                 # Small helpers (class-name joiner)
    ├── App.tsx                # Hash-based phase router
    ├── main.tsx               # React entry point
    └── index.css              # Tailwind + design tokens (@theme)
docs/
└── API_CONTRACT.md            # Proposed backend API contract (endpoints, validation, errors)
```

## 9. Application workflow

1. **Analysis Setup** (`#setup`) — enter lot number, sample weight (g), and
   moisture (%); select Paddy or Rice; then Start Analysis. Validation runs on
   change and at submit; errors clear as soon as an input is corrected.
2. **Processing** (`#processing`) — shows the submitted sample metadata. Because
   no backend is connected, the status panel explicitly reads *(analysis
   processing is not connected yet)*. No analysis ID, progress, or results are
   invented. **Back to Setup** returns without breaking state.
3. **Results** (`#results`) — the structure and visualizations exist; without a
   genuine analysis supply every section shows an honest "not available yet"
   state. Report downloads are disabled until generation is connected.
   **Rescan** clears the app-owned analysis state and returns to setup for a
   fresh sample.

**Intended future flow (once the backend exists):** Start Analysis posts the
setup to the backend, returns a genuine analysis ID, the Processing screen polls
real status (with real progress when provided), and the Results screen renders
only validated results belonging to that analysis. That flow is not active —
the frontend remains in the explicit disconnected state.

## 10. API contract

The proposed backend API is documented in
[`docs/API_CONTRACT.md`](docs/API_CONTRACT.md). **These endpoints are proposals
for the future backend — none exist yet:**

- `POST /api/v1/analysis` — start an analysis; returns a server-generated analysis ID.
- `GET /api/v1/analysis/{analysis_id}/status` — typed status (`queued` / `processing` / `completed` / `failed`) with optional genuine progress.
- `GET /api/v1/analysis/{analysis_id}/results` — validated results matching the frontend contract (composition, quality, uniformity, annotated image).
- `GET /api/v1/analysis/{analysis_id}/report?type={complete|composition|uniformity|detailed}` — a genuine `application/pdf` response.

## 11. Data integrity

The frontend is built so that displayed measurements can never be fabricated:

- **Charts use genuine analysis data only.** Composition percentages are shown
  only when supplied by a validated response, or derived from counts that form an
  exact partition of the measured total. Inconsistent data produces an error
  state, never a normalized chart.
- **Missing results are shown as unavailable** — never as zeros or empty-but-valid values.
- **Progress must come from a real backend status response.** The frontend never
  estimates progress from elapsed time.
- **Polygon overlays require a declared coordinate space** (`pixel` or `normalized`)
  and image dimensions from the analysis; undeclared/partial data is rejected
  rather than misaligned.
- **PDF downloads require genuine PDF generation.** The report panel stays
  disabled until a real generator is connected.

## 12. Troubleshooting

- **`npm install` fails** — delete `node_modules` and `package-lock.json` and retry (`rm -rf node_modules && npm install`); check your network/proxy; confirm your Node version is recent.
- **Port 5173 already in use** — another process (often a previous dev server) owns the port. Stop it, or run `npm run dev -- --port 5174`.
- **TypeScript or build errors** — run `npm run typecheck` and fix the reported files; stale incremental builds can be cleared by deleting `node_modules/.tmp` or `tsconfig.tsbuildinfo`.
- **The app says the analysis service is not connected** — expected when `VITE_API_BASE_URL` is unset (or when a configured backend is unreachable). No backend has been implemented yet, so this is not an error you can fix from the frontend.
- **Results and reports stay unavailable** — expected until a real backend supplies validated results and PDF generation.
- **A configured backend still fails** — check the URL (no trailing slash needed), protocol (http/https), and that the backend implements the endpoints in `docs/API_CONTRACT.md`.

> These steps address the most common issues; they do not cover every possible failure.

## 13. Testing and verification

There is **no automated test framework yet** — no unit, integration, or end-to-end tests exist in this repository. Available checks:

```bash
npm run typecheck   # TypeScript project check
npm run lint        # oxlint
npm run build       # type-check + production build
```

Run all three before sharing changes. Manual verification should cover the
setup validation scenarios, the disconnected processing state, and safe
navigation (refresh/back-forward on each route).

## 14. Roadmap and limitations

Before an end-to-end analysis can run, the following must exist outside this repository:

- A backend implementing the proposed endpoints in `docs/API_CONTRACT.md`.
- An image-acquisition or image-upload flow for grain samples.
- A genuine analysis pipeline (AI/ML or computer-vision) producing real
  composition, quality, and uniformity data.
- Real status/progress reporting for the processing stage.
- Server-side PDF report generation.

Recommended integration order mirrors the phases this frontend was built in:
connect `POST /analysis` first, then status polling, then results, then reports.

## 15. Contribution and development guidance

- Run `npm run lint`, `npm run typecheck`, and `npm run build` before every commit.
- Keep domain types (`src/types/`) as the single source of truth; screens render
  state honestly — never fabricate data to fill a chart or report.
- When the backend contract changes, update `docs/API_CONTRACT.md`, the runtime
  validators in `src/api/client.ts`, and the types together.
- Design tokens live only in `src/index.css` (`@theme`); avoid hardcoding colors or sizes in components.
- Keep the dev-only Results preview clearly separated from production analysis state.

## 16. License

No license has been specified yet. Add an agreed license file and update this
section once the project decision is made.
