import type {
  AutomationJobRow,
  ConflictPayload,
  DocumentType,
  JobDocumentRow,
  JobEventRow,
  JobRow,
  ScheduleRequestRow,
  ScheduleRow,
  SessionUser,
  SyncMutation,
  SyncPushResult,
  SyncQueueRow,
  UserRow
} from "@kharon/domain";

export interface StoreContext {
  correlationId: string;
  actorUserUid: string;
}

export interface WorkbookStore {
  ensureSchema(): Promise<void>;
  getUserByEmail(email: string): Promise<UserRow | null>;
  listJobsForUser(user: SessionUser): Promise<JobRow[]>;
  getJob(jobUid: string): Promise<JobRow | null>;
  updateJobStatus(args: {
    jobUid: string;
    status: JobRow["status"];
    expectedRowVersion: number;
    ctx: StoreContext;
  }): Promise<{ job: JobRow; conflict: ConflictPayload | null }>;
  appendJobNote(args: {
    jobUid: string;
    note: string;
    expectedRowVersion: number;
    ctx: StoreContext;
  }): Promise<{ job: JobRow; conflict: ConflictPayload | null }>;
  appendJobEvent(event: JobEventRow): Promise<void>;
  createScheduleRequest(row: ScheduleRequestRow): Promise<void>;
  getScheduleRequest(requestUid: string): Promise<ScheduleRequestRow | null>;
  upsertScheduleRequest(row: ScheduleRequestRow): Promise<void>;
  createSchedule(row: ScheduleRow): Promise<void>;
  getSchedule(scheduleUid: string): Promise<ScheduleRow | null>;
  upsertSchedule(row: ScheduleRow): Promise<void>;
  createDocument(row: JobDocumentRow): Promise<void>;
  getDocument(documentUid: string): Promise<JobDocumentRow | null>;
  upsertDocument(row: JobDocumentRow): Promise<void>;
  listDocuments(jobUid?: string): Promise<JobDocumentRow[]>;
  appendAudit(args: {
    action: string;
    payload: Record<string, unknown>;
    ctx: StoreContext;
    entry_type?: string;
  }): Promise<void>;
  listAudits(): Promise<Array<Record<string, string>>>;
  upsertAutomationJob(row: AutomationJobRow): Promise<void>;
  getAutomationJob(automationJobUid: string): Promise<AutomationJobRow | null>;
  upsertSyncQueue(row: SyncQueueRow): Promise<void>;
  getSyncQueue(mutationUid: string): Promise<SyncQueueRow | null>;
  listSyncQueueByJob(jobUid: string): Promise<SyncQueueRow[]>;
  listUsers(): Promise<UserRow[]>;
  applySyncMutations(args: {
    actor: SessionUser;
    mutations: SyncMutation[];
    ctx: StoreContext;
  }): Promise<SyncPushResult>;
  resolveSyncConflict(args: {
    actor: SessionUser;
    jobUid: string;
    strategy: "server" | "client" | "merge";
    serverRowVersion: number;
    clientRowVersion: number;
    mergePatch?: Record<string, unknown>;
    ctx: StoreContext;
  }): Promise<{ job: JobRow; conflict: ConflictPayload | null }>;
  pullSyncData(args: { actor: SessionUser; since: string }): Promise<{ jobs: JobRow[]; queue: SyncQueueRow[] }>;
}
