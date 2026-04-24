import { describe, expect, it } from "vitest";
import { canPublishDocument, canReadJob, canUpdateJobStatus, type JobRow, type SessionUser, canCreateJob, canDeleteJob, canReadUser, canModifyUser, canReadFinanceData, canModifyFinanceData, canAccessPeopleDirectory, canManageSchedules } from "@kharon/domain";

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

  it("validates job creation permissions", () => {
    expect(canCreateJob("admin")).toBe(true);
    expect(canCreateJob("dispatcher")).toBe(true);
    expect(canCreateJob("super_admin")).toBe(true);
    expect(canCreateJob("client")).toBe(false);
    expect(canCreateJob("technician")).toBe(false);
  });

  it("validates job deletion permissions", () => {
    expect(canDeleteJob("admin")).toBe(true);
    expect(canDeleteJob("super_admin")).toBe(true);
    expect(canDeleteJob("dispatcher")).toBe(false);
    expect(canDeleteJob("client")).toBe(false);
    expect(canDeleteJob("technician")).toBe(false);
  });

  it("validates user access permissions", () => {
    expect(canReadUser("admin")).toBe(true);
    expect(canReadUser("super_admin")).toBe(true);
    expect(canReadUser("dispatcher")).toBe(false);
    expect(canReadUser("client")).toBe(false);
  });

  it("validates user modification permissions", () => {
    expect(canModifyUser("admin")).toBe(true);
    expect(canModifyUser("super_admin")).toBe(true);
    expect(canModifyUser("dispatcher")).toBe(false);
    expect(canModifyUser("client")).toBe(false);
  });

  it("validates finance data permissions", () => {
    expect(canReadFinanceData("admin")).toBe(true);
    expect(canReadFinanceData("finance")).toBe(true);
    expect(canReadFinanceData("super_admin")).toBe(true);
    expect(canReadFinanceData("dispatcher")).toBe(false);
  });

  it("validates people directory access", () => {
    expect(canAccessPeopleDirectory("admin")).toBe(true);
    expect(canAccessPeopleDirectory("dispatcher")).toBe(true);
    expect(canAccessPeopleDirectory("super_admin")).toBe(true);
    expect(canAccessPeopleDirectory("client")).toBe(false);
    expect(canAccessPeopleDirectory("technician")).toBe(false);
  });

  it("validates schedule management permissions", () => {
    expect(canManageSchedules("admin")).toBe(true);
    expect(canManageSchedules("dispatcher")).toBe(true);
    expect(canManageSchedules("super_admin")).toBe(true);
    expect(canManageSchedules("client")).toBe(false);
    expect(canManageSchedules("technician")).toBe(false);
  });
});