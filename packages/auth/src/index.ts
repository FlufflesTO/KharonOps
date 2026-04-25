import { Role, SessionUser } from '@kharon-platform/types';
import { getConfig } from '@kharon-platform/config';

// Enhanced RBAC functions for the new architecture
export function canAccessResource(user: SessionUser, resource: string, action: string): boolean {
  // Super admin has access to everything
  if (user.role === 'super_admin') {
    return true;
  }

  // Define resource access rules
  const resourceAccessMap: Record<Role, Record<string, string[]>> = {
    client: {
      jobs: ['read'],
      documents: ['read'],
      sites: ['read'],
    },
    technician: {
      jobs: ['read', 'update'],
      reports: ['create', 'read'],
      certificates: ['read'],
      schedule: ['read'],
    },
    dispatcher: {
      jobs: ['create', 'read', 'update'],
      users: ['read'],
      schedule: ['create', 'read', 'update'],
      documents: ['create', 'read', 'update'],
    },
    finance: {
      invoices: ['read', 'update'],
      payments: ['read', 'create'],
      reports: ['read'],
    },
    admin: {
      users: ['create', 'read', 'update', 'delete'],
      clients: ['create', 'read', 'update', 'delete'],
      jobs: ['create', 'read', 'update', 'delete'],
      sites: ['create', 'read', 'update', 'delete'],
      documents: ['create', 'read', 'update', 'delete'],
      system: ['read'],
    },
    'super_admin': {
      // Super admin can access everything, handled above
    },
  };

  const allowedActions = resourceAccessMap[user.role]?.[resource] || [];
  return allowedActions.includes(action);
}

// Enhanced role validation
export function hasRole(user: SessionUser, requiredRole: Role): boolean {
  // Super admin has all roles
  if (user.role === 'super_admin') {
    return true;
  }
  return user.role === requiredRole;
}

export function hasAnyRole(user: SessionUser, requiredRoles: Role[]): boolean {
  // Super admin has all roles
  if (user.role === 'super_admin') {
    return true;
  }
  return requiredRoles.includes(user.role);
}

export function hasHigherRole(user: SessionUser, requiredRole: Role): boolean {
  // Define role hierarchy
  const roleHierarchy: Record<Role, number> = {
    client: 1,
    technician: 2,
    dispatcher: 3,
    finance: 4,
    admin: 5,
    'super_admin': 6,
  };

  // Super admin has the highest authority
  if (user.role === 'super_admin') {
    return true;
  }

  const userLevel = roleHierarchy[user.role] || 0;
  const requiredLevel = roleHierarchy[requiredRole] || 0;

  return userLevel >= requiredLevel;
}

// Session validation functions
export function isValidSession(session: SessionUser | null): session is SessionUser {
  return session !== null && 
         typeof session === 'object' &&
         typeof session.user_id === 'string' &&
         typeof session.email === 'string' &&
         typeof session.role === 'string' &&
         Object.values(Role).includes(session.role as Role);
}

// Role-based permissions for specific actions
export function canCreateJob(user: SessionUser): boolean {
  return hasAnyRole(user, ['admin', 'dispatcher']);
}

export function canDeleteJob(user: SessionUser): boolean {
  return hasAnyRole(user, ['admin']);
}

export function canViewAllJobs(user: SessionUser): boolean {
  return hasAnyRole(user, ['admin', 'dispatcher', 'finance']);
}

export function canAssignJob(user: SessionUser): boolean {
  return hasAnyRole(user, ['admin', 'dispatcher']);
}

export function canUpdateJobStatus(user: SessionUser, jobId?: string): boolean {
  // Admins and dispatchers can update any job
  if (hasAnyRole(user, ['admin', 'dispatcher'])) {
    return true;
  }

  // Technicians can only update jobs assigned to them
  if (user.role === 'technician' && jobId) {
    // This would be checked against the actual job's assigned technician
    // Implementation would require job lookup
    return true; // Simplified for now
  }

  return false;
}

export function canGenerateReport(user: SessionUser): boolean {
  return hasAnyRole(user, ['technician', 'admin', 'dispatcher']);
}

export function canPublishDocument(user: SessionUser): boolean {
  return hasAnyRole(user, ['admin', 'dispatcher']);
}

export function canManageUsers(user: SessionUser): boolean {
  return hasAnyRole(user, ['admin']);
}

export function canAccessSystemSettings(user: SessionUser): boolean {
  return hasAnyRole(user, ['admin', 'super_admin']);
}

export function canViewAuditLogs(user: SessionUser): boolean {
  return hasAnyRole(user, ['admin', 'super_admin']);
}

// JWT token utilities
export async function createAccessToken(user: SessionUser, expiresIn: string = '1h'): Promise<string> {
  const config = getConfig();
  const secret = config.auth.sessionKeys[0] || 'fallback-secret';
  
  const token = await new jose.SignJWT({ 
    user_id: user.user_id,
    email: user.email,
    role: user.role
  })
  .setProtectedHeader({ alg: 'HS256' })
  .setIssuedAt()
  .setExpirationTime(expiresIn)
  .setIssuer('kharon-platform')
  .setAudience('kharon-platform-users')
  .sign(new TextEncoder().encode(secret));

  return token;
}

export async function verifyAccessToken(token: string): Promise<SessionUser | null> {
  const config = getConfig();
  const secret = config.auth.sessionKeys[0] || 'fallback-secret';
  
  try {
    const verified = await jose.jwtVerify(token, new TextEncoder().encode(secret), {
      issuer: 'kharon-platform',
      audience: 'kharon-platform-users',
    });
    
    const payload = verified.payload;
    if (
      typeof payload.user_id === 'string' &&
      typeof payload.email === 'string' &&
      typeof payload.role === 'string' &&
      Object.values(Role).includes(payload.role as Role)
    ) {
      return {
        user_id: payload.user_id,
        email: payload.email,
        role: payload.role as Role,
        display_name: payload.display_name as string || payload.email,
        client_id: payload.client_id as string || '',
        technician_id: payload.technician_id as string || ''
      };
    }
    
    return null;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

// Session management
export interface SessionManager {
  createSession(user: SessionUser): Promise<string>;
  validateSession(token: string): Promise<SessionUser | null>;
  invalidateSession(token: string): Promise<boolean>;
}

// Placeholder implementation - in a real app this would be properly implemented
export class DefaultSessionManager implements SessionManager {
  async createSession(user: SessionUser): Promise<string> {
    return createAccessToken(user);
  }

  async validateSession(token: string): Promise<SessionUser | null> {
    return verifyAccessToken(token);
  }

  async invalidateSession(_token: string): Promise<boolean> {
    // In a real implementation, this would add the token to a blacklist
    return true;
  }
}