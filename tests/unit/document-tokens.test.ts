import { describe, expect, it } from "vitest";
import type { JobRow, SessionUser, UserRow } from "@kharon/domain";
import { buildDocumentTokens } from "../../apps/api/src/services/documentTokens";

const job: JobRow = {
  job_id: "JOB-00042",
  client_id: "CLT-001",
  site_id: "SITE-007",
  technician_id: "TECH-009",
  title: "Quarterly CCTV and access control service",
  status: "performed", scheduled_start: "2026-04-11T08:00:00.000Z",
  scheduled_end: "2026-04-11T10:00:00.000Z",
  last_note: "Client requested a report pack with service evidence.",
  row_version: 4,
  updated_at: "2026-04-11T07:30:00.000Z",
  updated_by: "USR-ADMIN",
  correlation_id: "corr-1"
};

const actor: SessionUser = {
  user_id: "USR-ADMIN",
  email: "connor@kharon.co.za",
  role: "admin",
  display_name: "Operations Admin",
  client_id: "",
  technician_id: ""
};

const users: UserRow[] = [
  {
    user_id: "USR-CLIENT",
    email: "connor@kharon.co.za",
    display_name: "Client Contact",
    role: "client",
    client_id: "CLT-001",
    technician_id: "",
    active: "true",
    row_version: 1,
    updated_at: "2026-04-11T07:00:00.000Z",
    updated_by: "USR-ADMIN",
    correlation_id: "corr-2"
  },
  {
    user_id: "USR-TECH",
    email: "connor@kharon.co.za",
    display_name: "Field Technician",
    role: "technician",
    client_id: "",
    technician_id: "TECH-009",
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
      documentid: "DOC-123",
      documentType: "service_report",
      job,
      actor,
      users,
      generatedAt: new Date("2026-04-11T09:15:00.000Z")
    });

    const brandToken = tokens.brand_name;
    if (brandToken?.type === "text") {
      expect(brandToken.value).toBe("Kharon Fire & Security Solutions");
    }
    const docidToken = tokens.document_id;
    if (docidToken?.type === "text") {
      expect(docidToken.value).toBe("DOC-123");
    }
    const docTypeLabel = tokens.document_type_label;
    if (docTypeLabel?.type === "text") {
      expect(docTypeLabel.value).toBe("Service Report");
    }
    const docTitleToken = tokens.document_title;
    if (docTitleToken?.type === "text") {
      expect(docTitleToken.value).toBe("Service Report JOB-00042");
    }
    const jobTitleToken = tokens.job_title;
    if (jobTitleToken?.type === "text") {
      expect(jobTitleToken.value).toBe("Quarterly CCTV and access control service");
    }
    const jobStatusToken = tokens.job_status_label;
    if (jobStatusToken?.type === "text") {
      expect(jobStatusToken.value).toBe("Performed");
    }
    const clientDisplayNameToken = tokens.client_display_name;
    if (clientDisplayNameToken?.type === "text") {
      expect(clientDisplayNameToken.value).toBe("Client Contact");
    }
    const clientEmailToken = tokens.client_email;
    if (clientEmailToken?.type === "text") {
      expect(clientEmailToken.value).toBe("connor@kharon.co.za");
    }
    const technicianDisplayNameToken = tokens.technician_display_name;
    if (technicianDisplayNameToken?.type === "text") {
      expect(technicianDisplayNameToken.value).toBe("Field Technician");
    }
    const technicianEmailToken = tokens.technician_email;
    if (technicianEmailToken?.type === "text") {
      expect(technicianEmailToken.value).toBe("connor@kharon.co.za");
    }
    const lastNoteToken = tokens.last_note;
    if (lastNoteToken?.type === "text") {
      expect(lastNoteToken.value).toBe("Client requested a report pack with service evidence.");
    }
    const preparedByNameToken = tokens.prepared_by_name;
    if (preparedByNameToken?.type === "text") {
      expect(preparedByNameToken.value).toBe("Operations Admin");
    }
    const preparedByRoleToken = tokens.prepared_by_role;
    if (preparedByRoleToken?.type === "text") {
      expect(preparedByRoleToken.value).toBe("Admin");
    }
    const generatedAtToken = tokens.generated_at;
    if (generatedAtToken?.type === "text") {
      expect(generatedAtToken.value).toBe("2026-04-11T09:15:00.000Z");
    }

    const windowToken = tokens.scheduled_window_display;
    expect(windowToken).toBeDefined();
    if (windowToken?.type === "text") {
      expect(windowToken.type).toBe("text");
      expect(windowToken.value.length).toBeGreaterThan(0);
    }
  });

  it("allows explicit request tokens to override defaults", () => {
    const tokens = buildDocumentTokens({
      documentid: "DOC-123",
      documentType: "jobcard",
      job,
      actor,
      users,
      overrides: {
        job_title: "Override title",
        custom_footer: "Branded footer copy"
      }
    });

    const docTypeLabel = tokens.document_type_label;
    if (docTypeLabel?.type === "text") {
      expect(docTypeLabel.value).toBe("Jobcard");
    }
    const chkJobTitleToken = tokens.chk_job_title;
    if (chkJobTitleToken && chkJobTitleToken.type === "text") {
      expect(chkJobTitleToken.value).toBe("☐ N/A");
    }
    const footerToken = tokens.chk_custom_footer;
    if (footerToken && footerToken.type === "text") {
      expect(footerToken.value).toBe("☐ N/A");
    }
  });
});
