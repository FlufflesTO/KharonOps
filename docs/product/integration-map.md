# Kharon Platform - API Integration Map

## Overview

This document details the API endpoints and integration points for the Kharon Platform, mapping the internal service architecture and external integrations planned for the rebuild.

## API Architecture

### Base URL Structure
- Public Website: `https://www.kharon-platform.com/`
- Portal API: `https://api.kharon-platform.com/v1/`
- Authentication: `https://auth.kharon-platform.com/`

### Authentication Headers
- All authenticated endpoints require: `Authorization: Bearer <token>`
- All requests include: `X-Correlation-ID: <uuid>`

## Public Website Endpoints

### PW1: Landing Pages
- **GET** `/` - Home page
  - Purpose: Main landing page
  - Response: HTML content
  - Rate Limit: 100/hour/IP
  - Authentication: None

- **GET** `/about` - About Us page
  - Purpose: Company information
  - Response: HTML content
  - Rate Limit: 100/hour/IP
  - Authentication: None

- **GET** `/services` - Services overview page
  - Purpose: Overview of services
  - Response: HTML content
  - Rate Limit: 100/hour/IP
  - Authentication: None

### PW2: Service-Specific Pages
- **GET** `/services/fire-detection` - Fire detection services
  - Purpose: Detailed fire detection information
  - Response: HTML content
  - Rate Limit: 100/hour/IP
  - Authentication: None

- **GET** `/services/gas-suppression` - Gas suppression services
  - Purpose: Detailed gas suppression information
  - Response: HTML content
  - Rate Limit: 100/hour/IP
  - Authentication: None

- **GET** `/services/security-systems` - Security systems
  - Purpose: Detailed security systems information
  - Response: HTML content
  - Rate Limit: 100/hour/IP
  - Authentication: None

### PW3: Engagement Endpoints
- **GET** `/contact` - Contact page
  - Purpose: Contact information and form
  - Response: HTML content
  - Rate Limit: 100/hour/IP
  - Authentication: None

- **POST** `/contact/submit` - Submit contact form
  - Purpose: Handle contact form submissions
  - Request: { name, email, phone, message, company? }
  - Response: { success: boolean, message: string }
  - Rate Limit: 10/hour/IP
  - Authentication: None
  - Validation: CAPTCHA, email format, rate limiting

- **GET** `/request-service` - Service request form
  - Purpose: Form for requesting services
  - Response: HTML content
  - Rate Limit: 100/hour/IP
  - Authentication: None

## Portal API Endpoints

### PA1: Authentication Endpoints
- **POST** `/auth/login` - User login
  - Purpose: Authenticate user and return session token
  - Request: { email, password } or { id_token } for Google OAuth
  - Response: { token, user: { user_id, email, role, display_name }, expires_in }
  - Rate Limit: 5/minute/IP
  - Authentication: None (public endpoint)
  - Validation: Email format, valid credentials

- **POST** `/auth/logout` - User logout
  - Purpose: Invalidate user session
  - Request: {}
  - Response: { success: true }
  - Rate Limit: 10/minute/user
  - Authentication: Required
  - Authorization: Valid session token

- **GET** `/auth/me` - Get current user
  - Purpose: Retrieve current user information
  - Response: { user: { user_id, email, role, display_name, client_id, technician_id } }
  - Rate Limit: 100/minute/user
  - Authentication: Required
  - Authorization: Valid session token

### PA2: User Management (Admin/Super Admin)
- **GET** `/users` - List users
  - Purpose: Retrieve list of users with optional filters
  - Query Params: role?, status?, page?, limit?
  - Response: { users: [User], total, page, limit }
  - Rate Limit: 50/minute/user
  - Authentication: Required
  - Authorization: Admin or Super Admin

- **GET** `/users/{user_id}` - Get user by ID
  - Purpose: Retrieve specific user information
  - Response: { user: User }
  - Rate Limit: 100/minute/user
  - Authentication: Required
  - Authorization: Admin/Super Admin or self

- **POST** `/users` - Create user
  - Purpose: Create a new user account
  - Request: { email, role, display_name, client_id?, technician_id? }
  - Response: { user: User }
  - Rate Limit: 10/hour/user
  - Authentication: Required
  - Authorization: Admin or Super Admin
  - Validation: Valid email, valid role, unique email

- **PUT** `/users/{user_id}` - Update user
  - Purpose: Update user information
  - Request: { email?, role?, display_name?, client_id?, technician_id?, active? }
  - Response: { user: User }
  - Rate Limit: 50/minute/user
  - Authentication: Required
  - Authorization: Admin/Super Admin or self (limited fields)

- **DELETE** `/users/{user_id}` - Deactivate user
  - Purpose: Deactivate a user account
  - Response: { success: true }
  - Rate Limit: 10/hour/user
  - Authentication: Required
  - Authorization: Admin or Super Admin

### PA3: Client Management (Admin/Dispatcher)
- **GET** `/clients` - List clients
  - Purpose: Retrieve list of clients with optional filters
  - Query Params: status?, page?, limit?
  - Response: { clients: [Client], total, page, limit }
  - Rate Limit: 50/minute/user
  - Authentication: Required
  - Authorization: Admin or Dispatcher

- **GET** `/clients/{client_id}` - Get client by ID
  - Purpose: Retrieve specific client information
  - Response: { client: Client }
  - Rate Limit: 100/minute/user
  - Authentication: Required
  - Authorization: Admin, Dispatcher, or associated client users

- **POST** `/clients` - Create client
  - Purpose: Create a new client record
  - Request: { name, contact_person, contact_email, contact_phone, billing_address, vat_number? }
  - Response: { client: Client }
  - Rate Limit: 10/hour/user
  - Authentication: Required
  - Authorization: Admin
  - Validation: Valid email format, required fields

- **PUT** `/clients/{client_id}` - Update client
  - Purpose: Update client information
  - Request: { name?, contact_person?, contact_email?, contact_phone?, billing_address?, vat_number?, account_status? }
  - Response: { client: Client }
  - Rate Limit: 50/minute/user
  - Authentication: Required
  - Authorization: Admin, Dispatcher, or associated client users

### PA4: Site Management (Admin/Dispatcher/Client)
- **GET** `/sites` - List sites
  - Purpose: Retrieve list of sites with optional filters
  - Query Params: client_id?, page?, limit?
  - Response: { sites: [Site], total, page, limit }
  - Rate Limit: 50/minute/user
  - Authentication: Required
  - Authorization: Admin, Dispatcher, or associated Client

- **GET** `/sites/{site_id}` - Get site by ID
  - Purpose: Retrieve specific site information
  - Response: { site: Site }
  - Rate Limit: 100/minute/user
  - Authentication: Required
  - Authorization: Admin, Dispatcher, or associated Client

- **POST** `/sites` - Create site
  - Purpose: Create a new site record
  - Request: { client_id, name, address, contact_person?, contact_phone?, access_instructions?, risk_level? }
  - Response: { site: Site }
  - Rate Limit: 10/hour/user
  - Authentication: Required
  - Authorization: Admin or Dispatcher
  - Validation: Valid client association, required fields

- **PUT** `/sites/{site_id}` - Update site
  - Purpose: Update site information
  - Request: { name?, address?, contact_person?, contact_phone?, access_instructions?, risk_level? }
  - Response: { site: Site }
  - Rate Limit: 50/minute/user
  - Authentication: Required
  - Authorization: Admin, Dispatcher, or associated Client

### PA5: Job Management (All Roles)
- **GET** `/jobs` - List jobs
  - Purpose: Retrieve list of jobs with optional filters
  - Query Params: client_id?, site_id?, technician_id?, status?, job_type?, page?, limit?
  - Response: { jobs: [JobSummary], total, page, limit }
  - Rate Limit: 50/minute/user
  - Authentication: Required
  - Authorization: Depends on filters (see PA5.1)

- **GET** `/jobs/{job_id}` - Get job by ID
  - Purpose: Retrieve specific job information
  - Response: { job: JobDetail }
  - Rate Limit: 100/minute/user
  - Authentication: Required
  - Authorization: See PA5.1

- **POST** `/jobs` - Create job
  - Purpose: Create a new job
  - Request: { client_id, site_id, job_type, description, equipment_list?, special_requirements?, due_date? }
  - Response: { job: JobDetail }
  - Rate Limit: 20/hour/user
  - Authentication: Required
  - Authorization: Admin or Dispatcher
  - Validation: Valid associations, required fields

- **PUT** `/jobs/{job_id}` - Update job
  - Purpose: Update job information
  - Request: { status?, technician_id?, scheduled_date?, description?, equipment_list?, special_requirements?, completed_date? }
  - Response: { job: JobDetail }
  - Rate Limit: 100/minute/user
  - Authentication: Required
  - Authorization: See PA5.1

- **POST** `/jobs/{job_id}/status` - Update job status
  - Purpose: Update job status with validation
  - Request: { status, notes? }
  - Response: { job: JobDetail }
  - Rate Limit: 50/minute/user
  - Authentication: Required
  - Authorization: See PA5.1

#### PA5.1: Job Access Rules
- **Admin/Dispatcher/Super Admin**: Can access all jobs
- **Technician**: Can access assigned jobs only
- **Client**: Can access jobs associated with their client ID only
- **Finance**: Can access jobs for financial information only

### PA6: Job Notes (All Roles)
- **GET** `/jobs/{job_id}/notes` - List job notes
  - Purpose: Retrieve notes for a specific job
  - Response: { notes: [JobNote] }
  - Rate Limit: 100/minute/user
  - Authentication: Required
  - Authorization: Related to job access rules

- **POST** `/jobs/{job_id}/notes` - Create job note
  - Purpose: Add a note to a job
  - Request: { content, visibility? }
  - Response: { note: JobNote }
  - Rate Limit: 50/minute/user
  - Authentication: Required
  - Authorization: Must have access to the job

### PA7: Job Documents (All Roles)
- **GET** `/jobs/{job_id}/documents` - List job documents
  - Purpose: Retrieve documents for a specific job
  - Response: { documents: [JobDocument] }
  - Rate Limit: 100/minute/user
  - Authentication: Required
  - Authorization: Related to job access rules

- **POST** `/jobs/{job_id}/documents` - Upload job document
  - Purpose: Upload a document to a job
  - Request: multipart/form-data with file and metadata
  - Response: { document: JobDocument }
  - Rate Limit: 20/hour/user
  - Authentication: Required
  - Authorization: Must have permission to modify job

- **GET** `/jobs/{job_id}/documents/{document_id}` - Download document
  - Purpose: Download a specific document
  - Response: File content
  - Rate Limit: 50/hour/user
  - Authentication: Required
  - Authorization: Depends on document visibility settings

### PA8: Scheduling (Dispatcher/Technician)
- **GET** `/schedules` - List schedule entries
  - Purpose: Retrieve schedule entries with filters
  - Query Params: technician_id?, date_range_start?, date_range_end?, job_id?
  - Response: { schedules: [ScheduleEntry] }
  - Rate Limit: 50/minute/user
  - Authentication: Required
  - Authorization: Admin, Dispatcher, or own schedule

- **POST** `/schedules` - Create schedule entry
  - Purpose: Create a new schedule entry
  - Request: { job_id, technician_id, start_time, end_time, event_type? }
  - Response: { schedule: ScheduleEntry }
  - Rate Limit: 20/hour/user
  - Authentication: Required
  - Authorization: Admin or Dispatcher

- **PUT** `/schedules/{schedule_id}` - Update schedule
  - Purpose: Update a schedule entry
  - Request: { start_time?, end_time?, status? }
  - Response: { schedule: ScheduleEntry }
  - Rate Limit: 50/hour/user
  - Authentication: Required
  - Authorization: Admin or Dispatcher

- **DELETE** `/schedules/{schedule_id}` - Cancel schedule
  - Purpose: Cancel a scheduled entry
  - Response: { success: true }
  - Rate Limit: 10/hour/user
  - Authentication: Required
  - Authorization: Admin or Dispatcher

### PA9: Assets (Admin/Dispatcher/Technician)
- **GET** `/assets` - List assets
  - Purpose: Retrieve list of assets with optional filters
  - Query Params: site_id?, status?, page?, limit?
  - Response: { assets: [Asset], total, page, limit }
  - Rate Limit: 50/minute/user
  - Authentication: Required
  - Authorization: Admin, Dispatcher, or associated Site access

- **GET** `/assets/{asset_id}` - Get asset by ID
  - Purpose: Retrieve specific asset information
  - Response: { asset: Asset }
  - Rate Limit: 100/minute/user
  - Authentication: Required
  - Authorization: Admin, Dispatcher, Technician (assigned job), or associated Client

- **POST** `/assets` - Create asset
  - Purpose: Create a new asset record
  - Request: { site_id, name, serial_number?, installation_date, specifications?, status? }
  - Response: { asset: Asset }
  - Rate Limit: 20/hour/user
  - Authentication: Required
  - Authorization: Admin or Dispatcher
  - Validation: Valid site association, required fields

- **PUT** `/assets/{asset_id}` - Update asset
  - Purpose: Update asset information
  - Request: { name?, serial_number?, last_service_date?, next_service_due?, specifications?, status? }
  - Response: { asset: Asset }
  - Rate Limit: 50/minute/user
  - Authentication: Required
  - Authorization: Admin, Dispatcher, or associated Technician (during job)

### PA10: Certificates (Admin/Dispatcher/Client)
- **GET** `/certificates` - List certificates
  - Purpose: Retrieve list of certificates with optional filters
  - Query Params: job_id?, client_id?, status?, valid_until?, page?, limit?
  - Response: { certificates: [Certificate], total, page, limit }
  - Rate Limit: 50/minute/user
  - Authentication: Required
  - Authorization: Admin, Dispatcher, or associated Client

- **GET** `/certificates/{certificate_id}` - Get certificate by ID
  - Purpose: Retrieve specific certificate information
  - Response: { certificate: Certificate }
  - Rate Limit: 100/minute/user
  - Authentication: Required
  - Authorization: Admin, Dispatcher, or associated Client

- **POST** `/certificates` - Create certificate
  - Purpose: Generate a new certificate for a job
  - Request: { job_id, certificate_type, valid_from, valid_until, issued_by? }
  - Response: { certificate: Certificate }
  - Rate Limit: 10/hour/user
  - Authentication: Required
  - Authorization: Admin or Dispatcher
  - Validation: Valid job status, date ranges

### PA11: Financial Management (Finance/Admin)
- **GET** `/invoices` - List invoices
  - Purpose: Retrieve list of invoices with optional filters
  - Query Params: client_id?, status?, issue_date_start?, issue_date_end?, page?, limit?
  - Response: { invoices: [Invoice], total, page, limit }
  - Rate Limit: 50/minute/user
  - Authentication: Required
  - Authorization: Finance, Admin, or associated Client

- **GET** `/invoices/{invoice_id}` - Get invoice by ID
  - Purpose: Retrieve specific invoice information
  - Response: { invoice: Invoice }
  - Rate Limit: 100/minute/user
  - Authentication: Required
  - Authorization: Finance, Admin, associated Client, or Super Admin

- **POST** `/invoices` - Create invoice
  - Purpose: Generate a new invoice
  - Request: { job_id, client_id, issue_date, due_date, amount, tax_amount?, description? }
  - Response: { invoice: Invoice }
  - Rate Limit: 20/hour/user
  - Authentication: Required
  - Authorization: Finance or Admin
  - Validation: Valid amounts, date ranges, job status

- **GET** `/payments` - List payments
  - Purpose: Retrieve list of payments with optional filters
  - Query Params: invoice_id?, payment_method?, received_date_start?, received_date_end?, page?, limit?
  - Response: { payments: [Payment], total, page, limit }
  - Rate Limit: 50/minute/user
  - Authentication: Required
  - Authorization: Finance, Admin, or Super Admin

- **POST** `/invoices/{invoice_id}/payments` - Record payment
  - Purpose: Record a payment against an invoice
  - Request: { amount, payment_method, payment_reference, received_date }
  - Response: { payment: Payment }
  - Rate Limit: 20/hour/user
  - Authentication: Required
  - Authorization: Finance or Admin
  - Validation: Valid amount, payment method, date

### PA12: System and Audit (Admin/Super Admin)
- **GET** `/system/health` - System health check
  - Purpose: Check system health and status
  - Response: { status: 'healthy'|'degraded'|'unhealthy', services: {...} }
  - Rate Limit: 100/minute/user
  - Authentication: Required
  - Authorization: Admin or Super Admin

- **GET** `/audit/logs` - Retrieve audit logs
  - Purpose: Get system audit logs with filters
  - Query Params: user_id?, action?, entity_type?, date_start?, date_end?, page?, limit?
  - Response: { logs: [AuditLog], total, page, limit }
  - Rate Limit: 20/minute/user
  - Authentication: Required
  - Authorization: Admin or Super Admin

- **GET** `/settings` - Get system settings
  - Purpose: Retrieve system configuration settings
  - Response: { settings: { [key: string]: any } }
  - Rate Limit: 50/minute/user
  - Authentication: Required
  - Authorization: Admin or Super Admin

## External Integrations

### EI1: Google Workspace
- **OAuth**: Authentication via Google OAuth 2.0
- **Sheets API**: Data storage and retrieval (migration target: PostgreSQL)
- **Calendar API**: Scheduling and appointment management
- **Rate Limits**: 300 requests per minute per user

### EI2: Cloudflare Services
- **Workers KV**: Caching layer for frequently accessed data
- **Pages**: Frontend hosting for public website and portal
- **Analytics**: Performance and usage monitoring
- **Rate Limits**: Per account limits

### EI3: Email Service
- **Transactional Emails**: Password resets, notifications, receipts
- **Provider**: Implementation dependent (SendGrid, AWS SES, etc.)
- **Rate Limits**: Provider dependent

### EI4: Document Generation
- **PDF Generation**: HTML-to-PDF conversion for reports and certificates
- **Template Engine**: For dynamic document creation
- **Storage**: Cloud storage for generated documents

## Error Handling

### Standard Error Format
```json
{
  "error": {
    "code": "string",
    "message": "string",
    "details": "object",
    "correlation_id": "string"
  }
}
```

### Common Error Codes
- `unauthorized`: Authentication required
- `forbidden`: Insufficient permissions
- `not_found`: Resource not found
- `validation_error`: Request validation failed
- `rate_limit_exceeded`: Rate limit exceeded
- `internal_error`: Internal server error

This API integration map provides a comprehensive overview of the Kharon Platform's endpoints and integration points for the rebuild project.