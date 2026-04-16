import { chunkMutations, decideQueueAfterPush } from "@kharon/domain";
import { apiClient } from "../apiClient";
import { listQueuedMutations, removeQueuedMutations } from "./queue";
function extractData(envelope) {
    if (envelope.data) {
        return envelope.data;
    }
    return {
        applied: [],
        conflicts: envelope.conflict ? [{ mutation_id: "", job_uid: "", conflict: envelope.conflict }] : [],
        failed: envelope.error
            ? [
                {
                    mutation_id: "",
                    job_uid: "",
                    error: envelope.error
                }
            ]
            : []
    };
}
export async function replayQueuedMutations(batchSize = 25) {
    const queue = await listQueuedMutations();
    if (queue.length === 0) {
        return {
            attempted: 0,
            removed: 0,
            remaining: 0,
            conflicts: 0
        };
    }
    const chunks = chunkMutations(queue, batchSize);
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
