import { describe, expect, it } from "vitest";
import type { JobRow, SessionUser, UserRow } from "@kharon/domain";
import { buildDocumentTokens } from "../../apps/api/src/services/documentTokens";

const job: JobRow = {
  job_uid: "JOB-00042",
  client_uid: "CLT-001",
  site_uid: "SITE-007",
  technician_uid: "TECH-009",
  title: "Quarterly CCTV and access control service",
  status: "performed",  scheduled_start: "2026-04-11T08:00:00.000Z",
  scheduled_end: "2026-04-11T10:00:00.000Z",
  last_note: "Client requested a report pack with service evidence.",
  row_version: 4,
  updated_at: "2026-04-11T07:30:00.000Z",
  updated_by: "USR-ADMIN",
  correlation_id: "corr-1"
};

const actor: SessionUser = {
  user_uid: "USR-ADMIN",
  email: "connor@kharon.co.za",
  role: "admin",
  display_name: "Operations Admin",
  client_uid: "",
  technician_uid: ""
};

const users: UserRow[] = [
  {
    user_uid: "USR-CLIENT",
    email: "connor@kharon.co.za",
    display_name: "Client Contact",
    role: "client",
    client_uid: "CLT-001",
    technician_uid: "",
    active: "true",
    row_version: 1,
    updated_at: "2026-04-11T07:00:00.000Z",
    updated_by: "USR-ADMIN",
    correlation_id: "corr-2"
  },
  {
    user_uid: "USR-TECH",
    email: "connor@kharon.co.za",
    display_name: "Field Technician",
    role: "technician",
    client_uid: "",
    technician_uid: "TECH-009",
    active: "true",
    row_version: 1,
    updated_at: "2026-04-11T07:00:00.000Z",
    updated_by: "USR-ADMIN",
    correlation_id: "corr-3"
  }
];

describe("buildDocumentTokens", () => {
  it("builds a richer default token contract for document templates", () => {
    const tokens = buildDocumentTokens({
      documentUid: "DOC-123",
      documentType: "service_report",
      job,
      actor,
      users,
      generatedAt: new Date("2026-04-11T09:15:00.000Z")
    });

    expect(tokens.brand_name).toBe("Kharon Operations");
    expect(tokens.document_uid).toBe("DOC-123");
    expect(tokens.document_type_label).toBe("Service Report");
    expect(tokens.document_title).toBe("Service Report JOB-00042");
    expect(tokens.job_title).toBe("Quarterly CCTV and access control service");
    expect(tokens.job_status_label).toBe("Performed");
    expect(tokens.client_display_name).toBe("Client Contact");
    expect(tokens.client_email).toBe("connor@kharon.co.za");
    expect(tokens.technician_display_name).toBe("Field Technician");
    expect(tokens.technician_email).toBe("connor@kharon.co.za");
    expect(tokens.last_note).toBe("Client requested a report pack with service evidence.");
    expect(tokens.prepared_by_name).toBe("Operations Admin");
    expect(tokens.prepared_by_role).toBe("Admin");
    expect(tokens.generated_at).toBe("2026-04-11T09:15:00.000Z");
    expect(tokens.scheduled_window_display?.length).toBeGreaterThan(0);
  });

  it("allows explicit request tokens to override defaults", () => {
    const tokens = buildDocumentTokens({
      documentUid: "DOC-123",
      documentType: "jobcard",
      job,
      actor,
      users,
      overrides: {
        job_title: "Override title",
        custom_footer: "Branded footer copy"
      }
    });

    expect(tokens.document_type_label).toBe("Jobcard");
    expect(tokens.job_title).toBe("Override title");
    expect(tokens.custom_footer).toBe("Branded footer copy");
  });
});
