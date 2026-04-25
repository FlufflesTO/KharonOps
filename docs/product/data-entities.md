# Kharon Platform - Data Entities

## Overview

This document defines all data entities in the Kharon Platform, including their attributes, relationships, and access controls. It serves as a comprehensive reference for database design and API development.

## Entity Categories

### E1: User and Identity Entities

#### E1.1: User
- **Description**: Represents all system users regardless of role
- **Attributes**:
  - `user_id` (string): Unique identifier for the user
  - `email` (string): User's email address (unique)
  - `role` (Role enum): User's role in the system (client, technician, dispatcher, finance, admin, super_admin)
  - `display_name` (string): User's display name
  - `client_id` (string): Associated client ID (for client users)
  - `technician_id` (string): Associated technician ID (for technician users)
  - `active` (boolean): Whether the account is active
  - `created_at` (Date): Account creation timestamp
  - `updated_at` (Date): Last update timestamp
- **Relationships**:
  - One-to-many with Job (as assigned technician)
  - One-to-many with Job (as client)
  - Many-to-many with Site (through Client)
- **Access Controls**: Admin/Super Admin can modify; users can view/update own profile
- **Validation**: Email format, role enum constraint, unique email
- **Indexes**: email (unique), role, active

#### E1.2: Role
- **Description**: Role definitions and permissions
- **Attributes**:
  - `role_name` (string): Role identifier
  - `permissions` (array): List of permissions associated with the role
  - `description` (string): Human-readable description of the role
- **Relationships**: Referenced by User entity
- **Access Controls**: Read-only through user entity; managed through configuration
- **Validation**: Must be one of predefined role values
- **Indexes**: role_name (unique)

### E2: Client and Site Entities

#### E2.1: Client
- **Description**: Represents a business entity that receives services
- **Attributes**:
  - `client_id` (string): Unique identifier for the client
  - `name` (string): Client's business name
  - `contact_person` (string): Primary contact person
  - `contact_email` (string): Primary contact email
  - `contact_phone` (string): Primary contact phone
  - `billing_address` (object): Complete billing address
  - `vat_number` (string): VAT registration number (optional)
  - `account_status` (string): Active, Inactive, Suspended
  - `created_at` (Date): Record creation timestamp
  - `updated_at` (Date): Last update timestamp
- **Relationships**:
  - One-to-many with Site
  - One-to-many with Job
  - One-to-many with User (as associated client users)
- **Access Controls**: Admin/Dispatcher can manage; Client can view own data
- **Validation**: Email format, phone format, unique client_id
- **Indexes**: client_id (unique), name, account_status

#### E2.2: Site
- **Description**: Represents a physical location where services are performed
- **Attributes**:
  - `site_id` (string): Unique identifier for the site
  - `client_id` (string): Associated client
  - `name` (string): Name of the site/location
  - `address` (object): Complete address of the site
  - `contact_person` (string): On-site contact person
  - `contact_phone` (string): On-site contact phone
  - `access_instructions` (string): Special instructions for site access
  - `risk_level` (string): Low, Medium, High
  - `created_at` (Date): Record creation timestamp
  - `updated_at` (Date): Last update timestamp
- **Relationships**:
  - Many-to-one with Client
  - One-to-many with Job
  - One-to-many with Asset
- **Access Controls**: Admin/Dispatcher can manage; Client can view associated sites
- **Validation**: Required address, client association
- **Indexes**: site_id (unique), client_id, name

### E3: Job and Task Entities

#### E3.1: Job
- **Description**: Represents a specific service task to be performed
- **Attributes**:
  - `job_id` (string): Unique identifier for the job
  - `client_id` (string): Associated client
  - `site_id` (string): Associated site
  - `job_type` (string): Type of service (fire_detection, gas_suppression, security, maintenance)
  - `status` (JobStatus enum): Current status of the job
  - `technician_id` (string): Assigned technician ID
  - `scheduled_date` (Date): Scheduled date for the job
  - `due_date` (Date): Due date for job completion
  - `description` (string): Detailed description of the job
  - `equipment_list` (array): List of equipment to be serviced
  - `special_requirements` (string): Any special requirements
  - `created_by` (string): User ID of the creator
  - `completed_date` (Date): Date of completion (when applicable)
  - `notes` (array): Array of note objects
  - `row_version` (number): Version number for concurrency control
  - `created_at` (Date): Record creation timestamp
  - `updated_at` (Date): Last update timestamp
- **Relationships**:
  - Many-to-one with Client
  - Many-to-one with Site
  - Many-to-one with User (as assigned technician)
  - One-to-many with JobNote
  - One-to-many with JobDocument
- **Access Controls**: Admin/Dispatcher can manage all; Technician can update assigned jobs; Client can view own jobs
- **Validation**: Valid status transition, required associations
- **Indexes**: job_id (unique), client_id, site_id, technician_id, status, scheduled_date

#### E3.2: JobStatus
- **Description**: Enum representing possible job statuses
- **Values**:
  - draft: Job created but not scheduled
  - scheduled: Job scheduled for a date
  - assigned: Technician assigned to job
  - in_progress: Technician started the job
  - pending_review: Job completed, awaiting review
  - completed: Job completed and approved
  - cancelled: Job cancelled
  - overdue: Job past due date
- **Relationships**: Referenced by Job entity
- **Access Controls**: Read-only through job entity
- **Validation**: Must be one of predefined status values

#### E3.3: JobNote
- **Description**: Notes added to a job by various users
- **Attributes**:
  - `note_id` (string): Unique identifier for the note
  - `job_id` (string): Associated job
  - `author_user_id` (string): User who created the note
  - `content` (string): Content of the note
  - `visibility` (string): Who can view the note (internal, client_visible)
  - `created_at` (Date): Note creation timestamp
- **Relationships**:
  - Many-to-one with Job
  - Many-to-one with User (author)
- **Access Controls**: Depends on visibility setting and user role
- **Validation**: Non-empty content, valid visibility option
- **Indexes**: note_id (unique), job_id, author_user_id, created_at

#### E3.4: JobDocument
- **Description**: Documents associated with a job (reports, certificates, etc.)
- **Attributes**:
  - `document_id` (string): Unique identifier for the document
  - `job_id` (string): Associated job
  - `document_type` (string): Type of document (report, certificate, photo)
  - `filename` (string): Original filename
  - `storage_path` (string): Path to stored document
  - `uploaded_by` (string): User who uploaded the document
  - `published` (boolean): Whether document is published for client access
  - `created_at` (Date): Document upload timestamp
- **Relationships**:
  - Many-to-one with Job
  - Many-to-one with User (uploader)
- **Access Controls**: Published docs accessible to client; all docs accessible to admin/dispatcher
- **Validation**: Valid document type, valid job association
- **Indexes**: document_id (unique), job_id, document_type, published

### E4: Scheduling Entities

#### E4.1: Schedule
- **Description**: Scheduling information for jobs and technician availability
- **Attributes**:
  - `schedule_id` (string): Unique identifier for the schedule entry
  - `job_id` (string): Associated job (optional if general availability)
  - `technician_id` (string): Associated technician
  - `start_time` (Date): Start time of scheduled event
  - `end_time` (Date): End time of scheduled event
  - `event_type` (string): Job, Availability, Leave
  - `status` (string): Scheduled, Confirmed, Rescheduled, Cancelled
  - `created_at` (Date): Schedule creation timestamp
  - `updated_at` (Date): Last update timestamp
- **Relationships**:
  - Many-to-one with Job (optional)
  - Many-to-one with User (technician)
- **Access Controls**: Admin/Dispatcher can manage; Technician can view own schedule
- **Validation**: Valid time range, no overlapping jobs for same technician
- **Indexes**: schedule_id (unique), job_id, technician_id, start_time

### E5: Asset and Equipment Entities

#### E5.1: Asset
- **Description**: Equipment or assets at a site that require service
- **Attributes**:
  - `asset_id` (string): Unique identifier for the asset
  - `site_id` (string): Associated site
  - `name` (string): Name/model of the asset
  - `serial_number` (string): Serial number of the asset
  - `installation_date` (Date): Date the asset was installed
  - `last_service_date` (Date): Date of last service
  - `next_service_due` (Date): Date of next required service
  - `specifications` (object): Technical specifications
  - `status` (string): Active, Inactive, Decommissioned
  - `created_at` (Date): Record creation timestamp
  - `updated_at` (Date): Last update timestamp
- **Relationships**:
  - Many-to-one with Site
  - One-to-many with ServiceRecord
- **Access Controls**: Admin/Dispatcher can manage; Technician can view; Client can view own site assets
- **Validation**: Required associations, valid status
- **Indexes**: asset_id (unique), site_id, next_service_due, status

#### E5.2: ServiceRecord
- **Description**: Historical record of services performed on an asset
- **Attributes**:
  - `record_id` (string): Unique identifier for the record
  - `asset_id` (string): Associated asset
  - `job_id` (string): Associated job that generated this record
  - `service_type` (string): Type of service performed
  - `technician_id` (string): Technician who performed the service
  - `service_date` (Date): Date the service was performed
  - `findings` (string): What was found during the service
  - `actions_taken` (string): What actions were taken
  - `recommendations` (string): Recommendations for future action
  - `created_at` (Date): Record creation timestamp
- **Relationships**:
  - Many-to-one with Asset
  - Many-to-one with Job
  - Many-to-one with User (technician)
- **Access Controls**: Admin/Dispatcher/Technician can create; all roles can view relevant records
- **Validation**: Valid service date, required associations
- **Indexes**: record_id (unique), asset_id, job_id, service_date

### E6: Document and Report Entities

#### E6.1: DocumentTemplate
- **Description**: Templates used for generating documents
- **Attributes**:
  - `template_id` (string): Unique identifier for the template
  - `name` (string): Name of the template
  - `type` (string): Type of document (jobcard, report, certificate)
  - `content` (string): Template content with placeholders
  - `version` (string): Version of the template
  - `is_active` (boolean): Whether this template is currently active
  - `created_by` (string): User who created the template
  - `created_at` (Date): Template creation timestamp
  - `updated_at` (Date): Last update timestamp
- **Relationships**: Used to generate JobDocument entities
- **Access Controls**: Admin/Super Admin can manage
- **Validation**: Valid template syntax, non-empty content
- **Indexes**: template_id (unique), name, type, version

#### E6.2: Certificate
- **Description**: Compliance certificates generated after job completion
- **Attributes**:
  - `certificate_id` (string): Unique identifier for the certificate
  - `job_id` (string): Associated job
  - `certificate_type` (string): Type of certificate (fire, gas, security)
  - `certificate_number` (string): Unique certificate number
  - `issue_date` (Date): Date the certificate was issued
  - `valid_from` (Date): Start date of certificate validity
  - `valid_until` (Date): End date of certificate validity
  - `issued_by` (string): User who issued the certificate
  - `qr_code_data` (string): Data for QR code verification
  - `status` (string): Valid, Expired, Revoked
  - `created_at` (Date): Certificate creation timestamp
  - `updated_at` (Date): Last update timestamp
- **Relationships**:
  - Many-to-one with Job
  - Many-to-one with User (issuer)
- **Access Controls**: Admin/Dispatcher can issue; Client can view own certificates
- **Validation**: Valid date ranges, non-expired template
- **Indexes**: certificate_id (unique), job_id, certificate_number, valid_until, status

### E7: Financial Entities

#### E7.1: Invoice
- **Description**: Invoices generated for completed jobs
- **Attributes**:
  - `invoice_id` (string): Unique identifier for the invoice
  - `job_id` (string): Associated job (optional for composite invoices)
  - `client_id` (string): Associated client
  - `invoice_number` (string): Sequential invoice number
  - `issue_date` (Date): Date the invoice was issued
  - `due_date` (Date): Date payment is due
  - `amount` (number): Total amount in local currency
  - `tax_amount` (number): Tax amount
  - `status` (string): Draft, Sent, Paid, Overdue, Cancelled
  - `issued_by` (string): User who issued the invoice
  - `paid_date` (Date): Date payment was received
  - `created_at` (Date): Invoice creation timestamp
  - `updated_at` (Date): Last update timestamp
- **Relationships**:
  - Many-to-one with Job (optional)
  - Many-to-one with Client
  - Many-to-one with User (issuer)
  - One-to-many with Payment
- **Access Controls**: Finance/Admin can manage; Client can view own invoices
- **Validation**: Valid amounts, date ranges, status transitions
- **Indexes**: invoice_id (unique), invoice_number (unique), client_id, status, due_date

#### E7.2: Payment
- **Description**: Payments received against invoices
- **Attributes**:
  - `payment_id` (string): Unique identifier for the payment
  - `invoice_id` (string): Associated invoice
  - `amount` (number): Amount paid
  - `payment_method` (string): Method of payment (EFT, Cash, Credit Card)
  - `payment_reference` (string): Reference from payment provider
  - `received_date` (Date): Date payment was received
  - `processed_by` (string): User who processed the payment
  - `status` (string): Pending, Processed, Failed, Reversed
  - `created_at` (Date): Payment record creation timestamp
  - `updated_at` (Date): Last update timestamp
- **Relationships**:
  - Many-to-one with Invoice
  - Many-to-one with User (processor)
- **Access Controls**: Finance/Admin can manage
- **Validation**: Valid amount, successful payment verification
- **Indexes**: payment_id (unique), invoice_id, payment_reference, status

### E8: System and Audit Entities

#### E8.1: AuditLog
- **Description**: Log of important system events and user actions
- **Attributes**:
  - `log_id` (string): Unique identifier for the log entry
  - `timestamp` (Date): Time the event occurred
  - `user_id` (string): User responsible for the action (if applicable)
  - `action` (string): Description of the action performed
  - `entity_type` (string): Type of entity involved (Job, User, etc.)
  - `entity_id` (string): ID of the entity involved
  - `details` (object): Additional details about the action
  - `ip_address` (string): IP address of the request (if applicable)
  - `user_agent` (string): User agent of the requesting client
- **Relationships**: References other entities by ID
- **Access Controls**: Super Admin and Admin can access; limited access for other roles
- **Validation**: Required fields, valid action format
- **Indexes**: log_id (unique), timestamp, user_id, entity_type

#### E8.2: SystemSetting
- **Description**: Configuration settings for the system
- **Attributes**:
  - `setting_id` (string): Unique identifier for the setting
  - `key` (string): Setting identifier
  - `value` (string/object): Setting value (could be string, number, or JSON)
  - `description` (string): Description of what the setting controls
  - `category` (string): Category of the setting (security, workflow, etc.)
  - `is_sensitive` (boolean): Whether the setting contains sensitive information
  - `updated_by` (string): User who last updated the setting
  - `updated_at` (Date): Last update timestamp
- **Relationships**: None
- **Access Controls**: Super Admin and Admin can manage
- **Validation**: Valid key format, appropriate value type
- **Indexes**: setting_id (unique), key (unique)

## Relationships Summary

- User ↔ Job: One-to-many (users can create multiple jobs)
- Client ↔ Site: One-to-many (clients can have multiple sites)
- Site ↔ Job: One-to-many (sites can have multiple jobs)
- Job ↔ JobNote: One-to-many (jobs can have multiple notes)
- Job ↔ JobDocument: One-to-many (jobs can have multiple documents)
- User ↔ Schedule: One-to-many (users can have multiple schedule entries)
- Site ↔ Asset: One-to-many (sites can have multiple assets)
- Asset ↔ ServiceRecord: One-to-many (assets can have multiple service records)
- Job ↔ Certificate: One-to-one (jobs can generate one certificate)
- Client ↔ Invoice: One-to-many (clients can have multiple invoices)
- Invoice ↔ Payment: One-to-many (invoices can have multiple payments)

## Data Validation Rules

1. **Referential Integrity**: All foreign key relationships must reference valid entities
2. **Unique Constraints**: Where specified, fields must have unique values
3. **Format Validation**: Email, phone, and other formatted fields must match expected patterns
4. **Business Rules**: 
   - Job status transitions must follow allowed sequences
   - Scheduling must not allow double-booking of technicians
   - Certificate validity dates must be logical
   - Financial amounts must be positive where appropriate

## Indexing Strategy

1. **Primary Keys**: Each entity has a unique identifier
2. **Foreign Keys**: Frequently joined fields are indexed
3. **Query Patterns**: Indexes based on common query patterns
4. **Filtering**: Fields used for filtering in UI are indexed
5. **Temporal**: Date/time fields that are commonly searched are indexed

This data entity model provides a comprehensive foundation for the Kharon Platform database design and API development.