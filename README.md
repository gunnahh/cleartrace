# ClearTrace — Company Research Workspace

A production-oriented frontend MVP for a freelance company researcher. It records bilingual company/party profiles, category-specific searches, screenshot evidence, legal and media results, and a fixed-format submission report. All included names and records are fictional.

## Setup

Requires Node 20+. Run `npm install`, then `npm run dev`. Quality commands are `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`, and `npm run test:e2e`.

## Architecture

Features live under `src/features`, the responsive shell and routing under `src/app`, reusable fields under `src/components`, and the typed API adapter under `src/lib`. TanStack Query owns server-shaped data and invalidation; React Hook Form owns draft form data; TanStack Router search parameters own list filters. Zod schemas are the form validation source of truth.

The API adapter simulates network latency and persists fictional demo records in browser storage for the frontend demo. Components never access storage directly. To adopt a backend, replace the functions in `src/lib/api.ts` with HTTP requests while preserving their typed signatures and query keys. MSW can then intercept those endpoints for development and tests.

## Accessibility

The UI uses Radix Themes and primitives, semantic landmarks, a skip link, visible focus indicators, labelled fields, associated errors, accessible dialogs/tabs/selects, mobile navigation, responsive overflow strategies, text status labels, and reduced-motion handling. The report uses print-specific styles for PDF output.

## MVP limitations

Authentication is a demonstrative login route, file uploads store filename metadata rather than bytes, and structured case/media creation screens are represented as workspace states rather than a complete backend-backed editor. Browser storage is a mock API convenience, not production persistence. Connect the adapter to authenticated server endpoints and object storage before handling client data.
