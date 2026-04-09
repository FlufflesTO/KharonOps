# Security Model

## Identity

- Google ID token is verified server-side on login.
- Session cookie is signed with HMAC and validated server-side on every request.
- Session key rotation is supported through key-ring verification (`SESSION_KEYS`).

## Session Controls

Cookie flags:
- `httpOnly`
- `secure`
- `sameSite=Lax`
- bounded TTL (`SESSION_TTL_SECONDS`)

## Authorization

- RBAC and ownership checks are server-side only.
- No client-provided role or ownership claim is trusted.
- Entity-level checks enforce:
  - client ownership boundaries
  - technician assignment boundaries
  - dispatcher/admin privilege boundaries

## Request Integrity

- Correlation ID assigned on every request.
- Correlation ID is propagated in all responses and mutable writes.
- Optional Cloudflare Access JWT verification can be enforced on `/api/v1/*` using:
  - `CF_ACCESS_AUD`
  - `CF_ACCESS_JWKS_URL` (or `CF_ACCESS_JWKS_JSON`)
  - optional `CF_ACCESS_ISSUER`
  - optional `CF_ACCESS_ENABLED=true`
- When enabled, API requests without a valid `Cf-Access-Jwt-Assertion` are rejected with `401`.

## Concurrency Controls

- mutable writes require `row_version`
- stale writes fail with `409`
- response includes canonical `conflict` payload (`server_state`, `server_row_version`, `client_row_version`)

## Auditability

Privileged actions append audits, including:
- dispatcher/admin job status actions
- schedule confirmations/reschedules
- document publish actions
- workspace rail triggers
- admin automation retries

## Offline Sync Safety

- mutation IDs provide idempotent replay behavior
- duplicates are replay-safe
- partial success supported for push batches
- explicit conflict resolution endpoint with strategy selection

## Secrets Management

### Cloudflare
- set secrets with `wrangler secret put`
- never commit production secrets

### Netlify
- set env vars in Netlify UI
- keep API origin and client IDs outside source control

## Production Hardening Checklist

1. Set `KHARON_MODE=production` only after all required Google credentials are present.
2. Use at least two high-entropy `SESSION_KEYS` values.
3. Restrict Drive publish behavior to approved policy before client rollout.
4. Lock down CSP and allowed origins to final domains.
5. Enable Cloudflare logging/alerting and review admin audit outputs daily during pilot.
