import { describe, expect, it } from "vitest";
import { loginAs, makeTestApp } from "../contract/helpers";

describe("offline conflict generation", () => {
  it("returns conflict when queued mutation uses stale version", async () => {
    const app = makeTestApp();
    const cookie = await loginAs(app, "dev-technician");

    const first = await app.request("/api/v1/sync/push", {
      method: "POST",
      headers: {
        cookie,
        "content-type": "application/json"
      },
      body: JSON.stringify({
        mutations: [
          {
            mutation_id: "MUT-OFF-1",
            kind: "job_status",
            job_uid: "JOB-1001",
            expected_row_version: 1,
            payload: { status: "en_route" }
          }
        ]
      })
    });

    expect(first.status).toBe(200);

    const stale = await app.request("/api/v1/sync/push", {
      method: "POST",
      headers: {
        cookie,
        "content-type": "application/json"
      },
      body: JSON.stringify({
        mutations: [
          {
            mutation_id: "MUT-OFF-2",
            kind: "job_note",
            job_uid: "JOB-1001",
            expected_row_version: 1,
            payload: { note: "late update" }
          }
        ]
      })
    });

    expect(stale.status).toBe(409);
    const staleBody = (await stale.json()) as { conflict: { type: string } };
    expect(staleBody.conflict.type).toBe("row_version_conflict");
  });
});
