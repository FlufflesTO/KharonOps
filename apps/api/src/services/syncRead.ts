import type { JobEventRow, JobRow, SessionUser, SyncQueueRow } from "@kharon/domain";
import type { WorkbookStore } from "../store/types.js";

export async function readSyncSnapshot(args: {
  store: WorkbookStore;
  actor: SessionUser;
  since: string;
}): Promise<{ jobs: JobRow[]; queue: SyncQueueRow[]; events: JobEventRow[] }> {
  const sinceTs = Date.parse(args.since);
  const jobs = (await args.store.listJobsForUser(args.actor)).filter((job) =>
    Number.isNaN(sinceTs) ? true : Date.parse(job.updated_at) >= sinceTs
  );
  const uniqueJobids = [...new Set(jobs.map((job) => job.job_id))];

  const [queueLists, eventLists] = await Promise.all([
    Promise.all(uniqueJobids.map((jobid) => args.store.listSyncQueueByJob(jobid))),
    Promise.all(uniqueJobids.map((jobid) => args.store.listJobEventsByJob(jobid)))
  ]);

  const queue = queueLists
    .flat()
    .filter((item, index, arr) => arr.findIndex((candidate) => candidate.mutation_id === item.mutation_id) === index)
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at));

  const events = eventLists
    .flat()
    .filter((item, index, arr) => arr.findIndex((candidate) => candidate.event_id === item.event_id) === index)
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at));

  return { jobs, queue, events };
}
