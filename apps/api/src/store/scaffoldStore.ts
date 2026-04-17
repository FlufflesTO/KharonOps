import type {
  AutomationJobRow,
  ConflictPayload,
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
import type { StoreContext, WorkbookStore } from "./types.js";

export abstract class ScaffoldWorkbookStore implements WorkbookStore {
  protected abstract readonly label: string;

  protected notImplemented(method: string): never {
    throw new Error(`${this.label} is scaffolded only. ${method} is not implemented yet.`);
  }

  async ensureSchema(): Promise<void> {
    this.notImplemented("ensureSchema");
  }

  async getUserByEmail(_email: string): Promise<UserRow | null> {
    return this.notImplemented("getUserByEmail");
  }

  async listJobsForUser(_user: SessionUser): Promise<JobRow[]> {
    return this.notImplemented("listJobsForUser");
  }

  async getJob(_jobUid: string): Promise<JobRow | null> {
    return this.notImplemented("getJob");
  }

  async updateJobStatus(_args: {
    jobUid: string;
    status: JobRow["status"];
    expectedRowVersion: number;
    ctx: StoreContext;
  }): Promise<{ job: JobRow; conflict: ConflictPayload | null }> {
    return this.notImplemented("updateJobStatus");
  }

  async appendJobNote(_args: {
    jobUid: string;
    note: string;
    expectedRowVersion: number;
    ctx: StoreContext;
  }): Promise<{ job: JobRow; conflict: ConflictPayload | null }> {
    return this.notImplemented("appendJobNote");
  }

  async appendJobEvent(_event: JobEventRow): Promise<void> {
    this.notImplemented("appendJobEvent");
  }

  async createScheduleRequest(_row: ScheduleRequestRow): Promise<void> {
    this.notImplemented("createScheduleRequest");
  }

  async getScheduleRequest(_requestUid: string): Promise<ScheduleRequestRow | null> {
    return this.notImplemented("getScheduleRequest");
  }

  async listScheduleRequests(_jobUid?: string): Promise<ScheduleRequestRow[]> {
    return this.notImplemented("listScheduleRequests");
  }

  async upsertScheduleRequest(_row: ScheduleRequestRow): Promise<void> {
    this.notImplemented("upsertScheduleRequest");
  }

  async createSchedule(_row: ScheduleRow): Promise<void> {
    this.notImplemented("createSchedule");
  }

  async getSchedule(_scheduleUid: string): Promise<ScheduleRow | null> {
    return this.notImplemented("getSchedule");
  }

  async listSchedules(_jobUid?: string): Promise<ScheduleRow[]> {
    return this.notImplemented("listSchedules");
  }

  async upsertSchedule(_row: ScheduleRow): Promise<void> {
    this.notImplemented("upsertSchedule");
  }

  async createDocument(_row: JobDocumentRow): Promise<void> {
    this.notImplemented("createDocument");
  }

  async getDocument(_documentUid: string): Promise<JobDocumentRow | null> {
    return this.notImplemented("getDocument");
  }

  async upsertDocument(_row: JobDocumentRow): Promise<void> {
    this.notImplemented("upsertDocument");
  }

  async listDocuments(_jobUid?: string): Promise<JobDocumentRow[]> {
    return this.notImplemented("listDocuments");
  }

  async appendAudit(_args: { action: string; payload: Record<string, unknown>; ctx: StoreContext }): Promise<void> {
    this.notImplemented("appendAudit");
  }

  async listAudits(): Promise<Array<Record<string, string>>> {
    return this.notImplemented("listAudits");
  }

  async upsertAutomationJob(_row: AutomationJobRow): Promise<void> {
    this.notImplemented("upsertAutomationJob");
  }

  async getAutomationJob(_automationJobUid: string): Promise<AutomationJobRow | null> {
    return this.notImplemented("getAutomationJob");
  }

  async listAutomationJobs(): Promise<AutomationJobRow[]> {
    return this.notImplemented("listAutomationJobs");
  }

  async upsertSyncQueue(_row: SyncQueueRow): Promise<void> {
    this.notImplemented("upsertSyncQueue");
  }

  async getSyncQueue(_mutationUid: string): Promise<SyncQueueRow | null> {
    return this.notImplemented("getSyncQueue");
  }

  async listSyncQueueByJob(_jobUid: string): Promise<SyncQueueRow[]> {
    return this.notImplemented("listSyncQueueByJob");
  }

  async listUsers(): Promise<UserRow[]> {
    return this.notImplemented("listUsers");
  }

  async applySyncMutations(_args: {
    actor: SessionUser;
    mutations: SyncMutation[];
    ctx: StoreContext;
  }): Promise<SyncPushResult> {
    return this.notImplemented("applySyncMutations");
  }

  async resolveSyncConflict(_args: {
    actor: SessionUser;
    jobUid: string;
    strategy: "server" | "client" | "merge";
    serverRowVersion: number;
    clientRowVersion: number;
    mergePatch?: Record<string, unknown>;
    ctx: StoreContext;
  }): Promise<{ job: JobRow; conflict: ConflictPayload | null }> {
    return this.notImplemented("resolveSyncConflict");
  }

  async pullSyncData(_args: { actor: SessionUser; since: string }): Promise<{ jobs: JobRow[]; queue: SyncQueueRow[] }> {
    return this.notImplemented("pullSyncData");
  }
}
