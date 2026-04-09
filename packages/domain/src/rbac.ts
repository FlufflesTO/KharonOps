import type { JobRow, Role, SessionUser } from "./types.js";

export function canReadJob(user: SessionUser, job: JobRow): boolean {
  if (user.role === "admin" || user.role === "dispatcher") {
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
  return role === "client" || role === "dispatcher" || role === "admin";
}

export function canConfirmSchedule(role: Role): boolean {
  return role === "dispatcher" || role === "admin";
}

export function canGenerateDocument(role: Role): boolean {
  return role === "technician" || role === "dispatcher" || role === "admin";
}

export function canPublishDocument(role: Role): boolean {
  return role === "dispatcher" || role === "admin";
}

export function canUseAdmin(role: Role): boolean {
  return role === "admin";
}

export function canUpdateJobStatus(user: SessionUser, job: JobRow): boolean {
  if (user.role === "admin" || user.role === "dispatcher") {
    return true;
  }
  if (user.role === "technician") {
    return user.technician_uid !== "" && user.technician_uid === job.technician_uid;
  }
  return false;
}

export function canWriteJobNote(user: SessionUser, job: JobRow): boolean {
  return canUpdateJobStatus(user, job);
}
