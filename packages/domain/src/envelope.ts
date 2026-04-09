import type { ApiEnvelope, ApiError, ConflictPayload } from "./types.js";

export function envelopeSuccess<T>(args: {
  correlationId: string;
  data: T;
  rowVersion?: number | null;
  conflict?: ConflictPayload | null;
}): ApiEnvelope<T> {
  return {
    data: args.data,
    error: null,
    correlation_id: args.correlationId,
    row_version: args.rowVersion ?? null,
    conflict: args.conflict ?? null
  };
}

export function envelopeError(args: {
  correlationId: string;
  error: ApiError;
  rowVersion?: number | null;
  conflict?: ConflictPayload | null;
}): ApiEnvelope<null> {
  return {
    data: null,
    error: args.error,
    correlation_id: args.correlationId,
    row_version: args.rowVersion ?? null,
    conflict: args.conflict ?? null
  };
}
