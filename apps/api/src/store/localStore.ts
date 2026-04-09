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
import type { WorkbookStore } from "./types.js";

interface LocalData {
  users: Map<string, UserRow>;
  jobs: Map<string, JobRow>;
  jobEvents: Map<string, JobEventRow>;
  scheduleRequests: Map<string, ScheduleRequestRow>;
  schedules: Map<string, ScheduleRow>;
  documents: Map<string, JobDocumentRow>;
  automationJobs: Map<string, AutomationJobRow>;
  syncQueue: Map<string, SyncQueueRow>;
  audits: Array<Record<string, string>>;
}

function nowIso(): string {
  return new Date().toISOString();
}

function immutableClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function makeSeedData(): LocalData {
  const meta = newMutableMeta("system", "seed");

  const users = new Map<string, UserRow>();
  const jobs = new Map<string, JobRow>();
  const automationJobs = new Map<string, AutomationJobRow>();

  const userRows: UserRow[] = [
    {
      user_uid: "USR-CLIENT-1",
      email: "client@example.com",
      display_name: "Client Operator",
      role: "client",
      client_uid: "CLI-001",
      technician_uid: "",
      active: "true",
      ...meta
    },
    {
      user_uid: "USR-TECH-1",
      email: "tech@example.com",
      display_name: "Field Technician",
      role: "technician",
      client_uid: "",
      technician_uid: "TECH-001",
      active: "true",
      ...meta
    },
    {
      user_uid: "USR-DISP-1",
      email: "dispatcher@example.com",
      display_name: "Dispatch Controller",
      role: "dispatcher",
      client_uid: "",
      technician_uid: "",
      active: "true",
      ...meta
    },
    {
      user_uid: "USR-ADMIN-1",
      email: "admin@example.com",
      display_name: "Security Administrator",
      role: "admin",
      client_uid: "",
      technician_uid: "",
      active: "true",
      ...meta
    }
  ];

  const jobRows: JobRow[] = [
    {
      job_uid: "JOB-1001",
      client_uid: "CLI-001",
      site_uid: "SITE-001",
      technician_uid: "TECH-001",
      title: "Fire panel fault isolation",
      status: "assigned",
      scheduled_start: nowIso(),
      scheduled_end: nowIso(),
      last_note: "Initial assignment",
      ...meta
    },
    {
      job_uid: "JOB-2002",
      client_uid: "CLI-002",
      site_uid: "SITE-002",
      technician_uid: "TECH-002",
      title: "Suppression cylinder pressure test",
      status: "open",
      scheduled_start: nowIso(),
      scheduled_end: nowIso(),
      last_note: "Awaiting assignment",
      ...meta
    }
  ];

  for (const row of userRows) {
    users.set(row.user_uid, row);
  }

  for (const row of jobRows) {
    jobs.set(row.job_uid, row);
  }

  automationJobs.set("AUTO-001", {
    automation_job_uid: "AUTO-001",
    action: "calendar_sync",
    payload_json: "{}",
    status: "queued",
    retry_count: 0,
    last_error: "",
    ...meta
  });

  return {
    users,
    jobs,
    jobEvents: new Map<string, JobEventRow>(),
    scheduleRequests: new Map<string, ScheduleRequestRow>(),
    schedules: new Map<string, ScheduleRow>(),
    documents: new Map<string, JobDocumentRow>(),
    automationJobs,
    syncQueue: new Map<string, SyncQueueRow>(),
    audits: []
  };
}

function normalizeError(message: string, code = "validation_error"): ApiError {
  return {
    code,
    message
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

function stampEvent(args: { jobUid: string; eventType: string; payload: Record<string, unknown>; ctx: { actorUserUid: string; correlationId: string } }): JobEventRow {
  return {
    event_uid: `EVT-${crypto.randomUUID()}`,
    job_uid: args.jobUid,
    event_type: args.eventType,
    payload_json: JSON.stringify(args.payload),
    ...newMutableMeta(args.ctx.actorUserUid, args.ctx.correlationId)
  };
}

export class LocalWorkbookStore implements WorkbookStore {
  private readonly data: LocalData;

  constructor() {
    this.data = makeSeedData();
  }

  async ensureSchema(): Promise<void> {
    return;
  }

  async getUserByEmail(email: string): Promise<UserRow | null> {
    const target = email.trim().toLowerCase();
    for (const row of this.data.users.values()) {
      if (row.email.toLowerCase() === target && row.active === "true") {
        return immutableClone(row);
      }
    }
    return null;
  }

  async listUsers(): Promise<UserRow[]> {
    return [...this.data.users.values()].map((row) => immutableClone(row));
  }

  async listJobsForUser(user: SessionUser): Promise<JobRow[]> {
    return [...this.data.jobs.values()].filter((job) => canReadJob(user, job)).map((job) => immutableClone(job));
  }

  async getJob(jobUid: string): Promise<JobRow | null> {
    const job = this.data.jobs.get(jobUid);
    return job ? immutableClone(job) : null;
  }

  async updateJobStatus(args: {
    jobUid: string;
    status: JobRow["status"];
    expectedRowVersion: number;
    ctx: { correlationId: string; actorUserUid: string };
  }): Promise<{ job: JobRow; conflict: ConflictPayload | null }> {
    const current = this.data.jobs.get(args.jobUid);
    if (!current) {
      throw new Error(`Unknown job ${args.jobUid}`);
    }

    if (current.row_version !== args.expectedRowVersion) {
      return {
        job: immutableClone(current),
        conflict: toConflict(current, args.expectedRowVersion)
      };
    }

    if (!canTransitionStatus(current.status, args.status)) {
      throw new Error(`Invalid status transition from ${current.status} to ${args.status}`);
    }

    const updated: JobRow = {
      ...current,
      status: args.status,
      ...bumpMutableMeta(current, args.ctx.actorUserUid, args.ctx.correlationId)
    };

    this.data.jobs.set(updated.job_uid, updated);
    const event = stampEvent({
      jobUid: updated.job_uid,
      eventType: "status_changed",
      payload: { from: current.status, to: args.status },
      ctx: args.ctx
    });
    this.data.jobEvents.set(event.event_uid, event);

    return {
      job: immutableClone(updated),
      conflict: null
    };
  }

  async appendJobNote(args: {
    jobUid: string;
    note: string;
    expectedRowVersion: number;
    ctx: { correlationId: string; actorUserUid: string };
  }): Promise<{ job: JobRow; conflict: ConflictPayload | null }> {
    const current = this.data.jobs.get(args.jobUid);
    if (!current) {
      throw new Error(`Unknown job ${args.jobUid}`);
    }

    if (current.row_version !== args.expectedRowVersion) {
      return {
        job: immutableClone(current),
        conflict: toConflict(current, args.expectedRowVersion)
      };
    }

    const updated: JobRow = {
      ...current,
      last_note: args.note,
      ...bumpMutableMeta(current, args.ctx.actorUserUid, args.ctx.correlationId)
    };

    this.data.jobs.set(updated.job_uid, updated);
    const event = stampEvent({
      jobUid: updated.job_uid,
      eventType: "note_added",
      payload: { note: args.note },
      ctx: args.ctx
    });
    this.data.jobEvents.set(event.event_uid, event);

    return {
      job: immutableClone(updated),
      conflict: null
    };
  }

  async appendJobEvent(event: JobEventRow): Promise<void> {
    this.data.jobEvents.set(event.event_uid, immutableClone(event));
  }

  async createScheduleRequest(row: ScheduleRequestRow): Promise<void> {
    this.data.scheduleRequests.set(row.request_uid, immutableClone(row));
  }

  async getScheduleRequest(requestUid: string): Promise<ScheduleRequestRow | null> {
    const row = this.data.scheduleRequests.get(requestUid);
    return row ? immutableClone(row) : null;
  }

  async upsertScheduleRequest(row: ScheduleRequestRow): Promise<void> {
    this.data.scheduleRequests.set(row.request_uid, immutableClone(row));
  }

  async createSchedule(row: ScheduleRow): Promise<void> {
    this.data.schedules.set(row.schedule_uid, immutableClone(row));
  }

  async getSchedule(scheduleUid: string): Promise<ScheduleRow | null> {
    const row = this.data.schedules.get(scheduleUid);
    return row ? immutableClone(row) : null;
  }

  async upsertSchedule(row: ScheduleRow): Promise<void> {
    this.data.schedules.set(row.schedule_uid, immutableClone(row));
  }

  async createDocument(row: JobDocumentRow): Promise<void> {
    this.data.documents.set(row.document_uid, immutableClone(row));
  }

  async getDocument(documentUid: string): Promise<JobDocumentRow | null> {
    const row = this.data.documents.get(documentUid);
    return row ? immutableClone(row) : null;
  }

  async upsertDocument(row: JobDocumentRow): Promise<void> {
    this.data.documents.set(row.document_uid, immutableClone(row));
  }

  async listDocuments(jobUid?: string): Promise<JobDocumentRow[]> {
    return [...this.data.documents.values()]
      .filter((document) => !jobUid || document.job_uid === jobUid)
      .map((document) => immutableClone(document));
  }

  async appendAudit(args: {
    action: string;
    payload: Record<string, unknown>;
    ctx: { correlationId: string; actorUserUid: string };
  }): Promise<void> {
    this.data.audits.push({
      audit_uid: `AUD-${crypto.randomUUID()}`,
      action: args.action,
      payload_json: JSON.stringify(args.payload),
      actor_user_uid: args.ctx.actorUserUid,
      correlation_id: args.ctx.correlationId,
      at: nowIso()
    });
  }

  async listAudits(): Promise<Array<Record<string, string>>> {
    return this.data.audits.map((audit) => ({ ...audit }));
  }

  async upsertAutomationJob(row: AutomationJobRow): Promise<void> {
    this.data.automationJobs.set(row.automation_job_uid, immutableClone(row));
  }

  async getAutomationJob(automationJobUid: string): Promise<AutomationJobRow | null> {
    const row = this.data.automationJobs.get(automationJobUid);
    return row ? immutableClone(row) : null;
  }

  async upsertSyncQueue(row: SyncQueueRow): Promise<void> {
    this.data.syncQueue.set(row.mutation_uid, immutableClone(row));
  }

  async getSyncQueue(mutationUid: string): Promise<SyncQueueRow | null> {
    const row = this.data.syncQueue.get(mutationUid);
    return row ? immutableClone(row) : null;
  }

  async listSyncQueueByJob(jobUid: string): Promise<SyncQueueRow[]> {
    return [...this.data.syncQueue.values()]
      .filter((row) => row.job_uid === jobUid)
      .map((row) => immutableClone(row));
  }

  async applySyncMutations(args: {
    actor: SessionUser;
    mutations: SyncMutation[];
    ctx: { correlationId: string; actorUserUid: string };
  }): Promise<SyncPushResult> {
    const result: SyncPushResult = {
      applied: [],
      conflicts: [],
      failed: []
    };

    for (const mutation of args.mutations) {
      const existingQueue = this.data.syncQueue.get(mutation.mutation_id);
      if (existingQueue?.status === "applied") {
        const job = this.data.jobs.get(mutation.job_uid);
        result.applied.push({
          mutation_id: mutation.mutation_id,
          job_uid: mutation.job_uid,
          row_version: job?.row_version ?? 0
        });
        continue;
      }

      const job = this.data.jobs.get(mutation.job_uid);
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

      try {
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

        const updated: JobRow = {
          ...job,
          ...bumpMutableMeta(job, args.ctx.actorUserUid, args.ctx.correlationId)
        };
        this.data.jobs.set(updated.job_uid, updated);

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
          row_version: updated.row_version
        });
      } catch (error) {
        const typedError: ApiError = normalizeError(String(error), "sync_apply_failed");
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
    ctx: { correlationId: string; actorUserUid: string };
  }): Promise<{ job: JobRow; conflict: ConflictPayload | null }> {
    const job = this.data.jobs.get(args.jobUid);
    if (!job) {
      throw new Error(`Unknown job ${args.jobUid}`);
    }

    if (job.row_version !== args.serverRowVersion) {
      return {
        job: immutableClone(job),
        conflict: toConflict(job, args.clientRowVersion)
      };
    }

    if (args.strategy === "server") {
      return {
        job: immutableClone(job),
        conflict: null
      };
    }

    const patch = args.mergePatch ?? {};

    if (typeof patch.status === "string" && canTransitionStatus(job.status, patch.status as JobRow["status"])) {
      job.status = patch.status as JobRow["status"];
    }

    if (typeof patch.last_note === "string" && patch.last_note.trim() !== "") {
      job.last_note = patch.last_note;
    }

    const updated: JobRow = {
      ...job,
      ...bumpMutableMeta(job, args.ctx.actorUserUid, args.ctx.correlationId)
    };

    this.data.jobs.set(updated.job_uid, updated);

    return {
      job: immutableClone(updated),
      conflict: null
    };
  }

  async pullSyncData(args: { actor: SessionUser; since: string }): Promise<{ jobs: JobRow[]; queue: SyncQueueRow[] }> {
    const sinceTs = Date.parse(args.since);
    const jobs = [...this.data.jobs.values()]
      .filter((job) => canReadJob(args.actor, job))
      .filter((job) => Number.isNaN(sinceTs) || Date.parse(job.updated_at) >= sinceTs)
      .map((job) => immutableClone(job));

    const queue = [...this.data.syncQueue.values()]
      .filter((entry) => jobs.some((job) => job.job_uid === entry.job_uid))
      .map((entry) => immutableClone(entry));

    return { jobs, queue };
  }
}
