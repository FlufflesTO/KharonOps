# Hardening Plan: Forensic Audit Trail Integrity

## Objective
Ensure 100% compliance with the "Forensic Audit Trail Integrity" (GLOBAL-007) standard by implementing explicit `store.appendAudit()` logging for all mutating API endpoints that currently lack it. This guarantees a cryptographic-like chain of custody for all system state transitions.

## Scope & Impact
- **Impact**: High. Improves system compliance, accountability, and traceability.
- **Risk**: Low. These are additive, non-blocking asynchronous writes to the audit stream.

## Proposed Solution
We will systematically update the following routes to append a structured audit log immediately following a successful mutation:

### 1. `apps/api/src/routes/jobs.ts`
- `POST /:job_id/status`: Log `jobs.status.update` with payload `{ job_id, status }`.
- `POST /:job_id/note`: Log `jobs.note.append` with payload `{ job_id, note }`.

### 2. `apps/api/src/routes/finance.ts`
- `POST /quotes`: Log `finance.quote.create` with payload `{ quote_id, client_id, amount }`.
- `POST /quotes/:quote_id/status`: Log `finance.quote.status_update` with payload `{ quote_id, status }`.
- `POST /invoices/from-quote`: Log `finance.invoice.create` with payload `{ quote_id, invoice_id }`.
- `POST /invoices/:invoice_id/reconcile`: Log `finance.invoice.reconcile` with payload `{ invoice_id, status }`.
- `POST /escrow/lock`: Log `finance.escrow.lock` with payload `{ document_id, invoice_id }`.
- `POST /analytics/rebuild`: Log `finance.analytics.rebuild`.

### 3. `apps/api/src/routes/workspace.ts`
- `PUT /upgrade/skills/:user_id`: Log `workspace.skills.update` with payload `{ user_id }`.

### 4. `apps/api/src/routes/sync.ts`
- `POST /push`: Log `sync.push.applied` with payload `{ mutations_count: body.mutations.length }`.
- `POST /conflict/resolve`: Log `sync.conflict.resolved` with payload `{ job_id, strategy }`.

## Implementation Steps
1. Open each route file mentioned above.
2. For each missing mutating endpoint, inject the `await store.appendAudit({...})` call before the final `c.json(...)` success response.
3. Ensure the `ctx: createStoreContext(user.user_id, correlationId)` is properly passed to bind the actor and the network trace.

## Verification
- Run `npm run lint` and `npm run build:apps` to ensure no type errors were introduced.
- Run `vitest run` to ensure existing contract and unit tests pass.
