import { describe, expect, it } from "vitest";
import { loginAs, makeTestApp } from "../contract/helpers";

describe("offline conflict resolution flow", () => {
  it("resolves conflict using merge strategy", async () => {
    const app = makeTestApp();
    const cookie = await loginAs(app, "dev-technician");

    const apply = await app.request("/api/v1/sync/push", {
      method: "POST",
      headers: {
        cookie,
        "content-type": "application/json"
      },
      body: JSON.stringify({
        mutations: [
          {
            mutation_id: "MUT-RESOLVE-1",
            kind: "job_status",
            job_id: "JOB-1001",
            expected_row_version: 1,
            payload: { status: "draft" }
          }
        ]
      })
    });

    expect(apply.status).toBe(200);

    const conflictResponse = await app.request("/api/v1/sync/push", {
      method: "POST",
      headers: {
        cookie,
        "content-type": "application/json"
      },
      body: JSON.stringify({
        mutations: [
          {
            mutation_id: "MUT-RESOLVE-2",
            kind: "job_note",
            job_id: "JOB-1001",
            expected_row_version: 1,
            payload: { note: "queued note" }
          }
        ]
      })
    });

    expect(conflictResponse.status).toBe(409);
    const conflictBody = (await conflictResponse.json()) as {
      conflict: {
        server_row_version: number;
      };
    };

    const resolve = await app.request("/api/v1/sync/conflict/resolve", {
      method: "POST",
      headers: {
        cookie,
        "content-type": "application/json"
      },
      body: JSON.stringify({
        job_id: "JOB-1001",
        strategy: "merge",
        server_row_version: conflictBody.conflict.server_row_version,
        client_row_version: 1,
        merge_patch: {
          last_note: "merged note"
        }
      })
    });

    expect(resolve.status).toBe(200);
    const resolvedBody = (await resolve.json()) as { data: { last_note: string } };
    expect(resolvedBody.data.last_note).toBe("merged note");
  });
});
