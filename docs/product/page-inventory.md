# Kharon Platform - Page Inventory

## Overview

This document catalogs all pages in the Kharon Platform, distinguishing between the public website and the protected portal. It serves as a comprehensive inventory for navigation design and implementation.

## Public Website Pages

### Home Section
- **PW1.1**: Home Page (`/`)
  - Purpose: Main landing page, introduction to Kharon services
  - Components: Hero section, service highlights, testimonials, CTA
  - SEO Keywords: fire detection, gas suppression, security systems
  - Access: Public

- **PW1.2**: About Us (`/about`)
  - Purpose: Company background, values, and team information
  - Components: Company history, mission statement, team profiles
  - SEO Keywords: about Kharon, company history, fire safety
  - Access: Public

- **PW1.3**: Services Overview (`/services`)
  - Purpose: Overview of all service offerings
  - Components: Service categories, brief descriptions, CTAs
  - SEO Keywords: Kharon services, fire safety services, security services
  - Access: Public

### Service-Specific Pages
- **PW2.1**: Fire Detection Services (`/services/fire-detection`)
  - Purpose: Detailed information about fire detection services
  - Components: Service details, equipment, compliance, case studies
  - SEO Keywords: fire detection, fire alarms, fire safety systems
  - Access: Public

- **PW2.2**: Gas Suppression Services (`/services/gas-suppression`)
  - Purpose: Detailed information about gas suppression systems
  - Components: System types, installation, maintenance, safety
  - SEO Keywords: gas suppression, fire suppression, clean agent systems
  - Access: Public

- **PW2.3**: Security Systems (`/services/security-systems`)
  - Purpose: Information about security system installations
  - Components: Security solutions, monitoring, access control
  - SEO Keywords: security systems, access control, monitoring
  - Access: Public

- **PW2.4**: Maintenance Services (`/services/maintenance`)
  - Purpose: Details about ongoing maintenance services
  - Components: Maintenance programs, scheduling, compliance
  - SEO Keywords: fire system maintenance, security system maintenance
  - Access: Public

### Industry and Compliance
- **PW3.1**: Industries Served (`/industries`)
  - Purpose: Highlight sectors served by Kharon
  - Components: Industry-specific solutions, case studies, testimonials
  - SEO Keywords: industrial fire safety, commercial fire protection
  - Access: Public

- **PW3.2**: Compliance Information (`/compliance`)
  - Purpose: Information about safety standards and compliance
  - Components: Regulatory standards, certification bodies, compliance process
  - SEO Keywords: fire safety compliance, SANS standards, safety regulations
  - Access: Public

### Engagement Pages
- **PW4.1**: Contact Page (`/contact`)
  - Purpose: Contact information and inquiry form
  - Components: Contact form, phone numbers, email, physical address
  - SEO Keywords: contact Kharon, fire safety contact, emergency contact
  - Access: Public

- **PW4.2**: Request Service (`/request-service`)
  - Purpose: Form for requesting services
  - Components: Service request form, contact information, site details
  - SEO Keywords: request fire service, schedule inspection, service request
  - Access: Public

- **PW4.3**: Portal Access (`/portal`)
  - Purpose: Gateway to the protected operations portal
  - Components: Login button, authentication options
  - SEO Keywords: Kharon portal, login, customer access
  - Access: Public (leads to authentication)

### Legal and Policy
- **PW5.1**: Privacy Policy (`/privacy-policy`)
  - Purpose: Data privacy information
  - Components: Data collection, usage, protection, rights
  - SEO Keywords: privacy policy, data protection, privacy rights
  - Access: Public

- **PW5.2**: Terms of Service (`/terms`)
  - Purpose: Terms governing website use
  - Components: Usage terms, liability, intellectual property
  - SEO Keywords: terms of service, website terms, legal terms
  - Access: Public

- **PW5.3**: POPIA Policy (`/popia`)
  - Purpose: Protection of Personal Information Act compliance
  - Components: POPIA rights, information handling, consent
  - SEO Keywords: POPIA, data privacy South Africa, personal information
  - Access: Public

## Protected Portal Pages

### Authentication
- **PP1.1**: Login Page (`/portal/login`)
  - Purpose: User authentication
  - Components: Google login button, development tokens (dev env)
  - Access: Unauthenticated users

- **PP1.2**: Logout Handler (`/portal/logout`)
  - Purpose: End user session
  - Components: Session termination, redirect
  - Access: Authenticated users

### Dashboard and Navigation
- **PP2.1**: Portal Dashboard (`/portal/dashboard`)
  - Purpose: Role-specific dashboard overview
  - Components: Recent activity, quick stats, role-specific widgets
  - Access: Authenticated users
  - Role Variants: Admin, Dispatcher, Technician, Client, Finance

### Admin Pages
- **PP3.1**: Admin Dashboard (`/portal/admin`)
  - Purpose: Administrative functions and oversight
  - Components: System health, user management, reports
  - Access: Admin, Super Admin

- **PP3.2**: User Management (`/portal/admin/users`)
  - Purpose: Create, update, and manage user accounts
  - Components: User list, create form, edit forms, deactivation
  - Access: Admin, Super Admin

- **PP3.3**: System Settings (`/portal/admin/settings`)
  - Purpose: System configuration and settings
  - Components: Configuration forms, environment info
  - Access: Admin, Super Admin

- **PP3.4**: System Health (`/portal/admin/health`)
  - Purpose: Monitor system performance and health
  - Components: Metrics, logs, error reports
  - Access: Admin, Super Admin

### Dispatcher Pages
- **PP4.1**: Dispatcher Dashboard (`/portal/dispatcher`)
  - Purpose: Dispatcher-specific dashboard
  - Components: Today's jobs, unassigned jobs, technician schedule
  - Access: Dispatcher, Admin, Super Admin

- **PP4.2**: Job Creation (`/portal/dispatcher/create-job`)
  - Purpose: Create new jobs
  - Components: Job specification form, client/site selection
  - Access: Dispatcher, Admin, Super Admin

- **PP4.3**: Job Assignment (`/portal/dispatcher/assign-jobs`)
  - Purpose: Assign technicians to jobs
  - Components: Job list, technician selection, scheduling
  - Access: Dispatcher, Admin, Super Admin

- **PP4.4**: Schedule Management (`/portal/dispatcher/schedule`)
  - Purpose: View and manage schedules
  - Components: Calendar view, conflict resolution, rescheduling
  - Access: Dispatcher, Admin, Super Admin

### Technician Pages
- **PP5.1**: Technician Dashboard (`/portal/technician`)
  - Purpose: Technician-specific dashboard
  - Components: My jobs, offline-ready jobs, quick start
  - Access: Technician, Admin, Super Admin

- **PP5.2**: Job Execution (`/portal/technician/job/[id]`)
  - Purpose: Execute assigned jobs
  - Components: Job details, checklists, photo upload, signature capture
  - Access: Assigned technician, Admin, Super Admin

- **PP5.3**: Offline Jobs (`/portal/technician/offline`)
  - Purpose: Access jobs while offline
  - Components: Cached job list, offline status indicators
  - Access: Technician, Admin, Super Admin

- **PP5.4**: Submit Report (`/portal/technician/submit-report`)
  - Purpose: Submit completed job reports
  - Components: Report form, attachments, submission review
  - Access: Technician, Admin, Super Admin

### Client Pages
- **PP6.1**: Client Dashboard (`/portal/client`)
  - Purpose: Client-specific dashboard
  - Components: My sites, recent jobs, upcoming appointments
  - Access: Client, Admin, Super Admin

- **PP6.2**: My Sites (`/portal/client/sites`)
  - Purpose: View and manage client sites
  - Components: Site list, details, contact information
  - Access: Associated client, Admin, Super Admin

- **PP6.3**: Job History (`/portal/client/history`)
  - Purpose: View job history for client sites
  - Components: Job timeline, status, documents
  - Access: Associated client, Admin, Super Admin

- **PP6.4**: Documents (`/portal/client/documents`)
  - Purpose: Access reports and certificates
  - Components: Report list, certificate gallery, download options
  - Access: Associated client, Admin, Super Admin

### Finance Pages
- **PP7.1**: Finance Dashboard (`/portal/finance`)
  - Purpose: Financial overview and management
  - Components: Revenue metrics, outstanding invoices, payment status
  - Access: Finance, Admin, Super Admin

- **PP7.2**: Invoice Management (`/portal/finance/invoices`)
  - Purpose: Create and manage invoices
  - Components: Invoice list, creation form, status tracking
  - Access: Finance, Admin, Super Admin

- **PP7.3**: Payment Tracking (`/portal/finance/payments`)
  - Purpose: Track payments and balances
  - Components: Payment list, balance tracking, reminders
  - Access: Finance, Admin, Super Admin

- **PP7.4**: Debtors Report (`/portal/finance/debtors`)
  - Purpose: View outstanding debtor information
  - Components: Debtor list, aging report, contact information
  - Access: Finance, Admin, Super Admin

### Common Portal Pages
- **PP8.1**: Job List (`/portal/jobs`)
  - Purpose: List of jobs based on user permissions
  - Components: Filterable job list, status indicators, quick actions
  - Access: Role-dependent

- **PP8.2**: Job Detail (`/portal/jobs/[id]`)
  - Purpose: Detailed view of a specific job
  - Components: Job information, timeline, documents, actions
  - Access: Role-dependent based on job ownership/assignment

- **PP8.3**: Service Reports (`/portal/service-reports`)
  - Purpose: Access to generated service reports
  - Components: Report list, filtering, generation interface
  - Access: Role-dependent

- **PP8.4**: Certificates (`/portal/certificates`)
  - Purpose: Access to generated certificates
  - Components: Certificate list, validity tracking, download
  - Access: Role-dependent

- **PP8.5**: Assets Management (`/portal/assets`)
  - Purpose: Manage equipment and assets
  - Components: Asset list, specifications, maintenance records
  - Access: Role-dependent

- **PP8.6**: Sites Management (`/portal/sites`)
  - Purpose: Manage sites and locations
  - Components: Site list, details, equipment inventory
  - Access: Role-dependent

- **PP8.7**: Offline Status (`/portal/offline`)
  - Purpose: Manage offline state and sync
  - Components: Sync status, queue management, sync controls
  - Access: Technician, Admin, Super Admin

- **PP8.8**: Settings (`/portal/settings`)
  - Purpose: User-specific settings
  - Components: Profile management, preferences, notifications
  - Access: Authenticated users

- **PP8.9**: Unauthorized Access (`/portal/unauthorized`)
  - Purpose: Handle unauthorized access attempts
  - Components: Access denied message, role clarification
  - Access: Redirect for unauthorized users

## Navigation Structure

### Public Website Navigation
- Top-level: Home, Services, Industries, About, Contact
- Secondary: Service-specific pages, compliance information
- Footer: Legal pages, contact information, social links

### Portal Navigation
- Sidebar: Role-specific navigation based on user role
- Top bar: User profile, notifications, system status
- Breadcrumb: Contextual navigation within the portal
- Quick actions: Role-specific shortcuts to common functions

## Mobile Responsiveness

### Public Website
- Mobile-first design approach
- Collapsible navigation menu
- Touch-optimized forms and buttons
- Optimized image loading

### Portal
- Responsive dashboard layouts
- Touch-friendly interface for field technicians
- Collapsible sidebars and menus
- Optimized for tablet and mobile devices

This page inventory provides a comprehensive map of all platform pages and their intended functionality for the Kharon Platform rebuild.