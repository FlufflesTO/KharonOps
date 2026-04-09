import { describe, expect, it } from "vitest";
import { loginAs, makeTestApp } from "./helpers";

describe("contract: conflict response shape", () => {
  it("returns canonical conflict payload on sync push conflict", async () => {
    const app = makeTestApp();
    const cookie = await loginAs(app, "dev-technician");

    const response = await app.request("/api/v1/sync/push", {
      method: "POST",
      headers: {
        cookie,
        "content-type": "application/json"
      },
      body: JSON.stringify({
        mutations: [
          {
            mutation_id: "MUT-CONFLICT-1",
            kind: "job_status",
            job_uid: "JOB-1001",
            expected_row_version: 999,
            payload: {
              status: "on_site"
            }
          }
        ]
      })
    });

    expect(response.status).toBe(409);

    const body = (await response.json()) as {
      data: null;
      error: { code: string };
      correlation_id: string;
      row_version: null;
      conflict: {
        type: string;
        entity: string;
        entity_id: string;
        client_row_version: number;
        server_row_version: number;
        server_state: Record<string, unknown>;
      };
    };

    expect(body.data).toBeNull();
    expect(body.error.code).toBe("sync_conflict");
    expect(typeof body.correlation_id).toBe("string");
    expect(body.conflict.type).toBe("row_version_conflict");
    expect(body.conflict.entity).toBe("Jobs_Master");
    expect(body.conflict.entity_id).toBe("JOB-1001");
    expect(body.conflict.client_row_version).toBe(999);
    expect(body.conflict.server_row_version).toBeGreaterThan(0);
    expect(body.conflict.server_state.job_uid).toBe("JOB-1001");
  });
});
