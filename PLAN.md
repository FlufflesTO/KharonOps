# Kharon Unified Rebuild v1 Plan (Website + Core Ops, Google-First)

## Summary
- Build a **new codebase from scratch** (no legacy code reuse), keeping only approved brand assets/content.
- Deliver a **single responsive PWA** with:
  - Public marketing website
  - Staff portals (admin/dispatcher + technician)
  - Client portal (Google account login)
- Use **Cloudflare as core API runtime** and **Netlify for website/deploy path** from day one.
- Use **Google Workspace as full integration rail in v1**: Sheets, Drive, Docs, Calendar, Gmail, Chat, People.
- Use **Google Sheets as canonical system of record**, with full schema refactor.
- Enforce Kharon brand system exactly (Black, Purple, Blue, Grey, White; sharp geometry; high-density style).

## Implementation Changes
### 1) Platform and Repo Architecture
- Create a new monorepo (fresh folders, no copied legacy JS):
  - `apps/site` (public website)
  - `apps/portal` (PWA app: admin/tech/client)
  - `apps/api` (Cloudflare Workers API)
  - `packages/domain` (types, status machine, RBAC rules, validators)
  - `packages/google` (Sheets/Drive/Docs/Calendar/Gmail/Chat/People adapters)
  - `packages/ui` (brand tokens/components)
- Netlify serves site + portal static assets and proxies `/api/*` to Cloudflare Worker.
- Cloudflare handles API, auth session, RBAC, sync/conflict engine, and integration orchestration.

### 2) Identity, Roles, and Security
- Implement Google OAuth/OIDC login for all roles (client, technician, dispatcher/admin).
- Add `Users_Master` sheet for identity-to-role mapping and subject ownership.
- Server-side RBAC only; UI visibility derives from API claims.
- Replace current weak login behavior with:
  - Required ID token verification
  - Session cookie signing/rotation
  - Role + scope checks per endpoint
  - Audit logging for privileged actions

### 3) Data Model and Workflow (Sheets Canonical)
- Refactor workbook to explicit canonical sheets (minimum):
  - `Users_Master`, `Jobs_Master`, `Clients_Master`, `Sites_Master`, `Technicians_Master`
  - `Job_Events`, `Job_Documents`, `Schedule_Requests`, `Schedules_Master`
  - `Automation_Jobs`, `Sync_Queue`, `System_Config`
- Enforce on all mutable entities:
  - `row_version`, `updated_at`, `updated_by`, `correlation_id`
- Standardize status/state machine and transition guards in shared domain package.
- Implement optimistic concurrency with conflict payloads for portal resolution.

### 4) Product Scope (v1)
- Public website overhaul with strong brand-consistent marketing IA and conversion paths.
- Core ops features:
  - Jobs list/detail by role
  - Client schedule request flow (request only; dispatch confirms)
  - Dispatch scheduling via Calendar integration
  - Technician full offline sync (assigned jobs, forms, evidence queue, replay)
  - Jobcard + Service Report structured capture and PDF generation via Docs templates
  - Drive storage and portal publication controls
- Workspace rails required in v1:
  - Sheets read/write, Drive files, Docs generation, Calendar events
  - Gmail notifications, Chat alerts, People sync hooks

### 5) Migration and Release
- No legacy code porting; re-author features cleanly.
- Run internal pilot, then client enablement.
- Execute **hard cutover day** for operational writes:
  - Freeze legacy writes at cutover window
  - One-time migration script to new sheet schema
  - Switch DNS/proxy and production traffic
  - Keep rollback bundle for fixed window (read-only fallback + emergency revert)

## Public APIs / Interfaces
- New versioned API namespace: `/api/v1/*`.
- Core endpoint groups:
  - `auth/*` (google-login, session, logout)
  - `jobs/*` (list/detail/update/status/note)
  - `schedules/*` (request-slot, confirm, reschedule)
  - `documents/*` (generate, publish, history)
  - `sync/*` (offline pull, mutation push, conflict resolution)
  - `workspace/*` (gmail/chat/people actions)
  - `admin/*` (config, retries, audits, health)
- Canonical response envelope:
  - `data`, `error`, `correlation_id`, `row_version`, `conflict` (when applicable)

## Test Plan
- Unit tests: domain rules, RBAC matrix, status transitions, schema validators.
- Integration tests: each Google adapter with retry/error mapping and idempotency behavior.
- API contract tests: auth, role boundaries, conflict responses, mutation replay safety.
- Offline tests: full sync bootstrap, airplane-mode edits, queued mutation replay, conflict merge UX.
- E2E tests (role journeys):
  - Technician: assigned job -> offline work -> sync -> submit
  - Dispatcher: review client request -> confirm schedule -> notify
  - Client: login -> request slot -> view approved documents
  - Admin: retry failed automation -> audit trail verification
- Cutover rehearsal: dry-run migration + rollback drill before production day.
- Acceptance gate: no unresolved P1/P2 security, auth, data-integrity, or document-generation defects.

## Assumptions and Defaults
- Google Workspace admin access is available for OAuth setup and API scopes.
- Cloudflare + Netlify production accounts are available immediately.
- Brand identity bible is mandatory and supersedes default UI framework styling.
- v1 controlled docs are **Jobcard** and **Service Report** only; certificate/assessment move to phase 2.
- Legacy system remains available for read-only reference after cutover window.
