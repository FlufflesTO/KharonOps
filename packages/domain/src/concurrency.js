export function nowIso() {
    return new Date().toISOString();
}
export function newMutableMeta(updatedBy, correlationId) {
    return {
        row_version: 1,
        updated_at: nowIso(),
        updated_by: updatedBy,
        correlation_id: correlationId
    };
}
export function bumpMutableMeta(meta, updatedBy, correlationId) {
    return {
        row_version: meta.row_version + 1,
        updated_at: nowIso(),
        updated_by: updatedBy,
        correlation_id: correlationId
    };
}
export function buildConflict(args) {
    return {
        type: "row_version_conflict",
        entity: args.entity,
        entity_id: args.entityId,
        client_row_version: args.clientRowVersion,
        server_row_version: args.serverRowVersion,
        server_state: args.serverState
    };
}
