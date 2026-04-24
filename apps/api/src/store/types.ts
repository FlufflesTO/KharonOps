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
  SiteRow,
  PortalFileRow,
  UserRow
} from "@kharon/domain";

export interface StoreContext {
  correlationId: string;
  actorUserid: string;
}

export interface WorkbookStore {
  ensureSchema(): Promise<void>;
  getUserByEmail(email: string): Promise<UserRow | null>;
  listJobsForUser(user: SessionUser): Promise<JobRow[]>;
  getJob(jobid: string): Promise<JobRow | null>;
  updateJobStatus(args: {
    jobid: string;
    status: JobRow["status"];
    expectedRowVersion: number;
    ctx: StoreContext;
  }): Promise<{ job: JobRow; conflict: ConflictPayload | null }>;
  appendJobNote(args: {
    jobid: string;
    note: string;
    expectedRowVersion: number;
    ctx: StoreContext;
  }): Promise<{ job: JobRow; conflict: ConflictPayload | null }>;
  appendJobEvent(event: JobEventRow): Promise<void>;
  createScheduleRequest(row: ScheduleRequestRow): Promise<void>;
  getScheduleRequest(requestid: string): Promise<ScheduleRequestRow | null>;
  listScheduleRequests(jobid?: string): Promise<ScheduleRequestRow[]>;
  upsertScheduleRequest(row: ScheduleRequestRow): Promise<void>;
  createSchedule(row: ScheduleRow): Promise<void>;
  getSchedule(scheduleid: string): Promise<ScheduleRow | null>;
  listSchedules(jobid?: string): Promise<ScheduleRow[]>;
  upsertSchedule(row: ScheduleRow): Promise<void>;
  createDocument(row: JobDocumentRow): Promise<void>;
  getDocument(documentid: string): Promise<JobDocumentRow | null>;
  upsertDocument(row: JobDocumentRow): Promise<void>;
  listDocuments(jobid?: string): Promise<JobDocumentRow[]>;
  listSites(): Promise<SiteRow[]>;
  listPortalFiles(jobid?: string): Promise<PortalFileRow[]>;
  appendAudit(args: {
    action: string;
    payload: Record<string, unknown>;
    ctx: StoreContext;
    entry_type?: string;
  }): Promise<void>;
  listAudits(): Promise<Array<Record<string, string>>>;
  upsertAutomationJob(row: AutomationJobRow): Promise<void>;
  getAutomationJob(automationJobid: string): Promise<AutomationJobRow | null>;
  listAutomationJobs(): Promise<AutomationJobRow[]>;
  upsertSyncQueue(row: SyncQueueRow): Promise<void>;
  getSyncQueue(mutationid: string): Promise<SyncQueueRow | null>;
  listSyncQueueByJob(jobid: string): Promise<SyncQueueRow[]>;
  listJobEventsByJob(jobid: string): Promise<JobEventRow[]>;
  listUsers(): Promise<UserRow[]>;
  listClients(): Promise<ClientRow[]>;
  listTechnicians(): Promise<TechnicianRow[]>;
  listFinanceQuotes(): Promise<FinanceQuoteRow[]>;
  createFinanceQuote(row: FinanceQuoteRow): Promise<void>;
  updateFinanceQuoteStatus(args: {
    quote_id: string;
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
  getEscrowByDocument(document_id: string): Promise<EscrowRow | null>;
  upsertEscrow(row: EscrowRow): Promise<void>;
  listSkillMatrix(): Promise<SkillMatrixRow[]>;
  upsertSkillMatrix(row: SkillMatrixRow): Promise<void>;
  applySyncMutations(args: {
    actor: SessionUser;
    mutations: SyncMutation[];
    ctx: StoreContext;
  }): Promise<SyncPushResult>;
  resolveSyncConflict(args: {
    actor: SessionUser;
    jobid: string;
    strategy: "server" | "client" | "merge";
    serverRowVersion: number;
    clientRowVersion: number;
    mergePatch?: Record<string, unknown>;
    ctx: StoreContext;
  }): Promise<{ job: JobRow; conflict: ConflictPayload | null }>;
}
