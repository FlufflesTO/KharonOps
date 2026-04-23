import { buildConflict, newMutableMeta, type ApiError, type ConflictPayload, type JobEventRow, type JobRow } from "@kharon/domain";
import type { StoreContext } from "../types.js";

export function nowIso(): string {
  return new Date().toISOString();
}

export function immutableClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function toConflict(job: JobRow, expectedRowVersion: number): ConflictPayload {
  return buildConflict({
    entity: "Jobs_Master",
    entityId: job.job_id,
    serverState: job as unknown as Record<string, unknown>,
    clientRowVersion: expectedRowVersion,
    serverRowVersion: job.row_version
  });
}

export function normalizeError(message: string, code = "validation_error"): ApiError {
  return { code, message };
}

export function stampEvent(args: {
  jobid: string;
  eventType: string;
  payload: Record<string, unknown>;
  ctx: StoreContext;
}): JobEventRow {
  const meta = newMutableMeta(args.ctx.actorUserid, args.ctx.correlationId);
  return {
    event_id: `EVT-${crypto.randomUUID()}`,
    job_id: args.jobid,
    event_type: args.eventType,
    payload_json: JSON.stringify(args.payload),
    ...meta,
    created_at: meta.updated_at,
    created_by: meta.updated_by
  };
}
