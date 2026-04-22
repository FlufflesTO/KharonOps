# Changelog

All notable changes to the KharonOps project are documented in this file.

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
- Refactored `GET /jobs` and `GET /jobs/:job_uid` handlers to use shared `fetchNameSources` + `buildNameLookups` helpers (eliminates code duplication).
- `DualWorkbookStore.listClients()` / `listTechnicians()` now delegates to `this.primary` (was returning empty arrays).
- `Promise.all` → `Promise.allSettled` in name-enrichment fetch — a single sheet failure no longer crashes the entire endpoint.

### [Fixed]
- PostgresStore `listClients()` and `listTechnicians()` no longer return empty arrays — they now query `svr_clients` / `svr_technicians` with active-flag filtering.
- DualStore no longer silently drops client/technician data when active backend is dual-write.

### [Security]
- Added system actor UID governance documentation to SECURITY_MODEL.md — prohibits hardcoded `"system"` actor identity.

### Documentation
- `ARCHITECTURE.md` — added Services Layer section, name enrichment data model, updated store implementation descriptions.
- `API_SPEC.md` — documented `client_name` / `technician_name` enriched response fields and graceful degradation behavior.
- `TEST_MATRIX.md` — added all missing unit test entries (9 total test files documented).
- `WORKBOOK_SCHEMA.md` — complete rewrite to match production `workbook.ts` — all 20 required tabs, correct column names, governance notes.
- `DOCUMENT_TEMPLATES.md` — annotated `client_display_name` and `technician_display_name` tokens with source hierarchy.
- `SECURITY_MODEL.md` — added system actor UID naming convention.
- Created `CHANGELOG.md`.
