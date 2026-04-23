import { describe, expect, it } from "vitest";
import type { WorkbookStore } from "../../../apps/api/src/store/types";
import jobs from "../../../apps/api/src/routes/jobs";
import { makeRouteHarness } from "./helpers";

describe("unit: jobs route module", () => {
  it("rejects unauthenticated requests", async () => {
    const app = makeRouteHarness({
      route: jobs,
      sessionUser: null
    });

    const response = await app.request("/JOB-1/status", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: "performed", row_version: 1 })
    });

    expect(response.status).toBe(401);
  });

  it("returns row-version conflict envelope shape", async () => {
    const mockStore = {
      getJob: async () => ({
        job_id: "JOB-1",
        client_id: "CLI-1",
        site_id: "SITE-1",
        technician_id: "TECH-1",
        title: "Fault report",
        status: "draft",
        scheduled_start: "2026-04-23T08:00:00.000Z",
        scheduled_end: "2026-04-23T09:00:00.000Z",
        last_note: "",
        row_version: 2,
        updated_at: "2026-04-23T07:00:00.000Z",
        updated_by: "USR-ADMIN-1",
        correlation_id: "corr-1"
      }),
      updateJobStatus: async () => ({
        job: {
          job_id: "JOB-1",
          client_id: "CLI-1",
          site_id: "SITE-1",
          technician_id: "TECH-1",
          title: "Fault report",
          status: "draft",
          scheduled_start: "2026-04-23T08:00:00.000Z",
          scheduled_end: "2026-04-23T09:00:00.000Z",
          last_note: "",
          row_version: 2,
          updated_at: "2026-04-23T07:00:00.000Z",
          updated_by: "USR-ADMIN-1",
          correlation_id: "corr-1"
        },
        conflict: {
          type: "row_version_conflict" as const,
          entity: "Jobs_Master",
          entity_id: "JOB-1",
          client_row_version: 1,
          server_row_version: 2,
          server_state: { job_id: "JOB-1", row_version: 2 }
        }
      }),
      appendAudit: async () => undefined
    } as unknown as WorkbookStore;

    const app = makeRouteHarness({
      route: jobs,
      sessionUser: {
        user_id: "USR-ADMIN-1",
        email: "admin@kharon.co.za",
        role: "admin",
        display_name: "Admin",
        client_id: "",
        technician_id: ""
      },
      store: mockStore
    });

    const response = await app.request("/JOB-1/status", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: "performed", row_version: 1 })
    });

    expect(response.status).toBe(409);
    const body = (await response.json()) as { error: { code: string }; conflict: { server_row_version: number } };
    expect(body.error.code).toBe("row_version_conflict");
    expect(body.conflict.server_row_version).toBe(2);
  });

  it("formats schema validation errors consistently", async () => {
    const mockStore = {
      getJob: async () => null
    } as unknown as WorkbookStore;

    const app = makeRouteHarness({
      route: jobs,
      sessionUser: {
        user_id: "USR-ADMIN-1",
        email: "admin@kharon.co.za",
        role: "admin",
        display_name: "Admin",
        client_id: "",
        technician_id: ""
      },
      store: mockStore
    });

    const response = await app.request("/JOB-1/status", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({})
    });

    expect(response.status).toBe(400);
    const body = (await response.json()) as { error: { code: string } };
    expect(body.error.code).toBe("validation_error");
  });
});
