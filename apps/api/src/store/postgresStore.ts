import {
  buildConflict,
  bumpMutableMeta,
  canReadJob,
  canTransitionStatus,
  newMutableMeta,
  type ApiError,
  type AutomationJobRow,
  type ConflictPayload,
  type JobDocumentRow,
  type JobEventRow,
  type JobRow,
  type ScheduleRequestRow,
  type ScheduleRow,
  type SessionUser,
  type SyncMutation,
  type SyncPushResult,
  type SyncQueueRow,
  type UserRow
} from "@kharon/domain";
import type { PostgresStoreConfig } from "../config.js";
import type { StoreContext, WorkbookStore } from "./types.js";

// ---------------------------------------------------------------------------
// Postgres client abstraction
// ---------------------------------------------------------------------------

interface PgRow {
  [column: string]: unknown;
}

interface PgClient {
  query(text: string, values?: unknown[]): Promise<{ rows: PgRow[]; rowCount: number }>;
  release(): void;
}

interface PgPool {
  connect(): Promise<PgClient>;
  query(text: string, values?: unknown[]): Promise<{ rows: PgRow[]; rowCount: number }>;
  end(): Promise<void>;
}

interface PgPoolConstructor {
  new (config: Record<string, unknown>): PgPool;
}

let _pgModule: { Pool: PgPoolConstructor } | null = null;

async function loadPgModule(): Promise<{ Pool: PgPoolConstructor }> {
  if (_pgModule) return _pgModule;
  const mod = await import("pg");
  const { Pool } = mod;
  _pgModule = { Pool: Pool as unknown as PgPoolConstructor };
  return _pgModule;
}

function buildPoolConfig(config: PostgresStoreConfig): Record<string, unknown> {
  const poolCfg: Record<string, unknown> = {
    connectionString: config.connectionString || config.directUrl,
    max: 20,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
    application_name: config.applicationName
  };

  if (config.sslMode === "disable") {
    poolCfg.ssl = false;
  } else {
    poolCfg.ssl = { rejectUnauthorized: config.sslMode === "require" };
  }

  return poolCfg;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function nowIso(): string {
  return new Date().toISOString();
}

function immutableClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function rowToMutableMeta(row: PgRow): Pick<UserRow, "row_version" | "updated_at" | "updated_by" | "correlation_id"> {
  return {
    row_version: Number(row.row_version ?? 0),
    updated_at: String(row.updated_at ?? ""),
    updated_by: String(row.updated_by ?? ""),
    correlation_id: String(row.correlation_id ?? "")
  };
}

function userRowFromPg(row: PgRow | undefined): UserRow {
  if (!row) throw new Error("Missing row for UserRow mapping");
  return {
    user_uid: String(row.user_uid),
    email: String(row.email),
    display_name: String(row.display_name),
    role: String(row.role) as UserRow["role"],
    client_uid: String(row.client_uid),
    technician_uid: String(row.technician_uid),
    active: String(row.active) as UserRow["active"],
    ...rowToMutableMeta(row)
  };
}

function jobRowFromPg(row: PgRow | undefined): JobRow {
  if (!row) throw new Error("Missing row for JobRow mapping");
  return {
    job_uid: String(row.job_uid),
    client_uid: String(row.client_uid),
    site_uid: String(row.site_uid),
    technician_uid: String(row.technician_uid),
    title: String(row.title),
    status: String(row.status) as JobRow["status"],
    scheduled_start: String(row.scheduled_start),
    scheduled_end: String(row.scheduled_end),
    last_note: String(row.last_note ?? ""),
    ...rowToMutableMeta(row)
  };
}

function jobEventRowFromPg(row: PgRow | undefined): JobEventRow {
  if (!row) throw new Error("Missing row for JobEventRow mapping");
  return {
    event_uid: String(row.event_uid),
    job_uid: String(row.job_uid),
    event_type: String(row.event_type),
    payload_json: String(row.payload_json ?? "{}"),
    ...rowToMutableMeta(row)
  };
}

function scheduleRequestRowFromPg(row: PgRow | undefined): ScheduleRequestRow {
  if (!row) throw new Error("Missing row for ScheduleRequestRow mapping");
  return {
    request_uid: String(row.request_uid),
    job_uid: String(row.job_uid),
    client_uid: String(row.client_uid),
    preferred_slots_json: String(row.preferred_slots_json ?? "[]"),
    timezone: String(row.timezone ?? "UTC"),
    notes: String(row.notes ?? ""),
    status: String(row.status) as ScheduleRequestRow["status"],
    ...rowToMutableMeta(row)
  };
}

function scheduleRowFromPg(row: PgRow | undefined): ScheduleRow {
  if (!row) throw new Error("Missing row for ScheduleRow mapping");
  return {
    schedule_uid: String(row.schedule_uid),
    request_uid: String(row.request_uid),
    job_uid: String(row.job_uid),
    calendar_event_id: String(row.calendar_event_id ?? ""),
    start_at: String(row.start_at),
    end_at: String(row.end_at),
    technician_uid: String(row.technician_uid),
    status: String(row.status) as ScheduleRow["status"],
    ...rowToMutableMeta(row)
  };
}

function jobDocumentRowFromPg(row: PgRow | undefined): JobDocumentRow {
  if (!row) throw new Error("Missing row for JobDocumentRow mapping");
  return {
    document_uid: String(row.document_uid),
    job_uid: String(row.job_uid),
    document_type: String(row.document_type) as JobDocumentRow["document_type"],
    status: String(row.status) as JobDocumentRow["status"],
    drive_file_id: String(row.drive_file_id ?? ""),
    pdf_file_id: String(row.pdf_file_id ?? ""),
    published_url: String(row.published_url ?? ""),
    client_visible: Boolean(row.client_visible ?? false),
    ...rowToMutableMeta(row)
  };
}


function automationJobRowFromPg(row: PgRow | undefined): AutomationJobRow {
  if (!row) throw new Error("Missing row for AutomationJobRow mapping");
  return {
    automation_job_uid: String(row.automation_job_uid),
    action: String(row.action),
    payload_json: String(row.payload_json ?? "{}"),
    status: String(row.status) as AutomationJobRow["status"],
    retry_count: Number(row.retry_count ?? 0),
    last_error: String(row.last_error ?? ""),
    ...rowToMutableMeta(row)
  };
}

function syncQueueRowFromPg(row: PgRow | undefined): SyncQueueRow {
  if (!row) throw new Error("Missing row for SyncQueueRow mapping");
  return {
    mutation_uid: String(row.mutation_uid),
    job_uid: String(row.job_uid),
    actor_uid: String(row.actor_uid),
    payload_json: String(row.payload_json ?? "{}"),
    status: String(row.status) as SyncQueueRow["status"],
    last_result: String(row.last_result ?? ""),
    ...rowToMutableMeta(row)
  };
}

function toConflict(job: JobRow, expectedRowVersion: number): ConflictPayload {
  return buildConflict({
    entity: "Jobs_Master",
    entityId: job.job_uid,
    serverState: job as unknown as Record<string, unknown>,
    clientRowVersion: expectedRowVersion,
    serverRowVersion: job.row_version
  });
}

function normalizeError(message: string, code = "validation_error"): ApiError {
  return { code, message };
}

function stampEvent(args: {
  jobUid: string;
  eventType: string;
  payload: Record<string, unknown>;
  ctx: StoreContext;
}): JobEventRow {
  return {
    event_uid: `EVT-${crypto.randomUUID()}`,
    job_uid: args.jobUid,
    event_type: args.eventType,
    payload_json: JSON.stringify(args.payload),
    ...newMutableMeta(args.ctx.actorUserUid, args.ctx.correlationId)
  };
}

// ---------------------------------------------------------------------------
// Schema DDL
// ---------------------------------------------------------------------------

const SCHEMA_DDL = `
CREATE TABLE IF NOT EXISTS svr_users (
  user_uid        TEXT PRIMARY KEY,
  email           TEXT NOT NULL UNIQUE,
  display_name    TEXT NOT NULL,
  role            TEXT NOT NULL,
  client_uid      TEXT NOT NULL DEFAULT '',
  technician_uid  TEXT NOT NULL DEFAULT '',
  active          TEXT NOT NULL DEFAULT 'true',
  row_version     INTEGER NOT NULL DEFAULT 1,
  updated_at      TEXT NOT NULL,
  updated_by      TEXT NOT NULL,
  correlation_id  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS svr_jobs (
  job_uid         TEXT PRIMARY KEY,
  client_uid      TEXT NOT NULL,
  site_uid        TEXT NOT NULL,
  technician_uid  TEXT NOT NULL,
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
  event_uid       TEXT PRIMARY KEY,
  job_uid         TEXT NOT NULL REFERENCES svr_jobs(job_uid),
  event_type      TEXT NOT NULL,
  payload_json    TEXT NOT NULL,
  row_version     INTEGER NOT NULL DEFAULT 1,
  updated_at      TEXT NOT NULL,
  updated_by      TEXT NOT NULL,
  correlation_id  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS svr_schedule_requests (
  request_uid        TEXT PRIMARY KEY,
  job_uid            TEXT NOT NULL REFERENCES svr_jobs(job_uid),
  client_uid         TEXT NOT NULL,
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
  schedule_uid      TEXT PRIMARY KEY,
  request_uid       TEXT NOT NULL REFERENCES svr_schedule_requests(request_uid),
  job_uid           TEXT NOT NULL REFERENCES svr_jobs(job_uid),
  calendar_event_id TEXT NOT NULL DEFAULT '',
  start_at          TEXT NOT NULL,
  end_at            TEXT NOT NULL,
  technician_uid    TEXT NOT NULL,
  status            TEXT NOT NULL DEFAULT 'confirmed',
  row_version       INTEGER NOT NULL DEFAULT 1,
  updated_at        TEXT NOT NULL,
  updated_by        TEXT NOT NULL,
  correlation_id    TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS svr_job_documents (
  document_uid    TEXT PRIMARY KEY,
  job_uid         TEXT NOT NULL REFERENCES svr_jobs(job_uid),
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
  automation_job_uid TEXT PRIMARY KEY,
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
  mutation_uid    TEXT PRIMARY KEY,
  job_uid         TEXT NOT NULL REFERENCES svr_jobs(job_uid),
  actor_uid       TEXT NOT NULL,
  payload_json    TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'applied',
  last_result     TEXT NOT NULL DEFAULT '',
  row_version     INTEGER NOT NULL DEFAULT 1,
  updated_at      TEXT NOT NULL,
  updated_by      TEXT NOT NULL,
  correlation_id  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS svr_audit_log (
  audit_uid       TEXT PRIMARY KEY,
  action          TEXT NOT NULL,
  entry_type      TEXT NOT NULL DEFAULT 'system_audit',
  payload_json    TEXT NOT NULL,
  actor_user_uid  TEXT NOT NULL,
  correlation_id  TEXT NOT NULL,
  at              TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_svr_job_events_job_uid ON svr_job_events(job_uid);
CREATE INDEX IF NOT EXISTS idx_svr_sync_queue_job_uid ON svr_sync_queue(job_uid);
CREATE INDEX IF NOT EXISTS idx_svr_jobs_client_uid ON svr_jobs(client_uid);
CREATE INDEX IF NOT EXISTS idx_svr_jobs_technician_uid ON svr_jobs(technician_uid);
CREATE INDEX IF NOT EXISTS idx_svr_job_documents_job_uid ON svr_job_documents(job_uid);
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

  // -- Job operations ------------------------------------------------------

  async listJobsForUser(user: SessionUser): Promise<JobRow[]> {
    const pool = await this.getPool();
    let result;

    const broadAccessRoles = new Set(["admin", "dispatcher", "finance"]);
    if (broadAccessRoles.has(String(user.role))) {
      result = await pool.query(`SELECT * FROM ${this.schema}.svr_jobs ORDER BY updated_at DESC`);
    } else if (user.role === "client") {
      result = await pool.query(
        `SELECT * FROM ${this.schema}.svr_jobs WHERE client_uid = $1 ORDER BY updated_at DESC`,
        [user.client_uid]
      );
    } else {
      result = await pool.query(
        `SELECT * FROM ${this.schema}.svr_jobs WHERE technician_uid = $1 ORDER BY updated_at DESC`,
        [user.technician_uid]
      );
    }

    // Keep RBAC check as a defense-in-depth guard.
    return result.rows.map(jobRowFromPg).filter((job) => canReadJob(user, job));
  }

  async getJob(jobUid: string): Promise<JobRow | null> {
    const pool = await this.getPool();
    const result = await pool.query(
      `SELECT * FROM ${this.schema}.svr_jobs WHERE job_uid = $1`,
      [jobUid]
    );
    if (result.rows.length === 0) return null;
    return jobRowFromPg(result.rows[0]);
  }

  async updateJobStatus(args: {
    jobUid: string;
    status: JobRow["status"];
    expectedRowVersion: number;
    ctx: StoreContext;
  }): Promise<{ job: JobRow; conflict: ConflictPayload | null }> {
    const pool = await this.getPool();
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const currentRes = await client.query(
        `SELECT * FROM ${this.schema}.svr_jobs WHERE job_uid = $1 FOR UPDATE`,
        [args.jobUid]
      );

      if (currentRes.rows.length === 0) {
        await client.query("ROLLBACK");
        throw new Error(`Unknown job ${args.jobUid}`);
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
         WHERE job_uid = $6 AND row_version = $7
         RETURNING *`,
        [args.status, newVersion, now, args.ctx.actorUserUid, args.ctx.correlationId, args.jobUid, args.expectedRowVersion]
      );

      if (updatedRes.rows.length === 0) {
        await client.query("ROLLBACK");
        const refetched = await client.query(`SELECT * FROM ${this.schema}.svr_jobs WHERE job_uid = $1`, [args.jobUid]);
        const refetchedJob = refetched.rows.length > 0 ? jobRowFromPg(refetched.rows[0]) : current;
        return { job: immutableClone(refetchedJob), conflict: toConflict(refetchedJob, args.expectedRowVersion) };
      }

      const updated = jobRowFromPg(updatedRes.rows[0]);

      const event = stampEvent({
        jobUid: updated.job_uid,
        eventType: "status_changed",
        payload: { from: current.status, to: args.status },
        ctx: args.ctx
      });
      await client.query(
        `INSERT INTO ${this.schema}.svr_job_events
         (event_uid, job_uid, event_type, payload_json, row_version, updated_at, updated_by, correlation_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [event.event_uid, event.job_uid, event.event_type, event.payload_json, event.row_version, event.updated_at, event.updated_by, event.correlation_id]
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
    jobUid: string;
    note: string;
    expectedRowVersion: number;
    ctx: StoreContext;
  }): Promise<{ job: JobRow; conflict: ConflictPayload | null }> {
    const pool = await this.getPool();
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const currentRes = await client.query(
        `SELECT * FROM ${this.schema}.svr_jobs WHERE job_uid = $1 FOR UPDATE`,
        [args.jobUid]
      );

      if (currentRes.rows.length === 0) {
        await client.query("ROLLBACK");
        throw new Error(`Unknown job ${args.jobUid}`);
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
         WHERE job_uid = $6 AND row_version = $7
         RETURNING *`,
        [args.note, newVersion, now, args.ctx.actorUserUid, args.ctx.correlationId, args.jobUid, args.expectedRowVersion]
      );

      if (updatedRes.rows.length === 0) {
        await client.query("ROLLBACK");
        const refetched = await client.query(`SELECT * FROM ${this.schema}.svr_jobs WHERE job_uid = $1`, [args.jobUid]);
        const refetchedJob = refetched.rows.length > 0 ? jobRowFromPg(refetched.rows[0]) : current;
        return { job: immutableClone(refetchedJob), conflict: toConflict(refetchedJob, args.expectedRowVersion) };
      }

      const updated = jobRowFromPg(updatedRes.rows[0]);

      const event = stampEvent({
        jobUid: updated.job_uid,
        eventType: "note_added",
        payload: { note: args.note },
        ctx: args.ctx
      });
      await client.query(
        `INSERT INTO ${this.schema}.svr_job_events
         (event_uid, job_uid, event_type, payload_json, row_version, updated_at, updated_by, correlation_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [event.event_uid, event.job_uid, event.event_type, event.payload_json, event.row_version, event.updated_at, event.updated_by, event.correlation_id]
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
       (event_uid, job_uid, event_type, payload_json, row_version, updated_at, updated_by, correlation_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        event.event_uid, event.job_uid, event.event_type, event.payload_json,
        event.row_version, event.updated_at, event.updated_by, event.correlation_id
      ]
    );
  }

  // -- Schedule operations -------------------------------------------------

  async createScheduleRequest(row: ScheduleRequestRow): Promise<void> {
    const pool = await this.getPool();
    await pool.query(
      `INSERT INTO ${this.schema}.svr_schedule_requests
       (request_uid, job_uid, client_uid, preferred_slots_json, timezone, notes, status,
        row_version, updated_at, updated_by, correlation_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        row.request_uid, row.job_uid, row.client_uid, row.preferred_slots_json,
        row.timezone, row.notes, row.status,
        row.row_version, row.updated_at, row.updated_by, row.correlation_id
      ]
    );
  }

  async getScheduleRequest(requestUid: string): Promise<ScheduleRequestRow | null> {
    const pool = await this.getPool();
    const result = await pool.query(
      `SELECT * FROM ${this.schema}.svr_schedule_requests WHERE request_uid = $1`,
      [requestUid]
    );
    if (result.rows.length === 0) return null;
    return scheduleRequestRowFromPg(result.rows[0]);
  }

  async listScheduleRequests(jobUid?: string): Promise<ScheduleRequestRow[]> {
    const pool = await this.getPool();
    let sql = `SELECT * FROM ${this.schema}.svr_schedule_requests`;
    const params: unknown[] = [];
    if (jobUid) {
      sql += ` WHERE job_uid = $1`;
      params.push(jobUid);
    }
    sql += ` ORDER BY updated_at DESC`;
    const result = await pool.query(sql, params);
    return result.rows.map(scheduleRequestRowFromPg);
  }

  async upsertScheduleRequest(row: ScheduleRequestRow): Promise<void> {
    const pool = await this.getPool();
    await pool.query(
      `INSERT INTO ${this.schema}.svr_schedule_requests
       (request_uid, job_uid, client_uid, preferred_slots_json, timezone, notes, status,
        row_version, updated_at, updated_by, correlation_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       ON CONFLICT (request_uid) DO UPDATE SET
         job_uid = EXCLUDED.job_uid,
         client_uid = EXCLUDED.client_uid,
         preferred_slots_json = EXCLUDED.preferred_slots_json,
         timezone = EXCLUDED.timezone,
         notes = EXCLUDED.notes,
         status = EXCLUDED.status,
         row_version = EXCLUDED.row_version,
         updated_at = EXCLUDED.updated_at,
         updated_by = EXCLUDED.updated_by,
         correlation_id = EXCLUDED.correlation_id`,
      [
        row.request_uid, row.job_uid, row.client_uid, row.preferred_slots_json,
        row.timezone, row.notes, row.status,
        row.row_version, row.updated_at, row.updated_by, row.correlation_id
      ]
    );
  }

  async createSchedule(row: ScheduleRow): Promise<void> {
    const pool = await this.getPool();
    await pool.query(
      `INSERT INTO ${this.schema}.svr_schedules
       (schedule_uid, request_uid, job_uid, calendar_event_id, start_at, end_at, technician_uid, status,
        row_version, updated_at, updated_by, correlation_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        row.schedule_uid, row.request_uid, row.job_uid, row.calendar_event_id,
        row.start_at, row.end_at, row.technician_uid, row.status,
        row.row_version, row.updated_at, row.updated_by, row.correlation_id
      ]
    );
  }

  async getSchedule(scheduleUid: string): Promise<ScheduleRow | null> {
    const pool = await this.getPool();
    const result = await pool.query(
      `SELECT * FROM ${this.schema}.svr_schedules WHERE schedule_uid = $1`,
      [scheduleUid]
    );
    if (result.rows.length === 0) return null;
    return scheduleRowFromPg(result.rows[0]);
  }

  async listSchedules(jobUid?: string): Promise<ScheduleRow[]> {
    const pool = await this.getPool();
    let sql = `SELECT * FROM ${this.schema}.svr_schedules`;
    const params: unknown[] = [];
    if (jobUid) {
      sql += ` WHERE job_uid = $1`;
      params.push(jobUid);
    }
    sql += ` ORDER BY updated_at DESC`;
    const result = await pool.query(sql, params);
    return result.rows.map(scheduleRowFromPg);
  }

  async upsertSchedule(row: ScheduleRow): Promise<void> {
    const pool = await this.getPool();
    await pool.query(
      `INSERT INTO ${this.schema}.svr_schedules
       (schedule_uid, request_uid, job_uid, calendar_event_id, start_at, end_at, technician_uid, status,
        row_version, updated_at, updated_by, correlation_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       ON CONFLICT (schedule_uid) DO UPDATE SET
         request_uid = EXCLUDED.request_uid,
         job_uid = EXCLUDED.job_uid,
         calendar_event_id = EXCLUDED.calendar_event_id,
         start_at = EXCLUDED.start_at,
         end_at = EXCLUDED.end_at,
         technician_uid = EXCLUDED.technician_uid,
         status = EXCLUDED.status,
         row_version = EXCLUDED.row_version,
         updated_at = EXCLUDED.updated_at,
         updated_by = EXCLUDED.updated_by,
         correlation_id = EXCLUDED.correlation_id`,
      [
        row.schedule_uid, row.request_uid, row.job_uid, row.calendar_event_id,
        row.start_at, row.end_at, row.technician_uid, row.status,
        row.row_version, row.updated_at, row.updated_by, row.correlation_id
      ]
    );
  }

  // -- Document operations -------------------------------------------------

  async createDocument(row: JobDocumentRow): Promise<void> {
    const pool = await this.getPool();
    await pool.query(
      `INSERT INTO ${this.schema}.svr_job_documents
       (document_uid, job_uid, document_type, status, drive_file_id, pdf_file_id, published_url, client_visible,
        row_version, updated_at, updated_by, correlation_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        row.document_uid, row.job_uid, row.document_type, row.status,
        row.drive_file_id, row.pdf_file_id, row.published_url, row.client_visible,
        row.row_version, row.updated_at, row.updated_by, row.correlation_id
      ]
    );
  }


  async getDocument(documentUid: string): Promise<JobDocumentRow | null> {
    const pool = await this.getPool();
    const result = await pool.query(
      `SELECT * FROM ${this.schema}.svr_job_documents WHERE document_uid = $1`,
      [documentUid]
    );
    if (result.rows.length === 0) return null;
    return jobDocumentRowFromPg(result.rows[0]);
  }

  async upsertDocument(row: JobDocumentRow): Promise<void> {
    const pool = await this.getPool();
    await pool.query(
      `INSERT INTO ${this.schema}.svr_job_documents
       (document_uid, job_uid, document_type, status, drive_file_id, pdf_file_id, published_url, client_visible,
        row_version, updated_at, updated_by, correlation_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       ON CONFLICT (document_uid) DO UPDATE SET
         job_uid = EXCLUDED.job_uid,
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
        row.document_uid, row.job_uid, row.document_type, row.status,
        row.drive_file_id, row.pdf_file_id, row.published_url, row.client_visible,
        row.row_version, row.updated_at, row.updated_by, row.correlation_id
      ]
    );
  }


  async listDocuments(jobUid?: string): Promise<JobDocumentRow[]> {
    const pool = await this.getPool();
    let sql = `SELECT * FROM ${this.schema}.svr_job_documents`;
    const params: unknown[] = [];
    if (jobUid) {
      sql += ` WHERE job_uid = $1`;
      params.push(jobUid);
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
       (audit_uid, action, entry_type, payload_json, actor_user_uid, correlation_id, at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        `AUD-${crypto.randomUUID()}`,
        args.action,
        args.entry_type ?? "system_audit",
        JSON.stringify(args.payload),
        args.ctx.actorUserUid,
        args.ctx.correlationId,
        nowIso()
      ]
    );
  }

  async listAudits(): Promise<Array<Record<string, string>>> {
    const pool = await this.getPool();
    const result = await pool.query(
      `SELECT audit_uid, action, entry_type, payload_json, actor_user_uid, correlation_id, at
       FROM ${this.schema}.svr_audit_log
       ORDER BY at DESC`
    );
    return result.rows.map((row) => ({
      audit_uid: String(row.audit_uid),
      action: String(row.action),
      entry_type: String(row.entry_type),
      payload_json: String(row.payload_json),
      actor_user_uid: String(row.actor_user_uid),
      correlation_id: String(row.correlation_id),
      at: String(row.at)
    }));
  }

  // -- Automation job operations -------------------------------------------

  async upsertAutomationJob(row: AutomationJobRow): Promise<void> {
    const pool = await this.getPool();
    await pool.query(
      `INSERT INTO ${this.schema}.svr_automation_jobs
       (automation_job_uid, action, payload_json, status, retry_count, last_error,
        row_version, updated_at, updated_by, correlation_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (automation_job_uid) DO UPDATE SET
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
        row.automation_job_uid, row.action, row.payload_json, row.status,
        row.retry_count, row.last_error,
        row.row_version, row.updated_at, row.updated_by, row.correlation_id
      ]
    );
  }

  async getAutomationJob(automationJobUid: string): Promise<AutomationJobRow | null> {
    const pool = await this.getPool();
    const result = await pool.query(
      `SELECT * FROM ${this.schema}.svr_automation_jobs WHERE automation_job_uid = $1`,
      [automationJobUid]
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
       (mutation_uid, job_uid, actor_uid, payload_json, status, last_result,
        row_version, updated_at, updated_by, correlation_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (mutation_uid) DO UPDATE SET
         job_uid = EXCLUDED.job_uid,
         actor_uid = EXCLUDED.actor_uid,
         payload_json = EXCLUDED.payload_json,
         status = EXCLUDED.status,
         last_result = EXCLUDED.last_result,
         row_version = EXCLUDED.row_version,
         updated_at = EXCLUDED.updated_at,
         updated_by = EXCLUDED.updated_by,
         correlation_id = EXCLUDED.correlation_id`,
      [
        row.mutation_uid, row.job_uid, row.actor_uid, row.payload_json,
        row.status, row.last_result,
        row.row_version, row.updated_at, row.updated_by, row.correlation_id
      ]
    );
  }

  async getSyncQueue(mutationUid: string): Promise<SyncQueueRow | null> {
    const pool = await this.getPool();
    const result = await pool.query(
      `SELECT * FROM ${this.schema}.svr_sync_queue WHERE mutation_uid = $1`,
      [mutationUid]
    );
    if (result.rows.length === 0) return null;
    return syncQueueRowFromPg(result.rows[0]);
  }

  async listSyncQueueByJob(jobUid: string): Promise<SyncQueueRow[]> {
    const pool = await this.getPool();
    const result = await pool.query(
      `SELECT * FROM ${this.schema}.svr_sync_queue WHERE job_uid = $1 ORDER BY updated_at DESC`,
      [jobUid]
    );
    return result.rows.map(syncQueueRowFromPg);
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
          const job = await this.getJob(mutation.job_uid);
          result.applied.push({
            mutation_id: mutation.mutation_id,
            job_uid: mutation.job_uid,
            row_version: job?.row_version ?? 0
          });
          continue;
        }

        const job = await this.getJob(mutation.job_uid);
        if (!job) {
          result.failed.push({
            mutation_id: mutation.mutation_id,
            job_uid: mutation.job_uid,
            error: normalizeError(`Unknown job ${mutation.job_uid}`, "not_found")
          });
          continue;
        }

        if (job.row_version !== mutation.expected_row_version) {
          const conflict = toConflict(job, mutation.expected_row_version);
          result.conflicts.push({
            mutation_id: mutation.mutation_id,
            job_uid: mutation.job_uid,
            conflict
          });

          await this.upsertSyncQueue({
            mutation_uid: mutation.mutation_id,
            job_uid: mutation.job_uid,
            actor_uid: args.actor.user_uid,
            payload_json: JSON.stringify(mutation.payload),
            status: "conflict",
            last_result: JSON.stringify(conflict),
            ...newMutableMeta(args.ctx.actorUserUid, args.ctx.correlationId)
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
            job_uid: mutation.job_uid,
            conflict: updateResult.conflict
          });

          await this.upsertSyncQueue({
            mutation_uid: mutation.mutation_id,
            job_uid: mutation.job_uid,
            actor_uid: args.actor.user_uid,
            payload_json: JSON.stringify(mutation.payload),
            status: "conflict",
            last_result: JSON.stringify(updateResult.conflict),
            ...newMutableMeta(args.ctx.actorUserUid, args.ctx.correlationId)
          });

          continue;
        }

        await this.upsertSyncQueue({
          mutation_uid: mutation.mutation_id,
          job_uid: mutation.job_uid,
          actor_uid: args.actor.user_uid,
          payload_json: JSON.stringify(mutation.payload),
          status: "applied",
          last_result: "applied",
          ...newMutableMeta(args.ctx.actorUserUid, args.ctx.correlationId)
        });

        result.applied.push({
          mutation_id: mutation.mutation_id,
          job_uid: mutation.job_uid,
          row_version: updateResult.job.row_version
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        const typedError: ApiError = normalizeError(message, "sync_apply_failed");
        result.failed.push({
          mutation_id: mutation.mutation_id,
          job_uid: mutation.job_uid,
          error: typedError
        });

        await this.upsertSyncQueue({
          mutation_uid: mutation.mutation_id,
          job_uid: mutation.job_uid,
          actor_uid: args.actor.user_uid,
          payload_json: JSON.stringify(mutation.payload),
          status: "failed",
          last_result: JSON.stringify(typedError),
          ...newMutableMeta(args.ctx.actorUserUid, args.ctx.correlationId)
        });
      }
    }

    return result;
  }

  async resolveSyncConflict(args: {
    actor: SessionUser;
    jobUid: string;
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
        `SELECT * FROM ${this.schema}.svr_jobs WHERE job_uid = $1 FOR UPDATE`,
        [args.jobUid]
      );

      if (currentRes.rows.length === 0) {
        await client.query("ROLLBACK");
        throw new Error(`Unknown job ${args.jobUid}`);
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
         WHERE job_uid = $7 AND row_version = $8
         RETURNING *`,
        [current.status, current.last_note, newVersion, now, args.ctx.actorUserUid, args.ctx.correlationId, args.jobUid, args.serverRowVersion]
      );

      if (updatedRes.rows.length === 0) {
        await client.query("ROLLBACK");
        const refetched = await client.query(`SELECT * FROM ${this.schema}.svr_jobs WHERE job_uid = $1`, [args.jobUid]);
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

  async pullSyncData(args: {
    actor: SessionUser;
    since: string;
  }): Promise<{ jobs: JobRow[]; queue: SyncQueueRow[] }> {
    const pool = await this.getPool();
    const jobResult = await pool.query(
      `SELECT * FROM ${this.schema}.svr_jobs ORDER BY updated_at DESC`
    );
    const allJobs = jobResult.rows.map(jobRowFromPg);
    const jobs = allJobs.filter((job) => canReadJob(args.actor, job));

    const sinceTs = Date.parse(args.since);
    const filteredJobs = Number.isNaN(sinceTs)
      ? jobs
      : jobs.filter((job) => Date.parse(job.updated_at) >= sinceTs);

    const jobUids = filteredJobs.map((j) => j.job_uid);
    let queue: SyncQueueRow[] = [];
    if (jobUids.length > 0) {
      const placeholders = jobUids.map((_, i) => `$${i + 1}`).join(", ");
      const queueResult = await pool.query(
        `SELECT * FROM ${this.schema}.svr_sync_queue WHERE job_uid IN (${placeholders}) ORDER BY updated_at DESC`,
        jobUids
      );
      queue = queueResult.rows.map(syncQueueRowFromPg);
    }

    return { jobs: filteredJobs, queue };
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
       WHERE job_uid = $7 AND row_version = $8
       RETURNING *`,
      [job.status, job.last_note, newVersion, now, ctx.actorUserUid, ctx.correlationId, job.job_uid, job.row_version]
    );

    if (result.rows.length === 0) {
      const refetched = await this.getJob(job.job_uid);
      const refetchedJob = refetched ?? job;
      return { job: immutableClone(refetchedJob), conflict: toConflict(refetchedJob, job.row_version) };
    }

    const updated = jobRowFromPg(result.rows[0] as PgRow);

    const event = stampEvent({
      jobUid: updated.job_uid,
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
