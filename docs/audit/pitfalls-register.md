# Pitfalls Register - KharonOps Platform

## Overview
This document registers known pitfalls in the current codebase that must be avoided during the rebuild process.

## Critical Pitfalls

### P1: Insufficient Server-Side Role Validation
- **Risk**: Relying on client-side role checks that can be bypassed
- **Location**: Multiple route handlers may not adequately validate permissions
- **Impact**: Unauthorized access to sensitive data or functions
- **Mitigation**: Implement comprehensive server-side permission checks for all sensitive operations
- **Status**: Active

### P2: Weak Session Management
- **Risk**: Session tokens with insufficient security measures
- **Location**: Session creation and validation in auth.ts
- **Impact**: Session hijacking or unauthorized access
- **Mitigation**: Enhance token security with additional validation, shorter TTLs, and proper invalidation
- **Status**: Active

### P3: Data Leakage Between Roles
- **Risk**: Users accessing data they shouldn't based on their role
- **Location**: Data fetching functions that don't consider user role
- **Impact**: Privacy violations and security breaches
- **Mitigation**: Implement role-based data filtering at the service layer
- **Status**: Active

### P4: Inadequate Input Validation
- **Risk**: Insufficient validation of user inputs leading to injection attacks
- **Location**: API route handlers accepting various data inputs
- **Impact**: Data corruption, security vulnerabilities
- **Mitigation**: Implement comprehensive input validation using Zod or similar
- **Status**: Active

### P5: Race Conditions in Concurrent Operations
- **Risk**: Multiple simultaneous requests causing data inconsistency
- **Location**: Job status updates, document generation
- **Impact**: Data corruption or inconsistent state
- **Mitigation**: Implement proper locking mechanisms (Postgres `FOR UPDATE`) and optimistic locking (`row_version`).
- **Status**: Active

### P14: Dual-Write Drift (Source Registry Enforcement)
- **Risk**: Primary and Mirror backends drifting without automatic repair mechanisms.
- **Location**: `DualWorkbookStore.ts`
- **Impact**: Data inconsistency between Sheets (Canonical) and Postgres (Mirror).
- **Mitigation**: Section 10 of doctrine - implement "Source Registry Enforcement" where one is strictly canonical and the other is a verified derivative.
- **Status**: Critical

### P15: String-Based Data Normalization
- **Risk**: Sheet data being unstructured leading to runtime errors during mapping.
- **Location**: `sheetsStore.ts` (`normalizeValue`, `stringifyRow`)
- **Impact**: Type safety is "faked" at the boundary, but underlying data is volatile.
- **Mitigation**: Move to a structured database (Postgres) as the primary source of truth.
- **Status**: High

## High-Risk Pitfalls

### P6: Google API Rate Limits
- **Risk**: Exceeding Google API quotas during high-usage periods
- **Location**: Google Sheets integration points
- **Impact**: Service disruptions during critical operations
- **Mitigation**: Implement proper rate limiting, queuing, and retry mechanisms
- **Status**: Active

### P7: Inconsistent State Management
- **Risk**: Frontend and backend getting out of sync
- **Location**: Offline synchronization and conflict resolution
- **Impact**: Data loss or inconsistent user experience
- **Mitigation**: Implement robust sync protocols with clear conflict resolution
- **Status**: Active

### P8: Poor Error Handling
- **Risk**: Unhandled exceptions causing application crashes
- **Location**: API endpoints and asynchronous operations
- **Impact**: Service outages and poor user experience
- **Mitigation**: Implement comprehensive error boundaries and exception handling
- **Status**: Active

## Medium-Risk Pitfalls

### P9: Performance Degradation with Large Datasets
- **Risk**: Slow response times as data volume increases
- **Location**: List operations and data fetching
- **Impact**: Poor user experience and potential timeouts
- **Mitigation**: Implement pagination, caching, and optimized queries
- **Status**: Active

### P10: Inadequate Audit Trail
- **Risk**: Insufficient logging of important operations
- **Location**: Financial operations, admin actions, data modifications
- **Impact**: Difficulty in troubleshooting and compliance issues
- **Mitigation**: Implement comprehensive audit logging for all sensitive operations
- **Status**: Active

### P11: Dependency Vulnerabilities
- **Risk**: Outdated or vulnerable dependencies
- **Location**: Package.json files throughout the monorepo
- **Impact**: Security vulnerabilities and compatibility issues
- **Mitigation**: Regular dependency updates and security scans
- **Status**: Active

## Low-Risk Pitfalls

### P12: Inconsistent Naming Conventions
- **Risk**: Confusion due to inconsistent naming patterns
- **Location**: Variables, functions, and components throughout the codebase
- **Impact**: Reduced maintainability and readability
- **Mitigation**: Establish and enforce consistent naming conventions
- **Status**: Active

### P13: Insufficient Test Coverage
- **Risk**: Undetected regressions and bugs
- **Location**: Complex business logic and edge cases
- **Impact**: Bugs reaching production
- **Mitigation**: Increase test coverage, especially for critical paths
- **Status**: Active

## Prevention Strategies

### Immediate Actions
1. Implement comprehensive server-side role validation
2. Enhance session security measures
3. Add role-based data filtering
4. Implement robust input validation

### Short-term Actions
1. Establish proper rate limiting for external APIs
2. Improve error handling and logging
3. Implement better state synchronization
4. Conduct dependency audit and update

### Long-term Actions
1. Migrate to more scalable data storage
2. Implement comprehensive monitoring and alerting
3. Establish performance benchmarks and monitoring
4. Regular security audits and penetration testing

## Monitoring and Review

This pitfalls register should be regularly reviewed and updated as new issues are discovered during the rebuild process. Each registered pitfall should be addressed in the new architecture before deployment.