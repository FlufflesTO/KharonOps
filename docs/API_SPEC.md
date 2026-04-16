# KharonOps API Specification

Base URL: deployment dependent (local worker preview, staging, or production).

All application endpoints are under `/api/v1/*`.

## Envelope

Every JSON response uses the domain envelope:

```json
{
  "data": {},
  "error": null,
  "correlation_id": "uuid",
  "row_version": null,
  "conflict": null
}
```

Error example:

```json
{
  "data": null,
  "error": {
    "code": "validation_error",
    "message": "Request validation failed"
  },
  "correlation_id": "uuid",
  "row_version": null,
  "conflict": null
}
```

## Auth Endpoints

- `GET /api/v1/auth/config`
- `GET /api/v1/auth/session`
- `POST /api/v1/auth/google-login`
- `POST /api/v1/auth/logout`

## Core Endpoints

- `GET /api/v1/jobs`
- `GET /api/v1/jobs/:job_uid`
- `POST /api/v1/jobs/:job_uid/status`
- `POST /api/v1/jobs/:job_uid/note`
- `POST /api/v1/schedules/request-slot`
- `POST /api/v1/schedules/confirm`
- `POST /api/v1/schedules/reschedule`
- `POST /api/v1/documents/generate`
- `POST /api/v1/documents/publish`
- `GET /api/v1/documents/history`
- `GET /api/v1/sync/pull`
- `POST /api/v1/sync/push`

## Admin Endpoints

- `GET /api/v1/admin/health`
- `GET /api/v1/admin/audits`
- `POST /api/v1/admin/retries/:automation_job_uid`

## Health

- `GET /api/v1/health`

## Status Codes

Common status codes used by the runtime:

- `200` success
- `400` invalid request / validation failure
- `401` unauthorized
- `403` forbidden
- `404` not found
- `409` conflict (row-version or sync conflict)
- `429` upstream/google throttling
- `500` internal error

## Notes

- `correlation_id` is generated per request and propagated into audit/store events.
- `row_version` is returned on mutable operations to support optimistic concurrency.
- `conflict` is populated for conflict responses (`409`) and includes server state.
- Cloudflare Access can be enabled for `/api/v1/*` via runtime config.
