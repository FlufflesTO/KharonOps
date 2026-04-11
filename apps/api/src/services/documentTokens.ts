import type { DocumentType, JobRow, SessionUser, UserRow } from "@kharon/domain";

const BRAND_NAME = "Kharon Operations";
const BRAND_SHORT_NAME = "KharonOps";
const BRAND_PORTAL_NAME = "Kharon Operations Portal";
const DOCUMENT_TIME_ZONE = "Africa/Johannesburg";

function formatLabel(value: string): string {
  return value
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatDateTime(value: string): string {
  if (value.trim() === "") {
    return "";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  try {
    return new Intl.DateTimeFormat("en-ZA", {
      timeZone: DOCUMENT_TIME_ZONE,
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    }).format(parsed);
  } catch {
    return parsed.toISOString();
  }
}

function formatDateOnly(value: string): string {
  if (value.trim() === "") {
    return "";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  try {
    return new Intl.DateTimeFormat("en-ZA", {
      timeZone: DOCUMENT_TIME_ZONE,
      year: "numeric",
      month: "short",
      day: "2-digit"
    }).format(parsed);
  } catch {
    return parsed.toISOString().slice(0, 10);
  }
}

function formatTimeOnly(value: string): string {
  if (value.trim() === "") {
    return "";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  try {
    return new Intl.DateTimeFormat("en-ZA", {
      timeZone: DOCUMENT_TIME_ZONE,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    }).format(parsed);
  } catch {
    return parsed.toISOString().slice(11, 16);
  }
}

function resolveClientUser(users: UserRow[], clientUid: string): UserRow | null {
  return users.find((user) => user.role === "client" && user.client_uid === clientUid) ?? null;
}

function resolveTechnicianUser(users: UserRow[], technicianUid: string): UserRow | null {
  return users.find((user) => user.role === "technician" && user.technician_uid === technicianUid) ?? null;
}

function formatScheduleWindow(job: JobRow): string {
  if (job.scheduled_start.trim() === "" && job.scheduled_end.trim() === "") {
    return "";
  }

  if (job.scheduled_start.trim() !== "" && job.scheduled_end.trim() !== "") {
    return `${formatDateTime(job.scheduled_start)} to ${formatDateTime(job.scheduled_end)}`;
  }

  return formatDateTime(job.scheduled_start || job.scheduled_end);
}

export function buildDocumentTokens(args: {
  documentUid: string;
  documentType: DocumentType;
  job: JobRow;
  actor: SessionUser;
  users: UserRow[];
  generatedAt?: Date;
  overrides?: Record<string, string>;
}): Record<string, string> {
  const generatedAt = args.generatedAt ?? new Date();
  const generatedAtIso = generatedAt.toISOString();
  const clientUser = resolveClientUser(args.users, args.job.client_uid);
  const technicianUser = resolveTechnicianUser(args.users, args.job.technician_uid);
  const documentTypeLabel = args.documentType === "jobcard" ? "Jobcard" : "Service Report";

  return {
    brand_name: BRAND_NAME,
    brand_short_name: BRAND_SHORT_NAME,
    brand_portal_name: BRAND_PORTAL_NAME,
    document_uid: args.documentUid,
    document_type: args.documentType,
    document_type_label: documentTypeLabel,
    document_title: `${documentTypeLabel} ${args.job.job_uid}`,
    job_uid: args.job.job_uid,
    job_reference: args.job.job_uid,
    job_title: args.job.title,
    job_status: args.job.status,
    job_status_label: formatLabel(args.job.status),
    client_uid: args.job.client_uid,
    client_display_name: clientUser?.display_name ?? "",
    client_email: clientUser?.email ?? "",
    site_uid: args.job.site_uid,
    technician_uid: args.job.technician_uid,
    technician_display_name: technicianUser?.display_name ?? "",
    technician_email: technicianUser?.email ?? "",
    scheduled_start: args.job.scheduled_start,
    scheduled_start_display: formatDateTime(args.job.scheduled_start),
    scheduled_start_date: formatDateOnly(args.job.scheduled_start),
    scheduled_start_time: formatTimeOnly(args.job.scheduled_start),
    scheduled_end: args.job.scheduled_end,
    scheduled_end_display: formatDateTime(args.job.scheduled_end),
    scheduled_end_date: formatDateOnly(args.job.scheduled_end),
    scheduled_end_time: formatTimeOnly(args.job.scheduled_end),
    scheduled_window_display: formatScheduleWindow(args.job),
    last_note: args.job.last_note,
    prepared_by_name: args.actor.display_name,
    prepared_by_email: args.actor.email,
    prepared_by_role: formatLabel(args.actor.role),
    generated_at: generatedAtIso,
    generated_at_display: formatDateTime(generatedAtIso),
    generated_date: formatDateOnly(generatedAtIso),
    generated_time: formatTimeOnly(generatedAtIso),
    ...args.overrides
  };
}
