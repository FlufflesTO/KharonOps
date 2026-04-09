import { describe, expect, it } from "vitest";
import { scheduleRequestSchema, statusUpdateSchema, syncPushSchema } from "@kharon/domain";

describe("schema validation", () => {
  it("validates status payload", () => {
    expect(statusUpdateSchema.parse({ status: "on_site", row_version: 2 }).status).toBe("on_site");
    expect(() => statusUpdateSchema.parse({ status: "invalid", row_version: 2 })).toThrow();
  });

  it("validates schedule request payload", () => {
    const payload = scheduleRequestSchema.parse({
      job_uid: "JOB-1001",
      preferred_slots: [
        {
          start_at: "2026-04-09T10:00:00.000Z",
          end_at: "2026-04-09T11:00:00.000Z"
        }
      ],
      timezone: "Africa/Johannesburg",
      notes: "Preferred before noon",
      row_version: 4
    });

    expect(payload.job_uid).toBe("JOB-1001");
  });

  it("validates sync push payload", () => {
    const parsed = syncPushSchema.parse({
      mutations: [
        {
          mutation_id: "MUT-1",
          kind: "job_status",
          job_uid: "JOB-1001",
          expected_row_version: 3,
          payload: {
            status: "on_site"
          }
        }
      ]
    });

    expect(parsed.mutations).toHaveLength(1);
  });
});
