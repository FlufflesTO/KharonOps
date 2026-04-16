import type { ApiEnvelope, SyncMutation, SyncPushResult, Role } from "@kharon/domain";

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

export interface PortalSession {
  session: {
    user_uid: string;
    email: string;
    // Canonical Role type imported from @kharon/domain — GLOBAL-002 compliance.
    // Do not re-define this union locally; update @kharon/domain/src/types.ts instead.
    role: Role;
    display_name: string;
    client_uid: string;
    technician_uid: string;
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

export const apiClient = {
  async login(idToken: string, options?: { gsiClientId?: string }): Promise<PortalSession> {
    const result = await request<PortalSession>("/api/v1/auth/google-login", {
      method: "POST",
      headers: {
        ...(options?.gsiClientId ? { "x-gsi-client-id": options.gsiClientId } : {})
      },
      body: JSON.stringify({ id_token: idToken })
    });
    if (!result.data) {
      throw {
        data: null,
        error: { code: "empty_response", message: "Login succeeded but the server returned no session data." },
        correlation_id: result.correlation_id ?? "",
        row_version: null,
        conflict: null
      } satisfies ApiEnvelope<null>;
    }
    return result.data;
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
    if (!result.data) {
      throw {
        data: null,
        error: { code: "empty_response", message: "Auth config request succeeded but the server returned no data." },
        correlation_id: result.correlation_id ?? "",
        row_version: null,
        conflict: null
      } satisfies ApiEnvelope<null>;
    }
    return result.data;
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
  async getJob(jobUid: string) {
    const result = await request<Record<string, unknown>>(`/api/v1/jobs/${jobUid}`, {
      method: "GET"
    });
    return result;
  },
  async updateStatus(jobUid: string, status: string, rowVersion: number) {
    return request<Record<string, unknown>>(`/api/v1/jobs/${jobUid}/status`, {
      method: "POST",
      body: JSON.stringify({ status, row_version: rowVersion })
    });
  },
  async addNote(jobUid: string, note: string, rowVersion: number) {
    return request<Record<string, unknown>>(`/api/v1/jobs/${jobUid}/note`, {
      method: "POST",
      body: JSON.stringify({ note, row_version: rowVersion })
    });
  },
  async requestSchedule(jobUid: string, slot: { start_at: string; end_at: string }, timezone: string, rowVersion: number) {
    return request<Record<string, unknown>>("/api/v1/schedules/request-slot", {
      method: "POST",
      body: JSON.stringify({
        job_uid: jobUid,
        preferred_slots: [slot],
        timezone,
        notes: "",
        row_version: rowVersion
      })
    });
  },
  async confirmSchedule(
    requestUid: string,
    startAt: string,
    endAt: string,
    technicianUid: string,
    rowVersion: number,
    options?: { job_uid?: string }
  ) {
    return request<Record<string, unknown>>("/api/v1/schedules/confirm", {
      method: "POST",
      body: JSON.stringify({
        request_uid: requestUid,
        start_at: startAt,
        end_at: endAt,
        technician_uid: technicianUid,
        row_version: rowVersion,
        ...(options?.job_uid ? { job_uid: options.job_uid } : {})
      })
    });
  },
  async reschedule(
    scheduleUid: string,
    startAt: string,
    endAt: string,
    rowVersion: number,
    options?: {
      job_uid?: string;
      technician_uid?: string;
      request_uid?: string;
      calendar_event_id?: string;
    }
  ) {
    return request<Record<string, unknown>>("/api/v1/schedules/reschedule", {
      method: "POST",
      body: JSON.stringify({
        schedule_uid: scheduleUid,
        start_at: startAt,
        end_at: endAt,
        row_version: rowVersion,
        ...(options?.job_uid ? { job_uid: options.job_uid } : {}),
        ...(options?.technician_uid ? { technician_uid: options.technician_uid } : {}),
        ...(options?.request_uid ? { request_uid: options.request_uid } : {}),
        ...(options?.calendar_event_id ? { calendar_event_id: options.calendar_event_id } : {})
      })
    });
  },
  async generateDocument(jobUid: string, documentType: "jobcard" | "service_report" | "certificate", tokens: Record<string, string> = {}) {
    return request<Record<string, unknown>>("/api/v1/documents/generate", {
      method: "POST",
      body: JSON.stringify({
        job_uid: jobUid,
        document_type: documentType,
        tokens
      })
    });
  },

  async publishDocument(
    documentUid: string,
    rowVersion: number,
    options?: { job_uid?: string; document_type?: "jobcard" | "service_report" | "certificate"; client_visible?: boolean }
  ) {
    return request<Record<string, unknown>>("/api/v1/documents/publish", {
      method: "POST",
      body: JSON.stringify({
        document_uid: documentUid,
        row_version: rowVersion,
        client_visible: options?.client_visible ?? false,
        ...(options?.job_uid ? { job_uid: options.job_uid } : {}),
        ...(options?.document_type ? { document_type: options.document_type } : {})
      })
    });
  },
  async history(jobUid?: string) {
    const suffix = jobUid ? `?job_uid=${encodeURIComponent(jobUid)}` : "";
    return request<Array<Record<string, unknown>>>(`/api/v1/documents/history${suffix}`, {
      method: "GET"
    });
  },
  async sendGmailNotification(to: string, subject: string, body: string, jobUid: string) {
    return request<Record<string, unknown>>("/api/v1/workspace/gmail/notify", {
      method: "POST",
      body: JSON.stringify({ to, subject, body, job_uid: jobUid })
    });
  },
  async sendChatAlert(message: string, severity: "info" | "warning" | "critical", jobUid: string) {
    return request<Record<string, unknown>>("/api/v1/workspace/chat/alert", {
      method: "POST",
      body: JSON.stringify({ message, severity, job_uid: jobUid })
    });
  },
  async syncPerson(name: string, email: string, phone: string, roleHint: string) {
    return request<Record<string, unknown>>("/api/v1/workspace/people/sync", {
      method: "POST",
      body: JSON.stringify({ name, email, phone, role_hint: roleHint })
    });
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
  async retryAutomation(automationJobUid: string) {
    return request<Record<string, unknown>>(`/api/v1/admin/retries/${automationJobUid}`, {
      method: "POST"
    });
  },
  async syncPush(mutations: SyncMutation[]): Promise<ApiEnvelope<SyncPushResult>> {
    return request<SyncPushResult>("/api/v1/sync/push", {
      method: "POST",
      body: JSON.stringify({ mutations })
    });
  }
};
