# Mimir UI

An open-source frontend for [Grafana Mimir](https://grafana.com/oss/mimir/) - a horizontally scalable, highly available Prometheus-compatible metrics backend.

This unofficial Mimir UI gives Mimir users a Prometheus UI-equivalent experience directly in the browser, without requiring Grafana. It talks to Mimir's Prometheus-compatible HTTP APIs directly from the browser — no backend required.

---

## What it does

| Page | Purpose |
|------|---------|
| **Explore** | Write and execute PromQL queries against Mimir. View results as a time-series graph or a label/value table. Supports both range and instant queries. |
| **Rules** | Browse all recording and alerting rules loaded into the Mimir ruler, including their current evaluation state (firing / pending / inactive). |
| **Alerts** | See all alerting rules and their live state. Inactive alerts are shown alongside firing and pending ones so nothing is hidden. |

---

## Prerequisites

- [Node.js](https://nodejs.org/) >= 20
- A running Grafana Mimir instance (local or remote)
- For the local demo stack: [Docker](https://www.docker.com/) + Docker Compose

---

## Quick start — local demo

The repository ships with a `docker-compose.yml` that spins up:
- **Mimir** (monolithic mode, including the ruler and alertmanager)
- **Prometheus** (scrapes Mimir's own metrics and remote-writes them back into Mimir)
- **mimirtool** (loads the example rule group and alertmanager config at startup)

```bash
# Start the stack
docker compose up -d

# Start the UI dev server
npm install
npm run dev
```

Then open [http://localhost:5173](http://localhost:5173).

Mimir is available at [http://localhost:9009](http://localhost:9009). The Vite dev server proxies `/prometheus` to `http://localhost:9009` so there are no CORS issues during development.

---

## Configuration

The app loads `public/config.json` at runtime. If the file is absent, it falls back to defaults (targeting `http://localhost:9009` with tenant `demo`).

```json
{
  "mimirBaseUrl": "https://mimir.example.com",
  "tenantHeaderName": "X-Scope-OrgID",
  "defaultTenantId": "prod",
  "tenants": [
    { "id": "prod",    "name": "Production" },
    { "id": "staging", "name": "Staging"    }
  ],
  "auth": { "type": "none" }
}
```

`auth.type` accepts `"none"` or `"bearer"` (add `"token": "..."` for a static bearer token).

For Kubernetes deployment, mount a `ConfigMap` over `/app/public/config.json` — no image rebuild required.

---

## Development

```bash
npm run dev      # Start dev server with HMR (Vite)
npm run build    # Type-check (tsc) + production build
npm run lint     # Run ESLint
npm run preview  # Preview the production build locally
```

---

## Tech stack

- **React 19** with React Compiler (no manual `useMemo`/`useCallback` needed)
- **TypeScript**
- **Vite 8**
- **Tailwind CSS v4**
- **React Router v7**
- **Recharts** for time-series graphs
- **Lucide React** for icons

---

## Project structure

```
src/
  components/
    alerts/      # Alerts page
    explore/     # Explore (PromQL editor + results)
    rules/       # Rules page
    layout/      # Shell: sidebar, header, theme toggle
  config/        # Runtime config loader
  lib/           # Mimir API client (mimir.ts), utilities
  types/         # Shared TypeScript types
config/
  mimir.yaml           # Mimir configuration for the local demo
  prometheus.yaml      # Prometheus configuration for the local demo
  rules/
    mimir-health.yaml  # Example recording + alerting rules
    alertmanager.yaml  # Minimal Alertmanager configuration
```

---

## License

MIT
