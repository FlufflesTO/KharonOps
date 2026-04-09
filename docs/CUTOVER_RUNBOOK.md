# Cutover Runbook

## Objective

Execute hard cutover from legacy system to Kharon Unified Rebuild v1 with controlled rollback path.

## Preconditions

1. Internal pilot sign-off complete.
2. All required secrets configured in Cloudflare and Netlify.
3. Workbook schema migration completed.
4. Contract/offline test suite green.
5. Rollback package prepared and validated.

## T-7 Days

1. Freeze non-critical changes.
2. Validate Google rails permissions (Sheets, Drive, Docs, Calendar, Gmail, Chat, People).
3. Rehearse cutover script and collect artifacts.

## T-1 Day

1. Export legacy read-only snapshot.
2. Notify internal stakeholders of cutover window.
3. Confirm dispatcher and admin access in v1 production environment.

## Cutover Day Procedure

1. Enable read-only mode on legacy front-end and operations paths.
2. Deploy latest verified Worker and Netlify build.
3. Execute smoke sequence:
   - admin login
   - job list and job detail
   - status update with row version
   - schedule request + confirm
   - document generate + publish
   - sync push/pull with conflict case
4. Enable client access only after internal smoke passes.

## Hypercare (First 24 Hours)

1. Monitor `/api/v1/admin/health` and audit logs.
2. Review sync conflict rates every hour.
3. Validate Gmail/Chat/People operational outputs.
4. Escalate and decide rollback if severity threshold is exceeded.

## Exit Criteria

- no P1/P2 unresolved incidents
- stable session and RBAC behavior
- no sustained data integrity errors
- successful controlled document publication
