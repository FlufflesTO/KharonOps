import type { JobDocumentRow } from "@kharon/domain";

export type SheetsRow = Record<string, string>;

const PORTAL_FILE_DOCUMENT_NOTE_PREFIX = "Managed by KharonOps app for document_id:";

function normalizeValue(value: unknown): string {
  return String(value ?? "").trim();
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

function legacyBool(value: boolean | string): string {
  return typeof value === "boolean" ? (value ? "TRUE" : "FALSE") : parseBoolean(value) ? "TRUE" : "FALSE";
}

function field(row: SheetsRow | null | undefined, ...keys: string[]): string {
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

function parseDocumentStatus(row: SheetsRow, portalFile?: SheetsRow | null): JobDocumentRow["status"] {
  if (parseBoolean(field(portalFile, "visible_to_client", "portal_visible")) || field(portalFile, "source_url", "published_url") !== "") {
    return "published";
  }
  if (field(row, "published_url") !== "") {
    return "published";
  }
  return "generated";
}

function portalFileDocumentid(row: SheetsRow): string {
  const notes = field(row, "notes");
  const match = notes.match(/document_id:([A-Za-z0-9-]+)/);
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

function fileidForDocument(documentid: string): string {
  return `FIL-${documentid.replace(/^DOC-/, "")}`;
}

function managedPortalFileNote(documentid: string): string {
  return `${PORTAL_FILE_DOCUMENT_NOTE_PREFIX}${documentid}`;
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

export function findPortalFileForDocument(documentRow: SheetsRow, portalFiles: SheetsRow[]): SheetsRow | null {
  const documentid = field(documentRow, "document_id");
  const managed = portalFiles.find((file) => portalFileDocumentid(file) === documentid);
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

export function parseDocumentRow(row: SheetsRow, portalFile?: SheetsRow | null): JobDocumentRow {
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

export function serializeDocumentRow(record: JobDocumentRow, existing: SheetsRow = {}, relatedJob: SheetsRow = {}): SheetsRow {
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

export function serializePortalFileRow(record: JobDocumentRow, existing: SheetsRow = {}, relatedJob: SheetsRow = {}): SheetsRow {
  const row = { ...existing };
  row.file_id = firstNonEmpty(field(existing, "file_id"), fileidForDocument(record.document_id));
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
