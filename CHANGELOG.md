# Changelog

All notable changes to the KharonOps project are documented in this file.

## [Unreleased] - 2026-04-23

### [Changed]
- Updated `docs` and `drive` operations in `createProductionWorkspaceRails` (`packages/google/src/production.ts`) to utilize `delegatedConfig` and `delegatedSubjectArgs`. All Drive operations (generate pdf, publish file, list files) now execute under Domain-Wide Delegation (impersonating the configured Workspace user) rather than the generic Service Account.
- Added extensive diagnostic error logging to `packages/google/src/errors.ts`, extracting stringified JSON bodies and specific `error_description` fields from Google API failures into the `GoogleAdapterError` message, making UI toast notifications instantly actionable.

### [Fixed]
- Resolved `404 Not Found` errors in document generation by enforcing Domain-Wide Delegation impersonation, removing the need to manually share template files and destination folders with the underlying GCP Service Account email.
- Resolved `400 Bad Request` errors during the Drive Publish action, as the impersonated domain user correctly possesses authorization to share files to the `kharon.co.za` domain (unlike a non-domain Service Account).
- Fixed a typo (`jobUid` -> `jobid` and `scheduleUid` -> `scheduleid`) in `production.ts` causing TypeScript compilation errors in document filename generation and Calendar API parameters.
- Corrected `GOOGLE_CALENDAR_ID` in `.env` from an iCal URL to the correct email address identifier required by the Google Calendar API.

### [Added]
- `scripts/workbook-governance.mjs` automation for workbook auditing and repair.
- npm commands:
  - `npm run workbook:audit`
  - `npm run workbook:fix`
- Google Sheets 429 retry/backoff handling in workbook governance automation.

### [Changed]
- Workbook governance fix mode now auto-provisions missing technician master rows from active `Users_Master` technician records, then syncs generated `TECH-###` IDs back to users.

### [Fixed]
- Applied production workbook remediation:
  - mapped legacy technician IDs in `Users_Master` to canonical `TECH-###`
  - resolved duplicate `Users_Master.user_id`
  - backfilled empty `Jobs_Master.job_status` cells
  - created missing technician record and linked it back to `Users_Master`

## [Unreleased] — 2026-04-22

### [Added]
- `nameEnrichment.ts` service — extracted, testable `buildNameLookups` function with priority hierarchy (Clients_Master → Users_Master fallback for clients; Technicians_Master → Users_Master fallback for technicians).
- `svr_clients` and `svr_technicians` DDL tables in PostgresStore for SQL-backed name resolution.
- `clientRowFromPg()` and `technicianRowFromPg()` row mapper functions in PostgresStore.
- Real SQL queries for `listClients()` and `listTechnicians()` in `PostgresWorkbookStore`.
- `fetchNameSources()` helper with `Promise.allSettled` for error-resilient reference-sheet fetching.
- 13 unit tests in `tests/unit/name-enrichment.test.ts` covering: primary source mapping, fallback logic, priority hierarchy, inactive/empty filtering, graceful degradation.
- `WorkbookStore` type import in `index.ts`.

### [Changed]
- Refactored `GET /jobs` and `GET /jobs/:job_id` handlers to use shared `fetchNameSources` + `buildNameLookups` helpers (eliminates code duplication).
- `DualWorkbookStore.listClients()` / `listTechnicians()` now delegates to `this.primary` (was returning empty arrays).
- `Promise.all` → `Promise.allSettled` in name-enrichment fetch — a single sheet failure no longer crashes the entire endpoint.

### [Fixed]
- PostgresStore `listClients()` and `listTechnicians()` no longer return empty arrays — they now query `svr_clients` / `svr_technicians` with active-flag filtering.
- DualStore no longer silently drops client/technician data when active backend is dual-write.

### [Security]
- Added system actor id governance documentation to SECURITY_MODEL.md — prohibits hardcoded `"system"` actor identity.

### Documentation
- `ARCHITECTURE.md` — added Services Layer section, name enrichment data model, updated store implementation descriptions.
- `API_SPEC.md` — documented `client_name` / `technician_name` enriched response fields and graceful degradation behavior.
- `TEST_MATRIX.md` — added all missing unit test entries (9 total test files documented).
- `WORKBOOK_SCHEMA.md` — complete rewrite to match production `workbook.ts` — all 20 required tabs, correct column names, governance notes.
- `DOCUMENT_TEMPLATES.md` — annotated `client_display_name` and `technician_display_name` tokens with source hierarchy.
- `SECURITY_MODEL.md` — added system actor id naming convention.
- Created `CHANGELOG.md`.


