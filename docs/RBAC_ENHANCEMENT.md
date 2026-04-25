# Kharon Platform - Enhanced RBAC System

## Overview

The Kharon Platform features a sophisticated Role-Based Access Control (RBAC) system that governs permissions across multiple user roles. This document details the enhanced RBAC implementation and its capabilities.

## Roles

The system supports six distinct roles with granular permissions:

### Client
- Can view jobs associated with their organization
- Can view reports and certificates related to their sites
- Can request services
- Cannot modify other organizations' data
- Cannot access administrative functions

### Technician
- Can view assigned jobs
- Can update job status for assigned jobs
- Can add job notes to assigned jobs
- Can generate reports for completed jobs
- Cannot create new jobs or modify other technicians' assignments

### Dispatcher
- Can create and assign jobs
- Can update job assignments
- Can view all jobs within their organization
- Can manage scheduling
- Cannot modify financial data or administrative settings

### Finance
- Can manage invoices and payments
- Can view financial reports
- Can manage debtor information
- Cannot modify operational jobs or administrative settings
- Cannot access technician-only functions

### Admin
- Full access to organizational data
- Can manage users within their organization
- Can create and modify clients and sites
- Can approve job completion
- Cannot access super-admin functions

### Super Admin
- Full system access
- Can manage all organizations
- Can configure system-wide settings
- Can access audit logs
- Can manage all users regardless of organization

## Permission Model

### Resource Access Rules
Each role has defined access to specific resources:

| Role | Users | Clients | Sites | Jobs | Reports | Schedules | Documents | System |
|------|-------|---------|-------|------|---------|-----------|-----------|--------|
| Client | Read Own | Read Own | Read Own | Read Own | Read Own | Limited | Limited | None |
| Technician | Read | Read | Read | Read/Update Own | Create/Read | Read | Create/Read | None |
| Dispatcher | Read | Read/Create | Read/Create | Read/Create/Update | Create/Read | Create/Read/Update | Create/Read/Update | None |
| Finance | Read | Read | Read | Read | Read | Read | Read | None |
| Admin | All | All | All | All | All | All | All | Read |
| Super Admin | All | All | All | All | All | All | All | All |

### Status Transitions
The system enforces valid status transitions based on role permissions:

- **Draft** → Scheduled: Dispatcher, Admin
- **Scheduled** → Assigned: Dispatcher, Admin  
- **Assigned** → In Progress: Technician (assigned)
- **In Progress** → Pending Review: Technician (assigned)
- **Pending Review** → Completed: Admin, Super Admin
- **Any Status** → Cancelled: Admin, Super Admin

## Implementation Details

### Session Validation
The system validates sessions using JWT tokens with embedded role information:

```typescript
interface SessionUser {
  user_id: string;
  email: string;
  role: Role;
  display_name: string;
  client_id?: string;
  technician_id?: string;
}
```

### Permission Checks
The system performs permission checks at multiple levels:

1. **Route Level**: Middleware prevents unauthorized access
2. **Operation Level**: Validates specific actions
3. **Data Level**: Ensures data ownership and visibility

### Audit Trail
All permission checks and access attempts are logged for security auditing:

- Successful accesses
- Failed authorization attempts
- Permission escalation attempts
- Data modification activities

## Security Features

### Concurrency Control
- Row versioning prevents race conditions
- Atomic operations ensure data consistency
- Locking mechanisms prevent conflicting updates

### Data Isolation
- Organization-level data isolation
- Role-based data visibility
- Client data separation
- Technician assignment boundaries

### Session Management
- Configurable session timeouts
- Secure JWT token generation
- Token revocation capabilities
- Multi-factor authentication support

## Integration Points

### API Layer
The RBAC system integrates with the API layer through middleware:

```typescript
// Example middleware implementation
app.use("/api/v1/*", accessMiddleware(config));
app.use("*", sessionMiddleware(config));
```

### Domain Layer
Business logic validates permissions before executing operations:

```typescript
if (!canUpdateJobStatus(user, job, status)) {
  return forbiddenResponse();
}
```

### UI Layer
The UI adapts to user permissions dynamically:

- Hiding unauthorized features
- Disabling unavailable actions
- Customizing dashboard views
- Adjusting navigation options

## Testing Strategy

### Unit Tests
- Individual permission checks
- Role-based access validations
- Status transition validations
- Boundary condition testing

### Integration Tests
- End-to-end permission flows
- Cross-service permission checks
- Data isolation verification
- Audit logging validation

### Security Tests
- Privilege escalation attempts
- Data leakage prevention
- Authentication bypass attempts
- Session hijacking prevention

## Maintenance

### Permission Updates
New permissions can be added through the configuration system:

1. Define new permission in the domain layer
2. Update role mappings
3. Implement UI controls
4. Add audit logging
5. Create tests

### Role Modifications
Role definitions can be adjusted without system downtime:

- Configuration-based role definitions
- Hot reload of permission changes
- Backward compatibility preservation
- Gradual rollout capabilities

## Future Enhancements

### Attribute-Based Access Control (ABAC)
Future versions may incorporate attribute-based controls:

- Time-based restrictions
- Geographic limitations
- Device-based policies
- Risk-based authentication

### Dynamic Permissions
Potential for runtime permission modifications:

- Temporary privilege elevation
- Context-aware permissions
- Delegation capabilities
- Approval workflows

## Conclusion

The enhanced RBAC system provides comprehensive security and access control for the Kharon Platform, enabling secure multi-tenant operation while supporting complex role-based workflows for different user types.