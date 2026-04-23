import type { JobDocumentRow, JobEventRow, JobStatus, ScheduleRequestRow, ScheduleRow, UserRow } from "@kharon/domain";
import type { UpgradeWorkspaceState } from "../apiClient";
import type { JobRecord } from "../components/JobListView";

function pickString(record: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    const value = record[key];
    const text = String(value ?? "").trim();
    if (text !== "") {
      return text;
    }
  }
  return "";
}

function pickNumber(record: Record<string, unknown>, ...keys: string[]): number {
  for (const key of keys) {
    const value = Number(record[key] ?? NaN);
    if (Number.isFinite(value)) {
      return value;
    }
  }
  return 0;
}

export function asJob(record: Record<string, unknown>): JobRecord {
  const status = String(record.status ?? "draft") as JobStatus;

  return {
    job_id: pickString(record, "job_id"),
    title: String(record.title ?? ""),
    status,
    row_version: pickNumber(record, "row_version"),
    client_id: pickString(record, "client_id"),
    technician_id: pickString(record, "technician_id", "primary_technician_id"),
    client_name: String(record.client_name ?? ""),
    technician_name: String(record.technician_name ?? ""),
    updated_at: String(record.updated_at ?? ""),
    site_id: pickString(record, "site_id"),
    site_lat: Number.isFinite(Number(record.site_lat ?? record.latitude ?? NaN)) ? Number(record.site_lat ?? record.latitude) : null,
    site_lng: Number.isFinite(Number(record.site_lng ?? record.longitude ?? NaN)) ? Number(record.site_lng ?? record.longitude) : null,
    last_note: String(record.last_note ?? ""),
    active_request_id: pickString(record, "active_request_id"),
    active_document_id: pickString(record, "active_document_id"),
    suggested_technician_id: pickString(record, "suggested_technician_id")
  };
}

export function normalizeScheduleRequest(record: Record<string, unknown>): ScheduleRequestRow {
  return {
    request_id: pickString(record, "request_id"),
    job_id: pickString(record, "job_id"),
    client_id: pickString(record, "client_id"),
    preferred_slots_json: String(record.preferred_slots_json ?? "[]"),
    timezone: String(record.timezone ?? ""),
    notes: String(record.notes ?? ""),
    status: (String(record.status ?? "requested") as ScheduleRequestRow["status"]),
    row_version: pickNumber(record, "row_version"),
    updated_at: String(record.updated_at ?? ""),
    updated_by: String(record.updated_by ?? ""),
    correlation_id: String(record.correlation_id ?? "")
  };
}

export function normalizeSchedule(record: Record<string, unknown>): ScheduleRow {
  return {
    schedule_id: pickString(record, "schedule_id"),
    request_id: pickString(record, "request_id"),
    job_id: pickString(record, "job_id"),
    calendar_event_id: String(record.calendar_event_id ?? ""),
    start_at: String(record.start_at ?? ""),
    end_at: String(record.end_at ?? ""),
    technician_id: pickString(record, "technician_id"),
    status: (String(record.status ?? "confirmed") as ScheduleRow["status"]),
    row_version: pickNumber(record, "row_version"),
    updated_at: String(record.updated_at ?? ""),
    updated_by: String(record.updated_by ?? ""),
    correlation_id: String(record.correlation_id ?? "")
  };
}

export function normalizeDocument(record: Record<string, unknown>): JobDocumentRow {
  return {
    document_id: pickString(record, "document_id"),
    job_id: pickString(record, "job_id"),
    document_type: (String(record.document_type ?? "service_report") as JobDocumentRow["document_type"]),
    status: (String(record.status ?? "generated") as JobDocumentRow["status"]),
    drive_file_id: String(record.drive_file_id ?? ""),
    pdf_file_id: String(record.pdf_file_id ?? ""),
    published_url: String(record.published_url ?? ""),
    client_visible: Boolean(record.client_visible ?? false),
    row_version: pickNumber(record, "row_version"),
    updated_at: String(record.updated_at ?? ""),
    updated_by: String(record.updated_by ?? ""),
    correlation_id: String(record.correlation_id ?? "")
  };
}

export function normalizeJobEvent(record: Record<string, unknown>): JobEventRow {
  return {
    event_id: String(record.event_id ?? ""),
    job_id: String(record.job_id ?? ""),
    event_type: String(record.event_type ?? ""),
    payload_json: String(record.payload_json ?? "{}"),
    row_version: Number(record.row_version ?? 1),
    updated_at: String(record.updated_at ?? ""),
    updated_by: String(record.updated_by ?? ""),
    correlation_id: String(record.correlation_id ?? ""),
    created_at: String(record.created_at ?? record.updated_at ?? ""),
    created_by: String(record.created_by ?? record.updated_by ?? "")
  };
}

export function normalizeUser(record: Record<string, unknown>): UserRow {
  return {
    user_id: pickString(record, "user_id"),
    email: String(record.email ?? ""),
    display_name: String(record.display_name ?? ""),
    role: String(record.role ?? "client") as UserRow["role"],
    client_id: pickString(record, "client_id"),
    technician_id: pickString(record, "technician_id"),
    active: String(record.active ?? "true") === "false" ? "false" : "true",
    row_version: pickNumber(record, "row_version"),
    updated_at: String(record.updated_at ?? ""),
    updated_by: String(record.updated_by ?? ""),
    correlation_id: String(record.correlation_id ?? "")
  };
}

export function nowPlusHours(hours: number): string {
  const value = new Date(Date.now() + hours * 60 * 60 * 1000);
  return value.toISOString().slice(0, 16);
}

export function toIsoOrNull(value: string): string | null {
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) {
    return null;
  }
  return new Date(parsed).toISOString();
}

export function toLocalInputValue(value: string): string {
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) {
    return nowPlusHours(1);
  }
  return new Date(parsed).toISOString().slice(0, 16);
}

export function distanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const r = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return r * c;
}

export function errorMessage(error: unknown): string {
  const typed = error as { error?: { message?: string } };
  return typed.error?.message ?? String(error);
}

export function errorCode(error: unknown): string {
  const typed = error as { error?: { code?: string } };
  return typed.error?.code ?? "";
}

export function formatApiFailure(error: unknown): string {
  const typed = error as {
    error?: { code?: string; message?: string; details?: unknown };
    correlation_id?: string;
  };
  const message = typed.error?.message ?? "Request failed";
  const code = typed.error?.code ? ` [${typed.error.code}]` : "";
  const correlation = typed.correlation_id ? ` (corr: ${typed.correlation_id})` : "";
  const details = typed.error?.details ? ` details=${JSON.stringify(typed.error.details)}` : "";
  return `${message}${code}${correlation}${details}`;
}

export function isUnauthorizedError(error: unknown): boolean {
  const code = errorCode(error);
  if (code === "unauthorized" || code === "forbidden") {
    return true;
  }
  return /401|unauthori[sz]ed|forbidden/i.test(errorMessage(error));
}

export function looksLikeJwt(token: string): boolean {
  const trimmed = token.trim();
  return trimmed.split(".").length === 3 && trimmed.length > 40;
}

export function firstRequestedSlot(request: ScheduleRequestRow | null): { start_at: string; end_at: string } | null {
  if (!request) {
    return null;
  }

  try {
    const parsed = JSON.parse(request.preferred_slots_json) as Array<{ start_at?: string; end_at?: string }>;
    const first = parsed[0];
    if (!first?.start_at || !first?.end_at) {
      return null;
    }
    return {
      start_at: first.start_at,
      end_at: first.end_at
    };
  } catch {
    return null;
  }
}

export const EMPTY_UPGRADE_STATE: UpgradeWorkspaceState = {
  quotes: [],
  invoices: [],
  statements: [],
  debtors: [],
  escrow: [],
  skills: []
};

export const ROLE_LABELS: Record<string, string> = {
  client: "Client",
  technician: "Technician",
  dispatcher: "Dispatch",
  finance: "Finance",
  admin: "Admin",
  super_admin: "Super Admin"
};

export const WORKSPACE_TOOL_META: Record<string, { label: string; helper: string }> = {
  jobs: { label: "My Jobs", helper: "Track progress and approvals" },
  schedule: { label: "Schedule Board", helper: "Assign and coordinate field visits" },
  documents: { label: "Documents", helper: "Access reports and certificates" },
  comms: { label: "Messages", helper: "Team and client communication" },
  finance: { label: "Finance", helper: "Quotes, invoices, and escrow controls" },
  people: { label: "Teams", helper: "Field team availability and skills" },
  admin: { label: "Settings", helper: "Office and business configuration" },
  admin_dashboard: { label: "Dashboard", helper: "Urgent office actions and summaries" },
  dispatch_dashboard: { label: "Dashboard", helper: "Dispatch priorities and urgent assignments" },
  dispatch_unassigned: { label: "Unassigned Jobs", helper: "Jobs waiting for team assignment" },
  dispatch_daily: { label: "Daily Plan", helper: "Today's work summary and risks" },
  tech_day: { label: "My Day", helper: "Today's next job and schedule overview" },
  tech_checkin: { label: "Check In / Out", helper: "Guided arrival and finish flow" },
  tech_help: { label: "Help", helper: "Contact office support and guidance" },
  client_overview: { label: "Overview", helper: "Active work and latest updates" },
  client_invoices: { label: "Invoices", helper: "View and pay outstanding balances" },
  client_support: { label: "Support", helper: "Request assistance or callbacks" },
  finance_overview: { label: "Overview", helper: "Finance summaries and urgent actions" },
  finance_quotes: { label: "Quotes", helper: "Create and manage customer quotes" },
  finance_invoices: { label: "Invoices", helper: "Generate and track customer invoices" },
  finance_payments: { label: "Payments", helper: "Record and reconcile customer payments" },
  finance_debtors: { label: "Money Owed", helper: "Track and follow up on overdue accounts" },
  finance_statements: { label: "Statements", helper: "Generate and send account statements" },
  sa_overview: { label: "Overview", helper: "Top platform issues and summaries" },
  sa_users: { label: "Users & Roles", helper: "Manage users and access levels" },
  sa_units: { label: "Business Units", helper: "Manage company branches and departments" },
  sa_checks: { label: "Data Checks", helper: "Validate ledger integrity and schema health" },
  sa_automations: { label: "Automations", helper: "Monitor and manage background tasks" },
  sa_health: { label: "System Health", helper: "Platform diagnostics and uptime" },
  sa_activity: { label: "Activity Log", helper: "Complete audit trail and event history" }
};

export const ROLE_PRIMARY_TOOLS: Record<string, string[]> = {
  client: ["client_overview", "jobs", "documents", "client_invoices", "client_support"],
  technician: ["tech_day", "jobs", "tech_checkin", "documents", "tech_help"],
  dispatcher: ["dispatch_dashboard", "schedule", "dispatch_unassigned", "people", "comms", "dispatch_daily"],
  finance: ["finance_overview", "finance_quotes", "finance_invoices", "finance_payments", "finance_debtors", "finance_statements"],
  admin: ["admin_dashboard", "jobs", "people", "documents", "schedule", "admin", "sa_health"],
  super_admin: ["sa_overview", "sa_users", "sa_units", "sa_checks", "sa_automations", "sa_health", "sa_activity"]
};

export const COPY_GLOSSARY = {
  documents: "Files",
  engagements: "Jobs",
  mutations: "Queued changes",
  governance: "Settings"
} as const;
