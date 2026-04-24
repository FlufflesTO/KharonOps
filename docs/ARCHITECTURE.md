# KharonOps Architecture

## Overview

KharonOps is a role-based operations platform built with TypeScript, React, and Cloudflare Workers. The system consists of multiple applications, a shared domain library, and supporting infrastructure.

## Core Components

### Applications

- **API** (`apps/api`): RESTful API backend with authentication, authorization, and business logic
- **Portal** (`apps/portal`): Client-facing React application with role-based UI components
- **Site** (`apps/site`): Static marketing/public information site

### Packages

- **Domain** (`packages/domain`): Shared business logic, types, and RBAC utilities
- **Google** (`packages/google`): Google Workspace integration utilities
- **UI** (`packages/ui`): Shared UI components

## Key Architectural Patterns

### Role-Based Access Control (RBAC)

The system implements a comprehensive RBAC system with the following roles:

- `client`: Limited access to their own jobs
- `technician`: Access to assigned jobs and document generation
- `dispatcher`: Access to all jobs, scheduling, and document publishing
- `finance`: Financial data access and reporting
- `admin`: Full administrative capabilities
- `super_admin`: Platform-level administrative access

**NEW**: Enhanced RBAC includes granular permissions for specific operations:
- Job creation/deletion
- Document generation/publishing
- Schedule management
- User/finance data access

### Data Flow

1. Authentication via Google OAuth
2. Session management with signed cookies
3. Role-based authorization at API gateway
4. Business logic processing with audit logging
5. Data persistence to Google Sheets and PostgreSQL
6. Real-time synchronization for offline capabilities

### Offline Support

The system includes comprehensive offline support:
- Local storage of job data
- Queue for pending mutations
- Conflict resolution mechanisms
- Automatic sync when connectivity is restored

## Infrastructure

### Deployment

- Cloudflare Workers for API backend
- Cloudflare Pages for frontend applications
- Google Workspace for data storage and calendar integration
- PostgreSQL for primary data storage (migration in progress)

### Security

- End-to-end encryption for sensitive data
- Role-based access controls
- Audit logging for privileged operations
- Rate limiting and DDoS protection
- Secure session management

## Technology Stack

- **Frontend**: React 18, TypeScript, Vite
- **Backend**: Hono, Cloudflare Workers, TypeScript
- **Database**: Google Sheets (legacy), PostgreSQL (primary)
- **Authentication**: Google OAuth
- **Infrastructure**: Cloudflare (Workers, Pages, KV, D1)
- **Testing**: Vitest
- **Build**: TypeScript compiler