# Security Model

## Identity

- Google ID token is verified server-side on login.
- Session cookie is signed with HMAC and validated server-side on every request.
- Session key rotation is supported through key-ring verification with `SESSION_KEYS`.

## Session Controls

Cookie flags:

- `httpOnly`
- `secure`
- `sameSite=Lax`
- bounded TTL via `SESSION_TTL_SECONDS`

## Authorization

- RBAC and ownership checks are server-side only.
- No client-provided role or ownership claim is trusted.

## Request Integrity

- correlation ID assigned on every request
- correlation ID propagated in responses and mutable writes
- optional Cloudflare Access JWT verification on `/api/v1/*`

## Concurrency Controls

- mutable writes require `row_version`
- stale writes fail with `409`
- responses include canonical conflict payloads

## Auditability

Privileged actions append audits for:

- dispatcher and admin status actions
- schedule confirmations and reschedules
- document publish actions
- workspace rail triggers
- admin automation retries

### System Actor ids

System-initiated operations (cron, webhooks, automated reconciliation) use namespaced ids in the format `system:<function-name>` (e.g., `system:reconcile-ledger`, `system:hse-escalation`). The literal string `"system"` must never be hardcoded as an actor identity — every audit entry must bind to a verifiable actor id.

## Offline Sync Safety

- mutation IDs provide idempotent replay behavior
- duplicates are replay-safe
- partial success is supported for push batches
- explicit conflict resolution endpoint supports `server`, `client`, and `merge`

## Secrets Management

- set production secrets with `wrangler secret put`
- never commit production secrets
- keep static delivery and API on the same Cloudflare account and review secret scope per environment

## Production Hardening Checklist

1. Set `KHARON_MODE=production` only after required Google credentials are present.
2. Use at least two high-entropy `SESSION_KEYS` values.
3. Confirm `_headers` reflects final CSP, caching, and robots posture.
4. Lock final domains before customer rollout.
5. Review Cloudflare logs, audits, and health outputs daily during pilot.
