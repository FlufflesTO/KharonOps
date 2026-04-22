-- Postgres transactional schema scaffold for KharonOps.
-- Apply with the desired search_path set. The current runtime does not execute this file yet.

BEGIN;

CREATE TABLE IF NOT EXISTS users (
  user_id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('client', 'technician', 'dispatcher', 'admin')),
  client_id TEXT NOT NULL DEFAULT '',
  technician_id TEXT NOT NULL DEFAULT '',
  active BOOLEAN NOT NULL DEFAULT TRUE,
  row_version INTEGER NOT NULL DEFAULT 1 CHECK (row_version >= 1),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by TEXT NOT NULL,
  correlation_id TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS clients (
  client_id TEXT PRIMARY KEY,
  client_name TEXT NOT NULL,
  contact_email TEXT NOT NULL DEFAULT '',
  contact_phone TEXT NOT NULL DEFAULT '',
  row_version INTEGER NOT NULL DEFAULT 1 CHECK (row_version >= 1),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by TEXT NOT NULL,
  correlation_id TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sites (
  site_id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL REFERENCES clients (client_id) ON DELETE RESTRICT,
  site_name TEXT NOT NULL,
  address TEXT NOT NULL DEFAULT '',
  row_version INTEGER NOT NULL DEFAULT 1 CHECK (row_version >= 1),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by TEXT NOT NULL,
  correlation_id TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS technicians (
  technician_id TEXT PRIMARY KEY,
  technician_name TEXT NOT NULL,
  email TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  row_version INTEGER NOT NULL DEFAULT 1 CHECK (row_version >= 1),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by TEXT NOT NULL,
  correlation_id TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS jobs (
  job_id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL REFERENCES clients (client_id) ON DELETE RESTRICT,
  site_id TEXT NOT NULL REFERENCES sites (site_id) ON DELETE RESTRICT,
  technician_id TEXT REFERENCES technicians (technician_id) ON DELETE RESTRICT,
  title TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft', 'performed', 'rejected', 'approved', 'certified', 'cancelled')),
  scheduled_start TIMESTAMPTZ NOT NULL,
  scheduled_end TIMESTAMPTZ NOT NULL,
  last_note TEXT NOT NULL DEFAULT '',
  row_version INTEGER NOT NULL DEFAULT 1 CHECK (row_version >= 1),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by TEXT NOT NULL,
  correlation_id TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS job_events (
  event_id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL REFERENCES jobs (job_id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  row_version INTEGER NOT NULL DEFAULT 1 CHECK (row_version >= 1),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by TEXT NOT NULL,
  correlation_id TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS job_documents (
  document_id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL REFERENCES jobs (job_id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN ('jobcard', 'service_report', 'certificate')),
  status TEXT NOT NULL CHECK (status IN ('generated', 'published')),
  drive_file_id TEXT NOT NULL DEFAULT '',
  pdf_file_id TEXT NOT NULL DEFAULT '',
  published_url TEXT NOT NULL DEFAULT '',
  row_version INTEGER NOT NULL DEFAULT 1 CHECK (row_version >= 1),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by TEXT NOT NULL,
  correlation_id TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS schedule_requests (
  request_id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL REFERENCES jobs (job_id) ON DELETE CASCADE,
  client_id TEXT NOT NULL REFERENCES clients (client_id) ON DELETE RESTRICT,
  preferred_slots_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  timezone TEXT NOT NULL,
  notes TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL CHECK (status IN ('requested', 'confirmed', 'rescheduled')),
  row_version INTEGER NOT NULL DEFAULT 1 CHECK (row_version >= 1),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by TEXT NOT NULL,
  correlation_id TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS schedules (
  schedule_id TEXT PRIMARY KEY,
  request_id TEXT NOT NULL REFERENCES schedule_requests (request_id) ON DELETE CASCADE,
  job_id TEXT NOT NULL REFERENCES jobs (job_id) ON DELETE CASCADE,
  calendar_event_id TEXT NOT NULL DEFAULT '',
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  technician_id TEXT NOT NULL REFERENCES technicians (technician_id) ON DELETE RESTRICT,
  status TEXT NOT NULL CHECK (status IN ('confirmed', 'rescheduled')),
  row_version INTEGER NOT NULL DEFAULT 1 CHECK (row_version >= 1),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by TEXT NOT NULL,
  correlation_id TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS automation_jobs (
  automation_job_id TEXT PRIMARY KEY,
  action TEXT NOT NULL,
  payload_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL CHECK (status IN ('queued', 'done', 'failed')),
  retry_count INTEGER NOT NULL DEFAULT 0 CHECK (retry_count >= 0),
  last_error TEXT NOT NULL DEFAULT '',
  row_version INTEGER NOT NULL DEFAULT 1 CHECK (row_version >= 1),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by TEXT NOT NULL,
  correlation_id TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sync_queue (
  mutation_id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL REFERENCES jobs (job_id) ON DELETE CASCADE,
  actor_id TEXT NOT NULL REFERENCES users (user_id) ON DELETE RESTRICT,
  payload_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL CHECK (status IN ('applied', 'conflict', 'failed')),
  last_result JSONB NOT NULL DEFAULT '{}'::jsonb,
  row_version INTEGER NOT NULL DEFAULT 1 CHECK (row_version >= 1),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by TEXT NOT NULL,
  correlation_id TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS system_config (
  config_key TEXT PRIMARY KEY,
  config_value JSONB NOT NULL DEFAULT '{}'::jsonb,
  row_version INTEGER NOT NULL DEFAULT 1 CHECK (row_version >= 1),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by TEXT NOT NULL,
  correlation_id TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS audit_events (
  audit_id TEXT PRIMARY KEY,
  action TEXT NOT NULL,
  payload_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  actor_user_id TEXT NOT NULL DEFAULT '',
  correlation_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS idempotency_keys (
  idempotency_key TEXT PRIMARY KEY,
  scope TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed')),
  response_code INTEGER,
  response_body JSONB NOT NULL DEFAULT '{}'::jsonb,
  locked_until TIMESTAMPTZ,
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS attachments (
  attachment_id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL REFERENCES jobs (job_id) ON DELETE CASCADE,
  document_id TEXT REFERENCES job_documents (document_id) ON DELETE SET NULL,
  storage_provider TEXT NOT NULL,
  storage_key TEXT NOT NULL,
  filename TEXT NOT NULL,
  content_type TEXT NOT NULL,
  byte_size BIGINT NOT NULL DEFAULT 0 CHECK (byte_size >= 0),
  checksum_sha256 TEXT NOT NULL DEFAULT '',
  client_visible BOOLEAN NOT NULL DEFAULT FALSE,
  row_version INTEGER NOT NULL DEFAULT 1 CHECK (row_version >= 1),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by TEXT NOT NULL,
  correlation_id TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS site_contacts (
  site_contact_id TEXT PRIMARY KEY,
  site_id TEXT NOT NULL REFERENCES sites (site_id) ON DELETE CASCADE,
  client_id TEXT NOT NULL REFERENCES clients (client_id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  email TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  role_label TEXT NOT NULL DEFAULT '',
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  row_version INTEGER NOT NULL DEFAULT 1 CHECK (row_version >= 1),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by TEXT NOT NULL,
  correlation_id TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS contracts (
  contract_id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL REFERENCES clients (client_id) ON DELETE RESTRICT,
  site_id TEXT REFERENCES sites (site_id) ON DELETE SET NULL,
  contract_name TEXT NOT NULL,
  service_level TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL CHECK (status IN ('draft', 'active', 'paused', 'expired')),
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  billing_reference TEXT NOT NULL DEFAULT '',
  response_commitment_hours NUMERIC(8, 2),
  row_version INTEGER NOT NULL DEFAULT 1 CHECK (row_version >= 1),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by TEXT NOT NULL,
  correlation_id TEXT NOT NULL
);

COMMIT;
