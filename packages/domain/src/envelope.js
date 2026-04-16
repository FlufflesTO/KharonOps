export function envelopeSuccess(args) {
    return {
        data: args.data,
        error: null,
        correlation_id: args.correlationId,
        row_version: args.rowVersion ?? null,
        conflict: args.conflict ?? null
    };
}
export function envelopeError(args) {
    return {
        data: null,
        error: args.error,
        correlation_id: args.correlationId,
        row_version: args.rowVersion ?? null,
        conflict: args.conflict ?? null
    };
}
