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

type PermissionType = "job:read" | "job:update_status" | "job:write_note";

interface PermissionChecker {
  (user: SessionUser, job: JobRow): boolean;
}

const permissionMap: Record<PermissionType, PermissionChecker> = {
  "job:read": canReadJob,
  "job:update_status": canUpdateJobStatus,
  "job:write_note": canWriteJobNote,
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
              message: `Access denied: User role '${user.role}' cannot perform action '${permission}' on job '${jobId}'` 
            } 
          }), 
          403
        );
      }
    }

    // For non-job-specific permissions, we can allow the request to continue
    await next();
  });
}