const JSON_HEADERS = {
    "content-type": "application/json"
};
async function request(path, init) {
    const response = await fetch(path, {
        credentials: "include",
        ...init,
        headers: {
            ...(init?.headers ?? {}),
            ...(init?.body ? JSON_HEADERS : {})
        }
    });
    const contentType = response.headers.get("content-type") ?? "";
    let body;
    if (contentType.includes("application/json")) {
        body = (await response.json());
    }
    else {
        const raw = await response.text();
        const accessHint = raw.includes("cloudflareaccess.com") || raw.toLowerCase().includes("access denied");
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
        };
    }
    if (!response.ok) {
        throw body;
    }
    return body;
}
export const apiClient = {
    async login(idToken) {
        const result = await request("/api/v1/auth/google-login", {
            method: "POST",
            body: JSON.stringify({ id_token: idToken })
        });
        return result.data;
    },
    async session() {
        const result = await request("/api/v1/auth/session", {
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
            };
        }
        return {
            session: result.data.session,
            mode: result.data.mode,
            rails_mode: result.data.rails_mode
        };
    },
    async authConfig() {
        const result = await request("/api/v1/auth/config", {
            method: "GET"
        });
        return result.data;
    },
    async logout() {
        await request("/api/v1/auth/logout", {
            method: "POST"
        });
    },
    async listJobs() {
        const result = await request("/api/v1/jobs", {
            method: "GET"
        });
        return result.data ?? [];
    },
    async getJob(jobUid) {
        const result = await request(`/api/v1/jobs/${jobUid}`, {
            method: "GET"
        });
        return result;
    },
    async updateStatus(jobUid, status, rowVersion) {
        return request(`/api/v1/jobs/${jobUid}/status`, {
            method: "POST",
            body: JSON.stringify({ status, row_version: rowVersion })
        });
    },
    async addNote(jobUid, note, rowVersion) {
        return request(`/api/v1/jobs/${jobUid}/note`, {
            method: "POST",
            body: JSON.stringify({ note, row_version: rowVersion })
        });
    },
    async requestSchedule(jobUid, slot, timezone, rowVersion) {
        return request("/api/v1/schedules/request-slot", {
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
    async confirmSchedule(requestUid, startAt, endAt, technicianUid, rowVersion, options) {
        return request("/api/v1/schedules/confirm", {
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
    async reschedule(scheduleUid, startAt, endAt, rowVersion, options) {
        return request("/api/v1/schedules/reschedule", {
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
    async generateDocument(jobUid, documentType, tokens = {}) {
        return request("/api/v1/documents/generate", {
            method: "POST",
            body: JSON.stringify({
                job_uid: jobUid,
                document_type: documentType,
                tokens
            })
        });
    },
    async publishDocument(documentUid, rowVersion, options) {
        return request("/api/v1/documents/publish", {
            method: "POST",
            body: JSON.stringify({
                document_uid: documentUid,
                row_version: rowVersion,
                client_visible: true,
                ...(options?.job_uid ? { job_uid: options.job_uid } : {}),
                ...(options?.document_type ? { document_type: options.document_type } : {})
            })
        });
    },
    async history(jobUid) {
        const suffix = jobUid ? `?job_uid=${encodeURIComponent(jobUid)}` : "";
        return request(`/api/v1/documents/history${suffix}`, {
            method: "GET"
        });
    },
    async sendGmailNotification(to, subject, body, jobUid) {
        return request("/api/v1/workspace/gmail/notify", {
            method: "POST",
            body: JSON.stringify({ to, subject, body, job_uid: jobUid })
        });
    },
    async sendChatAlert(message, severity, jobUid) {
        return request("/api/v1/workspace/chat/alert", {
            method: "POST",
            body: JSON.stringify({ message, severity, job_uid: jobUid })
        });
    },
    async syncPerson(name, email, phone, roleHint) {
        return request("/api/v1/workspace/people/sync", {
            method: "POST",
            body: JSON.stringify({ name, email, phone, role_hint: roleHint })
        });
    },
    async adminHealth() {
        return request("/api/v1/admin/health", {
            method: "GET"
        });
    },
    async adminAudits() {
        return request("/api/v1/admin/audits", {
            method: "GET"
        });
    },
    async retryAutomation(automationJobUid) {
        return request(`/api/v1/admin/retries/${automationJobUid}`, {
            method: "POST"
        });
    },
    async syncPush(mutations) {
        return request("/api/v1/sync/push", {
            method: "POST",
            body: JSON.stringify({ mutations })
        });
    }
};
