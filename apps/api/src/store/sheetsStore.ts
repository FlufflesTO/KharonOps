import {
  WORKBOOK_HEADERS,
  buildConflict,
  bumpMutableMeta,
  canReadJob,
  canTransitionStatus,
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
import type { WorkspaceRails } from "@kharon/google";
import type { WorkbookStore } from "./types.js";

type Row = Record<string, string>;

function field(row: Row, key: string): string {
  return row[key] ?? "";
}

function toNum(value: string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function stringifyRow(record: object): Row {
  const row: Row = {};
  for (const [key, value] of Object.entries(record)) {
    row[key] = String(value ?? "");
  }
  return row;
}

function parseUserRow(row: Row): UserRow {
  return {
    user_uid: field(row, "user_uid"),
    email: field(row, "email"),
    display_name: field(row, "display_name"),
    role: field(row, "role") as UserRow["role"],
    client_uid: field(row, "client_uid"),
    technician_uid: field(row, "technician_uid"),
    active: (field(row, "active") || "false") as UserRow["active"],
    row_version: toNum(field(row, "row_version")),
    updated_at: field(row, "updated_at"),
    updated_by: field(row, "updated_by"),
    correlation_id: field(row, "correlation_id")
  };
}

function parseJobRow(row: Row): JobRow {
  return {
    job_uid: field(row, "job_uid"),
    client_uid: field(row, "client_uid"),
    site_uid: field(row, "site_uid"),
    technician_uid: field(row, "technician_uid"),
    title: field(row, "title"),
    status: field(row, "status") as JobRow["status"],
    scheduled_start: field(row, "scheduled_start"),
    scheduled_end: field(row, "scheduled_end"),
    last_note: field(row, "last_note"),
    row_version: toNum(field(row, "row_version")),
    updated_at: field(row, "updated_at"),
    updated_by: field(row, "updated_by"),
    correlation_id: field(row, "correlation_id")
  };
}

function parseScheduleRequest(row: Row): ScheduleRequestRow {
  return {
    request_uid: field(row, "request_uid"),
    job_uid: field(row, "job_uid"),
    client_uid: field(row, "client_uid"),
    preferred_slots_json: field(row, "preferred_slots_json"),
    timezone: field(row, "timezone"),
    notes: field(row, "notes"),
    status: field(row, "status") as ScheduleRequestRow["status"],
    row_version: toNum(field(row, "row_version")),
    updated_at: field(row, "updated_at"),
    updated_by: field(row, "updated_by"),
    correlation_id: field(row, "correlation_id")
  };
}

function parseSchedule(row: Row): ScheduleRow {
  return {
    schedule_uid: field(row, "schedule_uid"),
    request_uid: field(row, "request_uid"),
    job_uid: field(row, "job_uid"),
    calendar_event_id: field(row, "calendar_event_id"),
    start_at: field(row, "start_at"),
    end_at: field(row, "end_at"),
    technician_uid: field(row, "technician_uid"),
    status: field(row, "status") as ScheduleRow["status"],
    row_version: toNum(field(row, "row_version")),
    updated_at: field(row, "updated_at"),
    updated_by: field(row, "updated_by"),
    correlation_id: field(row, "correlation_id")
  };
}

function parseDocument(row: Row): JobDocumentRow {
  return {
    document_uid: field(row, "document_uid"),
    job_uid: field(row, "job_uid"),
    document_type: field(row, "document_type") as JobDocumentRow["document_type"],
    status: field(row, "status") as JobDocumentRow["status"],
    drive_file_id: field(row, "drive_file_id"),
    pdf_file_id: field(row, "pdf_file_id"),
    published_url: field(row, "published_url"),
    row_version: toNum(field(row, "row_version")),
    updated_at: field(row, "updated_at"),
    updated_by: field(row, "updated_by"),
    correlation_id: field(row, "correlation_id")
  };
}

function parseAutomation(row: Row): AutomationJobRow {
  return {
    automation_job_uid: field(row, "automation_job_uid"),
    action: field(row, "action"),
    payload_json: field(row, "payload_json"),
    status: field(row, "status") as AutomationJobRow["status"],
    retry_count: toNum(field(row, "retry_count")),
    last_error: field(row, "last_error"),
    row_version: toNum(field(row, "row_version")),
    updated_at: field(row, "updated_at"),
    updated_by: field(row, "updated_by"),
    correlation_id: field(row, "correlation_id")
  };
}

function parseSyncQueue(row: Row): SyncQueueRow {
  return {
    mutation_uid: field(row, "mutation_uid"),
    job_uid: field(row, "job_uid"),
    actor_uid: field(row, "actor_uid"),
    payload_json: field(row, "payload_json"),
    status: field(row, "status") as SyncQueueRow["status"],
    last_result: field(row, "last_result"),
    row_version: toNum(field(row, "row_version")),
    updated_at: field(row, "updated_at"),
    updated_by: field(row, "updated_by"),
    correlation_id: field(row, "correlation_id")
  };
}

function conflictFor(job: JobRow, expected: number): ConflictPayload {
  return buildConflict({
    entity: "Jobs_Master",
    entityId: job.job_uid,
    serverState: job as unknown as Record<string, unknown>,
    clientRowVersion: expected,
    serverRowVersion: job.row_version
  });
}

function nowIso(): string {
  return new Date().toISOString();
}

export class SheetsWorkbookStore implements WorkbookStore {
  constructor(private readonly rails: WorkspaceRails) {}

  private async rows(sheetName: string): Promise<Row[]> {
    return this.rails.sheets.getRows(sheetName);
  }

  async ensureSchema(): Promise<void> {
    await this.rails.sheets.ensureWorkbookSchema(WORKBOOK_HEADERS as unknown as Record<string, string[]>);
  }

  async getUserByEmail(email: string): Promise<UserRow | null> {
    const rows = await this.rows("Users_Master");
    const target = email.trim().toLowerCase();
    const found = rows.find((row) => field(row, "email").toLowerCase() === target && field(row, "active") === "true");
    return found ? parseUserRow(found) : null;
  }

  async listUsers(): Promise<UserRow[]> {
    return (await this.rows("Users_Master")).map(parseUserRow);
  }

  async listJobsForUser(user: SessionUser): Promise<JobRow[]> {
    return (await this.rows("Jobs_Master")).map(parseJobRow).filter((job) => canReadJob(user, job));
  }

  async getJob(jobUid: string): Promise<JobRow | null> {
    const row = (await this.rows("Jobs_Master")).find((candidate) => field(candidate, "job_uid") === jobUid);
    return row ? parseJobRow(row) : null;
  }

  async updateJobStatus(args: {
    jobUid: string;
    status: JobRow["status"];
    expectedRowVersion: number;
    ctx: { correlationId: string; actorUserUid: string };
  }): Promise<{ job: JobRow; conflict: ConflictPayload | null }> {
    const current = await this.getJob(args.jobUid);
    if (!current) {
      throw new Error(`Unknown job ${args.jobUid}`);
    }

    if (current.row_version !== args.expectedRowVersion) {
      return { job: current, conflict: conflictFor(current, args.expectedRowVersion) };
    }

    if (!canTransitionStatus(current.status, args.status)) {
      throw new Error(`Invalid status transition from ${current.status} to ${args.status}`);
    }

    const updated: JobRow = {
      ...current,
      status: args.status,
      ...bumpMutableMeta(current, args.ctx.actorUserUid, args.ctx.correlationId)
    };

    await this.rails.sheets.upsertRow("Jobs_Master", "job_uid", stringifyRow(updated));
    await this.appendJobEvent({
      event_uid: `EVT-${crypto.randomUUID()}`,
      job_uid: updated.job_uid,
      event_type: "status_changed",
      payload_json: JSON.stringify({ from: current.status, to: updated.status }),
      row_version: 1,
      updated_at: nowIso(),
      updated_by: args.ctx.actorUserUid,
      correlation_id: args.ctx.correlationId
    });

    return { job: updated, conflict: null };
  }

  async appendJobNote(args: {
    jobUid: string;
    note: string;
    expectedRowVersion: number;
    ctx: { correlationId: string; actorUserUid: string };
  }): Promise<{ job: JobRow; conflict: ConflictPayload | null }> {
    const current = await this.getJob(args.jobUid);
    if (!current) {
      throw new Error(`Unknown job ${args.jobUid}`);
    }

    if (current.row_version !== args.expectedRowVersion) {
      return { job: current, conflict: conflictFor(current, args.expectedRowVersion) };
    }

    const updated: JobRow = {
      ...current,
      last_note: args.note,
      ...bumpMutableMeta(current, args.ctx.actorUserUid, args.ctx.correlationId)
    };

    await this.rails.sheets.upsertRow("Jobs_Master", "job_uid", stringifyRow(updated));
    await this.appendJobEvent({
      event_uid: `EVT-${crypto.randomUUID()}`,
      job_uid: updated.job_uid,
      event_type: "note_added",
      payload_json: JSON.stringify({ note: args.note }),
      row_version: 1,
      updated_at: nowIso(),
      updated_by: args.ctx.actorUserUid,
      correlation_id: args.ctx.correlationId
    });

    return { job: updated, conflict: null };
  }

  async appendJobEvent(event: JobEventRow): Promise<void> {
    await this.rails.sheets.appendRow("Job_Events", stringifyRow(event));
  }

  async createScheduleRequest(row: ScheduleRequestRow): Promise<void> {
    await this.rails.sheets.appendRow("Schedule_Requests", stringifyRow(row));
  }

  async getScheduleRequest(requestUid: string): Promise<ScheduleRequestRow | null> {
    const row = (await this.rows("Schedule_Requests")).find((candidate) => field(candidate, "request_uid") === requestUid);
    return row ? parseScheduleRequest(row) : null;
  }

  async upsertScheduleRequest(row: ScheduleRequestRow): Promise<void> {
    await this.rails.sheets.upsertRow("Schedule_Requests", "request_uid", stringifyRow(row));
  }

  async createSchedule(row: ScheduleRow): Promise<void> {
    await this.rails.sheets.appendRow("Schedules_Master", stringifyRow(row));
  }

  async getSchedule(scheduleUid: string): Promise<ScheduleRow | null> {
    const row = (await this.rows("Schedules_Master")).find((candidate) => field(candidate, "schedule_uid") === scheduleUid);
    return row ? parseSchedule(row) : null;
  }

  async upsertSchedule(row: ScheduleRow): Promise<void> {
    await this.rails.sheets.upsertRow("Schedules_Master", "schedule_uid", stringifyRow(row));
  }

  async createDocument(row: JobDocumentRow): Promise<void> {
    await this.rails.sheets.appendRow("Job_Documents", stringifyRow(row));
  }

  async getDocument(documentUid: string): Promise<JobDocumentRow | null> {
    const row = (await this.rows("Job_Documents")).find((candidate) => field(candidate, "document_uid") === documentUid);
    return row ? parseDocument(row) : null;
  }

  async upsertDocument(row: JobDocumentRow): Promise<void> {
    await this.rails.sheets.upsertRow("Job_Documents", "document_uid", stringifyRow(row));
  }

  async listDocuments(jobUid?: string): Promise<JobDocumentRow[]> {
    return (await this.rows("Job_Documents"))
      .map(parseDocument)
      .filter((row) => (jobUid ? row.job_uid === jobUid : true));
  }

  async appendAudit(args: {
    action: string;
    payload: Record<string, unknown>;
    ctx: { correlationId: string; actorUserUid: string };
  }): Promise<void> {
    await this.rails.sheets.appendRow("System_Config", {
      config_key: `AUDIT_${Date.now()}_${crypto.randomUUID()}`,
      config_value: JSON.stringify({ action: args.action, payload: args.payload }),
      row_version: "1",
      updated_at: nowIso(),
      updated_by: args.ctx.actorUserUid,
      correlation_id: args.ctx.correlationId
    });
  }

  async listAudits(): Promise<Array<Record<string, string>>> {
    return (await this.rows("System_Config")).filter((row) => field(row, "config_key").startsWith("AUDIT_"));
  }

  async upsertAutomationJob(row: AutomationJobRow): Promise<void> {
    await this.rails.sheets.upsertRow("Automation_Jobs", "automation_job_uid", stringifyRow(row));
  }

  async getAutomationJob(automationJobUid: string): Promise<AutomationJobRow | null> {
    const row = (await this.rows("Automation_Jobs")).find(
      (candidate) => field(candidate, "automation_job_uid") === automationJobUid
    );
    return row ? parseAutomation(row) : null;
  }

  async upsertSyncQueue(row: SyncQueueRow): Promise<void> {
    await this.rails.sheets.upsertRow("Sync_Queue", "mutation_uid", stringifyRow(row));
  }

  async getSyncQueue(mutationUid: string): Promise<SyncQueueRow | null> {
    const row = (await this.rows("Sync_Queue")).find((candidate) => field(candidate, "mutation_uid") === mutationUid);
    return row ? parseSyncQueue(row) : null;
  }

  async listSyncQueueByJob(jobUid: string): Promise<SyncQueueRow[]> {
    return (await this.rows("Sync_Queue"))
      .map(parseSyncQueue)
      .filter((row) => row.job_uid === jobUid);
  }

  async applySyncMutations(args: {
    actor: SessionUser;
    mutations: SyncMutation[];
    ctx: { correlationId: string; actorUserUid: string };
  }): Promise<SyncPushResult> {
    const result: SyncPushResult = { applied: [], conflicts: [], failed: [] };

    for (const mutation of args.mutations) {
      const existing = await this.getSyncQueue(mutation.mutation_id);
      if (existing?.status === "applied") {
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
          error: { code: "not_found", message: `Unknown job ${mutation.job_uid}` }
        });
        continue;
      }

      if (job.row_version !== mutation.expected_row_version) {
        const conflict = conflictFor(job, mutation.expected_row_version);
        result.conflicts.push({ mutation_id: mutation.mutation_id, job_uid: mutation.job_uid, conflict });

        await this.upsertSyncQueue({
          mutation_uid: mutation.mutation_id,
          job_uid: mutation.job_uid,
          actor_uid: args.actor.user_uid,
          payload_json: JSON.stringify(mutation.payload),
          status: "conflict",
          last_result: JSON.stringify(conflict),
          row_version: existing ? existing.row_version + 1 : 1,
          updated_at: nowIso(),
          updated_by: args.ctx.actorUserUid,
          correlation_id: args.ctx.correlationId
        });
        continue;
      }

      try {
        if (mutation.kind === "job_status") {
          const status = String(mutation.payload.status ?? "") as JobRow["status"];
          if (!canTransitionStatus(job.status, status)) {
            throw new Error(`Invalid transition ${job.status} -> ${status}`);
          }
          job.status = status;
        }

        if (mutation.kind === "job_note") {
          const note = String(mutation.payload.note ?? "").trim();
          if (!note) {
            throw new Error("Empty note");
          }
          job.last_note = note;
        }

        const updated = {
          ...job,
          ...bumpMutableMeta(job, args.ctx.actorUserUid, args.ctx.correlationId)
        };

        await this.rails.sheets.upsertRow("Jobs_Master", "job_uid", stringifyRow(updated));
        await this.upsertSyncQueue({
          mutation_uid: mutation.mutation_id,
          job_uid: mutation.job_uid,
          actor_uid: args.actor.user_uid,
          payload_json: JSON.stringify(mutation.payload),
          status: "applied",
          last_result: "applied",
          row_version: existing ? existing.row_version + 1 : 1,
          updated_at: nowIso(),
          updated_by: args.ctx.actorUserUid,
          correlation_id: args.ctx.correlationId
        });

        result.applied.push({ mutation_id: mutation.mutation_id, job_uid: mutation.job_uid, row_version: updated.row_version });
      } catch (error) {
        const typed: ApiError = { code: "sync_apply_failed", message: String(error) };
        result.failed.push({ mutation_id: mutation.mutation_id, job_uid: mutation.job_uid, error: typed });
        await this.upsertSyncQueue({
          mutation_uid: mutation.mutation_id,
          job_uid: mutation.job_uid,
          actor_uid: args.actor.user_uid,
          payload_json: JSON.stringify(mutation.payload),
          status: "failed",
          last_result: JSON.stringify(typed),
          row_version: existing ? existing.row_version + 1 : 1,
          updated_at: nowIso(),
          updated_by: args.ctx.actorUserUid,
          correlation_id: args.ctx.correlationId
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
    ctx: { correlationId: string; actorUserUid: string };
  }): Promise<{ job: JobRow; conflict: ConflictPayload | null }> {
    const job = await this.getJob(args.jobUid);
    if (!job) {
      throw new Error(`Unknown job ${args.jobUid}`);
    }

    if (job.row_version !== args.serverRowVersion) {
      return { job, conflict: conflictFor(job, args.clientRowVersion) };
    }

    if (args.strategy === "server") {
      return { job, conflict: null };
    }

    const patch = args.mergePatch ?? {};
    if (typeof patch.status === "string" && canTransitionStatus(job.status, patch.status as JobRow["status"])) {
      job.status = patch.status as JobRow["status"];
    }
    if (typeof patch.last_note === "string" && patch.last_note.trim()) {
      job.last_note = patch.last_note;
    }

    const updated = {
      ...job,
      ...bumpMutableMeta(job, args.ctx.actorUserUid, args.ctx.correlationId)
    };
    await this.rails.sheets.upsertRow("Jobs_Master", "job_uid", stringifyRow(updated));

    return { job: updated, conflict: null };
  }

  async pullSyncData(args: { actor: SessionUser; since: string }): Promise<{ jobs: JobRow[]; queue: SyncQueueRow[] }> {
    const sinceTs = Date.parse(args.since);
    const jobs = (await this.listJobsForUser(args.actor)).filter((job) =>
      Number.isNaN(sinceTs) ? true : Date.parse(job.updated_at) >= sinceTs
    );

    const queue = (await this.rows("Sync_Queue"))
      .map(parseSyncQueue)
      .filter((entry) => jobs.some((job) => job.job_uid === entry.job_uid));

    return { jobs, queue };
  }
}
