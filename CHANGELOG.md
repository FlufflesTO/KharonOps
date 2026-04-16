# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.3.0] - 2026-04-16

### Added
- **SuperAdmin Role** (`packages/domain/src/types.ts`): Added `"super_admin"` to the canonical `Role` union. This is the definitive change point — all other files derive from this.
- **RBAC Super-Inheritance** (`packages/domain/src/rbac.ts`): All RBAC gate functions (`canReadJob`, `canRequestSchedule`, `canConfirmSchedule`, `canGenerateDocument`, `canPublishDocument`, `canUseAdmin`, `canUpdateJobStatus`) now short-circuit with a centralised `isSuperAdmin()` helper, granting full access across all domains.
- **Super Admin Dashboard** (`apps/portal/src/components/DashboardView.tsx`): SuperAdmin login shows all 4 role-specific command cards — Field Operations (technician), Schedule Control (dispatcher), Compliance Vault (client), and Platform Governance (admin).
- **Role Tag Display**: Dashboard header shows `"SUPER ADMIN — FULL ACCESS"` for `super_admin` sessions.
- **Schema Enum** (`packages/domain/src/schema.ts`): `super_admin` added to `role_hint` enum in `peopleSyncSchema`.

### Security
- **Hard-wired SuperAdmin Elevation** (`apps/api/src/index.ts`): `connor@kharon.co.za` is listed in the `SUPER_ADMIN_EMAILS` allowlist. After OIDC verification, the login handler overrides the `Role` from `Users_Master` to `"super_admin"` for this address. The allowlist requires a code change + deploy to modify — no UI-level self-service path exists. `super_admin` is never stored in `Users_Master`.

### Fixed
- **GLOBAL-002 Violation**: `PortalSession` in `apps/portal/src/apiClient.ts` was defining `role` as a local 4-member literal union, duplicating `@kharon/domain`. Now imports and uses the canonical `Role` type.

 - 2026-04-16

### Security
- [Security] **CRITICAL (A-001):** Replaced deprecated Google `tokeninfo` API endpoint with a fully local JWKS RS256 signature verifier in `packages/google/src/index.ts`. Eliminates 200–500ms server-to-server round-trip latency on every login and removes the dependency on Google's external validation API — the confirmed root cause of intermittent `400` authentication errors. Tokens are now verified locally using Google's public JWKS keys (`https://www.googleapis.com/oauth2/v3/certs`) via the Web Crypto API.
- [Security] **(A-004):** Hardened issuer validation in `verifyGoogleIdToken`. Replaced the bypassable `.includes("accounts.google.com")` substring check with an exact `Set` membership test against `["https://accounts.google.com", "accounts.google.com"]`. Prevents issuer spoofing via domains like `evil-accounts.google.com.attacker.com`.
- [Security] **(A-008):** Replaced real production email `connor@kharon.co.za` in dev token map (`auth/google.ts`) with RFC-2606-reserved `.invalid` TLD addresses (e.g., `dev.admin@kharon.invalid`). Prevents accidental role acquisition if `KHARON_MODE` is misconfigured.

### Fixed
- [Fixed] **(A-007):** Removed non-null assertions (`result.data!`) from `apiClient.ts` `login()` and `authConfig()` methods. Replaced with structured `ApiEnvelope<null>` error throws that surface a meaningful `"empty_response"` code to the UI.

### Added
- [Added] JWKS response caching in `loadOidcJwks()`. Cache TTL respects `Cache-Control: max-age` from Google's JWKS endpoint (defaulting to 5 minutes). Reduces JWKS fetch frequency for high-traffic deployments.

## [1.1.0] - 2026-04-16

### Added
- [Added] Role-based Dashboard landing surface in Portal (`DashboardView.tsx`) to reduce initial information density.
- [Added] Global GSI initialization lock to prevent duplicate Google Identity Services script calls.
- [Added] Dashboard/Workspace view switching state in Portal `App.tsx`.

### Changed
- [Changed] Removed "Command Centre Login" button from Marketing Site header to improve mobile responsiveness.
- [Changed] Relaxed `Cross-Origin-Opener-Policy` to `unsafe-none` in API middleware to resolve Google Login popup blockers.
- [Changed] Refactored `@kharon/domain` source exports to resolve Vite build resolution issues in the monorepo.

### Fixed
- [Fixed] Authentication instability caused by GSI double-initialization.
- [Fixed] Portal build failures caused by stale compiled files shadowing source and missing exports.
- [Fixed] Header density on small screens for the public marketing site.

### Security
- [Security] Standardized COOP headers to balance security and authentication interoperability.
- [Security] Ensured strict type adherence in new Dashboard components (Zero-Any policy).
