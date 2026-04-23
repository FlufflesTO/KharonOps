import type {
  ApiEnvelope,
  AutomationJobRow,
  JobDocumentRow,
  JobEventRow,
  Role,
  ScheduleRequestRow,
  ScheduleRow,
  SyncMutation,
  SyncPushResult,
  UserRow
} from "@kharon/domain";

export type { ApiEnvelope, SyncMutation, SyncPushResult };

export interface PortalSession {
  session: {
    user_id: string;
    email: string;
    role: Role;
    display_name: string;
    client_id: string;
    technician_id: string;
  };
  mode: "local" | "production";
  rails_mode: "local" | "production";
}

export interface PortalSessionState {
  authenticated: boolean;
  session: PortalSession["session"] | null;
  mode: "local" | "production";
  rails_mode: "local" | "production";
}

export interface PortalAuthConfig {
  mode: "local" | "production";
  google_client_id: string;
  dev_tokens_enabled: boolean;
}

export interface PortalDispatchContext {
  requests: ScheduleRequestRow[];
  schedules: ScheduleRow[];
  documents: JobDocumentRow[];
  technicians: UserRow[];
}

export type PeopleDirectoryEntry = UserRow;
export type AutomationJobEntry = AutomationJobRow;

export interface FinanceQuoteRecord {
  quote_id: string;
  job_id: string;
  client_id: string;
  description: string;
  amount: number;
  status: "draft" | "sent" | "approved" | "rejected" | "invoiced";
  created_at: string;
}

export interface FinanceInvoiceRecord {
  invoice_id: string;
  job_id: string;
  quote_id: string;
  client_id: string;
  amount: number;
  due_date: string;
  status: "issued" | "part_paid" | "paid" | "overdue";
  reconciled_at: string;
}

export interface FinanceStatementRecord {
  statement_id: string;
  client_id: string;
  period_label: string;
  opening_balance: number;
  billed: number;
  paid: number;
  closing_balance: number;
  generated_at: string;
}

export interface FinanceDebtorRecord {
  client_id: string;
  total_due: number;
  current_bucket: number;
  bucket_30: number;
  bucket_60: number;
  bucket_90_plus: number;
  risk_band: "low" | "medium" | "high";
}

export interface EscrowRecord {
  document_id: string;
  invoice_id: string;
  status: "locked" | "released";
  locked_at: string;
  released_at: string;
}

export interface SkillMatrixRecord {
  user_id: string;
  saqcc_type: string;
  saqcc_expiry: string;
  medical_expiry: string;
  rest_hours_last_24h: number;
}

export interface UpgradeWorkspaceState {
  quotes: FinanceQuoteRecord[];
  invoices: FinanceInvoiceRecord[];
  statements: FinanceStatementRecord[];
  debtors: FinanceDebtorRecord[];
  escrow: EscrowRecord[];
  skills: SkillMatrixRecord[];
}

export interface SyncPullPayload {
  jobs: Array<Record<string, unknown>>;
  queue: Array<Record<string, unknown>>;
  events: JobEventRow[];
}

export interface SchemaDriftIssue {
  code: string;
  severity: "warning" | "critical";
  detail: string;
}

export interface SchemaDriftPayload {
  generated_at: string;
  healthy: boolean;
  issue_count: number;
  issues: SchemaDriftIssue[];
}

export interface OpsIntelligencePayload {
  generated_at: string;
  jobs: { open: number; critical: number; stale_over_24h: number };
  operations: { schedules_total: number; documents_pending_publish: number; escrow_locked: number };
  finance: { outstanding_amount: number };
  sync: { queue_conflicts: number };
  schema_drift: { healthy: boolean; issue_count: number };
}
