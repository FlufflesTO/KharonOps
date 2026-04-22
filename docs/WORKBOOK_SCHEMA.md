# Workbook Schema

Production canonical system of record is a Google Sheets workbook.

## Required Tabs

See `packages/domain/src/workbook.ts` for the canonical `REQUIRED_WORKBOOK_SHEETS` array. Current required tabs:

1. `Users_Master`
2. `Jobs_Master`
3. `Clients_Master`
4. `Sites_Master`
5. `Technicians_Master`
6. `Job_Events`
7. `Job_Documents`
8. `Portal_Files`
9. `Schedule_Requests`
10. `Schedules_Master`
11. `Automation_Jobs`
12. `Sync_Queue`
13. `Finance_Quotes`
14. `Finance_Invoices`
15. `Finance_Statements`
16. `Finance_Debtors`
17. `Compliance_Escrow`
18. `HR_Skills_Matrix`
19. `System_Config`
20. `Ledger`

## Mandatory Mutable Fields

Every mutable row must include:
- `row_version` — integer, starts at 1, incremented on each write
- `updated_at` — ISO 8601 timestamp of last mutation
- `updated_by` — UID of the actor who performed the mutation
- `correlation_id` — request-scoped trace identifier

## Name Enrichment Governance

The API enriches job records with display names at query time. The lookup priority hierarchy is:

1. **Clients_Master** → provides `client_name` for each `client_id`
2. **Technicians_Master** → provides `display_name` for each `technician_id`
3. **Users_Master** → portal-provisioned fallback only (never overrides master data)

Both `Clients_Master` and `Technicians_Master` must have an `active_flag` (aliased to `active` at the API layer) to support soft-deletes.

## Column Definitions

### Users_Master
- `user_uid`
- `email`
- `display_name`
- `role` (`client|technician|dispatcher|admin`)
- `client_uid`
- `technician_uid`
- `active`
- mutable fields

### Jobs_Master
- `job_uid`, `api_locked`, `sync_status`, `last_sync_at`, `last_sync_error`
- `source_system`, `source_submission_id`, `legacy_job_id`
- `client_id`, `client_group`, `client_name`, `account`
- `site_id`, `site`, `system_type`, `system_confidence`
- `contract_id`, `asset_or_system_id`
- `request_type`, `job_status`, `status_raw`, `document_status`, `billing_status`
- `priority_score`, `sla_tier`, `response_due_at`, `attendance_due_at`, `completion_due_at`
- `breach_risk`, `breached_at`
- `job_owner`, `dispatcher_owner`, `assigned_team`, `technician_raw`
- `primary_technician_id`, `primary_technician_name`
- `secondary_technician_id`, `secondary_technician_name`
- `initial_date`, `date_scheduled`, `date_completed`
- `last_contact_at`, `next_action_at`, `next_action_type`
- `quotation_reference`, `details_of_works`, `jobcard_id`
- `po_number`, `amount`, `invoice_number`, `invoice_date`, `date_paid`, `billing_notes`
- `ready_to_invoice`, `requires_quote`, `requires_site_visit`, `requires_po`
- `requires_report`, `requires_certificate`, `requires_rams`, `requires_safety_file`
- `requires_client_signoff`, `requires_followup_visit`
- `jobcard_scanned`, `jobcard_sent`, `report_sent`
- `client_contact`, `client_contact_email`
- `site_access_contact`, `site_access_phone`, `site_open_time`, `site_close_time`
- `after_hours_allowed`, `permit_required`, `induction_required`, `site_risk_level`
- `site_geo_lat`, `site_geo_lng`
- `drive_folder_id`, `pdf_file_id`
- `source_month_board`, `source_sheet`, `source_row`, `source_refs`, `source_occurrences`
- `import_conflict_flag`, `legacy_formula_notes`
- mutable fields

### Clients_Master
- `client_id`, `client_group`, `legacy_account`
- `client_name`, `billing_entity`, `default_sla_tier`
- `preferred_contact_method`, `ops_email`, `billing_email`
- `portal_enabled`, `active_flag`
- `first_job_date`, `last_job_date`, `total_jobs`, `open_jobs`, `distinct_sites`
- `default_docs_required`, `contract_id_default`, `notes`, `source_confidence`
- mutable fields

### Sites_Master
- `site_id`, `client_id`, `client_name`
- `site_name`, `normalized_site_name`, `address`
- `site_access_contact`, `site_access_phone`, `site_open_time`, `site_close_time`
- `after_hours_allowed`, `permit_required`, `induction_required`, `site_risk_level`
- `geo_lat`, `geo_lng`, `primary_contract_id`
- `job_count`, `first_job_date`, `last_job_date`, `system_types_seen`, `source_confidence`
- mutable fields

### Technicians_Master
- `technician_id`, `technician_name`, `display_name`
- `is_dispatch_owner`, `active_flag`
- `total_jobs`, `last_job_date`, `team`, `email`, `phone`, `skills`, `source_confidence`
- mutable fields

### Job_Events
- `event_uid`, `job_uid`, `legacy_job_id`
- `event_type`, `event_date`, `actor`, `actor_type`
- `event_source`, `trigger_type`, `automation_rule_id`, `retry_count`, `success_flag`
- `source_sheet`, `source_row`, `old_value`, `new_value`, `notes`
- mutable fields

### Job_Documents
- `document_uid`, `sync_status`, `last_sync_at`, `last_sync_error`, `legacy_document_id`
- `job_uid`, `legacy_job_id`, `client_id`, `site_id`, `contract_id`
- `link_status`, `document_status`, `status_raw`
- `job_owner`, `assigned_to`, `requested_at`, `due_at`, `date_scheduled`, `date_completed`
- `sent_at`, `approved_at`, `client_viewed_at`, `client_acknowledged_at`
- `account`, `site`, `document_type`, `template_id`, `document_version`
- `approval_required`, `approved_by`, `sent_to`, `details_of_works`
- `requested_by`, `legacy_job_reference_raw`, `legacy_job_reference_formula`
- `drive_file_id`, `drive_folder_id`, `portal_visible`
- `source_sheet`, `source_row`, `source_refs`, `source_occurrences`
- mutable fields

### Portal_Files
- `file_uid`, `job_uid`, `legacy_job_id`, `client_id`, `site_id`, `contract_id`
- `file_role`, `file_category`, `storage_provider`
- `drive_file_id`, `drive_folder_id`, `portal_visible`, `visible_to_client`
- `uploaded_at`, `captured_at`, `uploaded_by`, `captured_by`
- `is_signature`, `is_before_photo`, `is_after_photo`, `sort_order`
- `source_url`, `notes`
- mutable fields

### Schedule_Requests
- `request_uid`, `job_uid`, `client_uid`
- `preferred_slots_json`, `timezone`, `notes`
- `status` (`requested|confirmed|rescheduled`)
- mutable fields

### Schedules_Master
- `schedule_uid`, `request_uid`, `job_uid`
- `calendar_event_id`, `start_at`, `end_at`, `technician_uid`
- `status` (`confirmed|rescheduled`)
- mutable fields

### Automation_Jobs
- `automation_job_uid`, `action`, `payload_json`
- `status` (`queued|done|failed`), `retry_count`, `last_error`
- mutable fields

### Sync_Queue
- `mutation_uid`, `job_uid`, `actor_uid`
- `payload_json`, `status` (`applied|conflict|failed`), `last_result`
- mutable fields

### Finance_Quotes
- `quote_uid`, `job_uid`, `client_uid`, `description`, `amount`
- `status` (`draft|sent|accepted|rejected`), `created_at`
- mutable fields

### Finance_Invoices
- `invoice_uid`, `job_uid`, `quote_uid`, `client_uid`, `amount`
- `due_date`, `status` (`issued|paid|overdue|cancelled`), `reconciled_at`
- mutable fields

### Finance_Statements
- `statement_uid`, `client_uid`, `period_label`
- `opening_balance`, `billed`, `paid`, `closing_balance`, `generated_at`
- mutable fields

### Finance_Debtors
- `client_uid`, `total_due`, `current_bucket`, `bucket_30`, `bucket_60`, `bucket_90_plus`
- `risk_band`, mutable fields

### Compliance_Escrow
- `document_uid`, `invoice_uid`, `status` (`locked|released`), `locked_at`, `released_at`
- mutable fields

### HR_Skills_Matrix
- `user_uid`, `saqcc_type`, `saqcc_expiry`, `medical_expiry`, `rest_hours_last_24h`
- mutable fields

### System_Config
- `config_key`, `config_value`
- mutable fields

### Ledger
- `ledger_uid`, `entry_type`, `action`, `entity_type`, `entity_id`, `payload_json`
- mutable fields

## Schema Migration

Run after package build:

```bash
node scripts/migrate-workbook.mjs
```

The migration script ensures tabs and headers exist in the workbook.
