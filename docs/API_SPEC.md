# KharonOps API Specification

Base URL: deployment dependent (local worker preview, staging, or production).

All application endpoints are under `/api/v1/*`.

## Envelope

Every JSON response uses the domain envelope:

```json
{
  "data": {},
  "error": null,
  "correlation_id": "uid",
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
  "correlation_id": "uid",
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

- `GET /api/v1/jobs` — returns enriched job records (see Name Enrichment below)
- `GET /api/v1/jobs/:job_id` — returns a single enriched job record
- `POST /api/v1/jobs/:job_id/status`
- `POST /api/v1/jobs/:job_id/note`
- `POST /api/v1/schedules/request-slot`
- `POST /api/v1/schedules/confirm`
- `POST /api/v1/schedules/reschedule`
- `POST /api/v1/documents/generate`
- `POST /api/v1/documents/publish`
- `GET /api/v1/documents/history`
- `GET /api/v1/sync/pull`
- `POST /api/v1/sync/push`

## Public Endpoints

- `POST /api/v1/public/contact` - captures public support and contact requests from the website and portal support card

## Admin Endpoints

- `GET /api/v1/admin/health`
- `GET /api/v1/admin/audits`
- `POST /api/v1/admin/retries/:automation_job_id`

## Health

- `GET /api/v1/health`

## Name Enrichment

The `GET /jobs` and `GET /jobs/:job_id` endpoints enrich each `JobRow` with two additional display fields:

| Field              | Type     | Source Priority                                           |
|--------------------|----------|-----------------------------------------------------------|
| `client_name`      | `string` | Clients_Master (primary) → Users_Master (fallback)        |
| `technician_name`  | `string` | Technicians_Master (primary) → Users_Master (fallback)    |

These fields are **not** stored in the job record. They are resolved at query time using the `buildNameLookups` service. If any reference-sheet fetch fails, the endpoint degrades gracefully — job data is returned with empty name fields rather than failing with a 500.

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
- Public contact requests are accepted without a session and still flow through the standard envelope and audit capture path.
