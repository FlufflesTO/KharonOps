import type { ConflictPayload, MutableMeta } from "./types.js";

export function nowIso(): string {
  return new Date().toISOString();
}

export function newMutableMeta(updatedBy: string, correlationId: string): MutableMeta {
  return {
    row_version: 1,
    updated_at: nowIso(),
    updated_by: updatedBy,
    correlation_id: correlationId
  };
}

export function bumpMutableMeta(meta: MutableMeta, updatedBy: string, correlationId: string): MutableMeta {
  return {
    row_version: meta.row_version + 1,
    updated_at: nowIso(),
    updated_by: updatedBy,
    correlation_id: correlationId
  };
}

export function buildConflict(args: {
  entity: string;
  entityId: string;
  serverState: Record<string, unknown>;
  clientRowVersion: number;
  serverRowVersion: number;
}): ConflictPayload {
  return {
    type: "row_version_conflict",
    entity: args.entity,
    entity_id: args.entityId,
    client_row_version: args.clientRowVersion,
    server_row_version: args.serverRowVersion,
    server_state: args.serverState
  };
}
