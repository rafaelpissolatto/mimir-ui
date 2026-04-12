<aside>
🎯

**Goal**

Build and open-source a modern UI for **Grafana Mimir** that matches (and improves on) the core feature set users expect from the **Prometheus UI**, with a cleaner, more modern layout.

</aside>

### Background

- Mimir is widely used as a long-term, horizontally scalable Prometheus-compatible backend.
- Unlike Prometheus, Thanos, and VictoriaMetrics, there is no first-party web UI focused on query and exploration workflows.

### Problem statement

Teams using Mimir often fall back to:

- Grafana dashboards only (good for dashboards, not for ad-hoc exploration)
- Prometheus UI connected elsewhere (not always representative of Mimir behavior or tenancy)
- Multiple tools for exploration versus troubleshooting

### Non-goals (for v1)

- Replacing Grafana
- Building a full dashboarding system
- Building a full alerting/recording rules editor (unless it is already part of the Prometheus UI parity list you want)

---

## Success criteria

- A developer can run the UI locally against a Mimir endpoint (single-tenant and optionally multi-tenant).
- Feature parity with the Prometheus UI for query workflows (see scope below).
- Clear README, screenshots, and a simple release process.
- Usable by a new user without reading docs for basic flows.

---

## Users & primary workflows

1. **Explore metrics**
    - Find series
    - Inspect labels
    - Run ad-hoc PromQL
2. **Debug incidents**
    - Iterate on queries quickly
    - Compare time ranges
    - Validate assumptions with series inspection
3. **Share and collaborate**
    - Share a query link
    - Preserve query history

---

## Scope: Prometheus UI parity (draft)

> Fill/adjust this list based on the exact Prometheus UI features you consider “must-have”.
> 

### Query

- PromQL editor with syntax highlighting
- Execute instant query
- Execute range query
- Graph results
- Table results
- Error display with helpful hints

### Data discovery

- Targets / scrape info equivalent (if available via Mimir APIs)
- Service discovery / label browser
- Metric name autocomplete
- Label names/values browsing

### Usability improvements (modern UI goals)

- Better layout and spacing
- Command palette / quick actions
- Improved query history and favorites
- Responsive design (works on laptops well)

---

## Technical decisions (to choose)

### Option A: Pure frontend + reverse proxy

- React/Vue/Svelte SPA
- Talks to Mimir HTTP APIs via a backend proxy to handle auth/CORS

### Option B: Go backend + embedded frontend

- Go server that:
    - Serves the static frontend
    - Proxies API calls to Mimir
    - Handles auth headers / multi-tenancy

### API surface to confirm

- Which endpoints are available and stable for:
    - `/api/v1/query`
    - `/api/v1/query_range`
    - `/api/v1/labels`
    - `/api/v1/label/:name/values`
    - `/api/v1/series`
    - Any Mimir-specific endpoints for tenancy, limits, etc.

---

## Milestones

### M0 — Project setup

- Choose repo name and license
- Decide architecture (A or B)
- Basic dev environment (lint, fmt, CI)

### M1 — Core query experience (MVP)

- Query editor + execute
- Graph + table rendering
- URL state (shareable links)

### M2 — Discovery

- Autocomplete for metrics and labels
- Label browser and series explorer

### M3 — Polish + v0.1

- Query history, favorites
- Theming (light/dark)
- Accessibility pass
- Screenshots + docs

---

## Risks & open questions

- Multi-tenancy support: how should tenant selection work?
- Auth: bearer tokens, basic auth, mTLS, reverse proxy assumptions
- API compatibility differences vs Prometheus
- Large result sets performance and safe query defaults

---

## GitHub publishing checklist

- README (what it is, who it’s for, quickstart)
- LICENSE
- CONTRIBUTING
- Code of conduct (optional)
- CI (tests + build)
- Release tags and changelog

---

## Decisions (captured)

- **GitHub repo**: **Mimir-UI** (`mimir-ui`)
- **Multi-tenancy**: **Yes**
    - Tenant identity via HTTP header **`X-Scope-OrgID`**
    - Tenant list is **config-driven** (easy to define/maintain)
- **Frontend stack**: **React + Vite**
- **Architecture**: **Pure frontend** calling Mimir HTTP APIs directly
- **Must-have parity scope**: **Graph**, **Table**, **Rules**, **Alerts** ("the basics")

## Next steps

1. Define the **config model** (v1)
    - **Decision**: `config.json` (loaded at runtime)
    - Fields (confirmed):
        - `mimirBaseUrl` (single URL)
        - `tenantHeaderName` (default: `X-Scope-OrgID`)
        - `tenants`: list of `{ id, name }` where `id` maps to `tenantHeaderName`
        - `defaultTenantId`
        - `auth`: none | bearer token (optional)
    - Example `config.json`:
        
        ```json
        {
          "mimirBaseUrl": "https://mimir.example.com",
          "tenantHeaderName": "X-Scope-OrgID",
          "defaultTenantId": "prod",
          "tenants": [
            { "id": "prod", "name": "Production" },
            { "id": "staging", "name": "Staging" }
          ],
          "auth": { "type": "none" }
        }
        ```
        
2. Confirm the **CORS / deployment approach**
    - Since this is a pure frontend, decide whether Mimir will allow browser-origin requests (CORS), or whether users will deploy behind an existing reverse proxy (nginx/ingress) that adds CORS headers.
3. Define the **API contract** we will rely on
    - Prometheus-compatible endpoints: `/api/v1/query`, `/api/v1/query_range`, `/api/v1/labels`, `/api/v1/label/:name/values`, `/api/v1/series`
    - Mimir endpoints for **rules** and **alerts** (confirm exact paths used in your environment)
4. UX spec for the core screens
    - **Explore**: editor + graph/table toggle + URL state + tenant selector
    - **Rules**: list + detail + search/filter + tenant selector
    - **Alerts**: list + detail + state filters + tenant selector
5. Repo scaffolding
    - React + Vite project
    - ESLint/Prettier, TypeScript
    - CI: build + test (use Makefile)

## Open questions

- Should tenant selection be:
    - a dropdown (manual),
    - derived from login (OIDC),
    - or configured server-side only?
- Do you need **multiple Mimir clusters** support in v1 ("environment" switch)?
- Pure frontend or golang server:
    - **Pure frontend + proxy** (recommended for flexibility)
- Where will the UI be deployed? (Docker, Kubernetes, standalone server?)
  -> Locally we can run using docker-compose
  -> But this will be deployed in Kubernetes
