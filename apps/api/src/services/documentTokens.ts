import type { DocumentType, JobRow, SessionUser, UserRow } from "@kharon/domain";
import type { StructuralToken } from "@kharon/google";
import { generateQrDataUri } from "./qr.js";

const BRAND_NAME = "Kharon Fire & Security Solutions";
const BRAND_SHORT_NAME = "Kharon";
const BRAND_PORTAL_NAME = "Kharon Command Centre";
const DOCUMENT_TIME_ZONE = "Africa/Johannesburg";

function formatStatusIcon(value: string | undefined): string {
  if (value === "PASS") {
    return "☑ PASS";
  }
  if (value === "FAIL") {
    return "☒ FAIL";
  }
  return "☐ N/A";
}

// ... existing helpers (formatLabel, formatDateTime, etc.) ...

export function buildDocumentTokens(args: {
  documentUid: string;
  documentType: DocumentType;
  job: JobRow;
  actor: SessionUser;
  users: UserRow[];
  generatedAt?: Date;
  overrides?: Record<string, string>;
}): Record<string, StructuralToken> {
  const generatedAt = args.generatedAt ?? new Date();
  const generatedAtIso = generatedAt.toISOString();
  const clientUser = resolveClientUser(args.users, args.job.client_uid);
  const technicianUser = resolveTechnicianUser(args.users, args.job.technician_uid);
  const documentTypeLabel = args.documentType === "jobcard" ? "Jobcard" : "Service Report";

  const checklistRows: Array<Record<string, string>> = [];
  if (args.overrides) {
    Object.entries(args.overrides).forEach(([key, value]) => {
      checklistRows.push({
        requirement: formatLabel(key),
        status: formatStatusIcon(value)
      });
    });
  }

  const tokens: Record<string, StructuralToken> = {
    brand_name: { type: "text", value: BRAND_NAME },
    brand_short_name: { type: "text", value: BRAND_SHORT_NAME },
    brand_portal_name: { type: "text", value: BRAND_PORTAL_NAME },
    document_uid: { type: "text", value: args.documentUid },
    document_type: { type: "text", value: args.documentType },
    document_type_label: { type: "text", value: documentTypeLabel },
    document_title: { type: "text", value: `${documentTypeLabel} ${args.job.job_uid}` },
    job_uid: { type: "text", value: args.job.job_uid },
    job_reference: { type: "text", value: args.job.job_uid },
    job_title: { type: "text", value: args.job.title },
    job_status: { type: "text", value: args.job.status },
    job_status_label: { type: "text", value: formatLabel(args.job.status) },
    client_uid: { type: "text", value: args.job.client_uid },
    client_display_name: { type: "text", value: clientUser?.display_name ?? "" },
    client_email: { type: "text", value: clientUser?.email ?? "" },
    site_uid: { type: "text", value: args.job.site_uid },
    technician_uid: { type: "text", value: args.job.technician_uid },
    technician_display_name: { type: "text", value: technicianUser?.display_name ?? "" },
    technician_email: { type: "text", value: technicianUser?.email ?? "" },
    scheduled_start: { type: "text", value: args.job.scheduled_start },
    scheduled_start_display: { type: "text", value: formatDateTime(args.job.scheduled_start) },
    scheduled_start_date: { type: "text", value: formatDateOnly(args.job.scheduled_start) },
    scheduled_start_time: { type: "text", value: formatTimeOnly(args.job.scheduled_start) },
    scheduled_end: { type: "text", value: args.job.scheduled_end },
    scheduled_end_display: { type: "text", value: formatDateTime(args.job.scheduled_end) },
    scheduled_end_date: { type: "text", value: formatDateOnly(args.job.scheduled_end) },
    scheduled_end_time: { type: "text", value: formatTimeOnly(args.job.scheduled_end) },
    scheduled_window_display: { type: "text", value: formatScheduleWindow(args.job) },
    last_note: { type: "text", value: args.job.last_note },
    prepared_by_name: { type: "text", value: args.actor.display_name },
    prepared_by_email: { type: "text", value: args.actor.email },
    prepared_by_role: { type: "text", value: formatLabel(args.actor.role) },
    generated_at: { type: "text", value: generatedAtIso },
    generated_at_display: { type: "text", value: formatDateTime(generatedAtIso) },
    generated_date: { type: "text", value: formatDateOnly(generatedAtIso) },
    generated_time: { type: "text", value: formatTimeOnly(generatedAtIso) },
    sans_fire_standard: { type: "text", value: "SANS 10139" },
    sans_gas_standard: { type: "text", value: "SANS 14520" },

    // Level 2 Structural Tokens
    compliance_matrix: { type: "matrix", rows: checklistRows },
    document_qr: { 
      type: "image", 
      dataUri: generateQrDataUri(`https://www.tequit.co.za/p/doc/${args.documentUid}`) 
    }
  };

  if (args.overrides) {
    Object.entries(args.overrides).forEach(([key, value]) => {
      tokens[`chk_${key}`] = { type: "text", value: formatStatusIcon(value) };
    });
  }

  return tokens;
}


