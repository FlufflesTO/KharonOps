/**
 * Project KharonOps - Normalization Utilities
 * Purpose: Centralized logic for parsing, cleaning, and normalizing data from legacy sources (Sheets).
 * Dependencies: ./types.js
 * Structural Role: Domain-level utilities for data consistency.
 */

import type { 
  EnquiryType, 
  JobRow, 
  UserRow, 
  ClientRow, 
  TechnicianRow, 
  ScheduleRequestRow, 
  ScheduleRow, 
  JobEventRow, 
  FinanceQuoteRow, 
  FinanceInvoiceRow, 
  FinanceStatementRow, 
  FinanceDebtorRow, 
  EscrowRow, 
  SkillMatrixRow, 
  AutomationJobRow, 
  SyncQueueRow,
  JobDocumentRow
} from "./types.js";


export type DomainRow = Record<string, unknown>;
type Row = DomainRow;

export const ROLE_LABELS: Record<string, string> = {
  client: "Client",
  technician: "Technician",
  dispatcher: "Dispatch",
  finance: "Finance",
  admin: "Admin",
  super_admin: "Super Admin"
};

export function normalizeValue(value: unknown): string {
  return String(value ?? "").trim();
}

export function field(row: Row | null | undefined, ...keys: string[]): string {
  for (const key of keys) {
    const value = normalizeValue(row?.[key as keyof typeof row]);
    if (value !== "") {
      return value;
    }
  }
  return "";
}

export function firstNonEmpty(...values: string[]): string {
  for (const value of values) {
    const normalized = normalizeValue(value);
    if (normalized !== "") {
      return normalized;
    }
  }
  return "";
}

export function toNum(value: string | number | null | undefined): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function normalizeToken(value: string): string {
  return normalizeValue(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function parseBoolean(value: string | boolean | null | undefined): boolean {
  if (typeof value === "boolean") return value;
  const normalized = normalizeToken(String(value ?? ""));
  return normalized === "true" || normalized === "1" || normalized === "yes" || normalized === "y";
}

export function boolString(value: string | boolean | null | undefined): "true" | "false" {
  return parseBoolean(value) ? "true" : "false";
}

export function legacyBool(value: boolean | string | null | undefined): string {
  return typeof value === "boolean" ? (value ? "TRUE" : "FALSE") : parseBoolean(value) ? "TRUE" : "FALSE";
}

export function asDateCell(value: string | null | undefined): string {
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
  return new Date(parsed).toISOString().split("T")[0] ?? "";
}

/**
 * safeJsonParse - safely parses JSON or returns an empty object.
 */
export function safeJsonParse(value: string | null | undefined): Record<string, unknown> {
  if (!value) return {};
  try {
    const parsed = JSON.parse(value);
    if (parsed && typeof parsed === "object") {
      return parsed as Record<string, unknown>;
    }
  } catch {
    // Ignore malformed payloads.
  }
  return {};
}

/**
 * stringifyRow - Converts a domain record back into a raw string-based row for legacy stores (Sheets).
 */
export function stringifyRow(record: Record<string, unknown> | object): Record<string, string> {
  const row: Record<string, string> = {};
  for (const [key, value] of Object.entries(record)) {
    if (value === null || value === undefined) {
      row[key] = "";
    } else if (typeof value === "object") {
      row[key] = JSON.stringify(value);
    } else {
      row[key] = String(value);
    }
  }
  return row;
}

/**
 * Row Parsers - Canonical mappers for Sheet data
 */

export function parseJobTitle(row: Row): string {
  const details = field(row, "title", "details_of_works");
  if (details !== "") {
    return details;
  }

  const requestType = field(row, "request_type");
  if (requestType !== "" && normalizeToken(requestType) !== "operational_job") {
    return requestType;
  }

  return firstNonEmpty(field(row, "system_type"), field(row, "site"), field(row, "job_id"));
}

export function jobStatusLabel(status: JobRow["status"]): string {
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

export function parseJobStatus(row: Row): JobRow["status"] {
  const raw = firstNonEmpty(
    field(row, "status"), 
    field(row, "job_status"), 
    field(row, "status_raw"), 
    field(row, "billing_status")
  );
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

export function parseUserRow(row: Row): UserRow {
  return {
    user_id: field(row, "user_id"),
    email: field(row, "email"),
    display_name: field(row, "display_name"),
    role: field(row, "role") as UserRow["role"],
    client_id: field(row, "client_id"),
    technician_id: field(row, "technician_id"),
    active: boolString(field(row, "active", "active_flag")),
    row_version: Math.max(1, toNum(field(row, "row_version"))),
    updated_at: firstNonEmpty(field(row, "updated_at"), field(row, "last_sync_at")),
    updated_by: firstNonEmpty(field(row, "updated_by"), field(row, "display_name")),
    correlation_id: firstNonEmpty(field(row, "correlation_id"), field(row, "email"), field(row, "user_id"))
  };
}

export function parseClientRow(row: Row): ClientRow {
  return {
    client_id: field(row, "client_id"),
    client_name: firstNonEmpty(field(row, "client_name"), field(row, "account"), field(row, "billing_entity")),
    billing_entity: firstNonEmpty(field(row, "billing_entity"), field(row, "client_name")),
    ops_email: field(row, "ops_email", "email"),
    active: boolString(field(row, "active_flag", "active"))
  };
}

export function parseTechnicianRow(row: Row): TechnicianRow {
  return {
    technician_id: field(row, "technician_id"),
    display_name: firstNonEmpty(field(row, "display_name"), field(row, "technician_name")),
    active: boolString(field(row, "active_flag", "active"))
  };
}

export function parseJobRow(row: Row): JobRow {
  return {
    job_id: field(row, "job_id"),
    client_id: field(row, "client_id"),
    site_id: field(row, "site_id"),
    technician_id: field(row, "technician_id", "primary_technician_id"),
    title: parseJobTitle(row),
    status: parseJobStatus(row),
    scheduled_start: firstNonEmpty(field(row, "scheduled_start"), field(row, "date_scheduled"), field(row, "initial_date"), field(row, "response_due_at")),
    scheduled_end: firstNonEmpty(field(row, "scheduled_end"), field(row, "completion_due_at"), field(row, "date_completed")),
    last_note: firstNonEmpty(field(row, "last_note"), field(row, "legacy_formula_notes"), field(row, "next_action_type"), field(row, "billing_notes")),
    row_version: Math.max(1, toNum(field(row, "row_version"))),
    updated_at: firstNonEmpty(field(row, "updated_at"), field(row, "last_sync_at"), field(row, "last_contact_at"), field(row, "date_completed"), field(row, "initial_date")),
    updated_by: firstNonEmpty(field(row, "updated_by"), field(row, "dispatcher_owner"), field(row, "job_owner"), field(row, "primary_technician_name")),
    correlation_id: firstNonEmpty(field(row, "correlation_id"), field(row, "source_refs"), field(row, "source_submission_id"), field(row, "legacy_job_id"), field(row, "job_id"))
  };
}

export function parseScheduleRequest(row: Row): ScheduleRequestRow {
  return {
    request_id: field(row, "request_id"),
    job_id: field(row, "job_id"),
    client_id: field(row, "client_id"),
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

export function parseSchedule(row: Row): ScheduleRow {
  return {
    schedule_id: field(row, "schedule_id"),
    request_id: field(row, "request_id"),
    job_id: field(row, "job_id"),
    calendar_event_id: field(row, "calendar_event_id"),
    start_at: field(row, "start_at"),
    end_at: field(row, "end_at"),
    technician_id: field(row, "technician_id"),
    status: field(row, "status") as ScheduleRow["status"],
    row_version: toNum(field(row, "row_version")),
    updated_at: field(row, "updated_at"),
    updated_by: field(row, "updated_by"),
    correlation_id: field(row, "correlation_id")
  };
}

export function parseJobEvent(row: Row): JobEventRow {
  const updated_at = field(row, "updated_at");
  const updated_by = field(row, "updated_by");
  return {
    event_id: field(row, "event_id"),
    job_id: field(row, "job_id"),
    event_type: field(row, "event_type"),
    payload_json: field(row, "payload_json"),
    row_version: toNum(field(row, "row_version")),
    updated_at: updated_at,
    updated_by: updated_by,
    correlation_id: field(row, "correlation_id"),
    created_at: String(row.created_at ?? updated_at ?? ""),
    created_by: String(row.created_by ?? updated_by ?? "")
  };
}

export function parseFinanceQuote(row: Row): FinanceQuoteRow {
  return {
    quote_id: field(row, "quote_id"),
    job_id: field(row, "job_id"),
    client_id: field(row, "client_id"),
    description: field(row, "description"),
    amount: toNum(field(row, "amount")),
    status: field(row, "status") as FinanceQuoteRow["status"],
    created_at: field(row, "created_at"),
    row_version: Math.max(1, toNum(field(row, "row_version"))),
    updated_at: field(row, "updated_at"),
    updated_by: field(row, "updated_by"),
    correlation_id: field(row, "correlation_id")
  };
}

export function parseFinanceInvoice(row: Row): FinanceInvoiceRow {
  return {
    invoice_id: field(row, "invoice_id"),
    job_id: field(row, "job_id"),
    quote_id: field(row, "quote_id"),
    client_id: field(row, "client_id"),
    amount: toNum(field(row, "amount")),
    due_date: field(row, "due_date"),
    status: field(row, "status") as FinanceInvoiceRow["status"],
    reconciled_at: field(row, "reconciled_at"),
    row_version: Math.max(1, toNum(field(row, "row_version"))),
    updated_at: field(row, "updated_at"),
    updated_by: field(row, "updated_by"),
    correlation_id: field(row, "correlation_id")
  };
}

export function parseFinanceStatement(row: Row): FinanceStatementRow {
  return {
    statement_id: field(row, "statement_id"),
    client_id: field(row, "client_id"),
    period_label: field(row, "period_label"),
    opening_balance: toNum(field(row, "opening_balance")),
    billed: toNum(field(row, "billed")),
    paid: toNum(field(row, "paid")),
    closing_balance: toNum(field(row, "closing_balance")),
    generated_at: field(row, "generated_at"),
    row_version: Math.max(1, toNum(field(row, "row_version"))),
    updated_at: field(row, "updated_at"),
    updated_by: field(row, "updated_by"),
    correlation_id: field(row, "correlation_id")
  };
}

export function parseFinanceDebtor(row: Row): FinanceDebtorRow {
  return {
    client_id: field(row, "client_id"),
    total_due: toNum(field(row, "total_due")),
    current_bucket: toNum(field(row, "current_bucket")),
    bucket_30: toNum(field(row, "bucket_30")),
    bucket_60: toNum(field(row, "bucket_60")),
    bucket_90_plus: toNum(field(row, "bucket_90_plus")),
    risk_band: (field(row, "risk_band") || "low") as FinanceDebtorRow["risk_band"],
    row_version: Math.max(1, toNum(field(row, "row_version"))),
    updated_at: field(row, "updated_at"),
    updated_by: field(row, "updated_by"),
    correlation_id: field(row, "correlation_id")
  };
}

export function parseEscrow(row: Row): EscrowRow {
  return {
    document_id: field(row, "document_id"),
    invoice_id: field(row, "invoice_id"),
    status: field(row, "status") as EscrowRow["status"],
    locked_at: field(row, "locked_at"),
    released_at: field(row, "released_at"),
    row_version: Math.max(1, toNum(field(row, "row_version"))),
    updated_at: field(row, "updated_at"),
    updated_by: field(row, "updated_by"),
    correlation_id: field(row, "correlation_id")
  };
}

export function parseSkillMatrix(row: Row): SkillMatrixRow {
  return {
    user_id: field(row, "user_id"),
    saqcc_type: field(row, "saqcc_type"),
    saqcc_expiry: field(row, "saqcc_expiry"),
    medical_expiry: field(row, "medical_expiry"),
    rest_hours_last_24h: toNum(field(row, "rest_hours_last_24h")),
    row_version: Math.max(1, toNum(field(row, "row_version"))),
    updated_at: field(row, "updated_at"),
    updated_by: field(row, "updated_by"),
    correlation_id: field(row, "correlation_id")
  };
}

export function parseAutomation(row: Row): AutomationJobRow {
  return {
    automation_job_id: field(row, "automation_job_id"),
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

export function parseSyncQueue(row: Row): SyncQueueRow {
  return {
    mutation_id: field(row, "mutation_id"),
    job_id: field(row, "job_id"),
    actor_id: field(row, "actor_id"),
    payload_json: field(row, "payload_json"),
    status: field(row, "status") as SyncQueueRow["status"],
    last_result: field(row, "last_result"),
    row_version: toNum(field(row, "row_version")),
    updated_at: field(row, "updated_at"),
    updated_by: field(row, "updated_by"),
    correlation_id: field(row, "correlation_id")
  };
}

export function parseDocumentType(value: string): JobDocumentRow["document_type"] {
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

export function parseDocumentStatus(row: Row, portalFile?: Row | null): JobDocumentRow["status"] {
  if (parseBoolean(field(portalFile, "visible_to_client", "portal_visible")) || field(portalFile, "source_url", "published_url") !== "") {
    return "published";
  }
  if (field(row, "published_url") !== "") {
    return "published";
  }
  return "generated";
}

export function portalFileDocumentId(row: Row): string {
  const notes = field(row, "notes");
  const match = notes.match(/document_id:([A-Za-z0-9-]+)/);
  return match?.[1] ?? "";
}

export function fileRoleForDocumentType(documentType: string): string {
  const normalized = normalizeToken(documentType);
  if (normalized.includes("jobcard")) {
    return "jobcard_pdf";
  }
  if (normalized.includes("certificate") || normalized.includes("coc")) {
    return "certificate_pdf";
  }
  return "report_pdf";
}

export function fileCategoryForDocumentType(documentType: string): string {
  const normalized = normalizeToken(documentType);
  if (normalized.includes("jobcard")) {
    return "jobcard";
  }
  if (normalized.includes("certificate") || normalized.includes("coc")) {
    return "certificate";
  }
  return "report";
}

export function fileIdForDocument(documentId: string): string {
  return `FIL-${documentId.replace(/^DOC-/, "")}`;
}

export function managedPortalFileNote(documentId: string): string {
  return `Managed by KharonOps app for document_id:${documentId}`;
}

export function templateIdForDocumentType(documentType: string): string {
  const normalized = normalizeToken(documentType);
  if (normalized.includes("jobcard")) {
    return "TPL-JOBCARD";
  }
  if (normalized.includes("certificate") || normalized.includes("coc")) {
    return "TPL-CERTIFICATE";
  }
  return "TPL-SERVICE-REPORT";
}

export function parseDocumentRow(row: Row, portalFile?: Row | null): JobDocumentRow {
  const status = parseDocumentStatus(row, portalFile);
  return {
    document_id: field(row, "document_id"),
    job_id: field(row, "job_id"),
    document_type: parseDocumentType(field(row, "document_type")),
    status,
    drive_file_id: field(row, "drive_file_id"),
    pdf_file_id: firstNonEmpty(field(portalFile, "drive_file_id"), field(row, "pdf_file_id")),
    published_url: firstNonEmpty(field(portalFile, "source_url"), field(row, "published_url")),
    client_visible: status === "published" || parseBoolean(field(portalFile, "visible_to_client", "portal_visible")),
    row_version: Math.max(1, Number(field(row, "row_version") || "0")),
    updated_at: firstNonEmpty(field(row, "updated_at"), field(row, "last_sync_at"), field(row, "sent_at"), field(row, "requested_at")),
    updated_by: firstNonEmpty(field(row, "updated_by"), field(row, "assigned_to"), field(row, "requested_by"), field(row, "job_owner")),
    correlation_id: firstNonEmpty(field(row, "correlation_id"), field(row, "source_refs"), field(row, "legacy_document_id"), field(row, "document_id"))
  };
}
export function serializeJobRow(record: JobRow, existing: Row = {}): Row {
  const row = { ...existing };
  row.job_id = record.job_id;
  row.row_version = String(record.row_version);
  row.api_locked = firstNonEmpty(field(existing, "api_locked"), "FALSE");
  row.sync_status = firstNonEmpty(field(existing, "sync_status"), "ready");
  row.last_sync_at = record.updated_at;
  row.last_sync_error = "";
  row.source_system = firstNonEmpty(field(existing, "source_system"), "kharon_portal");
  row.client_id = record.client_id;
  row.site_id = record.site_id;
  row.primary_technician_id = record.technician_id;
  if (record.technician_id !== "" && field(existing, "technician_raw") === "") {
    row.technician_raw = record.technician_id;
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

export function serializeJobEventRow(event: JobEventRow, existing: Row = {}): Row {
  const row = { ...existing };
  row.event_id = event.event_id;
  row.job_id = event.job_id;
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
  const payload = safeJsonParse(event.payload_json);
  row.old_value = firstNonEmpty(String(payload.from ?? ""), field(existing, "old_value"));
  row.new_value = firstNonEmpty(String(payload.to ?? payload.note ?? ""), field(existing, "new_value"));
  row.notes = firstNonEmpty(String(payload.note ?? ""), field(existing, "notes"), event.payload_json);
  return row;
}

export function serializeDocumentRow(record: JobDocumentRow, existing: Row = {}, relatedJob: Row = {}): Row {
  const row = { ...existing };
  row.document_id = record.document_id;
  row.status = record.status;
  row.row_version = String(record.row_version);
  row.sync_status = record.status === "published" ? "published" : firstNonEmpty(field(existing, "sync_status"), "ready");
  row.last_sync_at = record.updated_at;
  row.last_sync_error = "";
  row.job_id = record.job_id;
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
  row.document_type = String(record.document_type);
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
  row.pdf_file_id = record.pdf_file_id;
  row.published_url = record.published_url;
  row.client_visible = legacyBool(record.client_visible);
  row.drive_folder_id = firstNonEmpty(field(existing, "drive_folder_id"), field(relatedJob, "drive_folder_id"));
  row.portal_visible = legacyBool(record.published_url !== "");
  row.source_sheet = firstNonEmpty(field(existing, "source_sheet"), "KharonOps API");
  row.source_row = field(existing, "source_row");
  row.source_refs = firstNonEmpty(field(existing, "source_refs"), record.correlation_id);
  row.source_occurrences = firstNonEmpty(field(existing, "source_occurrences"), "1");
  return row;
}

export function serializePortalFileRow(record: JobDocumentRow, existing: Row = {}, relatedJob: Row = {}): Row {
  const row = { ...existing };
  row.file_id = firstNonEmpty(field(existing, "file_id"), fileIdForDocument(record.document_id));
  row.job_id = record.job_id;
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
  row.notes = managedPortalFileNote(record.document_id);
  return row;
}

/**
 * findPortalFileForDocument — finds the matching record in the Portal_Files sheet
 * for a given record from the Job_Documents sheet.
 *
 * Logic:
 * 1. Try to match by document_id exactly.
 * 2. If not found, try to match by job_id + file_role (derived from document_type).
 * 3. Fallback to the first file for the same job.
 */
export function findPortalFileForDocument(documentRow: Row, portalFiles: Row[]): Row | null {
  const documentid = field(documentRow, "document_id");
  const managed = portalFiles.find((file) => portalFileDocumentId(file) === documentid);
  if (managed) {
    return managed;
  }

  const jobid = field(documentRow, "job_id");
  const sameJob = portalFiles.filter((file) => field(file, "job_id") === jobid);
  if (sameJob.length === 0) {
    return null;
  }

  const expectedRole = normalizeToken(fileRoleForDocumentType(field(documentRow, "document_type")));
  const sameRole = sameJob.find((file) => normalizeToken(field(file, "file_role")) === expectedRole);
  return sameRole ?? sameJob[0] ?? null;
}

/**
 * Labels & Formatting
 */

export function enquiryTypeLabel(type: EnquiryType): string {
  switch (type) {
    case "project":
      return "New Project";
    case "maintenance":
      return "Maintenance Contract";
    case "urgent_callout":
      return "Urgent Callout";
    case "compliance":
      return "Compliance Request";
    case "resource":
      return "Resource Request";
    default:
      return "General Enquiry";
  }
}

export function formatLabel(value: string | undefined): string {
  if (!value) return "";
  return value
    .split(/[_-]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function formatStatusIcon(value: string | undefined): string {
  if (value === "PASS") {
    return "☑ PASS";
  }
  if (value === "FAIL") {
    return "☒ FAIL";
  }
  return "☐ N/A";
}

const DOCUMENT_TIME_ZONE = "Africa/Johannesburg";

export function formatDateTime(iso: string | undefined): string {
  if (!iso) return "N/A";
  return new Date(iso).toLocaleString("en-ZA", { timeZone: DOCUMENT_TIME_ZONE });
}

export function formatDateOnly(iso: string | undefined): string {
  if (!iso) return "N/A";
  return new Date(iso).toLocaleDateString("en-ZA", { timeZone: DOCUMENT_TIME_ZONE });
}

export function formatTimeOnly(iso: string | undefined): string {
  if (!iso) return "N/A";
  return new Date(iso).toLocaleTimeString("en-ZA", { timeZone: DOCUMENT_TIME_ZONE });
}

export function formatDatePDF(iso: string | undefined): string {
  if (!iso) return "N/A";
  const date = new Date(iso);
  const day = String(date.getDate()).padStart(2, '0');
  const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
  const month = monthNames[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}
