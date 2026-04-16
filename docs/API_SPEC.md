# API Specification — KharonOps (KharonWeb Worker)

Base URL: Depends on deployment (local dev: `http://localhost:8787`)

All endpoints live under `/api/*`. The worker enforces CORS preflight (`OPTIONS`) for all routes.

## Response Format

All responses use the following envelope:

```json
{
  "success": true,
  "data": { ... },
  "error": null
}
```

Error responses:

```json
{
  "success": false,
  "error": "Human-readable error message"
}
```

Standard HTTP status codes: `200`, `204` (CORS preflight), `400`, `403`, `404`, `422`, `500`.

## Auth

### GET `/auth/session`

> **Note:** Currently a scaffold endpoint. Returns session state when Cloudflare Access JWT assertion is present.

Requires: `Cf-Access-Jwt-Assertion` header (when Access enforcement is enabled).

Success `200`:
```json
{ "success": true, "data": { "email": "tech@example.com", "role": "technician" } }
```

Failure `401`:
```json
{ "success": false, "error": "Unauthorized" }
```

---

## Endpoints

### GET `/api/health`  /  `/api/v1/health`

Worker health-check. No auth required.

Success `200`:
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "timestamp": "2026-04-15T12:00:00.000Z",
    "ledger_configured": true
  }
}
```

### POST `/api/submit-contact`

Contact form submission.

Body:
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "message": "Requesting a site visit.",
  "phone": "0123456789",
  "property_type": "commercial",
  "service_required": "fire-alarm"
}
```

Required fields: `name`, `email`, `message`.

Success `200`:
```json
{ "success": true, "data": { "message": "Contact form submitted successfully" } }
```

### POST `/api/submit-job`

Job card submission from technician portal.

Body:
```json
{
  "title": "SVR_SITE_INSPECTION",
  "description": "Full fire alarm system audit completed.",
  "site_name": "Acme Warehouse",
  "status": "performed",
  "priority": "normal",
  "discipline": "fire",
  "assigned_to": "tech@example.com",
  "evidence_notes": "All zones passing."
}
```

Required fields: `title`, `description`.

Status taxonomy (canonical, from `packages/domain/src/status.ts`):
`draft` → `performed` → `rejected` | `approved` → `certified`

Additional terminal state: `cancelled`.

Success `200`:
```json
{
  "success": true,
  "data": {
    "job": {
      "id": "uuid-v4",
      "created_at": "2026-04-15T12:00:00.000Z",
      "title": "SVR_SITE_INSPECTION",
      "description": "Full fire alarm system audit completed.",
      "status": "performed",
      "site_name": "Acme Warehouse",
      "determination_status": "PENDING"
    }
  }
}
```

### GET `/api/get-jobs`

Retrieve job list. Query params filter by `status` and `role`.

Query: `?role=admin&status=performed`

- Non-admin callers receive a reduced object: `{ id, created_at, title, status, priority }`.
- Admin callers receive the full job record.

Success `200`:
```json
{
  "success": true,
  "data": {
    "jobs": [
      {
        "id": "uuid-v4",
        "created_at": "2026-04-15T12:00:00.000Z",
        "title": "SVR_SITE_INSPECTION",
        "status": "performed",
        "priority": "normal"
      }
    ]
  }
}
```

### POST `/api/submit-sla-request`

SLA / fault request submission.

Body:
```json
{
  "clientCode": "CLI-001",
  "contactName": "John Smith",
  "contactEmail": "john@client.com",
  "siteName": "Client HQ",
  "faultDescription": "Intruder panel showing persistent fault code E-42.",
  "priority": "high"
}
```

Also accepts flat field names: `client_name`, `property`, `description`, `urgency`.

Required fields: `clientCode` (or `client_name`), `siteName` (or `property`), `faultDescription` (or `description`).

Success `200`:
```json
{ "success": true, "data": { "message": "SLA request submitted successfully" } }
```

### POST `/api/determine-job`

Log a determination (approve / reject / certify) for a job.

Body:
```json
{
  "jobId": "uuid-v4",
  "status": "approved",
  "rationale": "All checks passed per SVR protocol.",
  "determinedBy": "admin@example.com"
}
```

Required fields: `jobId`, `status`.

Success `200`:
```json
{
  "success": true,
  "data": {
    "message": "Determination logged as approved",
    "integrity_marker": "SVR_HASH:<sha256-hash>"
  }
}
```

### POST `/api/generate-report`

Generate an audit-ready controlled document for a job.

Body:
```json
{ "jobId": "uuid-v4" }
```

Required: job must have `determination_status === 'APPROVED'`, else `403`.

Success `200`:
```json
{
  "success": true,
  "data": {
    "report": {
      "job_id": "uuid-v4",
      "generated_at": "2026-04-15T12:00:00.000Z",
      "title": "SVR_SITE_INSPECTION",
      "status": "performed",
      "determined_by": "admin@example.com",
      "site_name": "Acme Warehouse",
      "discipline": "fire"
    }
  }
}
```

---

## Sheet Column Layout (Jobs)

| Col | Field                |
|-----|----------------------|
| A   | id                   |
| B   | created_at           |
| C   | title                |
| D   | description          |
| E   | assigned_to          |
| F   | priority             |
| G   | status               |
| H   | notes                |
| I   | site_name            |
| J   | site_address         |
| K   | discipline           |
| L   | impairments          |
| M   | arrival_at           |
| N   | compliance_passed    |
| O   | determination_status |
| P   | determined_by        |
| Q   | rationale            |
| R   | integrity_marker     |

---

## Error Semantics

| Code | Meaning                         |
|------|---------------------------------|
| 400  | Bad request / not found         |
| 401  | Auth required (Access JWT)      |
| 403  | Role / ownership forbidden      |
| 404  | Entity not found                |
| 422  | Missing required fields         |
| 409  | Optimistic concurrency conflict |
| 500  | Internal / runtime failure      |
