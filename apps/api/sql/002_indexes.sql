-- Postgres index scaffold for KharonOps.
-- These indexes assume the tables from 001_initial_schema.sql already exist.

BEGIN;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_lower ON users ((LOWER(email)));
CREATE INDEX IF NOT EXISTS idx_users_role_active ON users (role, active) WHERE active = TRUE;

CREATE INDEX IF NOT EXISTS idx_sites_client_id ON sites (client_id);
CREATE INDEX IF NOT EXISTS idx_technicians_email_lower ON technicians ((LOWER(email)));

CREATE INDEX IF NOT EXISTS idx_jobs_client_status ON jobs (client_id, status, scheduled_start DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_site_status ON jobs (site_id, status, scheduled_start DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_technician_status ON jobs (technician_id, status, scheduled_start DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_active_dispatch ON jobs (status, scheduled_start DESC)
  WHERE status IN ('open', 'assigned', 'en_route', 'on_site', 'paused');

CREATE INDEX IF NOT EXISTS idx_job_events_job_id ON job_events (job_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_job_events_type ON job_events (event_type, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_job_documents_job_id ON job_documents (job_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_job_documents_status ON job_documents (status, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_schedule_requests_job_id ON schedule_requests (job_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_schedule_requests_status ON schedule_requests (status, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_schedules_job_id ON schedules (job_id, start_at DESC);
CREATE INDEX IF NOT EXISTS idx_schedules_technician_start ON schedules (technician_id, start_at DESC);

CREATE INDEX IF NOT EXISTS idx_automation_jobs_pending ON automation_jobs (status, updated_at DESC)
  WHERE status IN ('queued', 'failed');

CREATE INDEX IF NOT EXISTS idx_sync_queue_job_id ON sync_queue (job_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_sync_queue_pending ON sync_queue (status, updated_at DESC)
  WHERE status IN ('conflict', 'failed');

CREATE INDEX IF NOT EXISTS idx_audit_events_action ON audit_events (action, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_events_actor ON audit_events (actor_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_events_correlation ON audit_events (correlation_id);

CREATE INDEX IF NOT EXISTS idx_idempotency_keys_scope_status ON idempotency_keys (scope, status, last_seen_at DESC);
CREATE INDEX IF NOT EXISTS idx_idempotency_keys_locked_until ON idempotency_keys (locked_until) WHERE locked_until IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_attachments_job_id ON attachments (job_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_attachments_document_id ON attachments (document_id, updated_at DESC) WHERE document_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_site_contacts_site_id ON site_contacts (site_id);
CREATE INDEX IF NOT EXISTS idx_site_contacts_email_lower ON site_contacts ((LOWER(email))) WHERE email <> '';

CREATE INDEX IF NOT EXISTS idx_contracts_client_status ON contracts (client_id, status, starts_at DESC);
CREATE INDEX IF NOT EXISTS idx_contracts_site_id ON contracts (site_id) WHERE site_id IS NOT NULL;

COMMIT;
