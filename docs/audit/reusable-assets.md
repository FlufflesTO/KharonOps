# Reusable Assets - KharonOps Platform

## Overview
This document catalogs reusable components, patterns, and implementations from the existing codebase that should be preserved and potentially refined in the rebuild.

## Core Architecture Components

### A1: RBAC System
- **Location**: packages/domain/src/rbac.ts, apps/api/src/middleware/auth.ts
- **Description**: Role-based access control with 6 distinct roles (client, technician, dispatcher, finance, admin, super_admin)
- **Functionality**: Granular permissions for different operations based on role and ownership
- **Reuse Strategy**: Preserve core logic, enhance with additional security measures
- **Dependencies**: SessionUser type, JobRow type
- **Notes**: Well-tested with comprehensive test matrix in tests/unit/rbac-matrix.test.ts

### A2: Authentication System
- **Location**: apps/api/src/auth/, apps/api/src/middleware/auth.ts
- **Description**: Google OAuth integration with session management
- **Functionality**: Secure login, session validation, role assignment
- **Reuse Strategy**: Maintain approach, enhance with additional security validations
- **Dependencies**: Google OAuth, session management utilities
- **Notes**: Includes audit logging for successful and failed logins

### A3: Document Generation Engine
- **Location**: packages/domain/src/workbook.ts, apps/api/src/services/document.ts
- **Description**: Template-based document generation system
- **Functionality**: Token replacement, structured output, multiple document types
- **Reuse Strategy**: Preserve engine, enhance with more templates and improved formatting
- **Dependencies**: Template definitions, job data models
- **Notes**: Supports jobcards, service reports, certificates

## Data Management Components

### A4: Google Sheets Integration
- **Location**: packages/google/src/adapters/sheets.ts
- **Description**: Adapter pattern for interacting with Google Sheets
- **Functionality**: Read/write operations, batch updates, error handling
- **Reuse Strategy**: Preserve adapter pattern, migrate to PostgreSQL backend
- **Dependencies**: Google API client, workbook schemas
- **Notes**: Includes retry mechanisms and rate limiting

### A5: Offline Sync Architecture
- **Location**: packages/domain/src/offline.ts, apps/portal/src/services/sync.ts
- **Description**: Mutation queue and synchronization mechanism
- **Functionality**: Idempotent operations, conflict detection, retry logic
- **Reuse Strategy**: Preserve core architecture, enhance with better conflict resolution
- **Dependencies**: IndexedDB, mutation tracking
- **Notes**: Designed to handle intermittent connectivity

### A6: Audit Logging System
- **Location**: apps/api/src/services/meta.ts, apps/api/src/services/utils.ts
- **Description**: Structured logging for security and operational events
- **Functionality**: Correlation IDs, action tracking, user attribution
- **Reuse Strategy**: Maintain structure, enhance with more comprehensive coverage
- **Dependencies**: Store appendAudit method
- **Notes**: Critical for compliance and debugging

## UI Components and Patterns

### A7: Responsive Layout System
- **Location**: apps/portal/src/components/layout/*
- **Description**: Mobile-first responsive design system
- **Functionality**: Adapts to various screen sizes, touch-friendly interactions
- **Reuse Strategy**: Preserve responsive patterns, enhance with additional breakpoints
- **Dependencies**: Tailwind CSS, CSS Grid/Flexbox
- **Notes**: Designed for field technicians using mobile devices

### A8: Role-Based Navigation
- **Location**: apps/portal/src/config/roleNavigation.ts, apps/portal/src/components/PortalChrome.tsx
- **Description**: Dynamic navigation based on user role
- **Functionality**: Shows relevant options per role, hides inappropriate items
- **Reuse Strategy**: Maintain concept, enhance with better organization
- **Dependencies**: User role data, route definitions
- **Notes**: Critical for preventing role confusion

### A9: Form and Validation Patterns
- **Location**: apps/portal/src/components/forms/*
- **Description**: Consistent form handling with validation
- **Functionality**: Error handling, loading states, submission feedback
- **Reuse Strategy**: Preserve patterns, enhance with better UX
- **Dependencies**: React Hook Form, Zod validation
- **Notes**: Ensures data quality at entry points

## Service Components

### A10: Configuration Management
- **Location**: apps/api/src/config.ts
- **Description**: Environment-based configuration with validation
- **Functionality**: Mode-specific behavior, secure defaults, validation
- **Reuse Strategy**: Maintain approach, enhance with better validation
- **Dependencies**: Environment variables, type safety
- **Notes**: Critical for different deployment environments

### A11: Error Handling Framework
- **Location**: packages/domain/src/envelope.ts, apps/api/src/middleware/error.ts
- **Description**: Consistent error response format and handling
- **Functionality**: Structured error responses, correlation tracking
- **Reuse Strategy**: Preserve consistency, enhance with better categorization
- **Dependencies**: Response formatting, logging
- **Notes**: Provides consistent API for error handling

### A12: Rate Limiting Middleware
- **Location**: apps/api/src/middleware/rateLimit.ts
- **Description**: Prevents abuse and manages API consumption
- **Functionality**: Time-based request limits, configurable windows
- **Reuse Strategy**: Maintain approach, enhance with role-based limits
- **Dependencies**: Request tracking, timer utilities
- **Notes**: Important for API stability and cost management

## Testing Components

### A13: Test Matrix Framework
- **Location**: tests/unit/rbac-matrix.test.ts, tests/contract/*
- **Description**: Comprehensive role and permission testing
- **Functionality**: Validates role-based access, boundary enforcement
- **Reuse Strategy**: Preserve testing approach, expand coverage
- **Dependencies**: Mock users, test fixtures
- **Notes**: Critical for security validation

### A14: Integration Testing Suite
- **Location**: tests/integration/*, tests/contract/*
- **Description**: End-to-end workflow validation
- **Functionality**: Tests complete user journeys, system interactions
- **Reuse Strategy**: Maintain comprehensive approach, add more scenarios
- **Dependencies**: Complete system setup, test data
- **Notes**: Ensures system works as intended

## Data Models

### A15: Type Definitions
- **Location**: packages/domain/src/types.ts
- **Description**: Centralized type definitions for the entire system
- **Functionality**: Ensures consistency, enables type safety
- **Reuse Strategy**: Preserve and expand, maintain centralization
- **Dependencies**: TypeScript, domain knowledge
- **Notes**: Foundation for type safety across the system

### A16: Schema Validation
- **Location**: apps/api/src/schemas/*
- **Description**: Zod-based schema validation for all inputs
- **Functionality**: Input validation, type coercion, error generation
- **Reuse Strategy**: Maintain approach, expand coverage
- **Dependencies**: Zod, type definitions
- **Notes**: Critical for input sanitization and security

## Integration Components

### A17: Google Calendar Integration
- **Location**: packages/google/src/adapters/calendar.ts
- **Description**: Scheduling and appointment management
- **Functionality**: Event creation, updates, conflict detection
- **Reuse Strategy**: Preserve integration approach, enhance with better error handling
- **Dependencies**: Google Calendar API, job scheduling data
- **Notes**: Important for dispatcher workflow

## Reuse Guidelines

### Preservation Priority
1. **High**: RBAC system, authentication, audit logging, type definitions
2. **Medium**: Document generation, form patterns, configuration management
3. **Low**: Specific UI implementations, legacy Google Sheets handling

### Enhancement Opportunities
1. Add additional security measures to existing components
2. Improve error handling and user feedback
3. Enhance performance and scalability
4. Expand test coverage and add new scenarios

### Migration Considerations
1. Plan gradual migration from Google Sheets to PostgreSQL
2. Maintain backward compatibility during transition
3. Ensure data integrity during migration
4. Provide fallback mechanisms during transition

## Conclusion

The existing codebase contains numerous valuable assets that form a solid foundation for the rebuild. The key is to preserve the proven architectural patterns and business logic while enhancing security, performance, and maintainability.