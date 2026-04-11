import type { JobStatus } from "./types.js";

const transitions: Record<JobStatus, JobStatus[]> = {
  draft: ["performed", "cancelled"],
  performed: ["approved", "rejected", "cancelled"],
  rejected: ["performed", "cancelled"],
  approved: ["certified", "cancelled"],
  certified: [],
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
