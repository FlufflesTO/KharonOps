# Test Matrix

## Command Gates

- `npm run check`
- `npm run build`
- `npm run test`
- `npm run lint`

## Unit Tests (`tests/unit`)

1. `status-transitions.test.ts`
   - validates allowed/blocked status transitions
2. `rbac-matrix.test.ts`
   - validates role and ownership enforcement helpers
3. `schema-validation.test.ts`
   - validates request schemas and payload contracts
4. `name-enrichment.test.ts`
   - validates primary source mapping (Clients_Master, Technicians_Master)
   - validates Users_Master fallback when master sheet has no match
   - validates priority hierarchy (master wins over portal)
   - validates inactive/empty row filtering
   - validates graceful degradation with empty sources
5. `google-sheet-layout.test.ts`
   - validates canonical vs legacy header detection
6. `sheets-store-legacy-schema.test.ts`
   - validates legacy workbook mapping, update, and portal file storage
7. `runtime-config.test.ts`
   - validates local/production config requirements
8. `store-factory.test.ts`
   - validates store backend selection
9. `document-tokens.test.ts`
   - validates template token contract and override behavior

## Integration Tests (`tests/integration`)

1. `google-retry.test.ts`
   - validates bounded retry/backoff on transient errors
   - validates no retry on permanent errors

## Contract Tests (`tests/contract`)

1. `auth-session.test.ts`
   - login/session/logout lifecycle
2. `role-ownership.test.ts`
   - ownership and role boundary enforcement
3. `job-status-row-version.test.ts`
   - optimistic concurrency enforcement on status update
4. `conflict-shape.test.ts`
   - canonical conflict envelope shape
5. `dispatch-workspace.test.ts`
   - client slot request, dispatcher confirm/reschedule, people directory, and document publish lifecycle
6. `admin-automation.test.ts`
   - automation queue listing and retry workflow
7. `public-contact.test.ts`
   - public website contact intake and audit capture
8. `super-admin-middleware.test.ts`
   - super-admin access through admin middleware surfaces

## Offline Tests (`tests/offline`)

1. `queued-replay.test.ts`
   - replay decision logic for queue mutation removal/retention
2. `conflict-generation.test.ts`
   - stale mutation generates conflict response
3. `conflict-resolution.test.ts`
   - merge strategy resolves conflict and updates state

## Manual Production Verification Checklist

1. Google OIDC login with real tenant account.
2. Role-gated job visibility across all roles.
3. Browser UX sanity check for contact intake, resources request links, and portal dashboard navigation.
4. Document generate/publish in Drive + Docs PDF output.
5. Gmail notify + Chat alert + People sync execution against live Google rails.
6. Offline mutation queue and replay with forced disconnect.
7. Admin health and audit endpoints under load.
