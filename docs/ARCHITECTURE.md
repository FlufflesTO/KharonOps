# Architecture

## System Overview

Kharon Unified Rebuild v1 is a single Cloudflare-hosted product with:

- `apps/site` for public marketing
- `apps/portal` for authenticated operations
- `apps/api` for the Hono API under `/api/v1/*`

## Hosting Topology

- Public and staging public Workers serve static assets from `dist/public`
- Those same public Workers execute `/api/*`
- Internal and staging internal Workers remain API-only and can stay Access-protected

## Runtime Components

### UI Layer

- shared design tokens from `packages/ui`
- public marketing site
- portal for client, technician, dispatcher, and admin roles
- offline support in the portal:
  - service worker caches shell
  - IndexedDB queue stores mutations
  - replay posts batches to `/api/v1/sync/push`

### API Layer

- Hono-based API router
- correlation ID middleware on every request
- session middleware with signed `httpOnly` cookie validation
- route groups:
  - `auth`
  - `jobs`
  - `schedules`
  - `documents`
  - `sync`
  - `workspace`
  - `admin`

### Domain Layer

- canonical types and schemas
- response envelopes
- RBAC and ownership rules
- status transitions
- workbook schema definitions
- conflict payload helpers

### Google Adapter Layer

- Sheets
- Drive
- Docs
- Calendar
- Gmail
- Chat
- People

Production mode uses service-account-backed API calls. Local mode uses deterministic fallbacks.

## Data Model

### Canonical Source of Record

Google Sheets remains canonical in the current production design.

### Store Implementations

- `LocalWorkbookStore`
- `SheetsWorkbookStore`
- scaffolded `PostgresWorkbookStore`
- scaffolded `DualWorkbookStore`

All stores enforce:

- row version checks
- mutable audit fields
- conflict payload generation
- replay-safe mutation behavior

## Identity and Session

- Google ID token verification is server-side
- session token signing uses rotating `SESSION_KEYS`
- session cookie is `httpOnly`, `secure`, `sameSite=Lax`
- client role claims are never trusted

## RBAC and Ownership

Enforced server-side:

- client: own jobs and schedule requests
- technician: assigned jobs and controlled document generation for owned jobs
- dispatcher: operational overrides and workspace actions
- admin: full access, audits, and recovery actions

## Controlled Documents

Current controlled documents:

- Jobcard
- Service Report

Flow:

1. generate from Docs template
2. export PDF
3. store in Drive
4. publish and update status/history
