# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start dev server (Vite HMR)
npm run build      # Type-check (tsc -b) then build for production
npm run lint       # Run ESLint
npm run preview    # Preview production build locally
```

There are no tests yet — the test infrastructure has not been set up.

## Project purpose

Mimir UI is an open-source frontend for [Grafana Mimir](https://grafana.com/oss/mimir/), providing a Prometheus UI-equivalent experience for Mimir users. It is a pure SPA (no backend) that calls Mimir's Prometheus-compatible HTTP APIs directly from the browser. Target deployment is Kubernetes; local development uses docker-compose.

MVP scope: **Explore** (PromQL editor + graph/table), **Rules** (recording & alerting rules list), **Alerts** (active alerts list).

## Architecture

**Stack**: React 19 + TypeScript + Vite 8 + Tailwind CSS v4 + React Router v7  
**React Compiler** is enabled via `babel-plugin-react-compiler` — avoid manual `useMemo`/`useCallback` optimizations as the compiler handles them.

### Runtime configuration

The app loads `public/config.json` at runtime via `src/config/config.ts`. This is how deployment-time settings are injected without rebuilding the image. If `config.json` is absent or fails to load, `defaultConfig` is used (targets `http://localhost:9009`).

Config shape (defined in `src/types/config.ts`):
```json
{
  "mimirBaseUrl": "https://mimir.example.com",
  "tenantHeaderName": "X-Scope-OrgID",
  "defaultTenantId": "prod",
  "tenants": [{ "id": "prod", "name": "Production" }],
  "auth": { "type": "none" }
}
```
`auth.type` can be `"none"` or `"bearer"` (with optional `token` field).

### Multi-tenancy

Tenant identity is sent via an HTTP header (`X-Scope-OrgID` by default). The tenant list and active tenant are managed in `Layout` component state, loaded from config on mount. Every Mimir API call must include this header with the currently selected tenant ID.

### Routing

Routes are defined in `App.tsx`. Root `/` redirects to `/explore`. The three main routes are `/explore`, `/rules`, `/alerts` — each has its own page component under `src/components/<section>/`.

### Layout

`Layout` owns global state: dark/light theme (persisted to `localStorage`) and the active tenant. It passes tenant props down to `Header`. Pages are rendered as `children` of `Layout`'s `<main>` element.

### Utility

`src/lib/utils.ts` exports `cn()` — a `clsx` + `tailwind-merge` helper for conditional class names. Use this for all dynamic Tailwind class composition.

## API surface

Mimir exposes Prometheus-compatible endpoints. All requests must include the tenant header. Planned endpoints:
- `GET /api/v1/query` — instant query
- `GET /api/v1/query_range` — range query
- `GET /api/v1/labels` — label names
- `GET /api/v1/label/:name/values` — label values
- `GET /api/v1/series` — series matching

CORS: since this is a pure frontend, Mimir (or a reverse proxy in front of it) must allow browser-origin requests.

## Styling conventions

- Tailwind CSS v4 (configured via `@tailwindcss/vite` plugin, not `postcss`).
- Dark mode uses the `dark:` variant with `class` strategy — toggled by adding/removing the `dark` class on `<html>`.
- Use `cn()` from `src/lib/utils.ts` for conditional class merging.
