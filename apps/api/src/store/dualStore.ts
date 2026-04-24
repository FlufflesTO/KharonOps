import type { StoreBackend } from "../config.js";
import type { WorkbookStore } from "./types.js";
import {
  compareRecords,
  log,
  resolveConflict,
  retryWithBackoff,
  type ConflictResolutionStrategy,
  type ConsistencyDiscrepancy,
  type ConsistencyReport
} from "./dual/ops.js";

// ---------------------------------------------------------------------------
// Dual-write configuration
// ---------------------------------------------------------------------------

export interface DualWorkbookStoreConfig {
  primaryBackend: Exclude<StoreBackend, "dual">;
  mirrorBackend: Exclude<StoreBackend, "dual">;
}

interface DualStoreRuntimeConfig {
  primaryBackend: Exclude<StoreBackend, "dual">;
  mirrorBackend: Exclude<StoreBackend, "dual">;
  /** If true, throw on primary write failure (default: false). */
  strictPrimary: boolean;
  /** If true, verify consistency after each write (default: true). */
  verifyWrites: boolean;
  /** Maximum number of retries for mirror writes (default: 3). */
  mirrorRetryCount: number;
  /** Delay in ms between mirror retries (default: 100). */
  mirrorRetryDelayMs: number;
}

// ---------------------------------------------------------------------------
// Consistency checker
// ---------------------------------------------------------------------------

import {
  type AutomationJobRow,
  type ConflictPayload,
  type EscrowRow,
  type FinanceDebtorRow,
  type FinanceInvoiceRow,
  type FinanceQuoteRow,
  type FinanceStatementRow,
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
import type { StoreContext } from "./types.js";

// ---------------------------------------------------------------------------
// DualWorkbookStore
// ---------------------------------------------------------------------------

/**
 * DualWorkbookStore implements a primary+mirror write strategy.
 *
 * - **Reads** always go to the primary backend.
 * - **Writes** go to primary first, then to mirror (with retries).
 * - **Consistency verification** optionally compares primary and mirror after writes.
 * - **Conflict resolution** uses the configured strategy when discrepancies are found.
 */
export class DualWorkbookStore implements WorkbookStore {
  protected readonly label: string;
  readonly config: DualStoreRuntimeConfig;

  private readonly primary: WorkbookStore;
  private readonly mirror: WorkbookStore;

  constructor(
    args: {
      config: DualWorkbookStoreConfig;
      createStore: (backend: Exclude<StoreBackend, "dual">) => WorkbookStore;
      options?: Partial<DualStoreRuntimeConfig>;
    }
  ) {
    this.config = {
      primaryBackend: args.config.primaryBackend,
      mirrorBackend: args.config.mirrorBackend,
      strictPrimary: args.options?.strictPrimary ?? false,
      verifyWrites: args.options?.verifyWrites ?? true,
      mirrorRetryCount: args.options?.mirrorRetryCount ?? 3,
      mirrorRetryDelayMs: args.options?.mirrorRetryDelayMs ?? 100
    };

    this.label = `DualWorkbookStore(${this.config.primaryBackend}->${this.config.mirrorBackend})`;
    this.primary = args.createStore(this.config.primaryBackend);
    this.mirror = args.createStore(this.config.mirrorBackend);

    log("info", this.label, "DualWorkbookStore initialized", {
      primary: this.config.primaryBackend,
      mirror: this.config.mirrorBackend,
      strictPrimary: this.config.strictPrimary,
      verifyWrites: this.config.verifyWrites
    });
  }

  // -- Schema management ---------------------------------------------------

  async ensureSchema(): Promise<void> {
    await Promise.all([
      this.primary.ensureSchema().catch((err: unknown) => {
        log("error", this.label, "Primary ensureSchema failed", { error: String(err) });
        throw err;
      }),
      this.mirror.ensureSchema().catch((err: unknown) => {
        log("warn", this.label, "Mirror ensureSchema failed (non-fatal)", { error: String(err) });
      })
    ]);
  }

  // -- User operations -----------------------------------------------------

  async getUserByEmail(email: string): Promise<UserRow | null> {
    return this.executeReadOperation(
      `getUserByEmail(${email})`,
      () => this.primary.getUserByEmail(email),
      () => this.mirror.getUserByEmail(email)
    );
  }

  async listUsers(): Promise<UserRow[]> {
    return this.executeReadOperation(
      "listUsers",
      () => this.primary.listUsers(),
      () => this.mirror.listUsers()
    );
  }

  async listClients(): Promise<ClientRow[]> {
    return this.executeReadOperation(
      "listClients",
      () => this.primary.listClients(),
      () => this.mirror.listClients()
    );
  }

  async listTechnicians(): Promise<TechnicianRow[]> {
    return this.executeReadOperation(
      "listTechnicians",
      () => this.primary.listTechnicians(),
      () => this.mirror.listTechnicians()
    );
  }

  async listFinanceQuotes(): Promise<FinanceQuoteRow[]> {
    return this.executeReadOperation(
      "listFinanceQuotes",
      () => this.primary.listFinanceQuotes(),
      () => this.mirror.listFinanceQuotes()
    );
  }

  async createFinanceQuote(row: FinanceQuoteRow): Promise<void> {
    await this.primary.createFinanceQuote(row);
    await this._mirrorWrite("createFinanceQuote", row.quote_id, () => this.mirror.createFinanceQuote(row));
  }

  async updateFinanceQuoteStatus(args: {
    quote_id: string;
    status: FinanceQuoteRow["status"];
    ctx: StoreContext;
  }): Promise<FinanceQuoteRow | null> {
    const result = await this.primary.updateFinanceQuoteStatus(args);
    await this._mirrorWrite("updateFinanceQuoteStatus", args.quote_id, () => this.mirror.updateFinanceQuoteStatus(args));
    return result;
  }

  async listFinanceInvoices(): Promise<FinanceInvoiceRow[]> {
    return this.executeReadOperation(
      "listFinanceInvoices",
      () => this.primary.listFinanceInvoices(),
      () => this.mirror.listFinanceInvoices()
    );
  }

  async createFinanceInvoice(row: FinanceInvoiceRow): Promise<void> {
    await this.primary.createFinanceInvoice(row);
    await this._mirrorWrite("createFinanceInvoice", row.invoice_id, () => this.mirror.createFinanceInvoice(row));
  }

  async updateFinanceInvoice(row: FinanceInvoiceRow): Promise<void> {
    await this.primary.updateFinanceInvoice(row);
    await this._mirrorWrite("updateFinanceInvoice", row.invoice_id, () => this.mirror.updateFinanceInvoice(row));
  }

  async listFinanceStatements(): Promise<FinanceStatementRow[]> {
    return this.executeReadOperation(
      "listFinanceStatements",
      () => this.primary.listFinanceStatements(),
      () => this.mirror.listFinanceStatements()
    );
  }

  async replaceFinanceStatements(rows: FinanceStatementRow[]): Promise<void> {
    await this.primary.replaceFinanceStatements(rows);
    await this._mirrorWrite("replaceFinanceStatements", `rows:${rows.length}`, () => this.mirror.replaceFinanceStatements(rows));
  }

  async listFinanceDebtors(): Promise<FinanceDebtorRow[]> {
    return this.executeReadOperation(
      "listFinanceDebtors",
      () => this.primary.listFinanceDebtors(),
      () => this.mirror.listFinanceDebtors()
    );
  }

  async replaceFinanceDebtors(rows: FinanceDebtorRow[]): Promise<void> {
    await this.primary.replaceFinanceDebtors(rows);
    await this._mirrorWrite("replaceFinanceDebtors", `rows:${rows.length}`, () => this.mirror.replaceFinanceDebtors(rows));
  }

  async listEscrowRows(): Promise<EscrowRow[]> {
    return this.executeReadOperation(
      "listEscrowRows",
      () => this.primary.listEscrowRows(),
      () => this.mirror.listEscrowRows()
    );
  }

  async getEscrowByDocument(document_id: string): Promise<EscrowRow | null> {
    return this.executeReadOperation(
      `getEscrowByDocument(${document_id})`,
      () => this.primary.getEscrowByDocument(document_id),
      () => this.mirror.getEscrowByDocument(document_id)
    );
  }

  async upsertEscrow(row: EscrowRow): Promise<void> {
    await this.primary.upsertEscrow(row);
    await this._mirrorWrite("upsertEscrow", row.document_id, () => this.mirror.upsertEscrow(row));
  }

  async listSkillMatrix(): Promise<SkillMatrixRow[]> {
    return this.primary.listSkillMatrix();
  }

  async upsertSkillMatrix(row: SkillMatrixRow): Promise<void> {
    await this.primary.upsertSkillMatrix(row);
    await this._mirrorWrite("upsertSkillMatrix", row.user_id, () => this.mirror.upsertSkillMatrix(row));
  }

  // -- Job operations ------------------------------------------------------

  /**
   * Execute a read operation with fallback to mirror if primary fails
   */
  private async executeReadOperation<T>(
    operationName: string,
    primaryOperation: () => Promise<T>,
    mirrorOperation: () => Promise<T>
  ): Promise<T> {
    try {
      return await primaryOperation();
    } catch (primaryError) {
      console.warn(`Primary store failed for ${operationName}, falling back to mirror`, primaryError);
      try {
        return await mirrorOperation();
      } catch (mirrorError) {
        console.error(`Both primary and mirror failed for ${operationName}`, { 
          primaryError: (primaryError as Error).message, 
          mirrorError: (mirrorError as Error).message 
        });
        throw primaryError; // Throw the primary error as it occurred first
      }
    }
  }

  async listJobsForUser(user: SessionUser): Promise<JobRow[]> {
    return this.executeReadOperation(
      "listJobsForUser",
      () => this.primary.listJobsForUser(user),
      () => this.mirror.listJobsForUser(user)
    );
  }

  async getJob(jobid: string): Promise<JobRow | null> {
    return this.executeReadOperation(
      `getJob(${jobid})`,
      () => this.primary.getJob(jobid),
      () => this.mirror.getJob(jobid)
    );
  }

  async updateJobStatus(args: {
    jobid: string;
    status: JobRow["status"];
    expectedRowVersion: number;
    ctx: StoreContext;
  }): Promise<{ job: JobRow; conflict: ConflictPayload | null }> {
    const primaryResult = await this.primary.updateJobStatus(args);

    await this._mirrorWrite(
      "updateJobStatus",
      args.jobid,
      () => this.mirror.updateJobStatus(args)
    );

    if (this.config.verifyWrites && primaryResult.conflict === null) {
      await this._verifyJobConsistency(args.jobid);
    }

    return primaryResult;
  }

  async appendJobNote(args: {
    jobid: string;
    note: string;
    expectedRowVersion: number;
    ctx: StoreContext;
  }): Promise<{ job: JobRow; conflict: ConflictPayload | null }> {
    const primaryResult = await this.primary.appendJobNote(args);

    await this._mirrorWrite(
      "appendJobNote",
      args.jobid,
      () => this.mirror.appendJobNote(args)
    );

    if (this.config.verifyWrites && primaryResult.conflict === null) {
      await this._verifyJobConsistency(args.jobid);
    }

    return primaryResult;
  }

  async appendJobEvent(event: JobEventRow): Promise<void> {
    await this.primary.appendJobEvent(event);
    await this._mirrorWrite(
      "appendJobEvent",
      event.job_id,
      () => this.mirror.appendJobEvent(event)
    );
  }

  // Add fallback to other read operations
  async getDocument(documentid: string): Promise<JobDocumentRow | null> {
    return this.executeReadOperation(
      `getDocument(${documentid})`,
      () => this.primary.getDocument(documentid),
      () => this.mirror.getDocument(documentid)
    );
  }

  async listDocuments(jobid?: string): Promise<JobDocumentRow[]> {
    return this.executeReadOperation(
      "listDocuments",
      () => this.primary.listDocuments(jobid),
      () => this.mirror.listDocuments(jobid)
    );
  }

  async getSchedule(scheduleid: string): Promise<ScheduleRow | null> {
    return this.executeReadOperation(
      `getSchedule(${scheduleid})`,
      () => this.primary.getSchedule(scheduleid),
      () => this.mirror.getSchedule(scheduleid)
    );
  }

  async listSchedules(jobid?: string): Promise<ScheduleRow[]> {
    return this.executeReadOperation(
      "listSchedules",
      () => this.primary.listSchedules(jobid),
      () => this.mirror.listSchedules(jobid)
    );
  }

  // Add similar fallbacks for other read operations as needed...

  // -- Schedule operations -------------------------------------------------

  async createScheduleRequest(row: ScheduleRequestRow): Promise<void> {
    await this.primary.createScheduleRequest(row);
    await this._mirrorWrite(
      "createScheduleRequest",
      row.request_id,
      () => this.mirror.createScheduleRequest(row)
    );
  }

  async getScheduleRequest(requestid: string): Promise<ScheduleRequestRow | null> {
    return this.primary.getScheduleRequest(requestid);
  }

  async listScheduleRequests(jobid?: string): Promise<ScheduleRequestRow[]> {
    return this.primary.listScheduleRequests(jobid);
  }

  async upsertScheduleRequest(row: ScheduleRequestRow): Promise<void> {
    await this.primary.upsertScheduleRequest(row);
    await this._mirrorWrite(
      "upsertScheduleRequest",
      row.request_id,
      () => this.mirror.upsertScheduleRequest(row)
    );
  }

  async createSchedule(row: ScheduleRow): Promise<void> {
    await this.primary.createSchedule(row);
    await this._mirrorWrite(
      "createSchedule",
      row.schedule_id,
      () => this.mirror.createSchedule(row)
    );
  }

  async upsertSchedule(row: ScheduleRow): Promise<void> {
    await this.primary.upsertSchedule(row);
    await this._mirrorWrite(
      "upsertSchedule",
      row.schedule_id,
      () => this.mirror.upsertSchedule(row)
    );
  }

  // -- Document operations -------------------------------------------------

  async createDocument(row: JobDocumentRow): Promise<void> {
    await this.primary.createDocument(row);
    await this._mirrorWrite(
      "createDocument",
      row.document_id,
      () => this.mirror.createDocument(row)
    );
  }

  async upsertDocument(row: JobDocumentRow): Promise<void> {
    await this.primary.upsertDocument(row);
    await this._mirrorWrite(
      "upsertDocument",
      row.document_id,
      () => this.mirror.upsertDocument(row)
    );
  }

  // -- Audit operations ----------------------------------------------------

  async appendAudit(args: {
    action: string;
    payload: Record<string, unknown>;
    ctx: StoreContext;
    entry_type?: string;
  }): Promise<void> {
    await this.primary.appendAudit(args);
    await this._mirrorWrite(
      "appendAudit",
      args.ctx.correlationId,
      () => this.mirror.appendAudit(args)
    );
  }

  async listAudits(): Promise<Array<Record<string, string>>> {
    return this.primary.listAudits();
  }

  // -- Automation job operations -------------------------------------------

  async upsertAutomationJob(row: AutomationJobRow): Promise<void> {
    await this.primary.upsertAutomationJob(row);
    await this._mirrorWrite(
      "upsertAutomationJob",
      row.automation_job_id,
      () => this.mirror.upsertAutomationJob(row)
    );
  }

  async getAutomationJob(automationJobid: string): Promise<AutomationJobRow | null> {
    return this.primary.getAutomationJob(automationJobid);
  }

  async listAutomationJobs(): Promise<AutomationJobRow[]> {
    return this.primary.listAutomationJobs();
  }

  // -- Sync queue operations -----------------------------------------------

  async upsertSyncQueue(row: SyncQueueRow): Promise<void> {
    await this.primary.upsertSyncQueue(row);
    await this._mirrorWrite(
      "upsertSyncQueue",
      row.mutation_id,
      () => this.mirror.upsertSyncQueue(row)
    );
  }

  async getSyncQueue(mutationid: string): Promise<SyncQueueRow | null> {
    return this.primary.getSyncQueue(mutationid);
  }

  async listSyncQueueByJob(jobid: string): Promise<SyncQueueRow[]> {
    return this.primary.listSyncQueueByJob(jobid);
  }

  async listJobEventsByJob(jobid: string): Promise<JobEventRow[]> {
    return this.executeReadOperation(
      `listJobEventsByJob(${jobid})`,
      () => this.primary.listJobEventsByJob(jobid),
      () => this.mirror.listJobEventsByJob(jobid)
    );
  }

  // -- Sync operations -----------------------------------------------------

  async applySyncMutations(args: {
    actor: SessionUser;
    mutations: SyncMutation[];
    ctx: StoreContext;
  }): Promise<SyncPushResult> {
    const primaryResult = await this.primary.applySyncMutations(args);

    await this._mirrorWrite(
      "applySyncMutations",
      args.ctx.correlationId,
      () => this.mirror.applySyncMutations(args)
    );

    return primaryResult;
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
    const primaryResult = await this.primary.resolveSyncConflict(args);

    await this._mirrorWrite(
      "resolveSyncConflict",
      args.jobid,
      () => this.mirror.resolveSyncConflict(args)
    );

    if (this.config.verifyWrites && primaryResult.conflict === null) {
      await this._verifyJobConsistency(args.jobid);
    }

    return primaryResult;
  }

  // -- Consistency verification --------------------------------------------

  /**
   * Run a full consistency check between primary and mirror stores.
   */
  async checkConsistency(): Promise<ConsistencyReport> {
    const discrepancies: ConsistencyDiscrepancy[] = [];

    // Check users
    try {
      const primaryUsers = await this.primary.listUsers();
      for (const user of primaryUsers) {
        const mirrorUser = await this.mirror.getUserByEmail(user.email);
        const primaryObj = user as unknown as Record<string, unknown>;
        const mirrorObj = mirrorUser ? (mirrorUser as unknown as Record<string, unknown>) : null;
        const userDiscrepancies = compareRecords("User", user.user_id, primaryObj, mirrorObj);
        discrepancies.push(...userDiscrepancies);
      }
    } catch (err) {
      log("error", this.label, "Consistency check failed for users", { error: String(err) });
    }

    // Check jobs
    try {
      const syntheticUser: SessionUser = {
        user_id: "SYSTEM",
        email: "system@kharon.local",
        role: "admin",
        display_name: "System",
        client_id: "",
        technician_id: ""
      };
      const primaryJobs = await this.primary.listJobsForUser(syntheticUser);
      for (const job of primaryJobs) {
        const mirrorJob = await this.mirror.getJob(job.job_id);
        const primaryObj = job as unknown as Record<string, unknown>;
        const mirrorObj = mirrorJob ? (mirrorJob as unknown as Record<string, unknown>) : null;
        const jobDiscrepancies = compareRecords("Job", job.job_id, primaryObj, mirrorObj);
        discrepancies.push(...jobDiscrepancies);
      }
    } catch (err) {
      log("error", this.label, "Consistency check failed for jobs", { error: String(err) });
    }

    return {
      consistent: discrepancies.length === 0,
      discrepancies
    };
  }

  /**
   * Resolve a discrepancy for a specific entity by writing the winning value
   * to the losing store.
   */
  async resolveDiscrepancy(
    discrepancy: ConsistencyDiscrepancy,
    strategy: ConflictResolutionStrategy = "primary_wins"
  ): Promise<void> {
    const resolved = resolveConflict(strategy, discrepancy.primaryValue, discrepancy.mirrorValue);

    if (resolved === discrepancy.mirrorValue && discrepancy.primaryValue !== null) {
      log("info", this.label, "Resolving discrepancy: mirror wins, writing to primary", {
        entity: discrepancy.entity,
        entityId: discrepancy.entityId
      });
    } else if (resolved === discrepancy.primaryValue && discrepancy.mirrorValue !== null) {
      log("info", this.label, "Resolving discrepancy: primary wins, writing to mirror", {
        entity: discrepancy.entity,
        entityId: discrepancy.entityId
      });
    }

    throw new Error(
      `Automatic discrepancy reconciliation is not implemented for entity "${discrepancy.entity}". ` +
      "Use strict dual-write mode and operator-led repair."
    );
  }

  // -- Internal helpers ----------------------------------------------------

  /**
   * Write to the mirror store with retries. Non-fatal — logs warnings on failure.
   */
  private async _mirrorWrite(
    operation: string,
    entityId: string,
    fn: () => Promise<unknown>
  ): Promise<void> {
    try {
      await retryWithBackoff(
        fn,
        this.config.mirrorRetryCount,
        this.config.mirrorRetryDelayMs,
        this.label,
        `mirror:${operation}`
      );
      log("info", this.label, `Mirror write succeeded: ${operation}`, { entityId });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      log("warn", this.label, `Mirror write failed after retries: ${operation}`, {
        entityId,
        error: message
      });
      if (this.config.strictPrimary) {
        throw new Error(`Strict dual-write failure for ${operation}(${entityId}): ${message}`);
      }
    }
  }

  /**
   * Verify that a job is consistent between primary and mirror stores.
   */
  private async _verifyJobConsistency(jobid: string): Promise<void> {
    try {
      const [primaryJob, mirrorJob] = await Promise.all([
        this.primary.getJob(jobid),
        this.mirror.getJob(jobid)
      ]);

      const primaryObj = primaryJob ? (primaryJob as unknown as Record<string, unknown>) : null;
      const mirrorObj = mirrorJob ? (mirrorJob as unknown as Record<string, unknown>) : null;
      const discrepancies = compareRecords("Job", jobid, primaryObj, mirrorObj);

      if (discrepancies.length > 0) {
        log("warn", this.label, "Job consistency verification failed", {
          jobid,
          discrepancyCount: discrepancies.length,
          fields: discrepancies.map((d) => d.field)
        });
      }
    } catch (err) {
      log("error", this.label, "Job consistency verification error", {
        jobid,
        error: String(err)
      });
    }
  }
}

// ---------------------------------------------------------------------------
// Factory helper
// ---------------------------------------------------------------------------

/**
 * Create a DualWorkbookStore using a provided backend store factory.
 */
export function createDualWorkbookStore(
  args: {
    config: DualWorkbookStoreConfig;
    createBackendStore: (backend: Exclude<StoreBackend, "dual">) => WorkbookStore;
    options?: Partial<DualStoreRuntimeConfig>;
  }
): DualWorkbookStore {
  return new DualWorkbookStore({
    config: args.config,
    createStore: args.createBackendStore,
    options: args.options ?? {}
  });
}
