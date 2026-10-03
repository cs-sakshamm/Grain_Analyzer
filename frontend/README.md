# Grain Analyzer — Frontend

Frontend foundation (Phase 1) for an AI-powered grain analysis instrument.
Currently supports **Paddy** and **Rice**; the Setup → Processing → Results
analysis workflow arrives in later phases. No backend is required to run it.

## Tech stack

- React 19 + TypeScript (strict)
- Vite 8
- Tailwind CSS v4 — all design tokens live in `src/index.css`
- Oxlint

## Getting started

```bash
cd frontend
npm install
npm run dev        # development server
npm run typecheck  # TypeScript project check
npm run build      # type-check + production build
npm run preview    # serve the production build
npm run lint       # oxlint
```

## Project structure

```
src/
├── api/                  # Reserved for the future backend API layer (see api/README.md)
├── assets/
├── components/
│   ├── common/           # Button, Input, Card, SectionHeader, Loading/Empty/Error states
│   └── layout/           # AppShell, Header
├── config/               # Product identity + supported crops (single source of truth)
├── hooks/
├── pages/                # Page-level components (one page in Phase 1)
├── types/                # Shared domain types (Crop, AppPhase)
├── utils/
├── App.tsx
├── main.tsx
└── index.css             # Design tokens (@theme) + base styles
```

## Notes

- No mock analysis data exists anywhere in the codebase, by design.
- Crop support (Paddy, Rice) is centralized in `src/config/crops.ts`.
- The product name is configured in `src/config/app.ts`.
