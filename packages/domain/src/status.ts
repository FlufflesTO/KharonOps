import type { JobStatus } from "./types.js";

const transitions: Record<JobStatus, JobStatus[]> = {
  open: ["assigned", "cancelled"],
  assigned: ["en_route", "on_site", "paused", "cancelled"],
  en_route: ["on_site", "paused", "cancelled"],
  on_site: ["paused", "completed", "cancelled"],
  paused: ["en_route", "on_site", "cancelled"],
  completed: [],
  cancelled: []
};

export function canTransitionStatus(from: JobStatus, to: JobStatus): boolean {
  if (from === to) {
    return true;
  }
  return transitions[from].includes(to);
}

export function ensureStatusTransition(from: JobStatus, to: JobStatus): void {
  if (!canTransitionStatus(from, to)) {
    throw new Error(`Invalid status transition from ${from} to ${to}`);
  }
}

export function listAllowedStatusTransitions(from: JobStatus): JobStatus[] {
  return [from, ...transitions[from]];
}
