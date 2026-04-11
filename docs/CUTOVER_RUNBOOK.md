# Cutover Runbook

## Objective

Execute hard cutover from the legacy system to Kharon Unified Rebuild v1 with a controlled rollback path.

## Preconditions

1. internal pilot sign-off complete
2. all required Cloudflare secrets configured
3. workbook schema migration completed
4. contract and offline test suite green
5. rollback package prepared and validated

## T-7 Days

1. freeze non-critical changes
2. validate Google rails permissions
3. rehearse the cutover script and collect artifacts

## T-1 Day

1. export legacy read-only snapshot
2. notify internal stakeholders of the cutover window
3. confirm dispatcher and admin access in production

## Cutover Day Procedure

1. enable read-only mode on legacy front-end and operations paths
2. deploy the latest verified internal Worker
3. deploy the latest verified public Worker
4. execute smoke sequence:
   - admin login
   - job list and job detail
   - status update with row version
   - schedule request and confirm
   - document generate and publish
   - sync push and pull with a conflict case
5. enable client access only after internal smoke passes

## Hypercare

1. monitor `/api/v1/admin/health` and audit logs
2. review sync conflict rates every hour
3. validate Gmail, Chat, and People outputs
4. escalate and decide rollback if severity threshold is exceeded
