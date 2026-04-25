# Integration Map - KharonOps Platform

## Overview
This document maps all external integrations and internal service connections in the existing system, providing guidance for the rebuild process.

## External Integrations

### I1: Google Workspace
- **Type**: Primary Data Store & Authentication
- **Components**: 
  - Google Sheets (data storage)
  - Google OAuth (authentication)
  - Google Calendar (scheduling)
- **Endpoints**: 
  - Sheets API: spreadsheets.values.batchGet, spreadsheets.values.update
  - OAuth2: token validation and user info
  - Calendar API: event creation and updates
- **Authentication**: Service accounts and delegated access
- **Rate Limits**: 300 requests per minute per user
- **Dependencies**: packages/google
- **Usage**: Core data storage and user authentication
- **Migration Path**: Transition to PostgreSQL with Google Sheets as backup/legacy support

### I2: Cloudflare Services
- **Type**: Hosting & Caching
- **Components**:
  - Cloudflare Workers (API backend)
  - Cloudflare Pages (frontend hosting)
  - Cloudflare KV (planned caching layer)
- **Endpoints**:
  - Worker routes for API endpoints
  - KV namespace operations
- **Authentication**: API tokens and zone-based access
- **Rate Limits**: Per account limits
- **Dependencies**: Wrangler configuration, environment variables
- **Usage**: Platform hosting and edge computing
- **Migration Path**: Continue using Cloudflare services with updated configurations

### I3: Email Services
- **Type**: Notification System
- **Components**: Transactional emails
- **Endpoints**: SMTP or API endpoints (implementation specific)
- **Authentication**: API keys or SMTP credentials
- **Rate Limits**: Provider-specific
- **Dependencies**: Email provider configuration
- **Usage**: Notifications and alerts
- **Migration Path**: Maintain current approach with improved templates

## Internal Service Connections

### I4: API to Data Layer
- **Type**: Internal Data Access
- **Components**:
  - WorkbookStore interface
  - Google Sheets adapter
  - PostgreSQL adapter (planned)
- **Endpoints**: 
  - getAllJobs, getJobById, updateJob
  - getAllUsers, getUserByEmail, updateUser
  - getAllClients, getClientById, updateClient
- **Authentication**: Internal (via session validation)
- **Rate Limits**: N/A (internal calls)
- **Dependencies**: packages/domain types, store implementations
- **Usage**: All data operations in the application
- **Migration Path**: Maintain interface, switch implementations gradually

### I5: Authentication Middleware
- **Type**: Internal Security Layer
- **Components**:
  - Session validation
  - Role checking
  - JWT validation
- **Endpoints**: All protected routes
- **Authentication**: Session tokens and role validation
- **Rate Limits**: N/A
- **Dependencies**: apps/api/src/middleware/auth.ts
- **Usage**: All authenticated routes
- **Migration Path**: Enhance with additional security checks

### I6: Document Generation Service
- **Type**: Internal Content Creation
- **Components**:
  - Template engine
  - Data binding
  - Output formatting
- **Endpoints**: 
  - Generate jobcard
  - Generate service report
  - Generate certificate
- **Authentication**: Via parent request authentication
- **Rate Limits**: CPU/memory constrained
- **Dependencies**: packages/domain/workbook.ts, template definitions
- **Usage**: Report and certificate generation
- **Migration Path**: Maintain interface, improve output formatting

## Data Flow Connections

### I7: Frontend to Backend API
- **Type**: User Interface Communication
- **Components**:
  - REST API endpoints
  - Request/response envelopes
  - Error handling
- **Endpoints**:
  - /api/v1/auth/* (authentication)
  - /api/v1/jobs/* (job operations)
  - /api/v1/documents/* (document operations)
  - /api/v1/schedules/* (scheduling)
- **Authentication**: Session cookies with JWT
- **Rate Limits**: Per-user rate limiting
- **Dependencies**: Hono router, validation schemas
- **Usage**: All frontend-backend communication
- **Migration Path**: Maintain API contracts, optimize payloads

### I8: Offline Sync Mechanism
- **Type**: Local to Remote Synchronization
- **Components**:
  - IndexedDB storage
  - Sync queue
  - Conflict resolution
- **Endpoints**: All mutable operations
- **Authentication**: Via stored session tokens
- **Rate Limits**: Connection-dependent
- **Dependencies**: packages/domain/offline.ts, browser storage APIs
- **Usage**: Offline capability for field technicians
- **Migration Path**: Enhance with better conflict detection

## Third-Party Dependencies

### I9: UI Libraries
- **Type**: Frontend Components
- **Components**: 
  - Tailwind CSS (styling)
  - React ecosystem libraries
- **Endpoints**: N/A (front-end only)
- **Authentication**: N/A
- **Rate Limits**: N/A
- **Dependencies**: Package.json entries
- **Usage**: User interface rendering
- **Migration Path**: Continue with updated versions

### I10: Validation Libraries
- **Type**: Input Processing
- **Components**: Zod (schema validation)
- **Endpoints**: All API endpoints
- **Authentication**: N/A
- **Rate Limits**: N/A
- **Dependencies**: Schema definitions
- **Usage**: Input validation and type safety
- **Migration Path**: Continue with enhanced schemas

### I11: Testing Frameworks
- **Type**: Quality Assurance
- **Components**: Vitest (unit testing), Playwright (e2e testing)
- **Endpoints**: N/A (testing only)
- **Authentication**: N/A
- **Rate Limits**: N/A
- **Dependencies**: Test configuration
- **Usage**: Quality assurance
- **Migration Path**: Continue with expanded test coverage

## Security Integrations

### I12: Audit Logging
- **Type**: Security Monitoring
- **Components**: 
  - Action logging
  - User attribution
  - Correlation tracking
- **Endpoints**: All significant operations
- **Authentication**: Internal
- **Rate Limits**: N/A
- **Dependencies**: Store audit methods
- **Usage**: Compliance and security monitoring
- **Migration Path**: Enhance with more comprehensive logging

### I13: Rate Limiting
- **Type**: Abuse Prevention
- **Components**:
  - Request counting
  - Time window management
  - Limit enforcement
- **Endpoints**: Authentication and mutation endpoints
- **Authentication**: N/A
- **Rate Limits**: Configurable per endpoint
- **Dependencies**: apps/api/src/middleware/rateLimit.ts
- **Usage**: Prevent API abuse
- **Migration Path**: Enhance with role-based limits

## Monitoring and Observability

### I14: Logging System
- **Type**: Operational Visibility
- **Components**:
  - Structured logging
  - Correlation IDs
  - Error tracking
- **Endpoints**: All operations
- **Authentication**: N/A
- **Rate Limits**: N/A
- **Dependencies**: Console logging, potential external services
- **Usage**: Debugging and monitoring
- **Migration Path**: Potentially integrate with Cloudflare logging

## Integration Migration Strategy

### Phase 1: Core Architecture
1. Maintain API contracts while improving internal implementation
2. Keep Google authentication initially, consider alternatives later
3. Preserve document generation functionality with improved output

### Phase 2: Data Layer Migration
1. Introduce PostgreSQL alongside Google Sheets
2. Implement dual-write mechanism for data consistency
3. Gradually transition reads to PostgreSQL
4. Eventually phase out Google Sheets as primary store

### Phase 3: Enhanced Services
1. Implement Cloudflare KV for caching
2. Add more sophisticated offline sync
3. Enhance audit logging capabilities
4. Improve rate limiting with role-based rules

### Phase 4: Advanced Features
1. Add email notification system
2. Implement advanced reporting features
3. Enhance security measures
4. Optimize performance and scalability

## Critical Integration Points

### Highest Priority
- Authentication and session management (I5) - security critical
- Data storage interface (I4) - business critical
- API communication (I7) - user experience critical

### High Priority
- Document generation (I6) - business functionality
- Offline sync (I8) - field usability
- Google integration (I1) - current data store

### Medium Priority
- Audit logging (I12) - compliance
- Rate limiting (I13) - stability
- External services (I2, I3) - infrastructure

## Risk Assessment

### High Risk Integrations
- Google Workspace (I1) - single point of failure
- Authentication system (I5) - security implications
- Data storage (I4) - business continuity

### Medium Risk Integrations
- Offline sync (I8) - data consistency
- Document generation (I6) - business processes
- API communication (I7) - user experience

### Low Risk Integrations
- UI libraries (I9) - easy to replace
- Testing frameworks (I10) - replaceable
- Rate limiting (I13) - configurable

This integration map should be continuously updated as the rebuild progresses and new integration requirements emerge.