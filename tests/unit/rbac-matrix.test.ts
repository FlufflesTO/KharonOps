import { describe, expect, it } from "vitest";
import { canPublishDocument, canReadJob, canUpdateJobStatus, type JobRow, type SessionUser } from "@kharon/domain";

const job: JobRow = {
  job_uid: "JOB-1001",
  client_uid: "CLI-001",
  site_uid: "SITE-001",
  technician_uid: "TECH-001",
  title: "Test",
  status: "assigned",
  scheduled_start: "2026-04-09T00:00:00.000Z",
  scheduled_end: "2026-04-09T00:00:00.000Z",
  last_note: "",
  row_version: 1,
  updated_at: "2026-04-09T00:00:00.000Z",
  updated_by: "seed",
  correlation_id: "seed"
};

function user(role: SessionUser["role"], clientUid = "", techUid = ""): SessionUser {
  return {
    user_uid: `${role}-1`,
    email: `${role}@example.com`,
    role,
    display_name: role,
    client_uid: clientUid,
    technician_uid: techUid
  };
}

describe("RBAC matrix", () => {
  it("enforces ownership for client and technician", () => {
    expect(canReadJob(user("client", "CLI-001"), job)).toBe(true);
    expect(canReadJob(user("client", "CLI-999"), job)).toBe(false);
    expect(canReadJob(user("technician", "", "TECH-001"), job)).toBe(true);
    expect(canReadJob(user("technician", "", "TECH-999"), job)).toBe(false);
  });

  it("allows dispatcher and admin status updates", () => {
    expect(canUpdateJobStatus(user("dispatcher"), job)).toBe(true);
    expect(canUpdateJobStatus(user("admin"), job)).toBe(true);
    expect(canUpdateJobStatus(user("client", "CLI-001"), job)).toBe(false);
  });

  it("restricts document publish to dispatcher/admin", () => {
    expect(canPublishDocument("dispatcher")).toBe(true);
    expect(canPublishDocument("admin")).toBe(true);
    expect(canPublishDocument("technician")).toBe(false);
  });
});
