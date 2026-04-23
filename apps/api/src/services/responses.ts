/**
 * KharonOps — Standard API Responses
 * Purpose: Reusable response wrappers for consistent error/success patterns.
 * Dependencies: @kharon/domain (envelopeError)
 */

import { envelopeError } from "@kharon/domain";

/**
 * Returns a standard 409 Conflict response for row version mismatches.
 */
export function rowVersionConflictResponse(
  correlationId: string,
  rowVersion: number,
  conflict: NonNullable<ReturnType<typeof envelopeError>["conflict"]>
) {
  return envelopeError({
    correlationId,
    rowVersion,
    conflict,
    error: {
      code: "row_version_conflict",
      message: "The record was modified by another actor"
    }
  });
}
