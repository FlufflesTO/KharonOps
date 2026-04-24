# Security Model

## Identity

- Google ID token is verified server-side on login.
- Session cookie is signed with HMAC and validated server-side on every request.
- Session key rotation is supported through key-ring verification with `SESSION_KEYS`.

## Session Controls

Cookie flags:

- `httpOnly`
- `secure`
- `sameSite=Strict` (enhanced CSRF protection)
- bounded TTL via `SESSION_TTL_SECONDS`

## Authorization

- RBAC and ownership checks are server-side only.
- No client-provided role or ownership claim is trusted.
- Portal roles currently enforced end to end: client, technician, dispatcher, finance, admin, super_admin.
- Enhanced RBAC system with granular permissions for job creation/deletion, document generation/publishing, schedule management, and user/finance data access.

## Request Integrity

- correlation ID assigned on every request
- correlation ID propagated in responses and mutable writes
- optional Cloudflare Access JWT verification on `/api/v1/*`
- IP address logging for all authentication requests
- Enhanced audit logging for admin and super admin actions

## Concurrency Controls

- mutable writes require `row_version`
- stale writes fail with `409`
- responses include canonical conflict payloads

## Auditability

Privileged actions append audits for:

- dispatcher and admin status actions
- finance actions that mutate invoice or payment state
- schedule confirmations and reschedules
- document publish actions
- workspace rail triggers
- admin automation retries
- super-admin business-unit and platform control actions
- **NEW**: Enhanced audit logging for admin/superadmin access
- **NEW**: Failed authentication attempts logging
- **NEW**: Super admin access validation logging

### System Actor ids

System-initiated operations (cron, webhooks, automated reconciliation) use namespaced ids in the format `system:<function-name>` (e.g., `system:reconcile-ledger`, `system:hse-escalation`). The literal string `"system"` must never be hardcoded as an actor identity — every audit entry must bind to a verifiable actor id.

## Public Intake

- public contact requests are accepted without a session
- public intake still passes through request validation, audit capture, and backend queueing where applicable

## Offline Sync Safety

- mutation IDs provide idempotent replay behavior
- duplicates are replay-safe
- partial success is supported for push batches
- explicit conflict resolution endpoint supports `server`, `client`, and `merge`

## Secrets Management

- set production secrets with `wrangler secret put --env=""`
- never commit production secrets
- keep static delivery and API on the same Cloudflare account and review secret scope per environment

## Production Hardening Checklist

1. Set `KHARON_MODE=production` only after required Google credentials are present.
2. Use at least two high-entropy `SESSION_KEYS` values.
3. Confirm `_headers` reflects final CSP, caching, and robots posture.
4. Lock final domains before customer rollout.
5. Review Cloudflare logs, audits, and health outputs daily during pilot.

## NEW: Enhanced Security Measures

The system now includes additional security hardening:

- **Admin/Superadmin Access Validation**: Enhanced validation and audit logging for admin and super admin access
- **Session Token Security**: Additional security checks for session tokens including clock drift protection
- **IP Address Logging**: All authentication requests now log IP addresses for security monitoring
- **Rate Limiting**: Enhanced rate limiting on authentication endpoints
- **Super Admin Bypass**: Super admin access now includes enhanced audit logging
- **Critical Action Protection**: Additional validation for critical admin actions
- **Enhanced Session Security**: Stricter session cookie policies with SameSite=Strict

## NEW: Enhanced RBAC Documentation

The system now supports granular permissions including:

- Job creation: Available to admin, dispatcher, and super_admin roles
- Job deletion: Available to admin and super_admin roles
- Document generation: Available to technician, dispatcher, admin, and super_admin roles
- Document publishing: Available to dispatcher, admin, and super_admin roles
- Schedule management: Available to dispatcher, admin, and super_admin roles
- User data access: Available to admin and super_admin roles
- Finance data access: Available to finance, admin, and super_admin roles
- System-level access: Super admin only
- Critical admin actions: Super admin only
- Bypass rate limits: Super admin only