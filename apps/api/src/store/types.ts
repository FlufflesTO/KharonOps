import type {
  AutomationJobRow,
  EscrowRow,
  FinanceDebtorRow,
  FinanceInvoiceRow,
  FinanceQuoteRow,
  FinanceStatementRow,
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
  SkillMatrixRow,
  TechnicianRow,
  ClientRow,
  UpgradeWorkspaceState,
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
  listScheduleRequests(jobUid?: string): Promise<ScheduleRequestRow[]>;
  upsertScheduleRequest(row: ScheduleRequestRow): Promise<void>;
  createSchedule(row: ScheduleRow): Promise<void>;
  getSchedule(scheduleUid: string): Promise<ScheduleRow | null>;
  listSchedules(jobUid?: string): Promise<ScheduleRow[]>;
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
  listAutomationJobs(): Promise<AutomationJobRow[]>;
  upsertSyncQueue(row: SyncQueueRow): Promise<void>;
  getSyncQueue(mutationUid: string): Promise<SyncQueueRow | null>;
  listSyncQueueByJob(jobUid: string): Promise<SyncQueueRow[]>;
  listUsers(): Promise<UserRow[]>;
  listClients(): Promise<ClientRow[]>;
  listTechnicians(): Promise<TechnicianRow[]>;
  listFinanceQuotes(): Promise<FinanceQuoteRow[]>;
  createFinanceQuote(row: FinanceQuoteRow): Promise<void>;
  updateFinanceQuoteStatus(args: {
    quote_uid: string;
    status: FinanceQuoteRow["status"];
    ctx: StoreContext;
  }): Promise<FinanceQuoteRow | null>;
  listFinanceInvoices(): Promise<FinanceInvoiceRow[]>;
  createFinanceInvoice(row: FinanceInvoiceRow): Promise<void>;
  updateFinanceInvoice(row: FinanceInvoiceRow): Promise<void>;
  listFinanceStatements(): Promise<FinanceStatementRow[]>;
  replaceFinanceStatements(rows: FinanceStatementRow[]): Promise<void>;
  listFinanceDebtors(): Promise<FinanceDebtorRow[]>;
  replaceFinanceDebtors(rows: FinanceDebtorRow[]): Promise<void>;
  listEscrowRows(): Promise<EscrowRow[]>;
  getEscrowByDocument(document_uid: string): Promise<EscrowRow | null>;
  upsertEscrow(row: EscrowRow): Promise<void>;
  listSkillMatrix(): Promise<SkillMatrixRow[]>;
  upsertSkillMatrix(row: SkillMatrixRow): Promise<void>;
  getUpgradeWorkspaceState(): Promise<UpgradeWorkspaceState>;
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
