# Production Roadmap

## Current State

Kharon Unified Rebuild v1 currently consists of:

- `apps/site` as the public marketing site
- `apps/portal` as the authenticated operations portal
- `apps/api` as the Hono API on Cloudflare Workers
- Cloudflare Workers static assets serving `dist/public`
- Google Workspace rails for Sheets, Drive, Docs, Calendar, Gmail, Chat, and People integrations

This is a valid v1 production shape. It is not the right long-term platform shape for a sellable SME product because Sheets is still the bottleneck.

## Recommended Platform Decisions

### Decision 1: First production launch

Launch on the current Cloudflare-only delivery model:

- Cloudflare Workers for API and static delivery
- Google Workspace rails for operational integrations
- Google Sheets as the temporary production source of truth

Reason:

- the repo is now wired for Cloudflare-only deployment
- this removes the Netlify dependency without forcing a larger app rewrite
- the real scaling bottleneck remains the Sheets-backed store

### Decision 2: Medium-term platform direction

Do not keep Google Sheets as the canonical source of truth once the pilot is proven.

Move to:

- Cloudflare Workers as the runtime
- Postgres as the transactional source of truth
- R2 for generated files and attachments
- Queues for async jobs
- Google Workspace as integration rails only

### Decision 3: Long-term platform direction

Recommended end-state:

- Cloudflare for static delivery and API
- Postgres behind Hyperdrive or equivalent connection management
- R2 for file storage
- Queues for background jobs

### Decision 4: Database direction

Default recommendation:

- managed Postgres plus Cloudflare Workers

Good fit options:

- Neon plus Cloudflare Workers and Hyperdrive
- Supabase if you want Postgres, auth, and storage bundled together

## Phase Order

### Phase 0: Credibility Polish

- replace illustrative claims with client-safe production copy

### Phase 1: Current-Stack Production Hardening

- harden the current Cloudflare plus Google stack and launch

Reference:

- `docs/PHASE_1_PRODUCTION.md`

### Phase 2: Postgres Migration

- remove Sheets as the source of truth while keeping API behavior stable

Reference:

- `docs/PHASE_2_POSTGRES.md`

### Phase 3: Async Workflow Extraction

- move slow or retry-prone work off the request path

### Phase 4: SME Productization

- add tenant model, onboarding, billing, support tooling, and audit/export posture

Reference:

- `docs/PHASE_3_SME.md`
