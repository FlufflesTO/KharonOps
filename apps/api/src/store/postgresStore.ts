import {
  bumpMutableMeta,
  canReadJob,
  canTransitionStatus,
  newMutableMeta,
  type ApiError,
  type ConflictPayload,
  type EscrowRow,
  type FinanceDebtorRow,
  type FinanceInvoiceRow,
  type FinanceQuoteRow,
  type FinanceStatementRow,
  type AutomationJobRow,
  type JobDocumentRow,
  type JobEventRow,
  type JobRow,
  type ScheduleRequestRow,
  type ScheduleRow,
  type SessionUser,
  type SyncMutation,
  type SyncPushResult,
  type SyncQueueRow,
  type SkillMatrixRow,
  type ClientRow,
  type TechnicianRow,
  type UserRow
} from "@kharon/domain";
import type { PostgresStoreConfig } from "../config.js";
import type { StoreContext, WorkbookStore } from "./types.js";
import {
  type PgRow,
  automationJobRowFromPg,
  clientRowFromPg,
  escrowRowFromPg,
  financeDebtorRowFromPg,
  financeInvoiceRowFromPg,
  financeQuoteRowFromPg,
  financeStatementRowFromPg,
  jobDocumentRowFromPg,
  jobEventRowFromPg,
  jobRowFromPg,
  scheduleRequestRowFromPg,
  scheduleRowFromPg,
  skillMatrixRowFromPg,
  syncQueueRowFromPg,
  technicianRowFromPg,
  userRowFromPg
} from "./mappers/postgresRows.js";
import { immutableClone, normalizeError, nowIso, stampEvent, toConflict } from "./postgres/helpers.js";
import { buildPoolConfig, loadPgModule, type PgClient, type PgPool } from "./postgres/runtime.js";

// ---------------------------------------------------------------------------
// Schema DDL
// ---------------------------------------------------------------------------

const SCHEMA_DDL = `
CREATE TABLE IF NOT EXISTS svr_users (
  user_id        TEXT PRIMARY KEY,
  email           TEXT NOT NULL UNIQUE,
  display_name    TEXT NOT NULL,
  role            TEXT NOT NULL,
  client_id      TEXT NOT NULL DEFAULT '',
  technician_id  TEXT NOT NULL DEFAULT '',
  active          TEXT NOT NULL DEFAULT 'true',
  row_version     INTEGER NOT NULL DEFAULT 1,
  updated_at      TEXT NOT NULL,
  updated_by      TEXT NOT NULL,
  correlation_id  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS svr_jobs (
  job_id         TEXT PRIMARY KEY,
  client_id      TEXT NOT NULL,
  site_id        TEXT NOT NULL,
  technician_id  TEXT NOT NULL,
  title           TEXT NOT NULL,
  status          TEXT NOT NULL,
  scheduled_start TEXT NOT NULL,
  scheduled_end   TEXT NOT NULL,
  last_note       TEXT NOT NULL DEFAULT '',
  row_version     INTEGER NOT NULL DEFAULT 1,
  updated_at      TEXT NOT NULL,
  updated_by      TEXT NOT NULL,
  correlation_id  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS svr_job_events (
  event_id       TEXT PRIMARY KEY,
  job_id         TEXT NOT NULL REFERENCES svr_jobs(job_id),
  event_type      TEXT NOT NULL,
  payload_json    TEXT NOT NULL,
  row_version     INTEGER NOT NULL DEFAULT 1,
  updated_at      TEXT NOT NULL,
  updated_by      TEXT NOT NULL,
  correlation_id  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS svr_schedule_requests (
  request_id        TEXT PRIMARY KEY,
  job_id            TEXT NOT NULL REFERENCES svr_jobs(job_id),
  client_id         TEXT NOT NULL,
  preferred_slots_json TEXT NOT NULL,
  timezone           TEXT NOT NULL DEFAULT 'UTC',
  notes              TEXT NOT NULL DEFAULT '',
  status             TEXT NOT NULL DEFAULT 'requested',
  row_version        INTEGER NOT NULL DEFAULT 1,
  updated_at         TEXT NOT NULL,
  updated_by         TEXT NOT NULL,
  correlation_id     TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS svr_schedules (
  schedule_id      TEXT PRIMARY KEY,
  request_id       TEXT NOT NULL REFERENCES svr_schedule_requests(request_id),
  job_id           TEXT NOT NULL REFERENCES svr_jobs(job_id),
  calendar_event_id TEXT NOT NULL DEFAULT '',
  start_at          TEXT NOT NULL,
  end_at            TEXT NOT NULL,
  technician_id    TEXT NOT NULL,
  status            TEXT NOT NULL DEFAULT 'confirmed',
  row_version       INTEGER NOT NULL DEFAULT 1,
  updated_at        TEXT NOT NULL,
  updated_by        TEXT NOT NULL,
  correlation_id    TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS svr_job_documents (
  document_id    TEXT PRIMARY KEY,
  job_id         TEXT NOT NULL REFERENCES svr_jobs(job_id),
  document_type   TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'generated',
  drive_file_id   TEXT NOT NULL DEFAULT '',
  pdf_file_id     TEXT NOT NULL DEFAULT '',
  published_url   TEXT NOT NULL DEFAULT '',
  client_visible  BOOLEAN NOT NULL DEFAULT FALSE,
  row_version     INTEGER NOT NULL DEFAULT 1,
  updated_at      TEXT NOT NULL,
  updated_by      TEXT NOT NULL,
  correlation_id  TEXT NOT NULL
);


CREATE TABLE IF NOT EXISTS svr_automation_jobs (
  automation_job_id TEXT PRIMARY KEY,
  action             TEXT NOT NULL,
  payload_json       TEXT NOT NULL,
  status             TEXT NOT NULL DEFAULT 'queued',
  retry_count        INTEGER NOT NULL DEFAULT 0,
  last_error         TEXT NOT NULL DEFAULT '',
  row_version        INTEGER NOT NULL DEFAULT 1,
  updated_at         TEXT NOT NULL,
  updated_by         TEXT NOT NULL,
  correlation_id     TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS svr_sync_queue (
  mutation_id    TEXT PRIMARY KEY,
  job_id         TEXT NOT NULL REFERENCES svr_jobs(job_id),
  actor_id       TEXT NOT NULL,
  payload_json    TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'applied',
  last_result     TEXT NOT NULL DEFAULT '',
  row_version     INTEGER NOT NULL DEFAULT 1,
  updated_at      TEXT NOT NULL,
  updated_by      TEXT NOT NULL,
  correlation_id  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS svr_finance_quotes (
  quote_id       TEXT PRIMARY KEY,
  job_id         TEXT NOT NULL,
  client_id      TEXT NOT NULL,
  description     TEXT NOT NULL,
  amount          DOUBLE PRECISION NOT NULL DEFAULT 0,
  status          TEXT NOT NULL DEFAULT 'draft',
  created_at      TEXT NOT NULL,
  row_version     INTEGER NOT NULL DEFAULT 1,
  updated_at      TEXT NOT NULL,
  updated_by      TEXT NOT NULL,
  correlation_id  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS svr_finance_invoices (
  invoice_id     TEXT PRIMARY KEY,
  job_id         TEXT NOT NULL,
  quote_id       TEXT NOT NULL,
  client_id      TEXT NOT NULL,
  amount          DOUBLE PRECISION NOT NULL DEFAULT 0,
  due_date        TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'issued',
  reconciled_at   TEXT NOT NULL DEFAULT '',
  row_version     INTEGER NOT NULL DEFAULT 1,
  updated_at      TEXT NOT NULL,
  updated_by      TEXT NOT NULL,
  correlation_id  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS svr_finance_statements (
  statement_id   TEXT PRIMARY KEY,
  client_id      TEXT NOT NULL,
  period_label    TEXT NOT NULL,
  opening_balance DOUBLE PRECISION NOT NULL DEFAULT 0,
  billed          DOUBLE PRECISION NOT NULL DEFAULT 0,
  paid            DOUBLE PRECISION NOT NULL DEFAULT 0,
  closing_balance DOUBLE PRECISION NOT NULL DEFAULT 0,
  generated_at    TEXT NOT NULL,
  row_version     INTEGER NOT NULL DEFAULT 1,
  updated_at      TEXT NOT NULL,
  updated_by      TEXT NOT NULL,
  correlation_id  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS svr_finance_debtors (
  client_id      TEXT PRIMARY KEY,
  total_due       DOUBLE PRECISION NOT NULL DEFAULT 0,
  current_bucket  DOUBLE PRECISION NOT NULL DEFAULT 0,
  bucket_30       DOUBLE PRECISION NOT NULL DEFAULT 0,
  bucket_60       DOUBLE PRECISION NOT NULL DEFAULT 0,
  bucket_90_plus  DOUBLE PRECISION NOT NULL DEFAULT 0,
  risk_band       TEXT NOT NULL DEFAULT 'low',
  row_version     INTEGER NOT NULL DEFAULT 1,
  updated_at      TEXT NOT NULL,
  updated_by      TEXT NOT NULL,
  correlation_id  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS svr_compliance_escrow (
  document_id    TEXT PRIMARY KEY,
  invoice_id     TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'locked',
  locked_at       TEXT NOT NULL,
  released_at     TEXT NOT NULL DEFAULT '',
  row_version     INTEGER NOT NULL DEFAULT 1,
  updated_at      TEXT NOT NULL,
  updated_by      TEXT NOT NULL,
  correlation_id  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS svr_hr_skills_matrix (
  user_id                TEXT PRIMARY KEY,
  saqcc_type              TEXT NOT NULL DEFAULT '',
  saqcc_expiry            TEXT NOT NULL DEFAULT '',
  medical_expiry          TEXT NOT NULL DEFAULT '',
  rest_hours_last_24h     DOUBLE PRECISION NOT NULL DEFAULT 0,
  row_version             INTEGER NOT NULL DEFAULT 1,
  updated_at              TEXT NOT NULL,
  updated_by              TEXT NOT NULL,
  correlation_id          TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS svr_audit_log (
  audit_id       TEXT PRIMARY KEY,
  action          TEXT NOT NULL,
  entry_type      TEXT NOT NULL DEFAULT 'system_audit',
  payload_json    TEXT NOT NULL,
  actor_user_id  TEXT NOT NULL,
  correlation_id  TEXT NOT NULL,
  at              TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_svr_job_events_job_id ON svr_job_events(job_id);
CREATE INDEX IF NOT EXISTS idx_svr_sync_queue_job_id ON svr_sync_queue(job_id);
CREATE TABLE IF NOT EXISTS svr_clients (
  client_id       TEXT PRIMARY KEY,
  client_name     TEXT NOT NULL DEFAULT '',
  billing_entity  TEXT NOT NULL DEFAULT '',
  ops_email       TEXT NOT NULL DEFAULT '',
  active          TEXT NOT NULL DEFAULT 'true'
);

CREATE TABLE IF NOT EXISTS svr_technicians (
  technician_id   TEXT PRIMARY KEY,
  display_name    TEXT NOT NULL DEFAULT '',
  active          TEXT NOT NULL DEFAULT 'true'
);

CREATE INDEX IF NOT EXISTS idx_svr_jobs_client_id ON svr_jobs(client_id);
CREATE INDEX IF NOT EXISTS idx_svr_jobs_technician_id ON svr_jobs(technician_id);
CREATE INDEX IF NOT EXISTS idx_svr_job_documents_job_id ON svr_job_documents(job_id);
CREATE INDEX IF NOT EXISTS idx_svr_finance_quotes_job_id ON svr_finance_quotes(job_id);
CREATE INDEX IF NOT EXISTS idx_svr_finance_invoices_client_id ON svr_finance_invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_svr_clients_active ON svr_clients(active);
CREATE INDEX IF NOT EXISTS idx_svr_technicians_active ON svr_technicians(active);
`;

// ---------------------------------------------------------------------------
// Store Implementation
// ---------------------------------------------------------------------------

export class PostgresWorkbookStore implements WorkbookStore {
  protected readonly label = "PostgresWorkbookStore";
  private poolInstance: PgPool | null = null;
  private poolPromise: Promise<PgPool> | null = null;
  private readonly schema: string;

  constructor(readonly config: PostgresStoreConfig) {
    this.schema = config.schema || "public";
  }

  /** Lazily initialise the connection pool on first use. */
  private async getPool(): Promise<PgPool> {
    if (this.poolInstance) return this.poolInstance;
    if (this.poolPromise) return this.poolPromise;

    this.poolPromise = (async (): Promise<PgPool> => {
      const { Pool } = await loadPgModule();
      const poolCfg = buildPoolConfig(this.config);
      this.poolInstance = new Pool(poolCfg);
      return this.poolInstance;
    })();

    return this.poolPromise;
  }

  // -- Schema management ---------------------------------------------------

  async ensureSchema(): Promise<void> {
    const pool = await this.getPool();
    await pool.query(`SET search_path TO ${this.schema};`);
    await pool.query(SCHEMA_DDL);
  }

  // -- User operations -----------------------------------------------------

  async getUserByEmail(email: string): Promise<UserRow | null> {
    const pool = await this.getPool();
    const result = await pool.query(
      `SELECT * FROM ${this.schema}.svr_users WHERE email = $1 AND active = 'true'`,
      [email.trim().toLowerCase()]
    );
    if (result.rows.length === 0) return null;
    return userRowFromPg(result.rows[0]);
  }

  async listUsers(): Promise<UserRow[]> {
    const pool = await this.getPool();
    const result = await pool.query(`SELECT * FROM ${this.schema}.svr_users ORDER BY email`);
    return result.rows.map(userRowFromPg);
  }

  async listClients(): Promise<ClientRow[]> {
    const pool = await this.getPool();
    const result = await pool.query(`SELECT * FROM ${this.schema}.svr_clients WHERE active = 'true' ORDER BY client_name`);
    return result.rows.map(clientRowFromPg);
  }

  async listTechnicians(): Promise<TechnicianRow[]> {
    const pool = await this.getPool();
    const result = await pool.query(`SELECT * FROM ${this.schema}.svr_technicians WHERE active = 'true' ORDER BY display_name`);
    return result.rows.map(technicianRowFromPg);
  }

  async listFinanceQuotes(): Promise<FinanceQuoteRow[]> {
    const pool = await this.getPool();
    const result = await pool.query(`SELECT * FROM ${this.schema}.svr_finance_quotes ORDER BY created_at DESC`);
    return result.rows.map(financeQuoteRowFromPg);
  }

  async createFinanceQuote(row: FinanceQuoteRow): Promise<void> {
    const pool = await this.getPool();
    await pool.query(
      `INSERT INTO ${this.schema}.svr_finance_quotes
       (quote_id, job_id, client_id, description, amount, status, created_at, row_version, updated_at, updated_by, correlation_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       ON CONFLICT (quote_id) DO UPDATE SET
         job_id = EXCLUDED.job_id,
         client_id = EXCLUDED.client_id,
         description = EXCLUDED.description,
         amount = EXCLUDED.amount,
         status = EXCLUDED.status,
         created_at = EXCLUDED.created_at,
         row_version = EXCLUDED.row_version,
         updated_at = EXCLUDED.updated_at,
         updated_by = EXCLUDED.updated_by,
         correlation_id = EXCLUDED.correlation_id`,
      [
        row.quote_id,
        row.job_id,
        row.client_id,
        row.description,
        row.amount,
        row.status,
        row.created_at,
        row.row_version,
        row.updated_at,
        row.updated_by,
        row.correlation_id
      ]
    );
  }

  async updateFinanceQuoteStatus(args: {
    quote_id: string;
    status: FinanceQuoteRow["status"];
    ctx: StoreContext;
  }): Promise<FinanceQuoteRow | null> {
    const pool = await this.getPool();
    const current = await pool.query(`SELECT * FROM ${this.schema}.svr_finance_quotes WHERE quote_id = $1`, [args.quote_id]);
    if (current.rows.length === 0) return null;
    const now = nowIso();
    const currentRow = financeQuoteRowFromPg(current.rows[0]);
    const nextVersion = currentRow.row_version + 1;
    const updated = await pool.query(
      `UPDATE ${this.schema}.svr_finance_quotes
       SET status = $1, row_version = $2, updated_at = $3, updated_by = $4, correlation_id = $5
       WHERE quote_id = $6
       RETURNING *`,
      [args.status, nextVersion, now, args.ctx.actorUserid, args.ctx.correlationId, args.quote_id]
    );
    if (updated.rows.length === 0) return null;
    return financeQuoteRowFromPg(updated.rows[0]);
  }

  async listFinanceInvoices(): Promise<FinanceInvoiceRow[]> {
    const pool = await this.getPool();
    const result = await pool.query(`SELECT * FROM ${this.schema}.svr_finance_invoices ORDER BY updated_at DESC`);
    return result.rows.map(financeInvoiceRowFromPg);
  }

  async createFinanceInvoice(row: FinanceInvoiceRow): Promise<void> {
    const pool = await this.getPool();
    await pool.query(
      `INSERT INTO ${this.schema}.svr_finance_invoices
       (invoice_id, job_id, quote_id, client_id, amount, due_date, status, reconciled_at, row_version, updated_at, updated_by, correlation_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       ON CONFLICT (invoice_id) DO UPDATE SET
         job_id = EXCLUDED.job_id,
         quote_id = EXCLUDED.quote_id,
         client_id = EXCLUDED.client_id,
         amount = EXCLUDED.amount,
         due_date = EXCLUDED.due_date,
         status = EXCLUDED.status,
         reconciled_at = EXCLUDED.reconciled_at,
         row_version = EXCLUDED.row_version,
         updated_at = EXCLUDED.updated_at,
         updated_by = EXCLUDED.updated_by,
         correlation_id = EXCLUDED.correlation_id`,
      [
        row.invoice_id,
        row.job_id,
        row.quote_id,
        row.client_id,
        row.amount,
        row.due_date,
        row.status,
        row.reconciled_at,
        row.row_version,
        row.updated_at,
        row.updated_by,
        row.correlation_id
      ]
    );
  }

  async updateFinanceInvoice(row: FinanceInvoiceRow): Promise<void> {
    await this.createFinanceInvoice(row);
  }

  async listFinanceStatements(): Promise<FinanceStatementRow[]> {
    const pool = await this.getPool();
    const result = await pool.query(`SELECT * FROM ${this.schema}.svr_finance_statements ORDER BY generated_at DESC`);
    return result.rows.map(financeStatementRowFromPg);
  }

  async replaceFinanceStatements(rows: FinanceStatementRow[]): Promise<void> {
    const pool = await this.getPool();
    for (const row of rows) {
      await pool.query(
        `INSERT INTO ${this.schema}.svr_finance_statements
         (statement_id, client_id, period_label, opening_balance, billed, paid, closing_balance, generated_at, row_version, updated_at, updated_by, correlation_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         ON CONFLICT (statement_id) DO UPDATE SET
           client_id = EXCLUDED.client_id,
           period_label = EXCLUDED.period_label,
           opening_balance = EXCLUDED.opening_balance,
           billed = EXCLUDED.billed,
           paid = EXCLUDED.paid,
           closing_balance = EXCLUDED.closing_balance,
           generated_at = EXCLUDED.generated_at,
           row_version = EXCLUDED.row_version,
           updated_at = EXCLUDED.updated_at,
           updated_by = EXCLUDED.updated_by,
           correlation_id = EXCLUDED.correlation_id`,
        [
          row.statement_id,
          row.client_id,
          row.period_label,
          row.opening_balance,
          row.billed,
          row.paid,
          row.closing_balance,
          row.generated_at,
          row.row_version,
          row.updated_at,
          row.updated_by,
          row.correlation_id
        ]
      );
    }
  }

  async listFinanceDebtors(): Promise<FinanceDebtorRow[]> {
    const pool = await this.getPool();
    const result = await pool.query(`SELECT * FROM ${this.schema}.svr_finance_debtors ORDER BY total_due DESC`);
    return result.rows.map(financeDebtorRowFromPg);
  }

  async replaceFinanceDebtors(rows: FinanceDebtorRow[]): Promise<void> {
    const pool = await this.getPool();
    for (const row of rows) {
      await pool.query(
        `INSERT INTO ${this.schema}.svr_finance_debtors
         (client_id, total_due, current_bucket, bucket_30, bucket_60, bucket_90_plus, risk_band, row_version, updated_at, updated_by, correlation_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         ON CONFLICT (client_id) DO UPDATE SET
           total_due = EXCLUDED.total_due,
           current_bucket = EXCLUDED.current_bucket,
           bucket_30 = EXCLUDED.bucket_30,
           bucket_60 = EXCLUDED.bucket_60,
           bucket_90_plus = EXCLUDED.bucket_90_plus,
           risk_band = EXCLUDED.risk_band,
           row_version = EXCLUDED.row_version,
           updated_at = EXCLUDED.updated_at,
           updated_by = EXCLUDED.updated_by,
           correlation_id = EXCLUDED.correlation_id`,
        [
          row.client_id,
          row.total_due,
          row.current_bucket,
          row.bucket_30,
          row.bucket_60,
          row.bucket_90_plus,
          row.risk_band,
          row.row_version,
          row.updated_at,
          row.updated_by,
          row.correlation_id
        ]
      );
    }
  }

  async listEscrowRows(): Promise<EscrowRow[]> {
    const pool = await this.getPool();
    const result = await pool.query(`SELECT * FROM ${this.schema}.svr_compliance_escrow ORDER BY updated_at DESC`);
    return result.rows.map(escrowRowFromPg);
  }

  async getEscrowByDocument(document_id: string): Promise<EscrowRow | null> {
    const pool = await this.getPool();
    const result = await pool.query(`SELECT * FROM ${this.schema}.svr_compliance_escrow WHERE document_id = $1`, [document_id]);
    if (result.rows.length === 0) return null;
    return escrowRowFromPg(result.rows[0]);
  }

  async upsertEscrow(row: EscrowRow): Promise<void> {
    const pool = await this.getPool();
    await pool.query(
      `INSERT INTO ${this.schema}.svr_compliance_escrow
       (document_id, invoice_id, status, locked_at, released_at, row_version, updated_at, updated_by, correlation_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (document_id) DO UPDATE SET
         invoice_id = EXCLUDED.invoice_id,
         status = EXCLUDED.status,
         locked_at = EXCLUDED.locked_at,
         released_at = EXCLUDED.released_at,
         row_version = EXCLUDED.row_version,
         updated_at = EXCLUDED.updated_at,
         updated_by = EXCLUDED.updated_by,
         correlation_id = EXCLUDED.correlation_id`,
      [
        row.document_id,
        row.invoice_id,
        row.status,
        row.locked_at,
        row.released_at,
        row.row_version,
        row.updated_at,
        row.updated_by,
        row.correlation_id
      ]
    );
  }

  async listSkillMatrix(): Promise<SkillMatrixRow[]> {
    const pool = await this.getPool();
    const result = await pool.query(`SELECT * FROM ${this.schema}.svr_hr_skills_matrix ORDER BY user_id ASC`);
    return result.rows.map(skillMatrixRowFromPg);
  }

  async upsertSkillMatrix(row: SkillMatrixRow): Promise<void> {
    const pool = await this.getPool();
    await pool.query(
      `INSERT INTO ${this.schema}.svr_hr_skills_matrix
       (user_id, saqcc_type, saqcc_expiry, medical_expiry, rest_hours_last_24h, row_version, updated_at, updated_by, correlation_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (user_id) DO UPDATE SET
         saqcc_type = EXCLUDED.saqcc_type,
         saqcc_expiry = EXCLUDED.saqcc_expiry,
         medical_expiry = EXCLUDED.medical_expiry,
         rest_hours_last_24h = EXCLUDED.rest_hours_last_24h,
         row_version = EXCLUDED.row_version,
         updated_at = EXCLUDED.updated_at,
         updated_by = EXCLUDED.updated_by,
         correlation_id = EXCLUDED.correlation_id`,
      [
        row.user_id,
        row.saqcc_type,
        row.saqcc_expiry,
        row.medical_expiry,
        row.rest_hours_last_24h,
        row.row_version,
        row.updated_at,
        row.updated_by,
        row.correlation_id
      ]
    );
  }

  // -- Job operations ------------------------------------------------------

  async listJobsForUser(user: SessionUser): Promise<JobRow[]> {
    const pool = await this.getPool();
    let result;

    const broadAccessRoles = new Set(["admin", "dispatcher", "finance"]);
    if (broadAccessRoles.has(String(user.role))) {
      result = await pool.query(`SELECT * FROM ${this.schema}.svr_jobs ORDER BY updated_at DESC`);
    } else if (user.role === "client") {
      result = await pool.query(
        `SELECT * FROM ${this.schema}.svr_jobs WHERE client_id = $1 ORDER BY updated_at DESC`,
        [user.client_id]
      );
    } else {
      result = await pool.query(
        `SELECT * FROM ${this.schema}.svr_jobs WHERE technician_id = $1 ORDER BY updated_at DESC`,
        [user.technician_id]
      );
    }

    // Keep RBAC check as a defense-in-depth guard.
    return result.rows.map(jobRowFromPg).filter((job) => canReadJob(user, job));
  }

  async getJob(jobid: string): Promise<JobRow | null> {
    const pool = await this.getPool();
    const result = await pool.query(
      `SELECT * FROM ${this.schema}.svr_jobs WHERE job_id = $1`,
      [jobid]
    );
    if (result.rows.length === 0) return null;
    return jobRowFromPg(result.rows[0]);
  }

  async updateJobStatus(args: {
    jobid: string;
    status: JobRow["status"];
    expectedRowVersion: number;
    ctx: StoreContext;
  }): Promise<{ job: JobRow; conflict: ConflictPayload | null }> {
    const pool = await this.getPool();
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const currentRes = await client.query(
        `SELECT * FROM ${this.schema}.svr_jobs WHERE job_id = $1 FOR UPDATE`,
        [args.jobid]
      );

      if (currentRes.rows.length === 0) {
        await client.query("ROLLBACK");
        throw new Error(`Unknown job ${args.jobid}`);
      }

      const current = jobRowFromPg(currentRes.rows[0]);

      if (current.row_version !== args.expectedRowVersion) {
        await client.query("ROLLBACK");
        return { job: immutableClone(current), conflict: toConflict(current, args.expectedRowVersion) };
      }

      if (!canTransitionStatus(current.status, args.status)) {
        await client.query("ROLLBACK");
        throw new Error(`Invalid status transition from ${current.status} to ${args.status}`);
      }

      const now = nowIso();
      const newVersion = current.row_version + 1;

      const updatedRes = await client.query(
        `UPDATE ${this.schema}.svr_jobs
         SET status = $1, row_version = $2, updated_at = $3, updated_by = $4, correlation_id = $5
         WHERE job_id = $6 AND row_version = $7
         RETURNING *`,
        [args.status, newVersion, now, args.ctx.actorUserid, args.ctx.correlationId, args.jobid, args.expectedRowVersion]
      );

      if (updatedRes.rows.length === 0) {
        await client.query("ROLLBACK");
        const refetched = await client.query(`SELECT * FROM ${this.schema}.svr_jobs WHERE job_id = $1`, [args.jobid]);
        const refetchedJob = refetched.rows.length > 0 ? jobRowFromPg(refetched.rows[0]) : current;
        return { job: immutableClone(refetchedJob), conflict: toConflict(refetchedJob, args.expectedRowVersion) };
      }

      const updated = jobRowFromPg(updatedRes.rows[0]);

      const event = stampEvent({
        jobid: updated.job_id,
        eventType: "status_changed",
        payload: { from: current.status, to: args.status },
        ctx: args.ctx
      });
      await client.query(
        `INSERT INTO ${this.schema}.svr_job_events
         (event_id, job_id, event_type, payload_json, row_version, updated_at, updated_by, correlation_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [event.event_id, event.job_id, event.event_type, event.payload_json, event.row_version, event.updated_at, event.updated_by, event.correlation_id]
      );

      await client.query("COMMIT");
      return { job: immutableClone(updated), conflict: null };
    } catch (err) {
      await client.query("ROLLBACK").catch(() => undefined);
      throw err;
    } finally {
      client.release();
    }
  }

  async appendJobNote(args: {
    jobid: string;
    note: string;
    expectedRowVersion: number;
    ctx: StoreContext;
  }): Promise<{ job: JobRow; conflict: ConflictPayload | null }> {
    const pool = await this.getPool();
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const currentRes = await client.query(
        `SELECT * FROM ${this.schema}.svr_jobs WHERE job_id = $1 FOR UPDATE`,
        [args.jobid]
      );

      if (currentRes.rows.length === 0) {
        await client.query("ROLLBACK");
        throw new Error(`Unknown job ${args.jobid}`);
      }

      const current = jobRowFromPg(currentRes.rows[0]);

      if (current.row_version !== args.expectedRowVersion) {
        await client.query("ROLLBACK");
        return { job: immutableClone(current), conflict: toConflict(current, args.expectedRowVersion) };
      }

      const now = nowIso();
      const newVersion = current.row_version + 1;

      const updatedRes = await client.query(
        `UPDATE ${this.schema}.svr_jobs
         SET last_note = $1, row_version = $2, updated_at = $3, updated_by = $4, correlation_id = $5
         WHERE job_id = $6 AND row_version = $7
         RETURNING *`,
        [args.note, newVersion, now, args.ctx.actorUserid, args.ctx.correlationId, args.jobid, args.expectedRowVersion]
      );

      if (updatedRes.rows.length === 0) {
        await client.query("ROLLBACK");
        const refetched = await client.query(`SELECT * FROM ${this.schema}.svr_jobs WHERE job_id = $1`, [args.jobid]);
        const refetchedJob = refetched.rows.length > 0 ? jobRowFromPg(refetched.rows[0]) : current;
        return { job: immutableClone(refetchedJob), conflict: toConflict(refetchedJob, args.expectedRowVersion) };
      }

      const updated = jobRowFromPg(updatedRes.rows[0]);

      const event = stampEvent({
        jobid: updated.job_id,
        eventType: "note_added",
        payload: { note: args.note },
        ctx: args.ctx
      });
      await client.query(
        `INSERT INTO ${this.schema}.svr_job_events
         (event_id, job_id, event_type, payload_json, row_version, updated_at, updated_by, correlation_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [event.event_id, event.job_id, event.event_type, event.payload_json, event.row_version, event.updated_at, event.updated_by, event.correlation_id]
      );

      await client.query("COMMIT");
      return { job: immutableClone(updated), conflict: null };
    } catch (err) {
      await client.query("ROLLBACK").catch(() => undefined);
      throw err;
    } finally {
      client.release();
    }
  }

  async appendJobEvent(event: JobEventRow): Promise<void> {
    const pool = await this.getPool();
    await pool.query(
      `INSERT INTO ${this.schema}.svr_job_events
       (event_id, job_id, event_type, payload_json, row_version, updated_at, updated_by, correlation_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        event.event_id, event.job_id, event.event_type, event.payload_json,
        event.row_version, event.updated_at, event.updated_by, event.correlation_id
      ]
    );
  }

  // -- Schedule operations -------------------------------------------------

  async createScheduleRequest(row: ScheduleRequestRow): Promise<void> {
    const pool = await this.getPool();
    await pool.query(
      `INSERT INTO ${this.schema}.svr_schedule_requests
       (request_id, job_id, client_id, preferred_slots_json, timezone, notes, status,
        row_version, updated_at, updated_by, correlation_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        row.request_id, row.job_id, row.client_id, row.preferred_slots_json,
        row.timezone, row.notes, row.status,
        row.row_version, row.updated_at, row.updated_by, row.correlation_id
      ]
    );
  }

  async getScheduleRequest(requestid: string): Promise<ScheduleRequestRow | null> {
    const pool = await this.getPool();
    const result = await pool.query(
      `SELECT * FROM ${this.schema}.svr_schedule_requests WHERE request_id = $1`,
      [requestid]
    );
    if (result.rows.length === 0) return null;
    return scheduleRequestRowFromPg(result.rows[0]);
  }

  async listScheduleRequests(jobid?: string): Promise<ScheduleRequestRow[]> {
    const pool = await this.getPool();
    let sql = `SELECT * FROM ${this.schema}.svr_schedule_requests`;
    const params: unknown[] = [];
    if (jobid) {
      sql += ` WHERE job_id = $1`;
      params.push(jobid);
    }
    sql += ` ORDER BY updated_at DESC`;
    const result = await pool.query(sql, params);
    return result.rows.map(scheduleRequestRowFromPg);
  }

  async upsertScheduleRequest(row: ScheduleRequestRow): Promise<void> {
    const pool = await this.getPool();
    await pool.query(
      `INSERT INTO ${this.schema}.svr_schedule_requests
       (request_id, job_id, client_id, preferred_slots_json, timezone, notes, status,
        row_version, updated_at, updated_by, correlation_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       ON CONFLICT (request_id) DO UPDATE SET
         job_id = EXCLUDED.job_id,
         client_id = EXCLUDED.client_id,
         preferred_slots_json = EXCLUDED.preferred_slots_json,
         timezone = EXCLUDED.timezone,
         notes = EXCLUDED.notes,
         status = EXCLUDED.status,
         row_version = EXCLUDED.row_version,
         updated_at = EXCLUDED.updated_at,
         updated_by = EXCLUDED.updated_by,
         correlation_id = EXCLUDED.correlation_id`,
      [
        row.request_id, row.job_id, row.client_id, row.preferred_slots_json,
        row.timezone, row.notes, row.status,
        row.row_version, row.updated_at, row.updated_by, row.correlation_id
      ]
    );
  }

  async createSchedule(row: ScheduleRow): Promise<void> {
    const pool = await this.getPool();
    await pool.query(
      `INSERT INTO ${this.schema}.svr_schedules
       (schedule_id, request_id, job_id, calendar_event_id, start_at, end_at, technician_id, status,
        row_version, updated_at, updated_by, correlation_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        row.schedule_id, row.request_id, row.job_id, row.calendar_event_id,
        row.start_at, row.end_at, row.technician_id, row.status,
        row.row_version, row.updated_at, row.updated_by, row.correlation_id
      ]
    );
  }

  async getSchedule(scheduleid: string): Promise<ScheduleRow | null> {
    const pool = await this.getPool();
    const result = await pool.query(
      `SELECT * FROM ${this.schema}.svr_schedules WHERE schedule_id = $1`,
      [scheduleid]
    );
    if (result.rows.length === 0) return null;
    return scheduleRowFromPg(result.rows[0]);
  }

  async listSchedules(jobid?: string): Promise<ScheduleRow[]> {
    const pool = await this.getPool();
    let sql = `SELECT * FROM ${this.schema}.svr_schedules`;
    const params: unknown[] = [];
    if (jobid) {
      sql += ` WHERE job_id = $1`;
      params.push(jobid);
    }
    sql += ` ORDER BY updated_at DESC`;
    const result = await pool.query(sql, params);
    return result.rows.map(scheduleRowFromPg);
  }

  async upsertSchedule(row: ScheduleRow): Promise<void> {
    const pool = await this.getPool();
    await pool.query(
      `INSERT INTO ${this.schema}.svr_schedules
       (schedule_id, request_id, job_id, calendar_event_id, start_at, end_at, technician_id, status,
        row_version, updated_at, updated_by, correlation_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       ON CONFLICT (schedule_id) DO UPDATE SET
         request_id = EXCLUDED.request_id,
         job_id = EXCLUDED.job_id,
         calendar_event_id = EXCLUDED.calendar_event_id,
         start_at = EXCLUDED.start_at,
         end_at = EXCLUDED.end_at,
         technician_id = EXCLUDED.technician_id,
         status = EXCLUDED.status,
         row_version = EXCLUDED.row_version,
         updated_at = EXCLUDED.updated_at,
         updated_by = EXCLUDED.updated_by,
         correlation_id = EXCLUDED.correlation_id`,
      [
        row.schedule_id, row.request_id, row.job_id, row.calendar_event_id,
        row.start_at, row.end_at, row.technician_id, row.status,
        row.row_version, row.updated_at, row.updated_by, row.correlation_id
      ]
    );
  }

  // -- Document operations -------------------------------------------------

  async createDocument(row: JobDocumentRow): Promise<void> {
    const pool = await this.getPool();
    await pool.query(
      `INSERT INTO ${this.schema}.svr_job_documents
       (document_id, job_id, document_type, status, drive_file_id, pdf_file_id, published_url, client_visible,
        row_version, updated_at, updated_by, correlation_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        row.document_id, row.job_id, row.document_type, row.status,
        row.drive_file_id, row.pdf_file_id, row.published_url, row.client_visible,
        row.row_version, row.updated_at, row.updated_by, row.correlation_id
      ]
    );
  }


  async getDocument(documentid: string): Promise<JobDocumentRow | null> {
    const pool = await this.getPool();
    const result = await pool.query(
      `SELECT * FROM ${this.schema}.svr_job_documents WHERE document_id = $1`,
      [documentid]
    );
    if (result.rows.length === 0) return null;
    return jobDocumentRowFromPg(result.rows[0]);
  }

  async upsertDocument(row: JobDocumentRow): Promise<void> {
    const pool = await this.getPool();
    await pool.query(
      `INSERT INTO ${this.schema}.svr_job_documents
       (document_id, job_id, document_type, status, drive_file_id, pdf_file_id, published_url, client_visible,
        row_version, updated_at, updated_by, correlation_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       ON CONFLICT (document_id) DO UPDATE SET
         job_id = EXCLUDED.job_id,
         document_type = EXCLUDED.document_type,
         status = EXCLUDED.status,
         drive_file_id = EXCLUDED.drive_file_id,
         pdf_file_id = EXCLUDED.pdf_file_id,
         published_url = EXCLUDED.published_url,
         client_visible = EXCLUDED.client_visible,
         row_version = EXCLUDED.row_version,
         updated_at = EXCLUDED.updated_at,
         updated_by = EXCLUDED.updated_by,
         correlation_id = EXCLUDED.correlation_id`,
      [
        row.document_id, row.job_id, row.document_type, row.status,
        row.drive_file_id, row.pdf_file_id, row.published_url, row.client_visible,
        row.row_version, row.updated_at, row.updated_by, row.correlation_id
      ]
    );
  }


  async listDocuments(jobid?: string): Promise<JobDocumentRow[]> {
    const pool = await this.getPool();
    let sql = `SELECT * FROM ${this.schema}.svr_job_documents`;
    const params: unknown[] = [];
    if (jobid) {
      sql += ` WHERE job_id = $1`;
      params.push(jobid);
    }
    sql += ` ORDER BY updated_at DESC`;
    const result = await pool.query(sql, params);
    return result.rows.map(jobDocumentRowFromPg);
  }

  // -- Audit operations ----------------------------------------------------

  async appendAudit(args: {
    action: string;
    payload: Record<string, unknown>;
    ctx: StoreContext;
    entry_type?: string;
  }): Promise<void> {
    const pool = await this.getPool();
    await pool.query(
      `INSERT INTO ${this.schema}.svr_audit_log
       (audit_id, action, entry_type, payload_json, actor_user_id, correlation_id, at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        `AUD-${crypto.randomUUID()}`,
        args.action,
        args.entry_type ?? "system_audit",
        JSON.stringify(args.payload),
        args.ctx.actorUserid,
        args.ctx.correlationId,
        nowIso()
      ]
    );
  }

  async listAudits(): Promise<Array<Record<string, string>>> {
    const pool = await this.getPool();
    const result = await pool.query(
      `SELECT audit_id, action, entry_type, payload_json, actor_user_id, correlation_id, at
       FROM ${this.schema}.svr_audit_log
       ORDER BY at DESC`
    );
    return result.rows.map((row) => ({
      audit_id: String(row.audit_id),
      action: String(row.action),
      entry_type: String(row.entry_type),
      payload_json: String(row.payload_json),
      actor_user_id: String(row.actor_user_id),
      correlation_id: String(row.correlation_id),
      at: String(row.at)
    }));
  }

  // -- Automation job operations -------------------------------------------

  async upsertAutomationJob(row: AutomationJobRow): Promise<void> {
    const pool = await this.getPool();
    await pool.query(
      `INSERT INTO ${this.schema}.svr_automation_jobs
       (automation_job_id, action, payload_json, status, retry_count, last_error,
        row_version, updated_at, updated_by, correlation_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (automation_job_id) DO UPDATE SET
         action = EXCLUDED.action,
         payload_json = EXCLUDED.payload_json,
         status = EXCLUDED.status,
         retry_count = EXCLUDED.retry_count,
         last_error = EXCLUDED.last_error,
         row_version = EXCLUDED.row_version,
         updated_at = EXCLUDED.updated_at,
         updated_by = EXCLUDED.updated_by,
         correlation_id = EXCLUDED.correlation_id`,
      [
        row.automation_job_id, row.action, row.payload_json, row.status,
        row.retry_count, row.last_error,
        row.row_version, row.updated_at, row.updated_by, row.correlation_id
      ]
    );
  }

  async getAutomationJob(automationJobid: string): Promise<AutomationJobRow | null> {
    const pool = await this.getPool();
    const result = await pool.query(
      `SELECT * FROM ${this.schema}.svr_automation_jobs WHERE automation_job_id = $1`,
      [automationJobid]
    );
    if (result.rows.length === 0) return null;
    return automationJobRowFromPg(result.rows[0]);
  }

  async listAutomationJobs(): Promise<AutomationJobRow[]> {
    const pool = await this.getPool();
    const result = await pool.query(
      `SELECT * FROM ${this.schema}.svr_automation_jobs ORDER BY updated_at DESC`
    );
    return result.rows.map(automationJobRowFromPg);
  }

  // -- Sync queue operations -----------------------------------------------

  async upsertSyncQueue(row: SyncQueueRow): Promise<void> {
    const pool = await this.getPool();
    await pool.query(
      `INSERT INTO ${this.schema}.svr_sync_queue
       (mutation_id, job_id, actor_id, payload_json, status, last_result,
        row_version, updated_at, updated_by, correlation_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (mutation_id) DO UPDATE SET
         job_id = EXCLUDED.job_id,
         actor_id = EXCLUDED.actor_id,
         payload_json = EXCLUDED.payload_json,
         status = EXCLUDED.status,
         last_result = EXCLUDED.last_result,
         row_version = EXCLUDED.row_version,
         updated_at = EXCLUDED.updated_at,
         updated_by = EXCLUDED.updated_by,
         correlation_id = EXCLUDED.correlation_id`,
      [
        row.mutation_id, row.job_id, row.actor_id, row.payload_json,
        row.status, row.last_result,
        row.row_version, row.updated_at, row.updated_by, row.correlation_id
      ]
    );
  }

  async getSyncQueue(mutationid: string): Promise<SyncQueueRow | null> {
    const pool = await this.getPool();
    const result = await pool.query(
      `SELECT * FROM ${this.schema}.svr_sync_queue WHERE mutation_id = $1`,
      [mutationid]
    );
    if (result.rows.length === 0) return null;
    return syncQueueRowFromPg(result.rows[0]);
  }

  async listSyncQueueByJob(jobid: string): Promise<SyncQueueRow[]> {
    const pool = await this.getPool();
    const result = await pool.query(
      `SELECT * FROM ${this.schema}.svr_sync_queue WHERE job_id = $1 ORDER BY updated_at DESC`,
      [jobid]
    );
    return result.rows.map(syncQueueRowFromPg);
  }

  async listJobEventsByJob(jobid: string): Promise<JobEventRow[]> {
    const pool = await this.getPool();
    const result = await pool.query(
      `SELECT * FROM ${this.schema}.svr_job_events WHERE job_id = $1 ORDER BY updated_at DESC`,
      [jobid]
    );
    return result.rows.map(jobEventRowFromPg);
  }

  // -- Sync operations -----------------------------------------------------

  async applySyncMutations(args: {
    actor: SessionUser;
    mutations: SyncMutation[];
    ctx: StoreContext;
  }): Promise<SyncPushResult> {
    const result: SyncPushResult = { applied: [], conflicts: [], failed: [] };

    for (const mutation of args.mutations) {
      try {
        const existingQueue = await this.getSyncQueue(mutation.mutation_id);
        if (existingQueue?.status === "applied") {
          const job = await this.getJob(mutation.job_id);
          result.applied.push({
            mutation_id: mutation.mutation_id,
            job_id: mutation.job_id,
            row_version: job?.row_version ?? 0
          });
          continue;
        }

        const job = await this.getJob(mutation.job_id);
        if (!job) {
          result.failed.push({
            mutation_id: mutation.mutation_id,
            job_id: mutation.job_id,
            error: normalizeError(`Unknown job ${mutation.job_id}`, "not_found")
          });
          continue;
        }

        if (job.row_version !== mutation.expected_row_version) {
          const conflict = toConflict(job, mutation.expected_row_version);
          result.conflicts.push({
            mutation_id: mutation.mutation_id,
            job_id: mutation.job_id,
            conflict
          });

          await this.upsertSyncQueue({
            mutation_id: mutation.mutation_id,
            job_id: mutation.job_id,
            actor_id: args.actor.user_id,
            payload_json: JSON.stringify(mutation.payload),
            status: "conflict",
            last_result: JSON.stringify(conflict),
            ...newMutableMeta(args.ctx.actorUserid, args.ctx.correlationId)
          });

          continue;
        }

        if (mutation.kind === "job_status") {
          const status = String(mutation.payload.status ?? "") as JobRow["status"];
          if (!canTransitionStatus(job.status, status)) {
            throw new Error(`Invalid status transition from ${job.status} to ${status}`);
          }
          job.status = status;
        }

        if (mutation.kind === "job_note") {
          const note = String(mutation.payload.note ?? "").trim();
          if (!note) {
            throw new Error("Empty note payload");
          }
          job.last_note = note;
        }

        const updateResult = await this._updateJobDirect(job, args.ctx);
        if (updateResult.conflict) {
          result.conflicts.push({
            mutation_id: mutation.mutation_id,
            job_id: mutation.job_id,
            conflict: updateResult.conflict
          });

          await this.upsertSyncQueue({
            mutation_id: mutation.mutation_id,
            job_id: mutation.job_id,
            actor_id: args.actor.user_id,
            payload_json: JSON.stringify(mutation.payload),
            status: "conflict",
            last_result: JSON.stringify(updateResult.conflict),
            ...newMutableMeta(args.ctx.actorUserid, args.ctx.correlationId)
          });

          continue;
        }

        await this.upsertSyncQueue({
          mutation_id: mutation.mutation_id,
          job_id: mutation.job_id,
          actor_id: args.actor.user_id,
          payload_json: JSON.stringify(mutation.payload),
          status: "applied",
          last_result: "applied",
          ...newMutableMeta(args.ctx.actorUserid, args.ctx.correlationId)
        });

        result.applied.push({
          mutation_id: mutation.mutation_id,
          job_id: mutation.job_id,
          row_version: updateResult.job.row_version
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        const typedError: ApiError = normalizeError(message, "sync_apply_failed");
        result.failed.push({
          mutation_id: mutation.mutation_id,
          job_id: mutation.job_id,
          error: typedError
        });

        await this.upsertSyncQueue({
          mutation_id: mutation.mutation_id,
          job_id: mutation.job_id,
          actor_id: args.actor.user_id,
          payload_json: JSON.stringify(mutation.payload),
          status: "failed",
          last_result: JSON.stringify(typedError),
          ...newMutableMeta(args.ctx.actorUserid, args.ctx.correlationId)
        });
      }
    }

    return result;
  }

  async resolveSyncConflict(args: {
    actor: SessionUser;
    jobid: string;
    strategy: "server" | "client" | "merge";
    serverRowVersion: number;
    clientRowVersion: number;
    mergePatch?: Record<string, unknown>;
    ctx: StoreContext;
  }): Promise<{ job: JobRow; conflict: ConflictPayload | null }> {
    const pool = await this.getPool();
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const currentRes = await client.query(
        `SELECT * FROM ${this.schema}.svr_jobs WHERE job_id = $1 FOR UPDATE`,
        [args.jobid]
      );

      if (currentRes.rows.length === 0) {
        await client.query("ROLLBACK");
        throw new Error(`Unknown job ${args.jobid}`);
      }

      const current = jobRowFromPg(currentRes.rows[0]);

      if (current.row_version !== args.serverRowVersion) {
        await client.query("ROLLBACK");
        return { job: immutableClone(current), conflict: toConflict(current, args.clientRowVersion) };
      }

      if (args.strategy === "server") {
        await client.query("ROLLBACK");
        return { job: immutableClone(current), conflict: null };
      }

      const patch = args.mergePatch ?? {};

      if (typeof patch.status === "string" && canTransitionStatus(current.status, patch.status as JobRow["status"])) {
        current.status = patch.status as JobRow["status"];
      }

      if (typeof patch.last_note === "string" && patch.last_note.trim() !== "") {
        current.last_note = patch.last_note;
      }

      const now = nowIso();
      const newVersion = current.row_version + 1;

      const updatedRes = await client.query(
        `UPDATE ${this.schema}.svr_jobs
         SET status = $1, last_note = $2, row_version = $3, updated_at = $4, updated_by = $5, correlation_id = $6
         WHERE job_id = $7 AND row_version = $8
         RETURNING *`,
        [current.status, current.last_note, newVersion, now, args.ctx.actorUserid, args.ctx.correlationId, args.jobid, args.serverRowVersion]
      );

      if (updatedRes.rows.length === 0) {
        await client.query("ROLLBACK");
        const refetched = await client.query(`SELECT * FROM ${this.schema}.svr_jobs WHERE job_id = $1`, [args.jobid]);
        const refetchedJob = refetched.rows.length > 0 ? jobRowFromPg(refetched.rows[0] as PgRow) : current;
        return { job: immutableClone(refetchedJob), conflict: toConflict(refetchedJob, args.clientRowVersion) };
      }

      const updated = jobRowFromPg(updatedRes.rows[0] as PgRow);
      await client.query("COMMIT");
      return { job: immutableClone(updated), conflict: null };
    } catch (err) {
      await client.query("ROLLBACK").catch(() => undefined);
      throw err;
    } finally {
      client.release();
    }
  }

  // -- Internal helpers ----------------------------------------------------

  /**
   * Direct job update without going through the full updateJobStatus flow.
   * Used by applySyncMutations to apply status/note mutations.
   */
  private async _updateJobDirect(
    job: JobRow,
    ctx: StoreContext
  ): Promise<{ job: JobRow; conflict: ConflictPayload | null }> {
    const pool = await this.getPool();
    const now = nowIso();
    const newVersion = job.row_version + 1;

    const result = await pool.query(
      `UPDATE ${this.schema}.svr_jobs
       SET status = $1, last_note = $2, row_version = $3, updated_at = $4, updated_by = $5, correlation_id = $6
       WHERE job_id = $7 AND row_version = $8
       RETURNING *`,
      [job.status, job.last_note, newVersion, now, ctx.actorUserid, ctx.correlationId, job.job_id, job.row_version]
    );

    if (result.rows.length === 0) {
      const refetched = await this.getJob(job.job_id);
      const refetchedJob = refetched ?? job;
      return { job: immutableClone(refetchedJob), conflict: toConflict(refetchedJob, job.row_version) };
    }

    const updated = jobRowFromPg(result.rows[0] as PgRow);

    const event = stampEvent({
      jobid: updated.job_id,
      eventType: "sync_mutation_applied",
      payload: { status: updated.status, last_note: updated.last_note },
      ctx
    });
    await this.appendJobEvent(event);

    return { job: immutableClone(updated), conflict: null };
  }

  /**
   * Graceful shutdown — releases all idle connections and ends the pool.
   */
  async shutdown(): Promise<void> {
    if (this.poolInstance) {
      await this.poolInstance.end();
    }
  }
}
