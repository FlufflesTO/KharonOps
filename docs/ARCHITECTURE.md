# Architecture

## System Overview

Kharon Unified Rebuild v1 is a single product with two user-facing surfaces and one API runtime:
- `apps/site`: public conversion site
- `apps/portal`: authenticated role portal PWA (client, technician, dispatcher, admin)
- `apps/api`: Cloudflare Worker API under `/api/v1/*`

## Hosting Topology

- Netlify hosts static content (`dist/public`)
- Netlify proxies `/api/*` to Cloudflare Worker origin
- Cloudflare Worker executes all API logic and RBAC enforcement

## Runtime Components

### UI Layer
- Shared design tokens from `packages/ui`
- Public site for marketing and conversion
- Portal for operations workflows and workspace triggers
- Offline support in portal:
  - service worker caches shell
  - IndexedDB queue stores mutations
  - replay posts batches to `/api/v1/sync/push`

### API Layer
- Hono-based API router
- Correlation ID middleware for every request
- Session middleware validates signed httpOnly cookie
- Route groups:
  - `auth`
  - `jobs`
  - `schedules`
  - `documents`
  - `sync`
  - `workspace`
  - `admin`

### Domain Layer (`packages/domain`)
- canonical types and schemas
- response envelope helpers
- RBAC + ownership matrix
- status transition graph
- workbook sheet schema definitions
- concurrency + conflict payload helpers

### Google Adapter Layer (`packages/google`)
- unified rails interfaces for:
  - Sheets
  - Drive
  - Docs
  - Calendar
  - Gmail
  - Chat
  - People
- bounded retry/backoff for transient API failures
- normalized Google error mapping
- dual mode operation:
  - production mode with service-account-backed API calls
  - local deterministic fallback mode

## Data Model

### Canonical Source of Record
Google Sheets workbook is canonical in production mode.

### Store Implementations
- `LocalWorkbookStore`: deterministic functional fallback for local validation
- `SheetsWorkbookStore`: Sheets-backed persistence using canonical tabs

Both stores enforce:
- row version checks
- mutable audit fields
- conflict payload generation
- idempotent sync replay behavior

## Identity and Session

- Google ID token verification is server-side
- Session token signed with rotating key ring (`SESSION_KEYS`)
- Session delivered via `httpOnly`, `secure`, `sameSite=Lax` cookie
- No client-provided role claims are trusted

## RBAC and Ownership

Enforced server-side at route and entity level:
- client: own jobs and schedule requests only
- technician: assigned jobs and document generation for owned jobs
- dispatcher: operational overrides and workspace actions
- admin: full access + audits + automation retries

## Concurrency and Conflict

Optimistic concurrency on mutable entities:
- every mutable write includes `row_version`
- stale writes return `409` with canonical `conflict` payload
- offline sync supports partial success and explicit conflict resolution strategies (`server`, `client`, `merge`)

## Controlled Documents

v1 controlled docs:
- Jobcard
- Service Report

Flow:
1. Generate from Docs template with token replacement
2. Export PDF
3. Store in Drive
4. Publish action updates status + publication URL

## Operational Controls

- Correlation IDs on all requests
- Audit logs for privileged operations
- Admin health endpoint for runtime diagnostics
- Automation retry endpoint for operational replay
