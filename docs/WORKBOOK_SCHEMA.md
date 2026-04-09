# Workbook Schema

Production canonical system of record is a Google Sheets workbook.

## Required Tabs

1. `Users_Master`
2. `Jobs_Master`
3. `Clients_Master`
4. `Sites_Master`
5. `Technicians_Master`
6. `Job_Events`
7. `Job_Documents`
8. `Schedule_Requests`
9. `Schedules_Master`
10. `Automation_Jobs`
11. `Sync_Queue`
12. `System_Config`

## Mandatory Mutable Fields

Every mutable row must include:
- `row_version`
- `updated_at`
- `updated_by`
- `correlation_id`

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
- `job_uid`
- `client_uid`
- `site_uid`
- `technician_uid`
- `title`
- `status`
- `scheduled_start`
- `scheduled_end`
- `last_note`
- mutable fields

### Clients_Master
- `client_uid`
- `client_name`
- `contact_email`
- `contact_phone`
- mutable fields

### Sites_Master
- `site_uid`
- `client_uid`
- `site_name`
- `address`
- mutable fields

### Technicians_Master
- `technician_uid`
- `technician_name`
- `email`
- `phone`
- mutable fields

### Job_Events
- `event_uid`
- `job_uid`
- `event_type`
- `payload_json`
- mutable fields

### Job_Documents
- `document_uid`
- `job_uid`
- `document_type` (`jobcard|service_report`)
- `status` (`generated|published`)
- `drive_file_id`
- `pdf_file_id`
- `published_url`
- mutable fields

### Schedule_Requests
- `request_uid`
- `job_uid`
- `client_uid`
- `preferred_slots_json`
- `timezone`
- `notes`
- `status` (`requested|confirmed|rescheduled`)
- mutable fields

### Schedules_Master
- `schedule_uid`
- `request_uid`
- `job_uid`
- `calendar_event_id`
- `start_at`
- `end_at`
- `technician_uid`
- `status` (`confirmed|rescheduled`)
- mutable fields

### Automation_Jobs
- `automation_job_uid`
- `action`
- `payload_json`
- `status` (`queued|done|failed`)
- `retry_count`
- `last_error`
- mutable fields

### Sync_Queue
- `mutation_uid`
- `job_uid`
- `actor_uid`
- `payload_json`
- `status` (`applied|conflict|failed`)
- `last_result`
- mutable fields

### System_Config
- `config_key`
- `config_value`
- mutable fields

## Schema Migration

Run after package build:

```bash
node scripts/migrate-workbook.mjs
```

The migration script ensures tabs and headers exist in the workbook.
