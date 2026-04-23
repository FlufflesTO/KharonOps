import type {
  ApiEnvelope,
  AutomationJobRow,
  JobDocumentRow,
  Role,
  ScheduleRequestRow,
  ScheduleRow,
  SyncMutation,
  SyncPushResult,
  UserRow
} from "@kharon/domain";

const JSON_HEADERS = {
  "content-type": "application/json"
};

async function request<T>(path: string, init?: RequestInit): Promise<ApiEnvelope<T>> {
  const response = await fetch(path, {
    credentials: "include",
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      ...(init?.body ? JSON_HEADERS : {})
    }
  });

  const contentType = response.headers.get("content-type") ?? "";
  let body: ApiEnvelope<T>;

  if (contentType.includes("application/json")) {
    body = (await response.json()) as ApiEnvelope<T>;
  } else {
    const raw = await response.text();
    const accessHint =
      raw.includes("cloudflareaccess.com") || raw.toLowerCase().includes("access denied");

    throw {
      data: null,
      error: {
        code: "upstream_non_json",
        message: accessHint
          ? "API is protected by Cloudflare Access challenge for this request."
          : `API returned non-JSON content (status ${response.status}).`
      },
      correlation_id: "",
      row_version: null,
      conflict: null
    } satisfies ApiEnvelope<null>;
  }

  if (!response.ok) {
    throw body;
  }
  return body;
}

function requireData<T>(result: ApiEnvelope<T>, message: string): T {
  if (result.data == null) {
    throw {
      data: null,
      error: { code: "empty_response", message },
      correlation_id: result.correlation_id ?? "",
      row_version: null,
      conflict: null
    } satisfies ApiEnvelope<null>;
  }

  return result.data;
}

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

interface PortalSessionState {
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
  events: Array<Record<string, unknown>>;
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

export const apiClient = {
  async login(idToken: string, options?: { gsiClientId?: string }): Promise<PortalSession> {
    const result = await request<PortalSession>("/api/v1/auth/google-login", {
      method: "POST",
      headers: {
        ...(options?.gsiClientId ? { "x-gsi-client-id": options.gsiClientId } : {})
      },
      body: JSON.stringify({ id_token: idToken })
    });
    return requireData(result, "Login succeeded but the server returned no session data.");
  },
  async session(): Promise<PortalSession> {
    const result = await request<PortalSessionState>("/api/v1/auth/session", {
      method: "GET"
    });
    if (!result.data?.authenticated || !result.data.session) {
      throw {
        data: null,
        error: {
          code: "unauthorized",
          message: "Authentication required"
        },
        correlation_id: result.correlation_id,
        row_version: null,
        conflict: null
      } satisfies ApiEnvelope<null>;
    }

    return {
      session: result.data.session,
      mode: result.data.mode,
      rails_mode: result.data.rails_mode
    };
  },
  async authConfig(): Promise<PortalAuthConfig> {
    const result = await request<PortalAuthConfig>("/api/v1/auth/config", {
      method: "GET"
    });
    return requireData(result, "Auth config request succeeded but the server returned no data.");
  },
  async logout(): Promise<void> {
    await request<{ logged_out: boolean }>("/api/v1/auth/logout", {
      method: "POST"
    });
  },
  async listJobs() {
    const result = await request<Array<Record<string, unknown>>>("/api/v1/jobs", {
      method: "GET"
    });
    return result.data ?? [];
  },
  async getJob(jobid: string) {
    const result = await request<Record<string, unknown>>(`/api/v1/jobs/${jobid}`, {
      method: "GET"
    });
    return result;
  },
  async updateStatus(jobid: string, status: string, rowVersion: number) {
    return request<Record<string, unknown>>(`/api/v1/jobs/${jobid}/status`, {
      method: "POST",
      body: JSON.stringify({ status, row_version: rowVersion })
    });
  },
  async addNote(jobid: string, note: string, rowVersion: number) {
    return request<Record<string, unknown>>(`/api/v1/jobs/${jobid}/note`, {
      method: "POST",
      body: JSON.stringify({ note, row_version: rowVersion })
    });
  },
  async requestSchedule(jobid: string, slot: { start_at: string; end_at: string }, timezone: string, rowVersion: number) {
    return request<Record<string, unknown>>("/api/v1/schedules/request-slot", {
      method: "POST",
      body: JSON.stringify({
        job_id: jobid,
        preferred_slots: [slot],
        timezone,
        notes: "",
        row_version: rowVersion
      })
    });
  },
  async confirmSchedule(
    requestid: string,
    startAt: string,
    endAt: string,
    technicianid: string,
    rowVersion: number,
    options?: { job_id?: string }
  ) {
    return request<Record<string, unknown>>("/api/v1/schedules/confirm", {
      method: "POST",
      body: JSON.stringify({
        request_id: requestid,
        start_at: startAt,
        end_at: endAt,
        technician_id: technicianid,
        row_version: rowVersion,
        ...(options?.job_id ? { job_id: options.job_id } : {})
      })
    });
  },
  async reschedule(
    scheduleid: string,
    startAt: string,
    endAt: string,
    rowVersion: number,
    options?: {
      job_id?: string;
      technician_id?: string;
      request_id?: string;
      calendar_event_id?: string;
    }
  ) {
    return request<Record<string, unknown>>("/api/v1/schedules/reschedule", {
      method: "POST",
      body: JSON.stringify({
        schedule_id: scheduleid,
        start_at: startAt,
        end_at: endAt,
        row_version: rowVersion,
        ...(options?.job_id ? { job_id: options.job_id } : {}),
        ...(options?.technician_id ? { technician_id: options.technician_id } : {}),
        ...(options?.request_id ? { request_id: options.request_id } : {}),
        ...(options?.calendar_event_id ? { calendar_event_id: options.calendar_event_id } : {})
      })
    });
  },
  async generateDocument(jobid: string, documentType: "jobcard" | "service_report" | "certificate", tokens: Record<string, string> = {}) {
    return request<Record<string, unknown>>("/api/v1/documents/generate", {
      method: "POST",
      body: JSON.stringify({
        job_id: jobid,
        document_type: documentType,
        tokens
      })
    });
  },
  async publishDocument(
    documentid: string,
    rowVersion: number,
    options?: { job_id?: string; document_type?: "jobcard" | "service_report" | "certificate"; client_visible?: boolean }
  ) {
    return request<Record<string, unknown>>("/api/v1/documents/publish", {
      method: "POST",
      body: JSON.stringify({
        document_id: documentid,
        row_version: rowVersion,
        client_visible: options?.client_visible ?? false,
        ...(options?.job_id ? { job_id: options.job_id } : {}),
        ...(options?.document_type ? { document_type: options.document_type } : {})
      })
    });
  },
  async history(jobid?: string) {
    const suffix = jobid ? `?job_id=${encodeURIComponent(jobid)}` : "";
    return request<Array<Record<string, unknown>>>(`/api/v1/documents/history${suffix}`, {
      method: "GET"
    });
  },
  async dispatchContext(jobid: string): Promise<PortalDispatchContext> {
    const result = await request<PortalDispatchContext>(`/api/v1/workspace/dispatch-context?job_id=${encodeURIComponent(jobid)}`, {
      method: "GET"
    });
    return requireData(result, "Dispatch context request succeeded but the server returned no data.");
  },
  async sendGmailNotification(to: string, subject: string, body: string, jobid: string) {
    return request<Record<string, unknown>>("/api/v1/workspace/gmail/notify", {
      method: "POST",
      body: JSON.stringify({ to, subject, body, job_id: jobid })
    });
  },
  async sendChatAlert(message: string, severity: "info" | "warning" | "critical", jobid: string) {
    return request<Record<string, unknown>>("/api/v1/workspace/chat/alert", {
      method: "POST",
      body: JSON.stringify({ message, severity, job_id: jobid })
    });
  },
  async syncPerson(name: string, email: string, phone: string, roleHint: string) {
    return request<Record<string, unknown>>("/api/v1/workspace/people/sync", {
      method: "POST",
      body: JSON.stringify({ name, email, phone, role_hint: roleHint })
    });
  },
  async listPeople(): Promise<PeopleDirectoryEntry[]> {
    const result = await request<PeopleDirectoryEntry[]>("/api/v1/workspace/people", {
      method: "GET"
    });
    return result.data ?? [];
  },
  async adminHealth() {
    return request<Record<string, unknown>>("/api/v1/admin/health", {
      method: "GET"
    });
  },
  async adminAudits() {
    return request<Array<Record<string, unknown>>>("/api/v1/admin/audits", {
      method: "GET"
    });
  },
  async adminAutomationJobs() {
    return request<Array<Record<string, unknown>>>("/api/v1/admin/automation-jobs", {
      method: "GET"
    });
  },
  async listAutomationJobs(): Promise<AutomationJobEntry[]> {
    const result = await request<AutomationJobEntry[]>("/api/v1/admin/automation-jobs", {
      method: "GET"
    });
    return result.data ?? [];
  },
  async retryAutomation(automationJobid: string) {
    return request<Record<string, unknown>>(`/api/v1/admin/retries/${automationJobid}`, {
      method: "POST"
    });
  },
  async getUpgradeWorkspaceState(): Promise<UpgradeWorkspaceState> {
    const result = await request<UpgradeWorkspaceState>("/api/v1/workspace/upgrade/state", {
      method: "GET"
    });
    return requireData(result, "Upgrade state request succeeded but no state payload was returned.");
  },
  async createFinanceQuote(payload: {
    job_id: string;
    client_id: string;
    description: string;
    amount: number;
  }): Promise<FinanceQuoteRecord> {
    const result = await request<FinanceQuoteRecord>("/api/v1/workspace/upgrade/quotes", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    return requireData(result, "Quote creation succeeded but no quote payload was returned.");
  },
  async updateFinanceQuoteStatus(quote_id: string, status: FinanceQuoteRecord["status"]): Promise<FinanceQuoteRecord> {
    const result = await request<FinanceQuoteRecord>(`/api/v1/workspace/upgrade/quotes/${encodeURIComponent(quote_id)}/status`, {
      method: "POST",
      body: JSON.stringify({ status })
    });
    return requireData(result, "Quote status update succeeded but no quote payload was returned.");
  },
  async createInvoiceFromQuote(quote_id: string, due_date: string): Promise<FinanceInvoiceRecord> {
    const result = await request<FinanceInvoiceRecord>("/api/v1/workspace/upgrade/invoices/from-quote", {
      method: "POST",
      body: JSON.stringify({ quote_id, due_date })
    });
    return requireData(result, "Invoice creation succeeded but no invoice payload was returned.");
  },
  async reconcileInvoice(invoice_id: string): Promise<FinanceInvoiceRecord> {
    const result = await request<FinanceInvoiceRecord>(`/api/v1/workspace/upgrade/invoices/${encodeURIComponent(invoice_id)}/reconcile`, {
      method: "POST"
    });
    return requireData(result, "Invoice reconcile succeeded but no invoice payload was returned.");
  },
  async lockEscrow(document_id: string, invoice_id: string): Promise<EscrowRecord> {
    const result = await request<EscrowRecord>("/api/v1/workspace/upgrade/escrow/lock", {
      method: "POST",
      body: JSON.stringify({ document_id, invoice_id })
    });
    return requireData(result, "Escrow lock succeeded but no escrow payload was returned.");
  },
  async getEscrowByDocument(document_id: string): Promise<EscrowRecord | null> {
    const result = await request<EscrowRecord | null>(`/api/v1/workspace/upgrade/escrow/${encodeURIComponent(document_id)}`, {
      method: "GET"
    });
    return result.data ?? null;
  },
  async upsertSkillMatrix(payload: SkillMatrixRecord): Promise<SkillMatrixRecord> {
    const result = await request<SkillMatrixRecord>(`/api/v1/workspace/upgrade/skills/${encodeURIComponent(payload.user_id)}`, {
      method: "PUT",
      body: JSON.stringify(payload)
    });
    return requireData(result, "Skill upsert succeeded but no skill payload was returned.");
  },
  async rebuildUpgradeAnalytics(): Promise<{ debtors: number; statements: number }> {
    const result = await request<{ debtors: number; statements: number }>("/api/v1/workspace/upgrade/analytics/rebuild", {
      method: "POST"
    });
    return requireData(result, "Analytics rebuild succeeded but no summary payload was returned.");
  },
  async syncPush(mutations: SyncMutation[]): Promise<ApiEnvelope<SyncPushResult>> {
    return request<SyncPushResult>("/api/v1/sync/push", {
      method: "POST",
      body: JSON.stringify({ mutations })
    });
  },
  async syncPull(since: string): Promise<SyncPullPayload> {
    const result = await request<SyncPullPayload>(`/api/v1/sync/pull?since=${encodeURIComponent(since)}`, {
      method: "GET"
    });
    return requireData(result, "Sync pull succeeded but no payload was returned.");
  },
  async schemaDrift(): Promise<SchemaDriftPayload> {
    const result = await request<SchemaDriftPayload>("/api/v1/workspace/schema-drift", {
      method: "GET"
    });
    return requireData(result, "Schema drift request succeeded but no payload was returned.");
  },
  async opsIntelligence(): Promise<OpsIntelligencePayload> {
    const result = await request<OpsIntelligencePayload>("/api/v1/workspace/ops-intelligence", {
      method: "GET"
    });
    return requireData(result, "Operational intelligence request succeeded but no payload was returned.");
  }
};

