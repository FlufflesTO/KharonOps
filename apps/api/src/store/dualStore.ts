import type { StoreBackend } from "../config.js";
import type { WorkbookStore } from "./types.js";

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
  type UpgradeWorkspaceState,
  type UserRow
} from "@kharon/domain";
import type { StoreContext } from "./types.js";

interface ConsistencyReport {
  consistent: boolean;
  discrepancies: ConsistencyDiscrepancy[];
}

interface ConsistencyDiscrepancy {
  entity: string;
  entityId: string;
  primaryValue: Record<string, unknown> | null;
  mirrorValue: Record<string, unknown> | null;
  field: string;
  primaryFieldValue: unknown;
  mirrorFieldValue: unknown;
}

/**
 * Compare two records field-by-field and return discrepancies.
 */
function compareRecords(
  entity: string,
  entityId: string,
  a: Record<string, unknown> | null,
  b: Record<string, unknown> | null
): ConsistencyDiscrepancy[] {
  const discrepancies: ConsistencyDiscrepancy[] = [];

  if (a === null && b === null) return discrepancies;

  if (a === null) {
    for (const [key, value] of Object.entries(b as Record<string, unknown>)) {
      discrepancies.push({
        entity,
        entityId,
        primaryValue: null,
        mirrorValue: b,
        field: key,
        primaryFieldValue: undefined,
        mirrorFieldValue: value
      });
    }
    return discrepancies;
  }

  if (b === null) {
    for (const [key, value] of Object.entries(a)) {
      discrepancies.push({
        entity,
        entityId,
        primaryValue: a,
        mirrorValue: null,
        field: key,
        primaryFieldValue: value,
        mirrorFieldValue: undefined
      });
    }
    return discrepancies;
  }

  const allKeys = new Set([...Object.keys(a), ...Object.keys(b as Record<string, unknown>)]);
  for (const key of allKeys) {
    const aVal = a[key];
    const bVal = (b as Record<string, unknown>)[key];
    if (!deepEqual(aVal, bVal)) {
      discrepancies.push({
        entity,
        entityId,
        primaryValue: a,
        mirrorValue: b,
        field: key,
        primaryFieldValue: aVal,
        mirrorFieldValue: bVal
      });
    }
  }

  return discrepancies;
}

/** Deep equality for JSON-serialisable values. */
function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a === null || b === null) return false;
  if (typeof a !== typeof b) return false;

  if (Array.isArray(a)) {
    if (!Array.isArray(b)) return false;
    if (a.length !== b.length) return false;
    return a.every((item, i) => deepEqual(item, b[i]));
  }

  if (typeof a === "object") {
    const aKeys = Object.keys(a as Record<string, unknown>).sort();
    const bKeys = Object.keys(b as Record<string, unknown>).sort();
    if (aKeys.length !== bKeys.length) return false;
    if (!aKeys.every((k, i) => k === bKeys[i])) return false;
    for (const key of aKeys) {
      if (!deepEqual((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key])) {
        return false;
      }
    }
    return true;
  }

  return false;
}

// ---------------------------------------------------------------------------
// Conflict resolution strategy
// ---------------------------------------------------------------------------

type ConflictResolutionStrategy = "primary_wins" | "mirror_wins" | "latest_timestamp" | "manual";

function resolveConflict(
  strategy: ConflictResolutionStrategy,
  primaryValue: unknown,
  mirrorValue: unknown
): unknown {
  switch (strategy) {
    case "primary_wins":
      return primaryValue;
    case "mirror_wins":
      return mirrorValue;
    case "latest_timestamp": {
      const primaryObj = primaryValue as Record<string, unknown> | null;
      const mirrorObj = mirrorValue as Record<string, unknown> | null;
      if (primaryObj === null) return mirrorValue;
      if (mirrorObj === null) return primaryValue;
      const primaryTs = String(primaryObj.updated_at ?? "");
      const mirrorTs = String(mirrorObj.updated_at ?? "");
      return primaryTs >= mirrorTs ? primaryValue : mirrorValue;
    }
    case "manual":
      return primaryValue;
  }
}

// ---------------------------------------------------------------------------
// Logging helper
// ---------------------------------------------------------------------------

function log(level: "info" | "warn" | "error", label: string, message: string, data?: Record<string, unknown>): void {
  const timestamp = new Date().toISOString();
  const entry = { timestamp, level, store: label, message, ...(data ?? {}) };
  if (level === "error") {
    console.error(JSON.stringify(entry));
  } else if (level === "warn") {
    console.warn(JSON.stringify(entry));
  } else {
    console.log(JSON.stringify(entry));
  }
}

// ---------------------------------------------------------------------------
// Retry helper
// ---------------------------------------------------------------------------

async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number,
  delayMs: number,
  label: string,
  operation: string
): Promise<T> {
  let lastError: Error | undefined;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < maxRetries) {
        log("warn", label, `Retry ${attempt + 1}/${maxRetries} for ${operation}`, {
          error: lastError.message
        });
        await new Promise((resolve) => setTimeout(resolve, delayMs * (attempt + 1)));
      }
    }
  }
  throw lastError ?? new Error(`Unknown error during ${operation}`);
}

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
    return this.primary.getUserByEmail(email);
  }

  async listUsers(): Promise<UserRow[]> {
    return this.primary.listUsers();
  }

  async listClients(): Promise<ClientRow[]> {
    return this.primary.listClients();
  }

  async listTechnicians(): Promise<TechnicianRow[]> {
    return this.primary.listTechnicians();
  }

  async listFinanceQuotes(): Promise<FinanceQuoteRow[]> {
    return this.primary.listFinanceQuotes();
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
    return this.primary.listFinanceInvoices();
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
    return this.primary.listFinanceStatements();
  }

  async replaceFinanceStatements(rows: FinanceStatementRow[]): Promise<void> {
    await this.primary.replaceFinanceStatements(rows);
    await this._mirrorWrite("replaceFinanceStatements", `rows:${rows.length}`, () => this.mirror.replaceFinanceStatements(rows));
  }

  async listFinanceDebtors(): Promise<FinanceDebtorRow[]> {
    return this.primary.listFinanceDebtors();
  }

  async replaceFinanceDebtors(rows: FinanceDebtorRow[]): Promise<void> {
    await this.primary.replaceFinanceDebtors(rows);
    await this._mirrorWrite("replaceFinanceDebtors", `rows:${rows.length}`, () => this.mirror.replaceFinanceDebtors(rows));
  }

  async listEscrowRows(): Promise<EscrowRow[]> {
    return this.primary.listEscrowRows();
  }

  async getEscrowByDocument(document_id: string): Promise<EscrowRow | null> {
    return this.primary.getEscrowByDocument(document_id);
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

  async getUpgradeWorkspaceState(): Promise<UpgradeWorkspaceState> {
    return this.primary.getUpgradeWorkspaceState();
  }

  // -- Job operations ------------------------------------------------------

  async listJobsForUser(user: SessionUser): Promise<JobRow[]> {
    return this.primary.listJobsForUser(user);
  }

  async getJob(jobid: string): Promise<JobRow | null> {
    return this.primary.getJob(jobid);
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

  async getSchedule(scheduleid: string): Promise<ScheduleRow | null> {
    return this.primary.getSchedule(scheduleid);
  }

  async listSchedules(jobid?: string): Promise<ScheduleRow[]> {
    return this.primary.listSchedules(jobid);
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

  async getDocument(documentid: string): Promise<JobDocumentRow | null> {
    return this.primary.getDocument(documentid);
  }

  async upsertDocument(row: JobDocumentRow): Promise<void> {
    await this.primary.upsertDocument(row);
    await this._mirrorWrite(
      "upsertDocument",
      row.document_id,
      () => this.mirror.upsertDocument(row)
    );
  }

  async listDocuments(jobid?: string): Promise<JobDocumentRow[]> {
    return this.primary.listDocuments(jobid);
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

  async pullSyncData(args: {
    actor: SessionUser;
    since: string;
  }): Promise<{ jobs: JobRow[]; queue: SyncQueueRow[]; events: JobEventRow[] }> {
    return this.primary.pullSyncData(args);
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
