import type { OfflineQueueItem, ReplayDecision, SyncPushResult } from "./types.js";

export function decideQueueAfterPush(queue: OfflineQueueItem[], result: SyncPushResult): ReplayDecision {
  const remove = new Set<string>();

  for (const entry of result.applied) {
    remove.add(entry.mutation_id);
  }

  for (const entry of result.failed) {
    if (entry.error.code === "duplicate_mutation") {
      remove.add(entry.mutation_id);
    }
  }

  const removeMutationIds = [...remove];
  const keepMutationIds = queue
    .map((item) => item.mutation_id)
    .filter((mutationId) => !remove.has(mutationId));

  return {
    removeMutationIds,
    keepMutationIds
  };
}

export function chunkMutations<T>(items: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += chunkSize) {
    chunks.push(items.slice(index, index + chunkSize));
  }
  return chunks;
}
