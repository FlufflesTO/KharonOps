-- Postgres index scaffold for KharonOps.
-- These indexes assume the tables from 001_initial_schema.sql already exist.

BEGIN;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_lower ON users ((LOWER(email)));
CREATE INDEX IF NOT EXISTS idx_users_role_active ON users (role, active) WHERE active = TRUE;

CREATE INDEX IF NOT EXISTS idx_sites_client_uid ON sites (client_uid);
CREATE INDEX IF NOT EXISTS idx_technicians_email_lower ON technicians ((LOWER(email)));

CREATE INDEX IF NOT EXISTS idx_jobs_client_status ON jobs (client_uid, status, scheduled_start DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_site_status ON jobs (site_uid, status, scheduled_start DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_technician_status ON jobs (technician_uid, status, scheduled_start DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_active_dispatch ON jobs (status, scheduled_start DESC)
  WHERE status IN ('open', 'assigned', 'en_route', 'on_site', 'paused');

CREATE INDEX IF NOT EXISTS idx_job_events_job_uid ON job_events (job_uid, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_job_events_type ON job_events (event_type, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_job_documents_job_uid ON job_documents (job_uid, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_job_documents_status ON job_documents (status, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_schedule_requests_job_uid ON schedule_requests (job_uid, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_schedule_requests_status ON schedule_requests (status, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_schedules_job_uid ON schedules (job_uid, start_at DESC);
CREATE INDEX IF NOT EXISTS idx_schedules_technician_start ON schedules (technician_uid, start_at DESC);

CREATE INDEX IF NOT EXISTS idx_automation_jobs_pending ON automation_jobs (status, updated_at DESC)
  WHERE status IN ('queued', 'failed');

CREATE INDEX IF NOT EXISTS idx_sync_queue_job_uid ON sync_queue (job_uid, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_sync_queue_pending ON sync_queue (status, updated_at DESC)
  WHERE status IN ('conflict', 'failed');

CREATE INDEX IF NOT EXISTS idx_audit_events_action ON audit_events (action, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_events_actor ON audit_events (actor_user_uid, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_events_correlation ON audit_events (correlation_id);

CREATE INDEX IF NOT EXISTS idx_idempotency_keys_scope_status ON idempotency_keys (scope, status, last_seen_at DESC);
CREATE INDEX IF NOT EXISTS idx_idempotency_keys_locked_until ON idempotency_keys (locked_until) WHERE locked_until IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_attachments_job_uid ON attachments (job_uid, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_attachments_document_uid ON attachments (document_uid, updated_at DESC) WHERE document_uid IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_site_contacts_site_uid ON site_contacts (site_uid);
CREATE INDEX IF NOT EXISTS idx_site_contacts_email_lower ON site_contacts ((LOWER(email))) WHERE email <> '';

CREATE INDEX IF NOT EXISTS idx_contracts_client_status ON contracts (client_uid, status, starts_at DESC);
CREATE INDEX IF NOT EXISTS idx_contracts_site_uid ON contracts (site_uid) WHERE site_uid IS NOT NULL;

COMMIT;
