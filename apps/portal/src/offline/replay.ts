import { chunkMutations, decideQueueAfterPush } from "@kharon/domain";
import type { ApiEnvelope, OfflineQueueItem, SyncPushResult } from "@kharon/domain";
import { apiClient } from "../apiClient";
import { listQueuedMutations, removeQueuedMutations } from "./queue";

export interface ReplaySummary {
  attempted: number;
  removed: number;
  remaining: number;
  conflicts: number;
}

function extractData(envelope: ApiEnvelope<SyncPushResult>): SyncPushResult {
  if (envelope.data) {
    return envelope.data;
  }

  return {
    applied: [],
    conflicts: envelope.conflict ? [{ mutation_id: "", job_id: "", conflict: envelope.conflict }] : [],
    failed: envelope.error
      ? [
        {
          mutation_id: "",
          job_id: "",
          error: envelope.error
        }
      ]
      : []
  };
}

export async function replayQueuedMutations(batchSize = 25): Promise<ReplaySummary> {
  const queue = await listQueuedMutations();
  if (queue.length === 0) {
    return {
      attempted: 0,
      removed: 0,
      remaining: 0,
      conflicts: 0
    };
  }

  const chunks = chunkMutations<OfflineQueueItem>(queue, batchSize);
  let removeCount = 0;
  let conflictCount = 0;

  for (const chunk of chunks) {
    const envelope = await apiClient.syncPush(chunk);
    const data = extractData(envelope);
    const decision = decideQueueAfterPush(chunk, data);
    if (decision.removeMutationIds.length > 0) {
      await removeQueuedMutations(decision.removeMutationIds);
    }

    removeCount += decision.removeMutationIds.length;
    conflictCount += data.conflicts.length;
  }

  const remaining = (await listQueuedMutations()).length;

  return {
    attempted: queue.length,
    removed: removeCount,
    remaining,
    conflicts: conflictCount
  };
}
