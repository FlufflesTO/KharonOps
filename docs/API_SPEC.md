# API Specification

Base path: `/api/v1`

When Cloudflare Access enforcement is enabled in runtime config, every `/api/v1/*` request must include a valid `Cf-Access-Jwt-Assertion` header.

All responses use:

```json
{
  "data": {},
  "error": null,
  "correlation_id": "uuid",
  "row_version": 3,
  "conflict": null
}
```

## Auth

### POST `/auth/google-login`
Body:
```json
{ "id_token": "..." }
```
Success `200`: session payload + mode metadata.

### GET `/auth/session`
Requires session cookie.
Success `200`: active session.
Failure `401`: unauthorized.

### POST `/auth/logout`
Clears session cookie.

## Jobs

### GET `/jobs`
Returns role-filtered job list.

### GET `/jobs/:job_uid`
Returns owned/authorized job detail.

### POST `/jobs/:job_uid/status`
Body:
```json
{ "status": "on_site", "row_version": 2 }
```
- validates transition graph
- enforces ownership and role
- stale version => `409` + conflict payload

### POST `/jobs/:job_uid/note`
Body:
```json
{ "note": "text", "row_version": 2 }
```
- optimistic concurrency enforced

## Schedules

### POST `/schedules/request-slot`
Body:
```json
{
  "job_uid": "JOB-1001",
  "preferred_slots": [{ "start_at": "...", "end_at": "..." }],
  "timezone": "Africa/Johannesburg",
  "notes": "",
  "row_version": 3
}
```
Client requests preferred slots only.

### POST `/schedules/confirm`
Dispatcher/admin confirms final booking.

### POST `/schedules/reschedule`
Dispatcher/admin reschedules confirmed booking.

## Documents

### POST `/documents/generate`
Body:
```json
{ "job_uid": "JOB-1001", "document_type": "jobcard", "tokens": {} }
```
Supported `document_type`: `jobcard`, `service_report`.

### POST `/documents/publish`
Body:
```json
{ "document_uid": "DOC-...", "row_version": 1, "client_visible": true }
```

### GET `/documents/history?job_uid=JOB-1001`
Returns document records filtered by role ownership.

## Sync

### GET `/sync/pull?since=ISO_DATE`
Returns owned jobs + relevant sync queue entries.

### POST `/sync/push`
Body:
```json
{
  "mutations": [
    {
      "mutation_id": "MUT-1",
      "kind": "job_status",
      "job_uid": "JOB-1001",
      "expected_row_version": 2,
      "payload": { "status": "on_site" }
    }
  ]
}
```
- partial success supported
- idempotent duplicate handling
- conflicts returned with full conflict payload

### POST `/sync/conflict/resolve`
Body:
```json
{
  "job_uid": "JOB-1001",
  "strategy": "merge",
  "server_row_version": 3,
  "client_row_version": 2,
  "merge_patch": { "last_note": "..." }
}
```

## Workspace

### POST `/workspace/gmail/notify`
Triggers Gmail notification.

### POST `/workspace/chat/alert`
Triggers Chat alert.

### POST `/workspace/people/sync`
Creates/syncs contact in People.

## Admin

### GET `/admin/health`
Admin-only health status.

### GET `/admin/audits`
Admin-only privileged action audits.

### POST `/admin/retries/:automation_job_uid`
Admin-only automation retry operation.

## Error Semantics

- `400` validation errors
- `401` authentication required
- `403` role/ownership forbidden
- `404` missing entity
- `409` optimistic concurrency conflict
- `500` internal/runtime failures
