# Rollback Runbook

## Trigger Conditions

Initiate rollback when any of the following is true:
- sustained authentication/session failure
- RBAC leakage or ownership breach
- critical data integrity issue in Sheets
- severe sync replay failure with no mitigation inside SLA

## Rollback Assets

- previous Netlify deploy id
- previous Cloudflare Worker version id
- legacy read-only portal route configuration
- workbook snapshot export (pre-cutover)

## Rollback Procedure

1. Declare rollback and freeze new writes from portal.
2. Re-point Netlify to previous deploy.
3. Roll back Worker to previous version.
4. Re-enable legacy read-only fallback window.
5. Confirm legacy read path and key customer-facing actions.
6. Preserve and export v1 audit and incident logs.

## Data Handling

- Do not delete v1 workbook tabs.
- Capture post-cutover delta for forensic review.
- Reconcile any client-visible discrepancies before reattempt.

## Communications

1. Notify internal incident bridge.
2. Notify pilot users of temporary fallback.
3. Publish recovery ETA and decision checkpoint timeline.

## Recovery Gate to Retry Cutover

- root cause identified and fixed
- regression tests expanded and passing
- dry-run cutover and rollback rehearsal revalidated
- approval from operations lead and admin owner
