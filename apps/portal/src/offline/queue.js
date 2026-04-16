import { openDB } from "idb";
const DB_NAME = "kharon-portal";
const STORE_NAME = "mutations";
async function db() {
    return openDB(DB_NAME, 1, {
        upgrade(database) {
            if (!database.objectStoreNames.contains(STORE_NAME)) {
                database.createObjectStore(STORE_NAME, { keyPath: "mutation_id" });
            }
        }
    });
}
export async function enqueueMutation(item) {
    const database = await db();
    await database.put(STORE_NAME, item);
}
export async function listQueuedMutations() {
    const database = await db();
    const all = await database.getAll(STORE_NAME);
    return all.sort((a, b) => a.created_at.localeCompare(b.created_at));
}
export async function removeQueuedMutations(mutationIds) {
    const database = await db();
    const tx = database.transaction(STORE_NAME, "readwrite");
    for (const mutationId of mutationIds) {
        await tx.store.delete(mutationId);
    }
    await tx.done;
}
export async function clearQueue() {
    const database = await db();
    await database.clear(STORE_NAME);
}
