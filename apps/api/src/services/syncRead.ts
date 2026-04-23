import type { JobEventRow, JobRow, SessionUser, SyncQueueRow } from "@kharon/domain";
import type { WorkbookStore } from "../store/types.js";
import { listSyncArtifactsForJobs } from "../store/repositories/syncRepository.js";

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

  let queue: SyncQueueRow[] = [];
  let events: JobEventRow[] = [];

  try {
    const artifacts = await listSyncArtifactsForJobs(args.store, uniqueJobids);
    queue = artifacts.queue;
    events = artifacts.events;
  } catch (error) {
    console.warn("sync snapshot event/queue lookup failed, returning jobs-only snapshot", {
      actor: args.actor.user_id,
      error: String(error)
    });
    return { jobs, queue: [], events: [] };
  }

  return { jobs, queue, events };
}
