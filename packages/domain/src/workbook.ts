export const REQUIRED_WORKBOOK_SHEETS = [
  "Users_Master",
  "Jobs_Master",
  "Clients_Master",
  "Sites_Master",
  "Technicians_Master",
  "Job_Events",
  "Job_Documents",
  "Schedule_Requests",
  "Schedules_Master",
  "Automation_Jobs",
  "Sync_Queue",
  "System_Config"
] as const;

export const MUTABLE_FIELDS = ["row_version", "updated_at", "updated_by", "correlation_id"] as const;

export const WORKBOOK_HEADERS: Record<(typeof REQUIRED_WORKBOOK_SHEETS)[number], string[]> = {
  Users_Master: [
    "user_uid",
    "email",
    "display_name",
    "role",
    "client_uid",
    "technician_uid",
    "active",
    ...MUTABLE_FIELDS
  ],
  Jobs_Master: [
    "job_uid",
    "client_uid",
    "site_uid",
    "technician_uid",
    "title",
    "status",
    "scheduled_start",
    "scheduled_end",
    "last_note",
    ...MUTABLE_FIELDS
  ],
  Clients_Master: ["client_uid", "client_name", "contact_email", "contact_phone", ...MUTABLE_FIELDS],
  Sites_Master: ["site_uid", "client_uid", "site_name", "address", ...MUTABLE_FIELDS],
  Technicians_Master: ["technician_uid", "technician_name", "email", "phone", ...MUTABLE_FIELDS],
  Job_Events: ["event_uid", "job_uid", "event_type", "payload_json", ...MUTABLE_FIELDS],
  Job_Documents: [
    "document_uid",
    "job_uid",
    "document_type",
    "status",
    "drive_file_id",
    "pdf_file_id",
    "published_url",
    ...MUTABLE_FIELDS
  ],
  Schedule_Requests: [
    "request_uid",
    "job_uid",
    "client_uid",
    "preferred_slots_json",
    "timezone",
    "notes",
    "status",
    ...MUTABLE_FIELDS
  ],
  Schedules_Master: [
    "schedule_uid",
    "request_uid",
    "job_uid",
    "calendar_event_id",
    "start_at",
    "end_at",
    "technician_uid",
    "status",
    ...MUTABLE_FIELDS
  ],
  Automation_Jobs: [
    "automation_job_uid",
    "action",
    "payload_json",
    "status",
    "retry_count",
    "last_error",
    ...MUTABLE_FIELDS
  ],
  Sync_Queue: [
    "mutation_uid",
    "job_uid",
    "actor_uid",
    "payload_json",
    "status",
    "last_result",
    ...MUTABLE_FIELDS
  ],
  System_Config: ["config_key", "config_value", ...MUTABLE_FIELDS]
};
