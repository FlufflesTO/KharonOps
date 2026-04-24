import type {
  AutomationJobRow,
  ConflictPayload,
  EscrowRow,
  FinanceDebtorRow,
  FinanceInvoiceRow,
  FinanceQuoteRow,
  FinanceStatementRow,
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
  ClientRow,
  PortalFileRow,
  SiteRow,
  TechnicianRow,
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

  async getJob(_jobid: string): Promise<JobRow | null> {
    return this.notImplemented("getJob");
  }

  async updateJobStatus(_args: {
    jobid: string;
    status: JobRow["status"];
    expectedRowVersion: number;
    ctx: StoreContext;
  }): Promise<{ job: JobRow; conflict: ConflictPayload | null }> {
    return this.notImplemented("updateJobStatus");
  }

  async appendJobNote(_args: {
    jobid: string;
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

  async getScheduleRequest(_requestid: string): Promise<ScheduleRequestRow | null> {
    return this.notImplemented("getScheduleRequest");
  }

  async listScheduleRequests(_jobid?: string): Promise<ScheduleRequestRow[]> {
    return this.notImplemented("listScheduleRequests");
  }

  async upsertScheduleRequest(_row: ScheduleRequestRow): Promise<void> {
    this.notImplemented("upsertScheduleRequest");
  }

  async createSchedule(_row: ScheduleRow): Promise<void> {
    this.notImplemented("createSchedule");
  }

  async getSchedule(_scheduleid: string): Promise<ScheduleRow | null> {
    return this.notImplemented("getSchedule");
  }

  async listSchedules(_jobid?: string): Promise<ScheduleRow[]> {
    return this.notImplemented("listSchedules");
  }

  async upsertSchedule(_row: ScheduleRow): Promise<void> {
    this.notImplemented("upsertSchedule");
  }

  async createDocument(_row: JobDocumentRow): Promise<void> {
    this.notImplemented("createDocument");
  }

  async getDocument(_documentid: string): Promise<JobDocumentRow | null> {
    return this.notImplemented("getDocument");
  }

  async upsertDocument(_row: JobDocumentRow): Promise<void> {
    this.notImplemented("upsertDocument");
  }

  async listDocuments(_jobid?: string): Promise<JobDocumentRow[]> {
    return this.notImplemented("listDocuments");
  }

  async listSites(): Promise<SiteRow[]> {
    return this.notImplemented("listSites");
  }

  async listPortalFiles(_jobid?: string): Promise<PortalFileRow[]> {
    return this.notImplemented("listPortalFiles");
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

  async getAutomationJob(_automationJobid: string): Promise<AutomationJobRow | null> {
    return this.notImplemented("getAutomationJob");
  }

  async listAutomationJobs(): Promise<AutomationJobRow[]> {
    return this.notImplemented("listAutomationJobs");
  }

  async upsertSyncQueue(_row: SyncQueueRow): Promise<void> {
    this.notImplemented("upsertSyncQueue");
  }

  async getSyncQueue(_mutationid: string): Promise<SyncQueueRow | null> {
    return this.notImplemented("getSyncQueue");
  }

  async listSyncQueueByJob(_jobid: string): Promise<SyncQueueRow[]> {
    return this.notImplemented("listSyncQueueByJob");
  }

  async listJobEventsByJob(_jobid: string): Promise<JobEventRow[]> {
    return this.notImplemented("listJobEventsByJob");
  }

  async listUsers(): Promise<UserRow[]> {
    return this.notImplemented("listUsers");
  }

  async listClients(): Promise<ClientRow[]> { return this.notImplemented("listClients"); }
  async listTechnicians(): Promise<TechnicianRow[]> { return this.notImplemented("listTechnicians"); }

  async listFinanceQuotes(): Promise<FinanceQuoteRow[]> {
    return this.notImplemented("listFinanceQuotes");
  }

  async createFinanceQuote(_row: FinanceQuoteRow): Promise<void> {
    this.notImplemented("createFinanceQuote");
  }

  async updateFinanceQuoteStatus(_args: {
    quote_id: string;
    status: FinanceQuoteRow["status"];
    ctx: StoreContext;
  }): Promise<FinanceQuoteRow | null> {
    return this.notImplemented("updateFinanceQuoteStatus");
  }

  async listFinanceInvoices(): Promise<FinanceInvoiceRow[]> {
    return this.notImplemented("listFinanceInvoices");
  }

  async createFinanceInvoice(_row: FinanceInvoiceRow): Promise<void> {
    this.notImplemented("createFinanceInvoice");
  }

  async updateFinanceInvoice(_row: FinanceInvoiceRow): Promise<void> {
    this.notImplemented("updateFinanceInvoice");
  }

  async listFinanceStatements(): Promise<FinanceStatementRow[]> {
    return this.notImplemented("listFinanceStatements");
  }

  async replaceFinanceStatements(_rows: FinanceStatementRow[]): Promise<void> {
    this.notImplemented("replaceFinanceStatements");
  }

  async listFinanceDebtors(): Promise<FinanceDebtorRow[]> {
    return this.notImplemented("listFinanceDebtors");
  }

  async replaceFinanceDebtors(_rows: FinanceDebtorRow[]): Promise<void> {
    this.notImplemented("replaceFinanceDebtors");
  }

  async listEscrowRows(): Promise<EscrowRow[]> {
    return this.notImplemented("listEscrowRows");
  }

  async getEscrowByDocument(_document_id: string): Promise<EscrowRow | null> {
    return this.notImplemented("getEscrowByDocument");
  }

  async upsertEscrow(_row: EscrowRow): Promise<void> {
    this.notImplemented("upsertEscrow");
  }

  async listSkillMatrix(): Promise<SkillMatrixRow[]> {
    return this.notImplemented("listSkillMatrix");
  }

  async upsertSkillMatrix(_row: SkillMatrixRow): Promise<void> {
    this.notImplemented("upsertSkillMatrix");
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
    jobid: string;
    strategy: "server" | "client" | "merge";
    serverRowVersion: number;
    clientRowVersion: number;
    mergePatch?: Record<string, unknown>;
    ctx: StoreContext;
  }): Promise<{ job: JobRow; conflict: ConflictPayload | null }> {
    return this.notImplemented("resolveSyncConflict");
  }

}
