# Rollback Runbook

## Trigger Conditions

Initiate rollback when any of the following is true:

- sustained authentication or session failure
- RBAC leakage or ownership breach
- critical data integrity issue in Sheets
- severe sync replay failure with no mitigation inside SLA

## Rollback Assets

- previous public Cloudflare Worker version id
- previous internal Cloudflare Worker version id
- legacy read-only portal route configuration
- workbook snapshot export

## Rollback Procedure

1. declare rollback and freeze new writes from the portal
2. roll back the public Worker to the previous version
3. roll back the internal Worker to the previous version
4. re-enable the legacy read-only fallback window
5. confirm legacy read path and key customer-facing actions
6. preserve and export v1 audit and incident logs
