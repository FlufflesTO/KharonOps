import { describe, expect, it } from "vitest";
import { decideQueueAfterPush, type OfflineQueueItem } from "@kharon/domain";

describe("offline replay process", () => {
  it("removes applied mutations and keeps unresolved conflicts", () => {
    const queue: OfflineQueueItem[] = [
      {
        mutation_id: "MUT-1",
        kind: "job_status",
        job_uid: "JOB-1001",
        expected_row_version: 1,
        payload: { status: "draft" },
        created_at: "2026-04-09T10:00:00.000Z"
      },
      {
        mutation_id: "MUT-2",
        kind: "job_note",
        job_uid: "JOB-1001",
        expected_row_version: 1,
        payload: { note: "done" },
        created_at: "2026-04-09T10:01:00.000Z"
      }
    ];

    const decision = decideQueueAfterPush(queue, {
      applied: [{ mutation_id: "MUT-1", job_uid: "JOB-1001", row_version: 2 }],
      conflicts: [
        {
          mutation_id: "MUT-2",
          job_uid: "JOB-1001",
          conflict: {
            type: "row_version_conflict",
            entity: "Jobs_Master",
            entity_id: "JOB-1001",
            client_row_version: 1,
            server_row_version: 2,
            server_state: { job_uid: "JOB-1001" }
          }
        }
      ],
      failed: []
    });

    expect(decision.removeMutationIds).toEqual(["MUT-1"]);
    expect(decision.keepMutationIds).toEqual(["MUT-2"]);
  });
});
