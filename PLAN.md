# Kharon Unified Rebuild v1 Plan

## Summary

- Build and harden the current codebase into a production-ready platform.
- Deliver one responsive product with:
  - public marketing website
  - role-based portal for client, technician, dispatcher, finance, admin, and super_admin
- Use Cloudflare as the delivery and API platform from day one.
- Use Google Workspace as the v1 integration rail.
- Use Google Sheets as the v1 canonical system of record.

## Repo Architecture

- `apps/site`
- `apps/portal`
- `apps/api`
- `packages/domain`
- `packages/google`
- `packages/ui`

Public Workers serve static content and `/api/*`.
Internal Workers remain API-only for tighter control and admin use.

## Identity and Security

- Google OAuth or OIDC login
- server-side RBAC only
- required ID token verification
- signed session cookies
- audit logging for privileged actions
- public contact intake is unauthenticated but still audited

## Data and Workflow

- canonical workbook tabs for jobs, users, clients, sites, documents, schedules, sync queue, and config
- optimistic concurrency with `row_version`
- controlled docs for Jobcard and Service Report
- public support requests land through `/api/v1/public/contact`

## Release Model

- internal pilot first
- controlled cutover day
- rollback package kept ready for a fixed window
