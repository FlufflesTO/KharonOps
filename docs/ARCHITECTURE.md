# Architecture

## System Overview

Kharon Unified Rebuild v1 is a single Cloudflare-hosted product with:

- `apps/site` for public marketing
- `apps/portal` for authenticated operations
- `apps/api` for the Hono API under `/api/v1/*`

## Hosting Topology

- One Cloudflare Worker serves static assets from `dist/public`
- The same Worker executes `/api/*`
- No preview or staging Workers are configured

## Runtime Components

### UI Layer

- shared design tokens from `packages/ui`
- public marketing site
- **Redesigned Role-Based Portal:** Modular, component-driven architecture for client, technician, dispatcher, finance, admin, and super_admin roles.
- **Workflow Components:** Each role utilizes specialized React components for task-first workflows (e.g., `FinanceQuotesCard`, `TechMyDayCard`, `AdminDashboard`).
- **Progressive Disclosure:** Advanced technical diagnostics and platform controls are encapsulated behind specialized SuperAdmin modules with detailed viewing affordances.
- **Responsive Layouts:** Fluid, sidebar-driven navigation optimized for mobile, tablet, and desktop environments.
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

### Services Layer

- `nameEnrichment.ts` — builds client/technician name-lookup maps with priority hierarchy (Master sheets → Users_Master fallback)
- `documentTokens.ts` — token builder for controlled document generation
- `meta.ts` — mutable metadata stamping utilities
- `parse.ts` — Zod-validated JSON body parser

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

### Name Enrichment

Job records reference clients and technicians by id only (`client_id`, `technician_id`). Display names are enriched at query time using a priority hierarchy:

1. **Clients_Master / Technicians_Master** — authoritative registration data
2. **Users_Master** — portal-provisioned fallback only

The enrichment logic is implemented in `apps/api/src/services/nameEnrichment.ts` and is resilient to individual sheet-fetch failures via `Promise.allSettled`.

### Store Implementations

- `LocalWorkbookStore` — in-memory, deterministic seed data for development
- `SheetsWorkbookStore` — production Google Sheets backend
- `PostgresWorkbookStore` — SQL-backed store with `svr_clients` and `svr_technicians` tables
- `DualWorkbookStore` — primary+mirror write strategy with consistency verification

All stores enforce:

- row version checks
- mutable audit fields
- conflict payload generation
- replay-safe mutation behavior
- `listClients()` / `listTechnicians()` interface contract

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
- finance: quotes, invoices, payments, debtors, and statements
- admin: full access, audits, recovery actions, and workspace preference management
- super_admin: platform health, data checks, automations, activity, and business-unit governance

Portal role workspaces map to the current primary tool sets:

- client: overview, jobs, documents, invoices, support
- technician: my day, jobs, check-in/out, documents, help
- dispatcher: dashboard, schedule, unassigned queue, people, comms, daily plan
- finance: overview, quotes, invoices, payments, debtors, statements
- admin: dashboard, jobs, people, documents, schedule, settings
- super_admin: overview, users, business units, data checks, automations, health, activity

## Controlled Documents

Current controlled documents:

- Jobcard
- Service Report

Flow:

1. generate from Docs template
2. export PDF
3. store in Drive
4. publish and update status/history
