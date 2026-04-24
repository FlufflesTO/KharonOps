import { describe, expect, it } from "vitest";
import { canPublishDocument, canReadJob, canUpdateJobStatus, type JobRow, type SessionUser } from "@kharon/domain";

const job: JobRow = {
  job_id: "JOB-1001",
  client_id: "CLI-001",
  site_id: "SITE-001",
  technician_id: "TECH-001",
  title: "Test",
  status: "draft",
  scheduled_start: "2026-04-09T00:00:00.000Z",
  scheduled_end: "2026-04-09T00:00:00.000Z",
  last_note: "",
  row_version: 1,
  updated_at: "2026-04-09T00:00:00.000Z",
  updated_by: "seed",
  correlation_id: "seed"
};

function user(role: SessionUser["role"], clientid = "", techid = ""): SessionUser {
  return {
    user_id: `${role}-1`,
    email: `${role}@example.com`,
    role,
    display_name: role,
    client_id: clientid,
    technician_id: techid
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

  it("limits assigned technician status updates to field outcomes", () => {
    const technician = user("technician", "", "TECH-001");

    expect(canUpdateJobStatus(technician, job, "performed")).toBe(true);
    expect(canUpdateJobStatus(technician, job, "cancelled")).toBe(true);
    expect(canUpdateJobStatus(technician, job, "approved")).toBe(false);
    expect(canUpdateJobStatus(user("technician", "", "TECH-999"), job, "performed")).toBe(false);
  });

  it("restricts document publish to dispatcher/admin", () => {
    expect(canPublishDocument("dispatcher")).toBe(true);
    expect(canPublishDocument("admin")).toBe(true);
    expect(canPublishDocument("technician")).toBe(false);
  });
});
