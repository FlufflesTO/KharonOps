# Kharon Platform - Role Map

## Overview

This document defines the roles within the Kharon Platform, their permissions, responsibilities, and access levels. Each role is designed to support specific operational workflows while maintaining security and data isolation.

## Role Definitions

### 1. Administrator (Admin)

#### Permissions
- Full access to user management (create, update, deactivate)
- Complete client and site administration
- View and manage all jobs across the system
- Access to all reports and analytics
- System configuration and settings
- Document generation for any job
- Access to system health and audit logs
- Ability to complete or archive jobs
- Access to all historical data

#### Responsibilities
- Manage user accounts and permissions
- Configure system settings
- Oversee compliance and quality assurance
- Handle escalated issues
- Generate business reports
- Maintain client and site records
- Review and approve technician submissions

#### Access Level
- Full system access (except super_admin functions)
- Can view data for all roles
- No restrictions on data modification within their domain

### 2. Super Administrator (Super Admin)

#### Permissions
- All administrator permissions
- Platform-level configuration
- Business unit management
- Access to all data regardless of ownership
- Bypass all permission checks (with audit trail)
- System-level troubleshooting
- Access to all audit logs
- Platform control functions

#### Responsibilities
- Platform maintenance and oversight
- Troubleshooting system-wide issues
- Managing business units
- Handling critical system configurations
- Oversight of admin activities

#### Access Level
- Complete platform access
- Can bypass all role-based restrictions
- Access to all data and functions
- Subject to enhanced audit logging

### 3. Dispatcher

#### Permissions
- Create new jobs
- Assign technicians to jobs
- Track job status across the system
- Reschedule appointments
- Access to scheduling calendar
- Perform client and site lookups
- Coordinate technician activities
- Publish documents (certificates, reports)
- Access to people directory

#### Responsibilities
- Schedule jobs and assign technicians
- Monitor job progress
- Coordinate with clients and technicians
- Handle rescheduling and emergencies
- Maintain schedule efficiency
- Ensure proper resource allocation

#### Access Level
- Access to all jobs (read/write)
- Limited client information access
- Schedule management rights
- Document publishing rights

### 4. Field Technician

#### Permissions
- View assigned jobs
- Access job information for offline use
- Start and complete assigned jobs
- Complete digital checklists
- Capture notes and observations
- Upload photos (when online)
- Capture electronic signatures
- Submit service reports
- Access to their own schedule

#### Responsibilities
- Execute assigned jobs according to specifications
- Complete required checklists and documentation
- Report issues or anomalies
- Capture required evidence (photos, signatures)
- Submit timely and accurate reports
- Update job status appropriately

#### Access Level
- Access only to assigned jobs
- Limited to their own schedule
- Write access only to their assigned jobs
- Restricted from viewing other technicians' assignments

### 5. Finance

#### Permissions
- Access to financial data and reports
- Invoice and payment tracking
- Debtors report access
- Quote and billing information
- Revenue analytics
- Client payment history

#### Responsibilities
- Manage invoicing and payments
- Track outstanding debts
- Prepare financial reports
- Monitor revenue streams
- Handle billing disputes

#### Access Level
- Access to financial data only
- No access to operational details unrelated to finance
- Read-only access to job information for billing purposes
- Restricted from modifying operational data

### 6. Client

#### Permissions
- View their own sites
- Access job history for their sites
- Download reports and certificates
- Request new services
- View completed work relevant to their account
- Update their own contact information

#### Responsibilities
- Provide accurate site information
- Request services as needed
- Review and acknowledge completed work
- Maintain contact information accuracy

#### Access Level
- Access limited to their own data
- No visibility into other clients' information
- Read-only access to their own job history
- No ability to modify system data

## Role-Based Access Rules

### Data Isolation
- Clients can only access their own data
- Technicians can only access assigned jobs
- Dispatchers can access all jobs but limited client details
- Finance can access financial data but limited operational details
- Admins have broad access but not platform-level controls
- Super Admins have unrestricted access

### Permission Inheritance
- Super Admin bypasses all role checks
- Admins have permissions that encompass multiple roles
- Role-specific permissions are enforced server-side
- Client-side role information is not trusted for access decisions

### Security Checks
- All sensitive operations are validated server-side
- Ownership is verified for all data access
- Role-based filters are applied at the service layer
- Audit logs record all access and modifications

## Role Transitions and Management

### Role Assignment
- Admins can assign roles to users (except Super Admin)
- Super Admin role configured through environment variables
- Role changes trigger recalculation of access permissions
- Role changes are recorded in audit logs

### Session Management
- Role information stored in encrypted session tokens
- Session tokens validated on each request
- Role changes require re-authentication
- Sessions expire based on role sensitivity

### Emulation for Testing
- Admins can emulate other roles for troubleshooting
- Emulation activities are logged separately
- Emulation requires explicit activation
- Emulation is time-limited for security

## Integration with Workflows

### Job Lifecycle
- Admin/Dispatcher: Create and assign jobs
- Dispatcher: Schedule and reschedule
- Technician: Execute and report
- Admin: Review and approve
- Client: View results

### Document Generation
- Technician: Generate reports
- Dispatcher: Publish documents
- Admin: Generate various document types
- Client: Download approved documents

### Scheduling
- Dispatcher: Full scheduling control
- Technician: View own schedule
- Client: Request appointments
- Admin: Override scheduling as needed

This role map ensures appropriate access controls while enabling efficient workflows for each role within the Kharon Platform.