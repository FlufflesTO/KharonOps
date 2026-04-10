# Production Roadmap

## Current State

Kharon Unified Rebuild v1 currently consists of:

- `apps/site` as the public marketing site
- `apps/portal` as the authenticated operations PWA
- `apps/api` as the Hono API running on Cloudflare Workers
- Netlify serving `dist/public`
- Netlify proxying `/api/*` to the Cloudflare Worker origin
- Google Workspace rails providing Sheets, Drive, Docs, Calendar, Gmail, Chat, and People integrations

This is a valid v1 production shape, but it is not the right long-term platform shape for a sellable SME product.

## Recommended Platform Decisions

### Decision 1: First production launch

Keep the current split:

- Netlify for static delivery
- Cloudflare Workers for the API
- Google Workspace rails for operational integrations
- Google Sheets as the temporary production system of record

Reason:

- The repo is already wired for this in `netlify.toml`, `wrangler.toml`, `docs/DEPLOYMENT.md`, and `docs/ARCHITECTURE.md`.
- Changing hosting before the first real launch adds risk without fixing the actual scaling bottleneck.
- The real bottleneck is the Sheets-backed production store behind `apps/api/src/store/factory.ts`.

### Decision 2: Medium-term platform direction

Do not keep Google Sheets as the canonical source of truth once the pilot is proven.

Move to:

- Cloudflare Workers as the API runtime
- Postgres as the transactional source of truth
- R2 for generated files and attachments
- Queues for async jobs
- Google Workspace as integration rails only

### Decision 3: Long-term hosting direction

Consolidate onto Cloudflare after the first production cycle if you want a simpler product architecture.

Recommended end-state:

- Cloudflare static asset delivery for the public site and portal
- Cloudflare Workers for API and middleware
- Postgres behind Hyperdrive or an equivalent managed Postgres connection layer
- R2 for document/file storage
- Queues for background jobs

### Decision 4: Database direction

Do not use Google Sheets as the long-term backend for a multi-user SME product.

Do not make D1 the default target unless you intentionally want a Cloudflare-native SQLite system and accept its tradeoffs.

Default recommendation:

- Managed Postgres plus Cloudflare Workers

Good fit options:

- Neon plus Cloudflare Workers and Hyperdrive
- Supabase if you want Postgres, auth, and storage bundled into one platform

Given the current repo already owns its API and session model, Neon-style Postgres is the cleaner architectural fit.

## Phase Order

### Phase 0: Credibility Polish

Goal:

- Replace illustrative marketing claims with client-safe, production-grade copy

Outputs:

- Real project-safe examples
- Real response and maintenance language
- Final sector positioning
- Final contact and service coverage language

Exit criteria:

- The site can be shown publicly without placeholder or speculative claims

### Phase 1: Current-Stack Production Hardening

Goal:

- Launch safely on the current Netlify plus Cloudflare plus Google stack

Outputs:

- Final domains and CSP
- Staging and production environments
- Verified secrets and cookie configuration
- Observability and alerting
- Rehearsed cutover and rollback

Exit criteria:

- Production launch can happen without architectural churn

Reference:

- `docs/PHASE_1_PRODUCTION.md`

### Phase 2: Postgres Migration

Goal:

- Remove Sheets as the source of truth while keeping the current API and portal behavior stable

Outputs:

- Postgres schema
- `PostgresStore` implementation
- dual-write period
- backfill tooling
- read cutover

Exit criteria:

- The app reads and writes against Postgres in production
- Sheets is no longer a transactional dependency

Reference:

- `docs/PHASE_2_POSTGRES.md`

### Phase 3: Async Workflow Extraction

Goal:

- Move slow or retry-prone work off the request path

Outputs:

- Queue-backed document generation
- Queue-backed notifications
- Queue-backed calendar and sync jobs
- retry and dead-letter handling

Exit criteria:

- User-facing requests are short, deterministic, and not blocked on Google APIs

### Phase 4: SME Productization

Goal:

- Turn the system from an internal business platform into a sellable multi-tenant SME product

Outputs:

- tenant model
- tenant-scoped auth and RBAC
- onboarding and invites
- billing and plan controls
- support tooling
- exports and audit tooling

Exit criteria:

- The platform can safely host multiple customer organizations with clean separation

Reference:

- `docs/PHASE_3_SME.md`

## What To Avoid

- Do not rewrite hosting before the first production launch.
- Do not add multi-tenancy before replacing Sheets.
- Do not let Gmail, Drive, Docs, Calendar, or Chat remain blocking request-path dependencies forever.
- Do not keep customer-critical data primarily in Google Sheets once the system becomes team-heavy or customer-facing at scale.

## Roadmap Summary

1. Finish credibility polish.
2. Harden the current stack and launch.
3. Prove real user flows in production.
4. Replace Sheets with Postgres.
5. Move background work to queues.
6. Add multi-tenancy and SME product features.
7. Consolidate hosting if you want lower long-term operational complexity.
