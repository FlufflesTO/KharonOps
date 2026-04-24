import {
  WORKBOOK_HEADERS,
  buildConflict,
  bumpMutableMeta,
  canReadJob,
  canTransitionStatus,
  nowIso,
  normalizeValue,
  field,
  firstNonEmpty,
  toNum,
  stringifyRow,
  normalizeToken,
  parseBoolean,
  boolString,
  legacyBool,
  asDateCell,
  safeJsonParse,
  jobStatusLabel,
  parseJobStatus,
  parseJobTitle,
  parseUserRow,
  parseClientRow,
  parseTechnicianRow,
  parseSiteRow,
  parsePortalFileRow,
  parseJobRow,
  parseScheduleRequest,
  parseSchedule,
  parseAutomation,
  parseSyncQueue,
  parseJobEvent,
  parseFinanceQuote,
  parseFinanceInvoice,
  parseFinanceStatement,
  parseFinanceDebtor,
  parseEscrow,
  parseSkillMatrix,
  parseDocumentRow,
  serializeDocumentRow,
  serializePortalFileRow,
  findPortalFileForDocument,
  serializeJobRow,
  serializeJobEventRow,
  type EscrowRow,
  type ApiError,
  type AutomationJobRow,
  type ConflictPayload,
  type FinanceDebtorRow,
  type FinanceInvoiceRow,
  type FinanceQuoteRow,
  type FinanceStatementRow,
  type JobDocumentRow,
  type JobEventRow,
  type JobRow,
  type PortalFileRow,
  type ScheduleRequestRow,
  type ScheduleRow,
  type SessionUser,
  type SiteRow,
  type SyncMutation,
  type SyncPushResult,
  type SyncQueueRow,
  type SkillMatrixRow,
  type ClientRow,
  type TechnicianRow,
  type UserRow
} from "@kharon/domain";
import type { WorkspaceRails } from "@kharon/google";
import type { WorkbookStore } from "./types.js";

type Row = Record<string, unknown>;

function toSheetRow(record: object): Record<string, string> {
  return stringifyRow(record as Record<string, unknown>);
}

function conflictFor(job: JobRow, expected: number): ConflictPayload {
  return buildConflict({
    entity: "Jobs_Master",
    entityId: job.job_id,
    serverState: job as unknown as Record<string, unknown>,
    clientRowVersion: expected,
    serverRowVersion: job.row_version
  });
}

export class SheetsWorkbookStore implements WorkbookStore {
  private readonly rowCache = new Map<string, { rows: Row[]; expiresAt: number }>();
  constructor(private readonly rails: WorkspaceRails) { }

  private invalidateRows(...sheetNames: string[]): void {
    for (const sheetName of sheetNames) {
      this.rowCache.delete(sheetName);
    }
  }

  private async rows(sheetName: string): Promise<Row[]> {
    const now = Date.now();
    const hit = this.rowCache.get(sheetName);
    if (hit && hit.expiresAt > now) {
      return hit.rows;
    }

    try {
      const rows = await this.rails.sheets.getRows(sheetName);
      this.rowCache.set(sheetName, { rows, expiresAt: now + 2000 });
      return rows;
    } catch (error) {
      if (sheetName === "Portal_Files") {
        return [];
      }
      throw error;
    }
  }

  private async findRow(sheetName: string, keyField: string, target: string): Promise<Row | null> {
    const normalizedTarget = normalizeValue(target);
    const rows = await this.rows(sheetName);
    return rows.find((row) => field(row, keyField) === normalizedTarget) ?? null;
  }

  private async getRawJobRow(jobid: string): Promise<Row | null> {
    return this.findRow("Jobs_Master", "job_id", jobid);
  }

  private async getRawDocumentRow(documentid: string): Promise<Row | null> {
    return this.findRow("Job_Documents", "document_id", documentid);
  }

  async ensureSchema(): Promise<void> {
    await this.rails.sheets.ensureWorkbookSchema(WORKBOOK_HEADERS as unknown as Record<string, string[]>);
  }

  async getUserByEmail(email: string): Promise<UserRow | null> {
    const rows = await this.rows("Users_Master");
    const target = email.trim().toLowerCase();
    const found = rows.find((row) => field(row, "email").toLowerCase() === target && parseBoolean(field(row, "active", "active_flag")));
    return found ? parseUserRow(found) : null;
  }

  async listUsers(): Promise<UserRow[]> {
    return (await this.rows("Users_Master")).map(parseUserRow);
  }

  /**
   * listClients — reads Clients_Master as the authoritative source for
   * client display names. Users_Master is NOT used here; it has no client rows
   * with valid client_id values.
   */
  async listClients(): Promise<ClientRow[]> {
    return (await this.rows("Clients_Master")).map(parseClientRow);
  }

  /**
   * listTechnicians — reads Technicians_Master as the authoritative source
   * for technician display names. Technician IDs here (ROY001, MAG001, etc.)
   * map directly to Jobs_Master.primary_technician_id, unlike Users_Master
   * which uses a different ID scheme.
   */
  async listTechnicians(): Promise<TechnicianRow[]> {
    return (await this.rows("Technicians_Master")).map(parseTechnicianRow);
  }

  async listSites(): Promise<SiteRow[]> {
    return (await this.rows("Sites_Master")).map(parseSiteRow);
  }

  async listPortalFiles(jobid?: string): Promise<PortalFileRow[]> {
    const rows = await this.rows("Portal_Files");
    const all = rows.map(parsePortalFileRow);
    if (!jobid) return all;
    return all.filter((f) => f.job_id === jobid);
  }

  async listFinanceQuotes(): Promise<FinanceQuoteRow[]> {
    return (await this.rows("Finance_Quotes")).map(parseFinanceQuote).sort((a, b) => b.created_at.localeCompare(a.created_at));
  }

  async createFinanceQuote(row: FinanceQuoteRow): Promise<void> {
    await this.rails.sheets.upsertRow("Finance_Quotes", "quote_id", toSheetRow(row));
  }

  async updateFinanceQuoteStatus(args: {
    quote_id: string;
    status: FinanceQuoteRow["status"];
    ctx: { correlationId: string; actorUserid: string };
  }): Promise<FinanceQuoteRow | null> {
    const existing = await this.findRow("Finance_Quotes", "quote_id", args.quote_id);
    if (!existing) return null;
    const current = parseFinanceQuote(existing);
    const updated: FinanceQuoteRow = {
      ...current,
      status: args.status,
      ...bumpMutableMeta(current, args.ctx.actorUserid, args.ctx.correlationId)
    };
    await this.rails.sheets.upsertRow("Finance_Quotes", "quote_id", toSheetRow(updated));
    return updated;
  }

  async listFinanceInvoices(): Promise<FinanceInvoiceRow[]> {
    return (await this.rows("Finance_Invoices")).map(parseFinanceInvoice).sort((a, b) => b.updated_at.localeCompare(a.updated_at));
  }

  async createFinanceInvoice(row: FinanceInvoiceRow): Promise<void> {
    await this.rails.sheets.upsertRow("Finance_Invoices", "invoice_id", toSheetRow(row));
  }

  async updateFinanceInvoice(row: FinanceInvoiceRow): Promise<void> {
    await this.rails.sheets.upsertRow("Finance_Invoices", "invoice_id", toSheetRow(row));
  }

  async listFinanceStatements(): Promise<FinanceStatementRow[]> {
    return (await this.rows("Finance_Statements")).map(parseFinanceStatement).sort((a, b) => b.generated_at.localeCompare(a.generated_at));
  }

  async replaceFinanceStatements(rows: FinanceStatementRow[]): Promise<void> {
    for (const row of rows) {
      await this.rails.sheets.upsertRow("Finance_Statements", "statement_id", toSheetRow(row));
    }
  }

  async listFinanceDebtors(): Promise<FinanceDebtorRow[]> {
    return (await this.rows("Finance_Debtors")).map(parseFinanceDebtor).sort((a, b) => b.total_due - a.total_due);
  }

  async replaceFinanceDebtors(rows: FinanceDebtorRow[]): Promise<void> {
    for (const row of rows) {
      await this.rails.sheets.upsertRow("Finance_Debtors", "client_id", toSheetRow(row));
    }
  }

  async listEscrowRows(): Promise<EscrowRow[]> {
    return (await this.rows("Compliance_Escrow")).map(parseEscrow).sort((a, b) => b.updated_at.localeCompare(a.updated_at));
  }

  async getEscrowByDocument(document_id: string): Promise<EscrowRow | null> {
    const row = await this.findRow("Compliance_Escrow", "document_id", document_id);
    return row ? parseEscrow(row) : null;
  }

  async upsertEscrow(row: EscrowRow): Promise<void> {
    await this.rails.sheets.upsertRow("Compliance_Escrow", "document_id", toSheetRow(row));
  }

  async listSkillMatrix(): Promise<SkillMatrixRow[]> {
    return (await this.rows("HR_Skills_Matrix")).map(parseSkillMatrix).sort((a, b) => a.user_id.localeCompare(b.user_id));
  }

  async upsertSkillMatrix(row: SkillMatrixRow): Promise<void> {
    await this.rails.sheets.upsertRow("HR_Skills_Matrix", "user_id", toSheetRow(row));
  }

  async listJobsForUser(user: SessionUser): Promise<JobRow[]> {
    return (await this.rows("Jobs_Master")).map(parseJobRow).filter((job) => canReadJob(user, job));
  }

  async getJob(jobid: string): Promise<JobRow | null> {
    const row = await this.getRawJobRow(jobid);
    return row ? parseJobRow(row) : null;
  }

  async updateJobStatus(args: {
    jobid: string;
    status: JobRow["status"];
    expectedRowVersion: number;
    ctx: { correlationId: string; actorUserid: string };
  }): Promise<{ job: JobRow; conflict: ConflictPayload | null }> {
    const currentRaw = await this.getRawJobRow(args.jobid);
    if (!currentRaw) {
      throw new Error(`Unknown job ${args.jobid}`);
    }

    const current = parseJobRow(currentRaw);
    if (current.row_version !== args.expectedRowVersion) {
      return { job: current, conflict: conflictFor(current, args.expectedRowVersion) };
    }

    if (!canTransitionStatus(current.status, args.status)) {
      throw new Error(`Invalid status transition from ${current.status} to ${args.status}`);
    }

    const updated: JobRow = {
      ...current,
      status: args.status,
      ...bumpMutableMeta(current, args.ctx.actorUserid, args.ctx.correlationId)
    };

    await this.rails.sheets.upsertRow("Jobs_Master", "job_id", toSheetRow(serializeJobRow(updated, currentRaw)));
    const statusEventMeta = { updated_at: nowIso(), updated_by: args.ctx.actorUserid, correlation_id: args.ctx.correlationId, row_version: 1 };
      await this.appendJobEvent({
        event_id: `EVT-${crypto.randomUUID()}`,
        job_id: updated.job_id,
        event_type: "status_changed",
        payload_json: JSON.stringify({ from: current.status, to: updated.status }),
        ...statusEventMeta,
        created_at: statusEventMeta.updated_at,
        created_by: statusEventMeta.updated_by
      });

    return { job: updated, conflict: null };
  }

  async appendJobNote(args: {
    jobid: string;
    note: string;
    expectedRowVersion: number;
    ctx: { correlationId: string; actorUserid: string };
  }): Promise<{ job: JobRow; conflict: ConflictPayload | null }> {
    const currentRaw = await this.getRawJobRow(args.jobid);
    if (!currentRaw) {
      throw new Error(`Unknown job ${args.jobid}`);
    }

    const current = parseJobRow(currentRaw);
    if (current.row_version !== args.expectedRowVersion) {
      return { job: current, conflict: conflictFor(current, args.expectedRowVersion) };
    }

    const updated: JobRow = {
      ...current,
      last_note: args.note,
      ...bumpMutableMeta(current, args.ctx.actorUserid, args.ctx.correlationId)
    };

    await this.rails.sheets.upsertRow("Jobs_Master", "job_id", toSheetRow(serializeJobRow(updated, currentRaw)));
    const noteEventMeta = { updated_at: nowIso(), updated_by: args.ctx.actorUserid, correlation_id: args.ctx.correlationId, row_version: 1 };
      await this.appendJobEvent({
        event_id: `EVT-${crypto.randomUUID()}`,
        job_id: updated.job_id,
        event_type: "note_added",
        payload_json: JSON.stringify({ note: args.note }),
        ...noteEventMeta,
        created_at: noteEventMeta.updated_at,
        created_by: noteEventMeta.updated_by
      });

    return { job: updated, conflict: null };
  }

  async appendJobEvent(event: JobEventRow): Promise<void> {
    await this.rails.sheets.appendRow("Job_Events", toSheetRow(serializeJobEventRow(event)));
  }

  async createScheduleRequest(row: ScheduleRequestRow): Promise<void> {
    await this.rails.sheets.appendRow("Schedule_Requests", toSheetRow(row));
  }

  async getScheduleRequest(requestid: string): Promise<ScheduleRequestRow | null> {
    const row = await this.findRow("Schedule_Requests", "request_id", requestid);
    return row ? parseScheduleRequest(row) : null;
  }

  async listScheduleRequests(jobid?: string): Promise<ScheduleRequestRow[]> {
    return (await this.rows("Schedule_Requests"))
      .map(parseScheduleRequest)
      .filter((row) => (jobid ? row.job_id === jobid : true))
      .sort((a, b) => b.updated_at.localeCompare(a.updated_at));
  }

  async upsertScheduleRequest(row: ScheduleRequestRow): Promise<void> {
    await this.rails.sheets.upsertRow("Schedule_Requests", "request_id", toSheetRow(row));
  }

  async createSchedule(row: ScheduleRow): Promise<void> {
    await this.rails.sheets.appendRow("Schedules_Master", toSheetRow(row));
  }

  async getSchedule(scheduleid: string): Promise<ScheduleRow | null> {
    const row = await this.findRow("Schedules_Master", "schedule_id", scheduleid);
    return row ? parseSchedule(row) : null;
  }

  async listSchedules(jobid?: string): Promise<ScheduleRow[]> {
    return (await this.rows("Schedules_Master"))
      .map(parseSchedule)
      .filter((row) => (jobid ? row.job_id === jobid : true))
      .sort((a, b) => b.updated_at.localeCompare(a.updated_at));
  }

  async upsertSchedule(row: ScheduleRow): Promise<void> {
    await this.rails.sheets.upsertRow("Schedules_Master", "schedule_id", toSheetRow(row));
  }

  async createDocument(row: JobDocumentRow): Promise<void> {
    const relatedJob = (await this.getRawJobRow(row.job_id)) ?? {};
    await this.rails.sheets.appendRow("Job_Documents", toSheetRow(serializeDocumentRow(row, {}, relatedJob)));
    await this.rails.sheets.upsertRow("Portal_Files", "file_id", toSheetRow(serializePortalFileRow(row, {}, relatedJob)));
    this.invalidateRows("Job_Documents", "Portal_Files");
  }

  async getDocument(documentid: string): Promise<JobDocumentRow | null> {
    const row = await this.getRawDocumentRow(documentid);
    if (!row) {
      return null;
    }

    const portalFiles = await this.rows("Portal_Files");
    return parseDocumentRow(row, findPortalFileForDocument(row, portalFiles));
  }

  async upsertDocument(row: JobDocumentRow): Promise<void> {
    const existingDocument = (await this.getRawDocumentRow(row.document_id)) ?? {};
    const relatedJob = (await this.getRawJobRow(row.job_id)) ?? {};
    const portalFiles = await this.rows("Portal_Files");
    const portalLookupSource =
      field(existingDocument, "document_id") !== ""
        ? existingDocument
        : { document_id: row.document_id, job_id: row.job_id, document_type: String(row.document_type) };
    const existingPortalFile = findPortalFileForDocument(portalLookupSource as Row, portalFiles) ?? {};

    await this.rails.sheets.upsertRow("Job_Documents", "document_id", toSheetRow(serializeDocumentRow(row, existingDocument, relatedJob)));
    await this.rails.sheets.upsertRow("Portal_Files", "file_id", toSheetRow(serializePortalFileRow(row, existingPortalFile as Record<string, string>, relatedJob)));
    this.invalidateRows("Job_Documents", "Portal_Files");
  }

  async listDocuments(jobid?: string): Promise<JobDocumentRow[]> {
    const [documentRows, portalFiles] = await Promise.all([this.rows("Job_Documents"), this.rows("Portal_Files")]);
    return documentRows
      .filter((row) => (jobid ? field(row, "job_id") === jobid : true))
      .map((row) => parseDocumentRow(row, findPortalFileForDocument(row, portalFiles)));
  }

  async appendAudit(args: {
    action: string;
    payload: Record<string, unknown>;
    ctx: { correlationId: string; actorUserid: string };
    entry_type?: string;
  }): Promise<void> {
    await this.rails.sheets.appendRow("Ledger", {
      ledger_id: `AUD-${crypto.randomUUID()}`,
      entry_type: args.entry_type || "system_audit",
      action: args.action,
      entity_type: String(args.payload.entity || "system"),
      entity_id: String(args.payload.id || args.payload.job_id || ""),
      payload_json: JSON.stringify(args.payload),
      row_version: "1",
      updated_at: nowIso(),
      updated_by: args.ctx.actorUserid,
      correlation_id: args.ctx.correlationId
    });
  }

  async listAudits(): Promise<Array<Record<string, string>>> {
    return (await this.rows("Ledger")).map(toSheetRow);
  }

  async upsertAutomationJob(row: AutomationJobRow): Promise<void> {
    await this.rails.sheets.upsertRow("Automation_Jobs", "automation_job_id", toSheetRow(row));
  }

  async getAutomationJob(automationJobid: string): Promise<AutomationJobRow | null> {
    const row = await this.findRow("Automation_Jobs", "automation_job_id", automationJobid);
    return row ? parseAutomation(row) : null;
  }

  async listAutomationJobs(): Promise<AutomationJobRow[]> {
    return (await this.rows("Automation_Jobs"))
      .map(parseAutomation)
      .sort((a, b) => b.updated_at.localeCompare(a.updated_at));
  }

  async upsertSyncQueue(row: SyncQueueRow): Promise<void> {
    await this.rails.sheets.upsertRow("Sync_Queue", "mutation_id", toSheetRow(row));
  }

  async getSyncQueue(mutationid: string): Promise<SyncQueueRow | null> {
    const row = await this.findRow("Sync_Queue", "mutation_id", mutationid);
    return row ? parseSyncQueue(row) : null;
  }

  async listSyncQueueByJob(jobid: string): Promise<SyncQueueRow[]> {
    return (await this.rows("Sync_Queue"))
      .map(parseSyncQueue)
      .filter((row) => row.job_id === jobid);
  }

  async listJobEventsByJob(jobid: string): Promise<JobEventRow[]> {
    return (await this.rows("Job_Events"))
      .map(parseJobEvent)
      .filter((row) => row.job_id === jobid)
      .sort((a, b) => b.updated_at.localeCompare(a.updated_at));
  }

  async applySyncMutations(args: {
    actor: SessionUser;
    mutations: SyncMutation[];
    ctx: { correlationId: string; actorUserid: string };
  }): Promise<SyncPushResult> {
    const result: SyncPushResult = { applied: [], conflicts: [], failed: [] };

    for (const mutation of args.mutations) {
      const existing = await this.getSyncQueue(mutation.mutation_id);
      if (existing?.status === "applied") {
        const job = await this.getJob(mutation.job_id);
        result.applied.push({
          mutation_id: mutation.mutation_id,
          job_id: mutation.job_id,
          row_version: job?.row_version ?? 0
        });
        continue;
      }

      const rawJob = await this.getRawJobRow(mutation.job_id);
      const job = rawJob ? parseJobRow(rawJob) : null;
      if (!job || !rawJob) {
        result.failed.push({
          mutation_id: mutation.mutation_id,
          job_id: mutation.job_id,
          error: { code: "not_found", message: `Unknown job ${mutation.job_id}` }
        });
        continue;
      }

      if (job.row_version !== mutation.expected_row_version) {
        const conflict = conflictFor(job, mutation.expected_row_version);
        result.conflicts.push({ mutation_id: mutation.mutation_id, job_id: mutation.job_id, conflict });

        await this.upsertSyncQueue({
          mutation_id: mutation.mutation_id,
          job_id: mutation.job_id,
          actor_id: args.actor.user_id,
          payload_json: JSON.stringify(mutation.payload),
          status: "conflict",
          last_result: JSON.stringify(conflict),
          row_version: existing ? existing.row_version + 1 : 1,
          updated_at: nowIso(),
          updated_by: args.ctx.actorUserid,
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
          ...bumpMutableMeta(job, args.ctx.actorUserid, args.ctx.correlationId)
        };

        await this.rails.sheets.upsertRow("Jobs_Master", "job_id", toSheetRow(serializeJobRow(updated, rawJob)));
        await this.upsertSyncQueue({
          mutation_id: mutation.mutation_id,
          job_id: mutation.job_id,
          actor_id: args.actor.user_id,
          payload_json: JSON.stringify(mutation.payload),
          status: "applied",
          last_result: "applied",
          row_version: existing ? existing.row_version + 1 : 1,
          updated_at: nowIso(),
          updated_by: args.ctx.actorUserid,
          correlation_id: args.ctx.correlationId
        });

        result.applied.push({ mutation_id: mutation.mutation_id, job_id: mutation.job_id, row_version: updated.row_version });
      } catch (error) {
        const typed: ApiError = { code: "sync_apply_failed", message: String(error) };
        result.failed.push({ mutation_id: mutation.mutation_id, job_id: mutation.job_id, error: typed });
        await this.upsertSyncQueue({
          mutation_id: mutation.mutation_id,
          job_id: mutation.job_id,
          actor_id: args.actor.user_id,
          payload_json: JSON.stringify(mutation.payload),
          status: "failed",
          last_result: JSON.stringify(typed),
          row_version: existing ? existing.row_version + 1 : 1,
          updated_at: nowIso(),
          updated_by: args.ctx.actorUserid,
          correlation_id: args.ctx.correlationId
        });
      }
    }

    return result;
  }

  async resolveSyncConflict(args: {
    actor: SessionUser;
    jobid: string;
    strategy: "server" | "client" | "merge";
    serverRowVersion: number;
    clientRowVersion: number;
    mergePatch?: Record<string, unknown>;
    ctx: { correlationId: string; actorUserid: string };
  }): Promise<{ job: JobRow; conflict: ConflictPayload | null }> {
    const rawJob = await this.getRawJobRow(args.jobid);
    const job = rawJob ? parseJobRow(rawJob) : null;
    if (!job || !rawJob) {
      throw new Error(`Unknown job ${args.jobid}`);
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
    if (typeof patch.last_note === "string" && patch.last_note.trim() !== "") {
      job.last_note = patch.last_note;
    }

    const updated = {
      ...job,
      ...bumpMutableMeta(job, args.ctx.actorUserid, args.ctx.correlationId)
    };
    await this.rails.sheets.upsertRow("Jobs_Master", "job_id", toSheetRow(serializeJobRow(updated, rawJob)));

    return { job: updated, conflict: null };
  }

}
