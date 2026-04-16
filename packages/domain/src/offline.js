export function decideQueueAfterPush(queue, result) {
    const remove = new Set();
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
export function chunkMutations(items, chunkSize) {
    const chunks = [];
    for (let index = 0; index < items.length; index += chunkSize) {
        chunks.push(items.slice(index, index + chunkSize));
    }
    return chunks;
}
