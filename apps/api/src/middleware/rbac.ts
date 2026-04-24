/**
 * Project KharonOps - RBAC Middleware
 * Purpose: Centralized role-based access control for routes
 * Dependencies: @kharon/domain, hono
 * Structural Role: Authorization layer for API endpoints
 */

import { createMiddleware } from "hono/factory";
import { 
  canReadJob, 
  canUpdateJobStatus, 
  canWriteJobNote, 
  type SessionUser,
  type JobRow
} from "@kharon/domain";
import { envelopeError } from "@kharon/domain";
import { getSessionUser } from "./auth.js";
import type { AppBindings } from "../context.js";

type PermissionType = 
  | "job:read" 
  | "job:update_status" 
  | "job:write_note"
  | "job:create"
  | "job:delete"
  | "document:generate"
  | "document:publish"
  | "schedule:request"
  | "schedule:confirm"
  | "user:read"
  | "user:modify";

interface PermissionChecker {
  (user: SessionUser, job?: JobRow): boolean;
}

const permissionMap: Record<PermissionType, PermissionChecker> = {
  "job:read": (user, job) => job !== undefined ? canReadJob(user, job) : true,
  "job:update_status": (user, job) => job !== undefined ? canUpdateJobStatus(user, job) : true,
  "job:write_note": (user, job) => job !== undefined ? canWriteJobNote(user, job) : true,
  "job:create": (user) => ["admin", "dispatcher", "super_admin"].includes(user.role),
  "job:delete": (user) => ["admin", "super_admin"].includes(user.role),
  "document:generate": (user) => ["technician", "dispatcher", "admin", "super_admin"].includes(user.role),
  "document:publish": (user) => ["dispatcher", "admin", "super_admin"].includes(user.role),
  "schedule:request": (user) => ["client", "dispatcher", "admin", "super_admin"].includes(user.role),
  "schedule:confirm": (user) => ["dispatcher", "admin", "super_admin"].includes(user.role),
  "user:read": (user) => ["admin", "super_admin"].includes(user.role),
  "user:modify": (user) => ["admin", "super_admin"].includes(user.role),
};

export function requirePermission(permission: PermissionType) {
  return createMiddleware<AppBindings>(async (c, next) => {
    const user = getSessionUser(c);
    if (!user) {
      return c.json(
        envelopeError({ 
          correlationId: c.get("correlationId"),
          error: { code: "unauthorized", message: "Authentication required" } 
        }), 
        401
      );
    }

    // Extract job_id from the route parameters if needed
    const jobId = c.req.param("job_id");
    if (jobId) {
      // For job-specific permissions, we need to fetch the job first
      const store = c.get("store");
      const job = await store.getJob(jobId);
      
      if (!job) {
        return c.json(
          envelopeError({ 
            correlationId: c.get("correlationId"),
            error: { code: "not_found", message: "Job not found" } 
          }), 
          404
        );
      }

      // Check the specific permission
      const hasPermission = permissionMap[permission](user, job);
      if (!hasPermission) {
        return c.json(
          envelopeError({ 
            correlationId: c.get("correlationId"),
            error: { 
              code: "forbidden", 
              message: `Access denied: User role '${user.role}' cannot perform action '${permission}' on job '${jobId}'. You may need to contact a dispatcher or admin for this action.` 
            } 
          }), 
          403
        );
      }
    } else {
      // For non-job-specific permissions, check against the user only
      const hasPermission = permissionMap[permission](user);
      if (!hasPermission) {
        return c.json(
          envelopeError({ 
            correlationId: c.get("correlationId"),
            error: { 
              code: "forbidden", 
              message: `Access denied: User role '${user.role}' does not have permission to perform action '${permission}'.` 
            } 
          }), 
          403
        );
      }
    }
    await next();
  });
}