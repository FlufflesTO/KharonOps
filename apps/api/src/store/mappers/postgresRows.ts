import type {
  AutomationJobRow,
  ClientRow,
  EscrowRow,
  FinanceDebtorRow,
  FinanceInvoiceRow,
  FinanceQuoteRow,
  FinanceStatementRow,
  JobDocumentRow,
  JobEventRow,
  JobRow,
  PortalFileRow,
  ScheduleRequestRow,
  ScheduleRow,
  SiteRow,
  SkillMatrixRow,
  SyncQueueRow,
  TechnicianRow,
  UserRow
} from "@kharon/domain";

export interface PgRow {
  [column: string]: unknown;
}

function rowToMutableMeta(row: PgRow): Pick<UserRow, "row_version" | "updated_at" | "updated_by" | "correlation_id"> {
  return {
    row_version: Number(row.row_version ?? 0),
    updated_at: String(row.updated_at ?? ""),
    updated_by: String(row.updated_by ?? ""),
    correlation_id: String(row.correlation_id ?? "")
  };
}

export function userRowFromPg(row: PgRow | undefined): UserRow {
  if (!row) throw new Error("Missing row for UserRow mapping");
  return {
    user_id: String(row.user_id),
    email: String(row.email),
    display_name: String(row.display_name),
    role: String(row.role) as UserRow["role"],
    client_id: String(row.client_id),
    technician_id: String(row.technician_id),
    active: String(row.active) as UserRow["active"],
    ...rowToMutableMeta(row)
  };
}

export function jobRowFromPg(row: PgRow | undefined): JobRow {
  if (!row) throw new Error("Missing row for JobRow mapping");
  return {
    job_id: String(row.job_id),
    client_id: String(row.client_id),
    site_id: String(row.site_id),
    technician_id: String(row.technician_id),
    title: String(row.title),
    status: String(row.status) as JobRow["status"],
    scheduled_start: String(row.scheduled_start),
    scheduled_end: String(row.scheduled_end),
    last_note: String(row.last_note ?? ""),
    ...rowToMutableMeta(row)
  };
}

export function jobEventRowFromPg(row: PgRow | undefined): JobEventRow {
  if (!row) throw new Error("Missing row for JobEventRow mapping");
  const meta = rowToMutableMeta(row);
  return {
    event_id: String(row.event_id),
    job_id: String(row.job_id),
    event_type: String(row.event_type),
    payload_json: String(row.payload_json ?? "{}"),
    ...meta,
    created_at: meta.updated_at,
    created_by: meta.updated_by
  };
}

export function scheduleRequestRowFromPg(row: PgRow | undefined): ScheduleRequestRow {
  if (!row) throw new Error("Missing row for ScheduleRequestRow mapping");
  return {
    request_id: String(row.request_id),
    job_id: String(row.job_id),
    client_id: String(row.client_id),
    preferred_slots_json: String(row.preferred_slots_json ?? "[]"),
    timezone: String(row.timezone ?? "UTC"),
    notes: String(row.notes ?? ""),
    status: String(row.status) as ScheduleRequestRow["status"],
    ...rowToMutableMeta(row)
  };
}

export function scheduleRowFromPg(row: PgRow | undefined): ScheduleRow {
  if (!row) throw new Error("Missing row for ScheduleRow mapping");
  return {
    schedule_id: String(row.schedule_id),
    request_id: String(row.request_id),
    job_id: String(row.job_id),
    calendar_event_id: String(row.calendar_event_id ?? ""),
    start_at: String(row.start_at),
    end_at: String(row.end_at),
    technician_id: String(row.technician_id),
    status: String(row.status) as ScheduleRow["status"],
    ...rowToMutableMeta(row)
  };
}

export function jobDocumentRowFromPg(row: PgRow | undefined): JobDocumentRow {
  if (!row) throw new Error("Missing row for JobDocumentRow mapping");
  return {
    document_id: String(row.document_id),
    job_id: String(row.job_id),
    document_type: String(row.document_type) as JobDocumentRow["document_type"],
    status: String(row.status) as JobDocumentRow["status"],
    drive_file_id: String(row.drive_file_id ?? ""),
    pdf_file_id: String(row.pdf_file_id ?? ""),
    published_url: String(row.published_url ?? ""),
    client_visible: Boolean(row.client_visible ?? false),
    ...rowToMutableMeta(row)
  };
}

export function automationJobRowFromPg(row: PgRow | undefined): AutomationJobRow {
  if (!row) throw new Error("Missing row for AutomationJobRow mapping");
  return {
    automation_job_id: String(row.automation_job_id),
    action: String(row.action),
    payload_json: String(row.payload_json ?? "{}"),
    status: String(row.status) as AutomationJobRow["status"],
    retry_count: Number(row.retry_count ?? 0),
    last_error: String(row.last_error ?? ""),
    ...rowToMutableMeta(row)
  };
}

export function syncQueueRowFromPg(row: PgRow | undefined): SyncQueueRow {
  if (!row) throw new Error("Missing row for SyncQueueRow mapping");
  return {
    mutation_id: String(row.mutation_id),
    job_id: String(row.job_id),
    actor_id: String(row.actor_id),
    payload_json: String(row.payload_json ?? "{}"),
    status: String(row.status) as SyncQueueRow["status"],
    last_result: String(row.last_result ?? ""),
    ...rowToMutableMeta(row)
  };
}

export function financeQuoteRowFromPg(row: PgRow | undefined): FinanceQuoteRow {
  if (!row) throw new Error("Missing row for FinanceQuoteRow mapping");
  return {
    quote_id: String(row.quote_id),
    job_id: String(row.job_id),
    client_id: String(row.client_id),
    description: String(row.description ?? ""),
    amount: Number(row.amount ?? 0),
    status: String(row.status) as FinanceQuoteRow["status"],
    created_at: String(row.created_at ?? ""),
    ...rowToMutableMeta(row)
  };
}

export function financeInvoiceRowFromPg(row: PgRow | undefined): FinanceInvoiceRow {
  if (!row) throw new Error("Missing row for FinanceInvoiceRow mapping");
  return {
    invoice_id: String(row.invoice_id),
    job_id: String(row.job_id),
    quote_id: String(row.quote_id),
    client_id: String(row.client_id),
    amount: Number(row.amount ?? 0),
    due_date: String(row.due_date ?? ""),
    status: String(row.status) as FinanceInvoiceRow["status"],
    reconciled_at: String(row.reconciled_at ?? ""),
    ...rowToMutableMeta(row)
  };
}

export function financeStatementRowFromPg(row: PgRow | undefined): FinanceStatementRow {
  if (!row) throw new Error("Missing row for FinanceStatementRow mapping");
  return {
    statement_id: String(row.statement_id),
    client_id: String(row.client_id),
    period_label: String(row.period_label ?? ""),
    opening_balance: Number(row.opening_balance ?? 0),
    billed: Number(row.billed ?? 0),
    paid: Number(row.paid ?? 0),
    closing_balance: Number(row.closing_balance ?? 0),
    generated_at: String(row.generated_at ?? ""),
    ...rowToMutableMeta(row)
  };
}

export function financeDebtorRowFromPg(row: PgRow | undefined): FinanceDebtorRow {
  if (!row) throw new Error("Missing row for FinanceDebtorRow mapping");
  return {
    client_id: String(row.client_id),
    total_due: Number(row.total_due ?? 0),
    current_bucket: Number(row.current_bucket ?? 0),
    bucket_30: Number(row.bucket_30 ?? 0),
    bucket_60: Number(row.bucket_60 ?? 0),
    bucket_90_plus: Number(row.bucket_90_plus ?? 0),
    risk_band: String(row.risk_band ?? "low") as FinanceDebtorRow["risk_band"],
    ...rowToMutableMeta(row)
  };
}

export function escrowRowFromPg(row: PgRow | undefined): EscrowRow {
  if (!row) throw new Error("Missing row for EscrowRow mapping");
  return {
    document_id: String(row.document_id),
    invoice_id: String(row.invoice_id),
    status: String(row.status) as EscrowRow["status"],
    locked_at: String(row.locked_at ?? ""),
    released_at: String(row.released_at ?? ""),
    ...rowToMutableMeta(row)
  };
}

export function clientRowFromPg(row: PgRow | undefined): ClientRow {
  if (!row) throw new Error("Missing row for ClientRow mapping");
  return {
    client_id: String(row.client_id),
    client_name: String(row.client_name ?? ""),
    billing_entity: String(row.billing_entity ?? ""),
    ops_email: String(row.ops_email ?? ""),
    active: String(row.active ?? "true") as ClientRow["active"],
    ...rowToMutableMeta(row)
  };
}

export function technicianRowFromPg(row: PgRow | undefined): TechnicianRow {
  if (!row) throw new Error("Missing row for TechnicianRow mapping");
  return {
    technician_id: String(row.technician_id),
    display_name: String(row.display_name ?? ""),
    active: String(row.active ?? "true") as TechnicianRow["active"],
    ...rowToMutableMeta(row)
  };
}

export function siteRowFromPg(row: PgRow | undefined): SiteRow {
  if (!row) throw new Error("Missing row for SiteRow mapping");
  return {
    site_id: String(row.site_id),
    client_id: String(row.client_id),
    site_name: String(row.site_name ?? ""),
    address: String(row.address ?? ""),
    geo_lat: Number(row.geo_lat ?? 0),
    geo_lng: Number(row.geo_lng ?? 0),
    ...rowToMutableMeta(row)
  };
}

export function portalFileRowFromPg(row: PgRow | undefined): PortalFileRow {
  if (!row) throw new Error("Missing row for PortalFileRow mapping");
  return {
    file_id: String(row.file_id),
    job_id: String(row.job_id),
    client_id: String(row.client_id),
    site_id: String(row.site_id),
    file_role: String(row.file_role ?? ""),
    file_category: String(row.file_category ?? ""),
    drive_file_id: String(row.drive_file_id ?? ""),
    portal_visible: Boolean(row.portal_visible ?? false),
    source_url: String(row.source_url ?? ""),
    ...rowToMutableMeta(row)
  };
}

export function skillMatrixRowFromPg(row: PgRow | undefined): SkillMatrixRow {
  if (!row) throw new Error("Missing row for SkillMatrixRow mapping");
  return {
    user_id: String(row.user_id),
    saqcc_type: String(row.saqcc_type ?? ""),
    saqcc_expiry: String(row.saqcc_expiry ?? ""),
    medical_expiry: String(row.medical_expiry ?? ""),
    rest_hours_last_24h: Number(row.rest_hours_last_24h ?? 0),
    ...rowToMutableMeta(row)
  };
}
