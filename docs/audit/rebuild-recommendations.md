# Rebuild Recommendations - KharonOps Platform

## 1. Architectural Strategy

### 1.1 Unified Source of Truth
- **Recommendation**: Discontinue the "Dual-Write" real-time sync between Sheets and Postgres.
- **Action**: Adopt **PostgreSQL** as the canonical system of record (SVR-Canonical).
- **Secondary**: Use Google Sheets strictly as an "Export for Business Intelligence" or a "Manual Override Bridge" with a verified ingestion job, not real-time dual-writing.

### 1.2 Strict Type Enforcement
- **Recommendation**: Eliminate `normalizeValue` and `stringifyRow` patterns.
- **Action**: Use Zod schemas not just for API validation, but for database row mapping. Enforce strict types from the database driver up to the UI.

### 1.3 Service-Oriented Core
- **Recommendation**: Decouple the `Store` interface from business logic.
- **Action**: Create a `JobService`, `AuthService`, and `DocumentService` that handle RBAC and business rules, calling the `Store` only for persistence.

## 2. Infrastructure & Deployment

### 2.1 Worker Reliability
- **Recommendation**: Use Cloudflare KV or Durable Objects for global session state and rate limiting.
- **Action**: Move session management from pure JWT to a KV-backed session store to allow for instant revocation.

### 2.2 Forensic Audit Trail
- **Recommendation**: Implement a tamper-evident audit log.
- **Action**: Every mutation should generate an audit entry in a dedicated table with a cryptographic hash chain or at least a strict non-nullable `correlation_id`.

## 3. UI/UX Evolution (Level 4 Hardening)

### 3.1 Component Consistency
- **Recommendation**: Standardize on a strict design system (Vibrant/Dark Mode).
- **Action**: Remove all inline styles and legacy CSS. Use a consistent set of UI primitives for all roles.

### 3.2 Action-Data Controller Pattern
- **Recommendation**: Retain the `usePortalActionControllers` pattern but simplify prop-drilling.
- **Action**: Use a Context-based Action Registry so that deep components can trigger actions without passing them through 5 layers of parents.

## 4. Specific Fixes (Legacy Cleanup)

### 4.1 Global Namespace Purge
- **Recommendation**: Fix the `loadAdminHealth` ReferenceError by ensuring it's always imported from the Action Registry.
- **Action**: Audit all `.html` templates and `onclick` attributes to ensure they use the modern React event system.

## 5. Development Workflow

### 5.1 Zero-Any Compliance
- **Recommendation**: Enforce `strict: true` and `noImplicitAny` in `tsconfig.json`.
- **Action**: Any usage of `any` must be flagged in CI/CD and blocked from merging.
