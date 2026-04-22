import type { JobRow, Role, SessionUser, JobStatus } from "./types.js";

// super_admin bypasses all role gates — it has full-spectrum access by definition.
// This helper centralises the check so adding a new gate never silently excludes super_admin.
function isSuperAdmin(role: Role): boolean {
  return role === "super_admin";
}

export function canReadJob(user: SessionUser, job: JobRow): boolean {
  if (isSuperAdmin(user.role) || user.role === "admin" || user.role === "dispatcher" || user.role === "finance") {
    return true;
  }
  if (user.role === "client") {
    return user.client_uid !== "" && user.client_uid === job.client_uid;
  }
  if (user.role === "technician") {
    return user.technician_uid !== "" && user.technician_uid === job.technician_uid;
  }
  return false;
}

export function canRequestSchedule(role: Role): boolean {
  return isSuperAdmin(role) || role === "client" || role === "dispatcher" || role === "admin";
}

export function canConfirmSchedule(role: Role): boolean {
  return isSuperAdmin(role) || role === "dispatcher" || role === "admin";
}

export function canGenerateDocument(role: Role): boolean {
  return isSuperAdmin(role) || role === "technician" || role === "dispatcher" || role === "admin";
}

export function canPublishDocument(role: Role): boolean {
  return isSuperAdmin(role) || role === "dispatcher" || role === "admin";
}

export function canUseAdmin(role: Role): boolean {
  return isSuperAdmin(role) || role === "admin";
}

export function canUpdateJobStatus(user: SessionUser, job: JobRow, requestedStatus?: JobStatus): boolean {
  if (isSuperAdmin(user.role) || user.role === "admin" || user.role === "dispatcher") {
    return true;
  }
  if (user.role === "technician") {
    // Technician must be assigned to the job
    if (user.technician_uid === "" || user.technician_uid !== job.technician_uid) {
      return false;
    }
    // Technician can only transition to 'performed' or 'cancelled'
    if (requestedStatus) {
      return ["performed", "cancelled"].includes(requestedStatus);
    }
    // If no requestedStatus is provided, this might be a generic "can I see/edit this job" call (like for notes).
    // In that case, we allow it if they are the assigned technician.
    return true;
  }
  return false;
}

export function canWriteJobNote(user: SessionUser, job: JobRow): boolean {
  return canUpdateJobStatus(user, job);
}
