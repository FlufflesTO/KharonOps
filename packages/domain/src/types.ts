// Role union — canonical order reflects privilege escalation.
// super_admin is a platform-level role; it is hard-wired to specific email
// addresses in the auth layer and may never be stored in Users_Master.
export type Role = "client" | "technician" | "dispatcher" | "finance" | "admin" | "super_admin";

export type JobStatus =
  | "draft"       // Initial local state
  | "performed"   // Evidence captured and submitted by technician
  | "rejected"    // Determination failed; returns to technician
  | "approved"    // Determination passed; document generation unlocked
  | "certified"   // Document generated and promoted to canon
  | "cancelled";  // Formal cancellation of intent

export type DocumentType = "jobcard" | "service_report" | "certificate";

export interface MutableMeta {
  row_version: number;
  updated_at: string;
  updated_by: string;
  correlation_id: string;
}

export interface UserRow extends MutableMeta {
  user_uid: string;
  email: string;
  display_name: string;
  role: Role;
  client_uid: string;
  technician_uid: string;
  active: "true" | "false";
}

export interface JobRow extends MutableMeta {
  job_uid: string;
  client_uid: string;
  site_uid: string;
  technician_uid: string;
  title: string;
  status: JobStatus;
  scheduled_start: string;
  scheduled_end: string;
  last_note: string;
}

export interface JobEventRow extends MutableMeta {
  event_uid: string;
  job_uid: string;
  event_type: string;
  payload_json: string;
}

export interface JobDocumentRow extends MutableMeta {
  document_uid: string;
  job_uid: string;
  document_type: DocumentType;
  status: "generated" | "published";
  drive_file_id: string;
  pdf_file_id: string;
  published_url: string;
  client_visible: boolean;
}

export interface ScheduleRequestRow extends MutableMeta {
  request_uid: string;
  job_uid: string;
  client_uid: string;
  preferred_slots_json: string;
  timezone: string;
  notes: string;
  status: "requested" | "confirmed" | "rescheduled";
}

export interface ScheduleRow extends MutableMeta {
  schedule_uid: string;
  request_uid: string;
  job_uid: string;
  calendar_event_id: string;
  start_at: string;
  end_at: string;
  technician_uid: string;
  status: "confirmed" | "rescheduled";
}

export interface AutomationJobRow extends MutableMeta {
  automation_job_uid: string;
  action: string;
  payload_json: string;
  status: "queued" | "done" | "failed";
  retry_count: number;
  last_error: string;
}

export interface SyncQueueRow extends MutableMeta {
  mutation_uid: string;
  job_uid: string;
  actor_uid: string;
  payload_json: string;
  status: "applied" | "conflict" | "failed";
  last_result: string;
}

export interface FinanceQuoteRow extends MutableMeta {
  quote_uid: string;
  job_uid: string;
  client_uid: string;
  description: string;
  amount: number;
  status: "draft" | "sent" | "approved" | "rejected" | "invoiced";
  created_at: string;
}

export interface FinanceInvoiceRow extends MutableMeta {
  invoice_uid: string;
  job_uid: string;
  quote_uid: string;
  client_uid: string;
  amount: number;
  due_date: string;
  status: "issued" | "part_paid" | "paid" | "overdue";
  reconciled_at: string;
}

export interface FinanceStatementRow extends MutableMeta {
  statement_uid: string;
  client_uid: string;
  period_label: string;
  opening_balance: number;
  billed: number;
  paid: number;
  closing_balance: number;
  generated_at: string;
}

export interface FinanceDebtorRow extends MutableMeta {
  client_uid: string;
  total_due: number;
  current_bucket: number;
  bucket_30: number;
  bucket_60: number;
  bucket_90_plus: number;
  risk_band: "low" | "medium" | "high";
}

export interface EscrowRow extends MutableMeta {
  document_uid: string;
  invoice_uid: string;
  status: "locked" | "released";
  locked_at: string;
  released_at: string;
}

export interface SkillMatrixRow extends MutableMeta {
  user_uid: string;
  saqcc_type: string;
  saqcc_expiry: string;
  medical_expiry: string;
  rest_hours_last_24h: number;
}

/**
 * ClientRow — parsed from Clients_Master.
 * NOTE: This sheet currently lacks the full MutableMeta governance columns
 * (updated_at, updated_by, correlation_id, row_version). It does NOT extend
 * MutableMeta intentionally; adding those columns is tracked as a separate
 * schema migration task.
 */
export interface ClientRow {
  /** Primary key matching Jobs_Master.client_id (format: CLT-xxxxx). */
  client_id: string;
  client_name: string;
  billing_entity: string;
  ops_email: string;
  active: "true" | "false";
}

/**
 * TechnicianRow — parsed from Technicians_Master.
 * NOTE: Same governance-column gap as ClientRow above.
 */
export interface TechnicianRow {
  /** Primary key matching Jobs_Master.primary_technician_id (e.g., ROY001). */
  technician_id: string;
  /** Preferred display name (display_name > technician_name fallback). */
  display_name: string;
  active: "true" | "false";
}

export interface UpgradeWorkspaceState {
  quotes: FinanceQuoteRow[];
  invoices: FinanceInvoiceRow[];
  statements: FinanceStatementRow[];
  debtors: FinanceDebtorRow[];
  escrow: EscrowRow[];
  skills: SkillMatrixRow[];
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface ConflictPayload {
  type: "row_version_conflict";
  entity: string;
  entity_id: string;
  client_row_version: number;
  server_row_version: number;
  server_state: Record<string, unknown>;
}

export interface ApiEnvelope<T> {
  data: T | null;
  error: ApiError | null;
  correlation_id: string;
  row_version: number | null;
  conflict: ConflictPayload | null;
}

export interface SessionUser {
  user_uid: string;
  email: string;
  role: Role;
  display_name: string;
  client_uid: string;
  technician_uid: string;
}

export interface SyncMutation {
  mutation_id: string;
  kind: "job_status" | "job_note";
  job_uid: string;
  expected_row_version: number;
  payload: Record<string, unknown>;
}

export interface SyncPushResult {
  applied: Array<{ mutation_id: string; job_uid: string; row_version: number }>;
  conflicts: Array<{ mutation_id: string; job_uid: string; conflict: ConflictPayload }>;
  failed: Array<{ mutation_id: string; job_uid: string; error: ApiError }>;
}

export interface OfflineQueueItem extends SyncMutation {
  created_at: string;
}

export interface ReplayDecision {
  removeMutationIds: string[];
  keepMutationIds: string[];
}
