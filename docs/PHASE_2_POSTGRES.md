# Phase 2 Postgres Migration

## Objective

Replace Google Sheets as the canonical transactional store while keeping:

- the current API contract
- the current portal flows
- the current role model
- the current Google Workspace integrations where still useful

The goal is to remove the main scaling and operability bottleneck without forcing a frontend rewrite.

## Recommended Target Stack

Recommended default:

- Cloudflare Workers for API runtime
- managed Postgres for transactional data
- Hyperdrive or equivalent connection layer for Worker-to-Postgres access
- R2 for generated files and attachments
- Google Workspace retained only for optional integrations

## Why This Phase Is Necessary

Current production mode uses:

- `apps/api/src/store/factory.ts`
- `apps/api/src/store/sheetsStore.ts`

In production, `createWorkbookStore()` currently selects `SheetsWorkbookStore`. That is acceptable for pilot workflows, but it becomes a problem for:

- concurrency
- reporting
- bulk operations
- data integrity at larger team size
- customer-grade auditability
- productization into a sellable SME system

## Migration Rules

1. Do not change the portal API contract during the migration.
2. Do not cut directly from Sheets to Postgres in one step.
3. Add Postgres as a second store implementation.
4. Run dual-write before final cutover.
5. Cut reads over only after parity checks pass.
6. Keep the current runtime backend unless `STORE_BACKEND` is explicitly changed.

## Implementation Steps

### Step 1: Define the relational schema

Start from:

- `docs/WORKBOOK_SCHEMA.md`

Create SQL tables equivalent to the existing workbook tabs:

- `users`
- `clients`
- `sites`
- `technicians`
- `jobs`
- `job_events`
- `job_documents`
- `schedule_requests`
- `schedules`
- `automation_jobs`
- `sync_queue`
- `system_config`

Add product-ready extensions immediately:

- `audit_events`
- `idempotency_keys`
- `attachments`
- `site_contacts`
- `contracts`

Future-proof tables to add later:

- `tenants`
- `tenant_users`
- `plan_subscriptions`

### Step 2: Add SQL migration tooling

Create a migration path inside the repo.

Suggested additions:

- `apps/api/sql/001_initial_schema.sql`
- `apps/api/sql/002_indexes.sql`
- `apps/api/sql/README.md`
- `scripts/migrate-postgres.mjs`
- `scripts/backfill-sheets-to-postgres.mjs`
- `scripts/verify-store-parity.mjs`

You can choose your migration tool later, but the repo needs deterministic schema creation now.

### Step 3: Add a Postgres-backed store

Create:

- `apps/api/src/store/postgresStore.ts`
- `apps/api/src/store/dualStore.ts`

Update:

- `apps/api/src/store/factory.ts`
- `apps/api/src/config.ts`

Recommended new store selector:

- `STORE_BACKEND=local`
- `STORE_BACKEND=sheets`
- `STORE_BACKEND=postgres`
- `STORE_BACKEND=dual`

`dual` should:

- write to both stores
- read from the current primary store
- emit mismatch logs for parity validation

Current scaffold status:

- `postgres` and `dual` backends exist in config and the factory
- both are intentionally scaffold-only and not active by default
- the SQL and script assets are planning scaffolds, not live migrations

### Step 4: Preserve existing domain rules

Do not move business rules into ad hoc SQL first.

Keep domain and RBAC logic in:

- `packages/domain`
- API service and store layers

The store implementation should enforce persistence and transactional behavior, not redefine business semantics.

### Step 5: Write migration and backfill scripts

Add:

- `scripts/backfill-sheets-to-postgres.mjs`
- `scripts/verify-store-parity.mjs`

Backfill rules:

1. Export all workbook tabs.
2. Import rows into Postgres with original IDs and mutable fields preserved.
3. Preserve `row_version`, `updated_at`, `updated_by`, and `correlation_id`.
4. Verify row counts and key sample records before enabling dual-write.

### Step 6: Add store parity tests

Expand the test matrix so the same test cases run against:

- `LocalWorkbookStore`
- `SheetsWorkbookStore`
- `PostgresStore`

Critical parity cases:

1. RBAC filtering
2. row-version conflicts
3. status transitions
4. note append behavior
5. schedule request and confirm
6. document create and publish
7. sync replay and conflict handling

### Step 7: Run dual-write in staging

Set staging to:

- read from Sheets
- write to Sheets and Postgres

Observe:

1. row counts
2. write success rate
3. latency
4. mismatch logs
5. conflict behavior

Do not cut over reads until the mismatch rate is zero or fully explained.

### Step 8: Cut production to dual-write

After staging is stable:

1. backfill production data
2. switch production to dual-write
3. keep reads on Sheets for a short controlled period
4. verify parity continuously

### Step 9: Switch reads to Postgres

When parity is proven:

1. switch read path to Postgres
2. keep dual-write briefly for rollback confidence
3. monitor all core workflows
4. then disable Sheets writes

### Step 10: Demote Google Sheets

After successful cutover:

- treat Sheets as an export or migration artifact only
- remove it from transactional flows
- retain optional reporting exports only if needed

## Google Workspace After Migration

Keep only where valuable:

- Docs as template rendering, if still needed
- Drive as optional mirrored client-facing document distribution
- Gmail for outbound email
- Calendar for mirrored scheduling
- Chat for operator notifications
- People only if there is a specific integration reason

Do not keep:

- Sheets as canonical state

## Exit Criteria

This phase is done when:

1. Production reads and writes use Postgres.
2. Sheets is no longer required for live operations.
3. Existing portal workflows still work without UI rewrites.
4. Conflict and replay behavior remain intact.
5. Historical data is backfilled and verified.

## Follow-On Phase

After this migration:

- move async jobs to queues
- move document/file storage to R2
- then begin tenantization and SME product work
