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

const PORTAL_FILE_DOCUMENT_NOTE_PREFIX = "Managed by KharonOps app for document_uid:";

function normalizeValue(value: unknown): string {
  return String(value ?? "").trim();
}

function field(row: Row | null | undefined, ...keys: string[]): string {
  for (const key of keys) {
    const value = normalizeValue(row?.[key]);
    if (value !== "") {
      return value;
    }
  }
  return "";
}

function firstNonEmpty(...values: string[]): string {
  for (const value of values) {
    const normalized = normalizeValue(value);
    if (normalized !== "") {
      return normalized;
    }
  }
  return "";
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

function normalizeToken(value: string): string {
  return normalizeValue(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function parseBoolean(value: string): boolean {
  const normalized = normalizeToken(value);
  return normalized === "true" || normalized === "1" || normalized === "yes" || normalized === "y";
}

function boolString(value: string): "true" | "false" {
  return parseBoolean(value) ? "true" : "false";
}

function legacyBool(value: boolean | string): string {
  return typeof value === "boolean" ? (value ? "TRUE" : "FALSE") : parseBoolean(value) ? "TRUE" : "FALSE";
}

function asDateCell(value: string): string {
  const normalized = normalizeValue(value);
  if (normalized === "") {
    return "";
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    return normalized;
  }
  const parsed = Date.parse(normalized);
  if (Number.isNaN(parsed)) {
    return normalized;
  }
  return new Date(parsed).toISOString().slice(0, 10);
}

function safeJsonParse(value: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(value) as unknown;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    // Ignore malformed event payloads and fall back to the raw string.
  }
  return {};
}

function jobStatusLabel(status: JobRow["status"]): string {
  switch (status) {
    case "draft":
      return "Draft";
    case "performed":
      return "Performed";
    case "rejected":
      return "Rejected";
    case "approved":
      return "Approved";
    case "certified":
      return "Certified";
    case "cancelled":
      return "Cancelled";
    default:
      return (status as string).charAt(0).toUpperCase() + (status as string).slice(1);
  }
}

function parseJobStatus(row: Row): JobRow["status"] {
  const raw = firstNonEmpty(field(row, "status"), field(row, "job_status"), field(row, "status_raw"), field(row, "billing_status"));
  const normalized = normalizeToken(raw);

  if (normalized.includes("cancel")) {
    return "cancelled";
  }
  if (normalized === "certified" || normalized === "approved") {
    return normalized as JobRow["status"];
  }
  if (normalized === "rejected") {
    return "rejected";
  }
  if (
    normalized === "completed" ||
    normalized === "complete" ||
    normalized === "closed" ||
    normalized === "done" ||
    normalized === "resolved" ||
    normalized === "paid" ||
    normalized === "invoiced" ||
    normalized === "performed"
  ) {
    return "performed";
  }
  
  if (field(row, "date_completed") !== "") {
    return "performed";
  }
  return "draft";
}

function parseJobTitle(row: Row): string {
  const details = field(row, "title", "details_of_works");
  if (details !== "") {
    return details;
  }

  const requestType = field(row, "request_type");
  if (requestType !== "" && normalizeToken(requestType) !== "operational_job") {
    return requestType;
  }

  return firstNonEmpty(field(row, "system_type"), field(row, "site"), field(row, "job_uid"));
}

function parseUserRow(row: Row): UserRow {
  return {
    user_uid: field(row, "user_uid"),
    email: field(row, "email"),
    display_name: field(row, "display_name"),
    role: field(row, "role") as UserRow["role"],
    client_uid: field(row, "client_uid", "client_id"),
    technician_uid: field(row, "technician_uid", "technician_id"),
    active: boolString(field(row, "active", "active_flag")),
    row_version: Math.max(1, toNum(field(row, "row_version"))),
    updated_at: firstNonEmpty(field(row, "updated_at"), field(row, "last_sync_at")),
    updated_by: firstNonEmpty(field(row, "updated_by"), field(row, "display_name")),
    correlation_id: firstNonEmpty(field(row, "correlation_id"), field(row, "email"), field(row, "user_uid"))
  };
}

function parseJobRow(row: Row): JobRow {
  return {
    job_uid: field(row, "job_uid"),
    client_uid: field(row, "client_uid", "client_id"),
    site_uid: field(row, "site_uid", "site_id"),
    technician_uid: field(row, "technician_uid", "primary_technician_id"),
    title: parseJobTitle(row),
    status: parseJobStatus(row),
    scheduled_start: firstNonEmpty(field(row, "scheduled_start"), field(row, "date_scheduled"), field(row, "initial_date"), field(row, "response_due_at")),
    scheduled_end: firstNonEmpty(field(row, "scheduled_end"), field(row, "completion_due_at"), field(row, "date_completed")),
    last_note: firstNonEmpty(field(row, "last_note"), field(row, "legacy_formula_notes"), field(row, "next_action_type"), field(row, "billing_notes")),
    row_version: Math.max(1, toNum(field(row, "row_version"))),
    updated_at: firstNonEmpty(field(row, "updated_at"), field(row, "last_sync_at"), field(row, "last_contact_at"), field(row, "date_completed"), field(row, "initial_date")),
    updated_by: firstNonEmpty(field(row, "updated_by"), field(row, "dispatcher_owner"), field(row, "job_owner"), field(row, "primary_technician_name")),
    correlation_id: firstNonEmpty(field(row, "correlation_id"), field(row, "source_refs"), field(row, "source_submission_id"), field(row, "legacy_job_id"), field(row, "job_uid"))
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

function parseDocumentType(value: string): JobDocumentRow["document_type"] {
  const normalized = normalizeToken(value);
  if (normalized.includes("jobcard")) {
    return "jobcard";
  }
  if (normalized.includes("certificate") || normalized.includes("coc")) {
    return "certificate";
  }
  if (normalized === "service_report" || normalized === "service" || normalized.includes("report")) {
    return "service_report";
  }
  return (normalizeValue(value) || "service_report") as JobDocumentRow["document_type"];
}

function parseDocumentStatus(row: Row, portalFile?: Row | null): JobDocumentRow["status"] {
  if (parseBoolean(field(portalFile, "visible_to_client", "portal_visible")) || field(portalFile, "source_url", "published_url") !== "") {
    return "published";
  }
  if (field(row, "published_url") !== "") {
    return "published";
  }
  return "generated";
}

function portalFileDocumentUid(row: Row): string {
  const notes = field(row, "notes");
  const match = notes.match(/document_uid:([A-Za-z0-9-]+)/);
  return match?.[1] ?? "";
}

function fileRoleForDocumentType(documentType: string): string {
  const normalized = normalizeToken(documentType);
  if (normalized.includes("jobcard")) {
    return "jobcard_pdf";
  }
  if (normalized.includes("certificate") || normalized.includes("coc")) {
    return "certificate_pdf";
  }
  return "report_pdf";
}

function fileCategoryForDocumentType(documentType: string): string {
  const normalized = normalizeToken(documentType);
  if (normalized.includes("jobcard")) {
    return "jobcard";
  }
  if (normalized.includes("certificate") || normalized.includes("coc")) {
    return "certificate";
  }
  return "report";
}

function fileUidForDocument(documentUid: string): string {
  return `FIL-${documentUid.replace(/^DOC-/, "")}`;
}

function managedPortalFileNote(documentUid: string): string {
  return `${PORTAL_FILE_DOCUMENT_NOTE_PREFIX}${documentUid}`;
}

function findPortalFileForDocument(documentRow: Row, portalFiles: Row[]): Row | null {
  const documentUid = field(documentRow, "document_uid");
  const managed = portalFiles.find((file) => portalFileDocumentUid(file) === documentUid);
  if (managed) {
    return managed;
  }

  const jobUid = field(documentRow, "job_uid");
  const sameJob = portalFiles.filter((file) => field(file, "job_uid") === jobUid);
  if (sameJob.length === 0) {
    return null;
  }

  const expectedRole = normalizeToken(fileRoleForDocumentType(field(documentRow, "document_type")));
  const sameRole = sameJob.find((file) => normalizeToken(field(file, "file_role")) === expectedRole);
  return sameRole ?? sameJob[0] ?? null;
}

function parseDocument(row: Row, portalFile?: Row | null): JobDocumentRow {
  const status = parseDocumentStatus(row, portalFile);
  return {
    document_uid: field(row, "document_uid"),
    job_uid: field(row, "job_uid"),
    document_type: parseDocumentType(field(row, "document_type")),
    status,
    drive_file_id: field(row, "drive_file_id"),
    pdf_file_id: firstNonEmpty(field(portalFile, "drive_file_id"), field(row, "pdf_file_id")),
    published_url: firstNonEmpty(field(portalFile, "source_url"), field(row, "published_url")),
    client_visible: status === "published" || parseBoolean(field(portalFile, "visible_to_client", "portal_visible")),
    row_version: Math.max(1, toNum(field(row, "row_version"))),
    updated_at: firstNonEmpty(field(row, "updated_at"), field(row, "last_sync_at"), field(row, "sent_at"), field(row, "requested_at")),
    updated_by: firstNonEmpty(field(row, "updated_by"), field(row, "assigned_to"), field(row, "requested_by"), field(row, "job_owner")),
    correlation_id: firstNonEmpty(field(row, "correlation_id"), field(row, "source_refs"), field(row, "legacy_document_id"), field(row, "document_uid"))
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

function templateIdForDocumentType(documentType: string): string {
  const normalized = normalizeToken(documentType);
  if (normalized.includes("jobcard")) {
    return "TPL-JOBCARD";
  }
  if (normalized.includes("certificate") || normalized.includes("coc")) {
    return "TPL-CERTIFICATE";
  }
  return "TPL-SERVICE-REPORT";
}

function nowIso(): string {
  return new Date().toISOString();
}

function serializeJobRow(record: JobRow, existing: Row = {}): Row {
  const row = { ...existing };
  row.job_uid = record.job_uid;
  row.row_version = String(record.row_version);
  row.api_locked = firstNonEmpty(field(existing, "api_locked"), "FALSE");
  row.sync_status = firstNonEmpty(field(existing, "sync_status"), "ready");
  row.last_sync_at = record.updated_at;
  row.last_sync_error = "";
  row.source_system = firstNonEmpty(field(existing, "source_system"), "kharon_portal");
  row.client_id = record.client_uid;
  row.site_id = record.site_uid;
  row.primary_technician_id = record.technician_uid;
  if (record.technician_uid !== "" && field(existing, "technician_raw") === "") {
    row.technician_raw = record.technician_uid;
  }
  row.job_status = record.status;
  row.status_raw = jobStatusLabel(record.status);
  if (record.title !== "") {
    row.details_of_works = record.title;
  }
  if (field(existing, "request_type") === "") {
    row.request_type = "portal_job";
  }
  if (record.scheduled_start !== "") {
    row.date_scheduled = record.scheduled_start;
    if (field(existing, "initial_date") === "") {
      row.initial_date = record.scheduled_start;
    }
  }
  if (record.scheduled_end !== "" && record.status !== "performed" && record.status !== "certified") {
    row.completion_due_at = record.scheduled_end;
  }
  if (record.status === "performed" || record.status === "certified") {
    row.date_completed = firstNonEmpty(field(existing, "date_completed"), record.scheduled_end, asDateCell(record.updated_at));
  }
  row.last_contact_at = record.updated_at;
  if (record.last_note !== "") {
    row.billing_notes = record.last_note;
    row.legacy_formula_notes = record.last_note;
    row.next_action_type = "note_added";
  }
  row.import_conflict_flag = firstNonEmpty(field(existing, "import_conflict_flag"), "no");
  return row;
}

function serializeJobEventRow(event: JobEventRow, existing: Row = {}): Row {
  const payload = safeJsonParse(event.payload_json);
  const row = { ...existing };
  row.event_uid = event.event_uid;
  row.job_uid = event.job_uid;
  row.event_type = event.event_type;
  row.event_date = asDateCell(event.updated_at);
  row.actor = event.updated_by;
  row.actor_type = firstNonEmpty(field(existing, "actor_type"), "api_user");
  row.event_source = firstNonEmpty(field(existing, "event_source"), "portal_api");
  row.trigger_type = firstNonEmpty(field(existing, "trigger_type"), event.event_type);
  row.automation_rule_id = field(existing, "automation_rule_id");
  row.retry_count = firstNonEmpty(field(existing, "retry_count"), "0");
  row.success_flag = firstNonEmpty(field(existing, "success_flag"), "TRUE");
  row.source_sheet = firstNonEmpty(field(existing, "source_sheet"), "KharonOps API");
  row.source_row = field(existing, "source_row");
  row.old_value = firstNonEmpty(String(payload.from ?? ""), field(existing, "old_value"));
  row.new_value = firstNonEmpty(String(payload.to ?? payload.note ?? ""), field(existing, "new_value"));
  row.notes = firstNonEmpty(String(payload.note ?? ""), field(existing, "notes"), event.payload_json);
  return row;
}

function serializeDocumentRow(record: JobDocumentRow, existing: Row = {}, relatedJob: Row = {}): Row {
  const row = { ...existing };
  row.document_uid = record.document_uid;
  row.row_version = String(record.row_version);
  row.sync_status = record.status === "published" ? "published" : firstNonEmpty(field(existing, "sync_status"), "ready");
  row.last_sync_at = record.updated_at;
  row.last_sync_error = "";
  row.job_uid = record.job_uid;
  row.legacy_job_id = firstNonEmpty(field(existing, "legacy_job_id"), field(relatedJob, "legacy_job_id"));
  row.client_id = firstNonEmpty(field(existing, "client_id"), field(relatedJob, "client_id"));
  row.site_id = firstNonEmpty(field(existing, "site_id"), field(relatedJob, "site_id"));
  row.contract_id = firstNonEmpty(field(existing, "contract_id"), field(relatedJob, "contract_id"));
  row.link_status = record.published_url !== "" ? "linked_app" : firstNonEmpty(field(existing, "link_status"), "generated_app");
  row.document_status = record.status;
  row.status_raw = record.status === "published" ? "Published" : "Generated";
  row.job_owner = firstNonEmpty(field(existing, "job_owner"), field(relatedJob, "job_owner"), record.updated_by);
  row.assigned_to = firstNonEmpty(field(existing, "assigned_to"), record.updated_by);
  row.requested_at = firstNonEmpty(field(existing, "requested_at"), record.updated_at);
  row.due_at = field(existing, "due_at");
  row.date_scheduled = firstNonEmpty(field(existing, "date_scheduled"), field(relatedJob, "date_scheduled"));
  row.date_completed = firstNonEmpty(field(existing, "date_completed"), field(relatedJob, "date_completed"));
  row.sent_at = record.status === "published" ? firstNonEmpty(field(existing, "sent_at"), record.updated_at) : field(existing, "sent_at");
  row.approved_at = field(existing, "approved_at");
  row.client_viewed_at = field(existing, "client_viewed_at");
  row.client_acknowledged_at = field(existing, "client_acknowledged_at");
  row.account = firstNonEmpty(field(existing, "account"), field(relatedJob, "account"), field(relatedJob, "client_name"));
  row.site = firstNonEmpty(field(existing, "site"), field(relatedJob, "site"));
  row.document_type = normalizeValue(record.document_type);
  row.template_id = firstNonEmpty(field(existing, "template_id"), templateIdForDocumentType(record.document_type));
  row.document_version = firstNonEmpty(field(existing, "document_version"), "1");
  row.approval_required = firstNonEmpty(field(existing, "approval_required"), "FALSE");
  row.approved_by = field(existing, "approved_by");
  row.sent_to = firstNonEmpty(field(existing, "sent_to"), record.published_url);
  row.details_of_works = firstNonEmpty(field(existing, "details_of_works"), field(relatedJob, "details_of_works"));
  row.requested_by = firstNonEmpty(field(existing, "requested_by"), record.updated_by);
  row.legacy_job_reference_raw = field(existing, "legacy_job_reference_raw");
  row.legacy_job_reference_formula = field(existing, "legacy_job_reference_formula");
  row.drive_file_id = record.drive_file_id;
  row.drive_folder_id = firstNonEmpty(field(existing, "drive_folder_id"), field(relatedJob, "drive_folder_id"));
  row.portal_visible = legacyBool(record.published_url !== "");
  row.source_sheet = firstNonEmpty(field(existing, "source_sheet"), "KharonOps API");
  row.source_row = field(existing, "source_row");
  row.source_refs = firstNonEmpty(field(existing, "source_refs"), record.correlation_id);
  row.source_occurrences = firstNonEmpty(field(existing, "source_occurrences"), "1");
  return row;
}

function serializePortalFileRow(record: JobDocumentRow, existing: Row = {}, relatedJob: Row = {}): Row {
  const row = { ...existing };
  row.file_uid = firstNonEmpty(field(existing, "file_uid"), fileUidForDocument(record.document_uid));
  row.job_uid = record.job_uid;
  row.legacy_job_id = firstNonEmpty(field(existing, "legacy_job_id"), field(relatedJob, "legacy_job_id"));
  row.client_id = firstNonEmpty(field(existing, "client_id"), field(relatedJob, "client_id"));
  row.site_id = firstNonEmpty(field(existing, "site_id"), field(relatedJob, "site_id"));
  row.contract_id = firstNonEmpty(field(existing, "contract_id"), field(relatedJob, "contract_id"));
  row.file_role = firstNonEmpty(field(existing, "file_role"), fileRoleForDocumentType(record.document_type));
  row.file_category = firstNonEmpty(field(existing, "file_category"), fileCategoryForDocumentType(record.document_type));
  row.storage_provider = firstNonEmpty(field(existing, "storage_provider"), "google_drive");
  row.drive_file_id = record.pdf_file_id;
  row.drive_folder_id = firstNonEmpty(field(existing, "drive_folder_id"), field(relatedJob, "drive_folder_id"));
  const isVisible = record.published_url !== "" || record.status === "published";
  row.portal_visible = legacyBool(isVisible);
  row.visible_to_client = legacyBool(isVisible);
  row.uploaded_at = firstNonEmpty(field(existing, "uploaded_at"), record.updated_at);
  row.captured_at = firstNonEmpty(field(existing, "captured_at"), record.updated_at);
  row.uploaded_by = firstNonEmpty(field(existing, "uploaded_by"), record.updated_by);
  row.captured_by = firstNonEmpty(field(existing, "captured_by"), record.updated_by);
  row.is_signature = firstNonEmpty(field(existing, "is_signature"), "FALSE");
  row.is_before_photo = firstNonEmpty(field(existing, "is_before_photo"), "FALSE");
  row.is_after_photo = firstNonEmpty(field(existing, "is_after_photo"), "FALSE");
  row.sort_order = firstNonEmpty(field(existing, "sort_order"), "1");
  row.source_url = record.published_url;
  row.notes = managedPortalFileNote(record.document_uid);
  return row;
}

export class SheetsWorkbookStore implements WorkbookStore {
  constructor(private readonly rails: WorkspaceRails) {}

  private async rows(sheetName: string): Promise<Row[]> {
    try {
      return await this.rails.sheets.getRows(sheetName);
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

  private async getRawJobRow(jobUid: string): Promise<Row | null> {
    return this.findRow("Jobs_Master", "job_uid", jobUid);
  }

  private async getRawDocumentRow(documentUid: string): Promise<Row | null> {
    return this.findRow("Job_Documents", "document_uid", documentUid);
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

  async listJobsForUser(user: SessionUser): Promise<JobRow[]> {
    return (await this.rows("Jobs_Master")).map(parseJobRow).filter((job) => canReadJob(user, job));
  }

  async getJob(jobUid: string): Promise<JobRow | null> {
    const row = await this.getRawJobRow(jobUid);
    return row ? parseJobRow(row) : null;
  }

  async updateJobStatus(args: {
    jobUid: string;
    status: JobRow["status"];
    expectedRowVersion: number;
    ctx: { correlationId: string; actorUserUid: string };
  }): Promise<{ job: JobRow; conflict: ConflictPayload | null }> {
    const currentRaw = await this.getRawJobRow(args.jobUid);
    if (!currentRaw) {
      throw new Error(`Unknown job ${args.jobUid}`);
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
      ...bumpMutableMeta(current, args.ctx.actorUserUid, args.ctx.correlationId)
    };

    await this.rails.sheets.upsertRow("Jobs_Master", "job_uid", serializeJobRow(updated, currentRaw));
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
    const currentRaw = await this.getRawJobRow(args.jobUid);
    if (!currentRaw) {
      throw new Error(`Unknown job ${args.jobUid}`);
    }

    const current = parseJobRow(currentRaw);
    if (current.row_version !== args.expectedRowVersion) {
      return { job: current, conflict: conflictFor(current, args.expectedRowVersion) };
    }

    const updated: JobRow = {
      ...current,
      last_note: args.note,
      ...bumpMutableMeta(current, args.ctx.actorUserUid, args.ctx.correlationId)
    };

    await this.rails.sheets.upsertRow("Jobs_Master", "job_uid", serializeJobRow(updated, currentRaw));
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
    await this.rails.sheets.appendRow("Job_Events", serializeJobEventRow(event));
  }

  async createScheduleRequest(row: ScheduleRequestRow): Promise<void> {
    await this.rails.sheets.appendRow("Schedule_Requests", stringifyRow(row));
  }

  async getScheduleRequest(requestUid: string): Promise<ScheduleRequestRow | null> {
    const row = await this.findRow("Schedule_Requests", "request_uid", requestUid);
    return row ? parseScheduleRequest(row) : null;
  }

  async listScheduleRequests(jobUid?: string): Promise<ScheduleRequestRow[]> {
    return (await this.rows("Schedule_Requests"))
      .map(parseScheduleRequest)
      .filter((row) => (jobUid ? row.job_uid === jobUid : true))
      .sort((a, b) => b.updated_at.localeCompare(a.updated_at));
  }

  async upsertScheduleRequest(row: ScheduleRequestRow): Promise<void> {
    await this.rails.sheets.upsertRow("Schedule_Requests", "request_uid", stringifyRow(row));
  }

  async createSchedule(row: ScheduleRow): Promise<void> {
    await this.rails.sheets.appendRow("Schedules_Master", stringifyRow(row));
  }

  async getSchedule(scheduleUid: string): Promise<ScheduleRow | null> {
    const row = await this.findRow("Schedules_Master", "schedule_uid", scheduleUid);
    return row ? parseSchedule(row) : null;
  }

  async listSchedules(jobUid?: string): Promise<ScheduleRow[]> {
    return (await this.rows("Schedules_Master"))
      .map(parseSchedule)
      .filter((row) => (jobUid ? row.job_uid === jobUid : true))
      .sort((a, b) => b.updated_at.localeCompare(a.updated_at));
  }

  async upsertSchedule(row: ScheduleRow): Promise<void> {
    await this.rails.sheets.upsertRow("Schedules_Master", "schedule_uid", stringifyRow(row));
  }

  async createDocument(row: JobDocumentRow): Promise<void> {
    const relatedJob = (await this.getRawJobRow(row.job_uid)) ?? {};
    await this.rails.sheets.appendRow("Job_Documents", serializeDocumentRow(row, {}, relatedJob));
    await this.rails.sheets.upsertRow("Portal_Files", "file_uid", serializePortalFileRow(row, {}, relatedJob));
  }

  async getDocument(documentUid: string): Promise<JobDocumentRow | null> {
    const row = await this.getRawDocumentRow(documentUid);
    if (!row) {
      return null;
    }

    const portalFiles = await this.rows("Portal_Files");
    return parseDocument(row, findPortalFileForDocument(row, portalFiles));
  }

  async upsertDocument(row: JobDocumentRow): Promise<void> {
    const existingDocument = (await this.getRawDocumentRow(row.document_uid)) ?? {};
    const relatedJob = (await this.getRawJobRow(row.job_uid)) ?? {};
    const portalFiles = await this.rows("Portal_Files");
    const portalLookupSource =
      field(existingDocument, "document_uid") !== ""
        ? existingDocument
        : { document_uid: row.document_uid, job_uid: row.job_uid, document_type: String(row.document_type) };
    const existingPortalFile = findPortalFileForDocument(portalLookupSource as Row, portalFiles) ?? {};

    await this.rails.sheets.upsertRow("Job_Documents", "document_uid", serializeDocumentRow(row, existingDocument, relatedJob));
    await this.rails.sheets.upsertRow("Portal_Files", "file_uid", serializePortalFileRow(row, existingPortalFile, relatedJob));
  }

  async listDocuments(jobUid?: string): Promise<JobDocumentRow[]> {
    const [documentRows, portalFiles] = await Promise.all([this.rows("Job_Documents"), this.rows("Portal_Files")]);
    return documentRows
      .filter((row) => (jobUid ? field(row, "job_uid") === jobUid : true))
      .map((row) => parseDocument(row, findPortalFileForDocument(row, portalFiles)));
  }

  async appendAudit(args: {
    action: string;
    payload: Record<string, unknown>;
    ctx: { correlationId: string; actorUserUid: string };
    entry_type?: string;
  }): Promise<void> {
    await this.rails.sheets.appendRow("Ledger", {
      ledger_uid: `AUD-${crypto.randomUUID()}`,
      entry_type: args.entry_type || "system_audit",
      action: args.action,
      entity_type: String(args.payload.entity || "system"),
      entity_id: String(args.payload.id || args.payload.job_uid || ""),
      payload_json: JSON.stringify(args.payload),
      row_version: "1",
      updated_at: nowIso(),
      updated_by: args.ctx.actorUserUid,
      correlation_id: args.ctx.correlationId
    });
  }

  async listAudits(): Promise<Array<Record<string, string>>> {
    return this.rows("Ledger");
  }

  async upsertAutomationJob(row: AutomationJobRow): Promise<void> {
    await this.rails.sheets.upsertRow("Automation_Jobs", "automation_job_uid", stringifyRow(row));
  }

  async getAutomationJob(automationJobUid: string): Promise<AutomationJobRow | null> {
    const row = await this.findRow("Automation_Jobs", "automation_job_uid", automationJobUid);
    return row ? parseAutomation(row) : null;
  }

  async listAutomationJobs(): Promise<AutomationJobRow[]> {
    return (await this.rows("Automation_Jobs"))
      .map(parseAutomation)
      .sort((a, b) => b.updated_at.localeCompare(a.updated_at));
  }

  async upsertSyncQueue(row: SyncQueueRow): Promise<void> {
    await this.rails.sheets.upsertRow("Sync_Queue", "mutation_uid", stringifyRow(row));
  }

  async getSyncQueue(mutationUid: string): Promise<SyncQueueRow | null> {
    const row = await this.findRow("Sync_Queue", "mutation_uid", mutationUid);
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

      const rawJob = await this.getRawJobRow(mutation.job_uid);
      const job = rawJob ? parseJobRow(rawJob) : null;
      if (!job || !rawJob) {
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

        await this.rails.sheets.upsertRow("Jobs_Master", "job_uid", serializeJobRow(updated, rawJob));
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
    const rawJob = await this.getRawJobRow(args.jobUid);
    const job = rawJob ? parseJobRow(rawJob) : null;
    if (!job || !rawJob) {
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
    if (typeof patch.last_note === "string" && patch.last_note.trim() !== "") {
      job.last_note = patch.last_note;
    }

    const updated = {
      ...job,
      ...bumpMutableMeta(job, args.ctx.actorUserUid, args.ctx.correlationId)
    };
    await this.rails.sheets.upsertRow("Jobs_Master", "job_uid", serializeJobRow(updated, rawJob));

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
