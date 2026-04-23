import type { JobEventRow, SyncQueueRow } from "@kharon/domain";
import type { WorkbookStore } from "../types.js";

export async function listSyncArtifactsForJobs(
  store: WorkbookStore,
  jobids: readonly string[]
): Promise<{ queue: SyncQueueRow[]; events: JobEventRow[] }> {
  const [queueLists, eventLists] = await Promise.all([
    Promise.all(jobids.map((jobid) => store.listSyncQueueByJob(jobid))),
    Promise.all(jobids.map((jobid) => store.listJobEventsByJob(jobid)))
  ]);

  const queue = queueLists
    .flat()
    .filter((item, index, arr) => arr.findIndex((candidate) => candidate.mutation_id === item.mutation_id) === index)
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at));

  const events = eventLists
    .flat()
    .filter((item, index, arr) => arr.findIndex((candidate) => candidate.event_id === item.event_id) === index)
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at));

  return { queue, events };
}
