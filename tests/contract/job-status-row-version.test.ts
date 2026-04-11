import { describe, expect, it } from "vitest";
import { loginAs, makeTestApp } from "./helpers";

describe("contract: job status update row_version", () => {
  it("returns 409 on stale row version", async () => {
    const app = makeTestApp();
    const cookie = await loginAs(app, "dev-technician");

    const jobResponse = await app.request("/api/v1/jobs/JOB-1001", {
      method: "GET",
      headers: { cookie }
    });
    const jobBody = (await jobResponse.json()) as { data: { row_version: number } };
    const version = jobBody.data.row_version;

    const updateOne = await app.request("/api/v1/jobs/JOB-1001/status", {
      method: "POST",
      headers: {
        cookie,
        "content-type": "application/json"
      },
      body: JSON.stringify({ status: "performed", row_version: version })
    });
    expect(updateOne.status).toBe(200);

    const staleUpdate = await app.request("/api/v1/jobs/JOB-1001/status", {
      method: "POST",
      headers: {
        cookie,
        "content-type": "application/json"
      },
      body: JSON.stringify({ status: "performed", row_version: version })
    });

    expect(staleUpdate.status).toBe(409);
    const staleBody = (await staleUpdate.json()) as { error: { code: string }; conflict: { type: string } };
    expect(staleBody.error.code).toBe("row_version_conflict");
    expect(staleBody.conflict.type).toBe("row_version_conflict");
  });
});
