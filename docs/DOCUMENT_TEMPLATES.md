# Document Templates

## Current model

Production document export is template-driven.

1. The API copies the Google Doc referenced by `GOOGLE_JOBCARD_TEMPLATE_ID` or `GOOGLE_SERVICE_REPORT_TEMPLATE_ID`.
2. It replaces `{{TOKEN}}` placeholders with runtime values.
3. It exports the filled Google Doc to PDF.

That means branding, layout, typography, headers, logo placement, tables, signature blocks, and pagination are owned by the Google Docs template itself. The repo does not currently style PDF output directly.

## What this means operationally

- If the Google Doc template is plain, the PDF will be plain.
- If the template has strong branding and structure, the PDF will preserve that structure.
- The code's job is to provide a rich token contract so the template can be populated reliably.

## Supported tokens

These tokens are populated by default during document generation:

- `{{brand_name}}`
- `{{brand_short_name}}`
- `{{brand_portal_name}}`
- `{{document_uid}}`
- `{{document_type}}`
- `{{document_type_label}}`
- `{{document_title}}`
- `{{job_uid}}`
- `{{job_reference}}`
- `{{job_title}}`
- `{{job_status}}`
- `{{job_status_label}}`
- `{{client_uid}}`
- `{{client_display_name}}` — resolved from Clients_Master (primary) or Users_Master (fallback)
- `{{client_email}}`
- `{{site_uid}}`
- `{{technician_uid}}`
- `{{technician_display_name}}` — resolved from Technicians_Master (primary) or Users_Master (fallback)
- `{{technician_email}}`
- `{{scheduled_start}}`
- `{{scheduled_start_display}}`
- `{{scheduled_start_date}}`
- `{{scheduled_start_time}}`
- `{{scheduled_end}}`
- `{{scheduled_end_display}}`
- `{{scheduled_end_date}}`
- `{{scheduled_end_time}}`
- `{{scheduled_window_display}}`
- `{{last_note}}`
- `{{prepared_by_name}}`
- `{{prepared_by_email}}`
- `{{prepared_by_role}}`
- `{{generated_at}}`
- `{{generated_at_display}}`
- `{{generated_date}}`
- `{{generated_time}}`

Caller-supplied tokens may still be passed and will override defaults when needed.

## Recommended template structure

### Jobcard

- Branded masthead with logo, company identity, and document title
- Reference band for job UID, site UID, client, technician, and current status
- Scheduled service window
- Job scope or work title
- Work execution notes or instructions block
- Technician sign-off block
- Client acknowledgement block
- Footer with document UID, generation timestamp, and page numbering

### Service report

- Branded cover band with logo and report title
- Executive summary line using `{{job_title}}` and `{{job_status_label}}`
- Site and client identification
- Service window and attending technician
- Findings / notes section using `{{last_note}}`
- Evidence or attachment references section
- Next actions / recommendations section
- Approval or acknowledgement section
- Footer with `{{document_uid}}` and `{{generated_at_display}}`

## Next quality step

If exports still look weak after template cleanup, the next workstream should be:

1. redesign the Google Docs templates
2. expand the domain data available to document generation
3. add section-specific tokens for findings, readings, evidence, and approvals
