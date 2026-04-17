import { describe, expect, it } from "vitest";
import { loginAs, makeTestApp } from "./helpers";

describe("contract: admin automation surface", () => {
  it("lists automation jobs and retries a selected queue entry", async () => {
    const app = makeTestApp();
    const cookie = await loginAs(app, "dev-admin");

    const listResponse = await app.request("/api/v1/admin/automation-jobs", {
      method: "GET",
      headers: {
        cookie
      }
    });

    expect(listResponse.status).toBe(200);
    const listBody = (await listResponse.json()) as {
      data: Array<{ automation_job_uid: string; retry_count: number }>;
    };
    expect(listBody.data.some((job) => job.automation_job_uid === "AUTO-001")).toBe(true);

    const retryResponse = await app.request("/api/v1/admin/retries/AUTO-001", {
      method: "POST",
      headers: {
        cookie
      }
    });
    expect(retryResponse.status).toBe(200);

    const afterResponse = await app.request("/api/v1/admin/automation-jobs", {
      method: "GET",
      headers: {
        cookie
      }
    });
    expect(afterResponse.status).toBe(200);
    const afterBody = (await afterResponse.json()) as {
      data: Array<{ automation_job_uid: string; retry_count: number; status: string }>;
    };
    const retriedJob = afterBody.data.find((job) => job.automation_job_uid === "AUTO-001");
    expect(retriedJob?.retry_count).toBe(1);
    expect(retriedJob?.status).toBe("queued");
  });
});
