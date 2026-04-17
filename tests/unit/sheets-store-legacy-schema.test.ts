import { describe, expect, it } from "vitest";
import type { RowRecord, WorkspaceRails } from "../../packages/google/src/types";
import { SheetsWorkbookStore } from "../../apps/api/src/store/sheetsStore";

function createRails(seed: Record<string, RowRecord[]>): { rails: WorkspaceRails; rows: Map<string, RowRecord[]> } {
  const rows = new Map<string, RowRecord[]>(
    Object.entries(seed).map(([sheetName, sheetRows]) => [sheetName, sheetRows.map((row) => ({ ...row }))])
  );

  function sheet(sheetName: string): RowRecord[] {
    if (!rows.has(sheetName)) {
      rows.set(sheetName, []);
    }
    return rows.get(sheetName) ?? [];
  }

  const rails: WorkspaceRails = {
    mode: "local",
    driveRootFolderId: "root-id",
    sheets: {
      async ensureWorkbookSchema() {
        return;
      },
      async getRows(sheetName) {
        return sheet(sheetName).map((row) => ({ ...row }));
      },
      async appendRow(sheetName, row) {
        sheet(sheetName).push({ ...row });
      },
      async upsertRow(sheetName, keyField, row) {
        const target = sheet(sheetName);
        const key = String(row[keyField] ?? "");
        const index = target.findIndex((existing) => String(existing[keyField] ?? "") === key);
        if (index >= 0) {
          target[index] = { ...target[index], ...row };
        } else {
          target.push({ ...row });
        }
      }
    },
    docs: {
      async generateDocument() {
        return { drive_file_id: "unused", pdf_file_id: "unused" };
      },
      async listFiles() {
        return [];
      }
    },
    drive: {
      async publishFile() {
        return { publishedUrl: "" };
      }
    },
    calendar: {
      async confirmEvent() {
        return { eventId: "unused" };
      }
    },
    gmail: {
      async sendNotification() {
        return { messageId: "unused" };
      }
    },
    chat: {
      async sendAlert() {
        return;
      }
    },
    people: {
      async syncContact() {
        return { resourceName: "unused" };
      }
    }
  };

  return { rails, rows };
}

describe("SheetsWorkbookStore legacy workbook mapping", () => {
  it("maps legacy user and job headers into the app model", async () => {
    const { rails } = createRails({
      Users_Master: [
        {
          user_uid: "USR-001",
          email: "connor@kharon.co.za",
          display_name: "Connor",
          role: "admin",
          client_uid: "",
          technician_uid: "",
          active: "TRUE",
          row_version: "1",
          updated_at: "2026-04-10T19:01:54.054Z",
          updated_by: "bootstrap",
          correlation_id: "bootstrap-admin-001"
        }
      ],
      Jobs_Master: [
        {
          job_uid: "JOB-00001",
          row_version: "7",
          client_id: "CLT-0042",
          site_id: "SITE-00119",
          primary_technician_id: "TECH-001",
          details_of_works: "Replace Power Supply",
          job_status: "invoiced",
          status_raw: "Invoiced",
          date_scheduled: "2026-01-05",
          completion_due_at: "2026-01-26",
          legacy_formula_notes: "Imported from legacy",
          last_sync_at: "2026-04-08",
          dispatcher_owner: "Anthony",
          source_refs: "Jan 2026!R7"
        }
      ]
    });

    const store = new SheetsWorkbookStore(rails);
    const user = await store.getUserByEmail("connor@kharon.co.za");
    const job = await store.getJob("JOB-00001");

    expect(user?.active).toBe("true");
    expect(user?.email).toBe("connor@kharon.co.za");
    expect(job).toMatchObject({
      job_uid: "JOB-00001",
      client_uid: "CLT-0042",
      site_uid: "SITE-00119",
      technician_uid: "TECH-001",
      title: "Replace Power Supply",
      status: "performed",
      scheduled_start: "2026-01-05",
      scheduled_end: "2026-01-26",
      last_note: "Imported from legacy",
      updated_at: "2026-04-08",
      updated_by: "Anthony",
      correlation_id: "Jan 2026!R7"
    });
  });

  it("updates legacy jobs without losing imported metadata", async () => {
    const { rails, rows } = createRails({
      Jobs_Master: [
        {
          job_uid: "JOB-00002",
          row_version: "3",
          client_id: "CLT-0001",
          site_id: "SITE-0001",
          primary_technician_id: "TECH-001",
          details_of_works: "Investigate panel fault",
          job_status: "draft",
          status_raw: "Assigned",
          legacy_job_id: "KHA12602",
          source_system: "legacy_workbook_import",
          import_conflict_flag: "no",
          last_sync_at: "2026-04-08T00:00:00.000Z"
        }
      ],
      Job_Events: []
    });

    const store = new SheetsWorkbookStore(rails);
    const result = await store.updateJobStatus({
      jobUid: "JOB-00002",
      status: "performed",
      expectedRowVersion: 3,
      ctx: {
        actorUserUid: "USR-001",
        correlationId: "corr-001"
      }
    });

    const updatedRow = rows.get("Jobs_Master")?.[0];
    const eventRow = rows.get("Job_Events")?.[0];

    expect(result.conflict).toBeNull();
    expect(result.job.status).toBe("performed");
    expect(updatedRow).toMatchObject({
      job_uid: "JOB-00002",
      row_version: "4",
      job_status: "performed",
      status_raw: "Performed",
      legacy_job_id: "KHA12602",
      client_id: "CLT-0001",
      site_id: "SITE-0001",
      source_system: "legacy_workbook_import",
      import_conflict_flag: "no"
    });
    expect(eventRow).toMatchObject({
      event_type: "status_changed",
      job_uid: "JOB-00002",
      new_value: "performed"
    });
  });

  it("stores generated pdf state in Portal_Files while keeping document metadata in Job_Documents", async () => {
    const { rails, rows } = createRails({
      Jobs_Master: [
        {
          job_uid: "JOB-00003",
          legacy_job_id: "KHA12603",
          client_id: "CLT-0009",
          site_id: "SITE-00061",
          contract_id: "CTR-0009",
          account: "BidvestFM",
          site: "Zola",
          details_of_works: "Investigate door and report",
          drive_folder_id: "folder-001"
        }
      ],
      Job_Documents: [],
      Portal_Files: []
    });

    const store = new SheetsWorkbookStore(rails);
    await store.createDocument({
      document_uid: "DOC-00001",
      job_uid: "JOB-00003",
      document_type: "service_report",
      status: "generated",
      drive_file_id: "drive-doc-001",
      pdf_file_id: "pdf-file-001",
      published_url: "",
      row_version: 1,
      updated_at: "2026-04-11T10:00:00.000Z",
      updated_by: "USR-001",
      correlation_id: "corr-doc-001",
      client_visible: false
    });


    const createdDocument = await store.getDocument("DOC-00001");
    const documentRow = rows.get("Job_Documents")?.[0];
    const fileRow = rows.get("Portal_Files")?.[0];

    expect(createdDocument).toMatchObject({
      document_uid: "DOC-00001",
      drive_file_id: "drive-doc-001",
      pdf_file_id: "pdf-file-001",
      status: "generated"
    });
    expect(documentRow).toMatchObject({
      document_uid: "DOC-00001",
      job_uid: "JOB-00003",
      client_id: "CLT-0009",
      site_id: "SITE-00061",
      contract_id: "CTR-0009",
      drive_file_id: "drive-doc-001",
      drive_folder_id: "folder-001",
      portal_visible: "FALSE"
    });
    expect(fileRow).toMatchObject({
      file_uid: "FIL-00001",
      job_uid: "JOB-00003",
      drive_file_id: "pdf-file-001",
      source_url: "",
      portal_visible: "FALSE",
      visible_to_client: "FALSE"
    });
    expect(String(fileRow?.notes)).toContain("document_uid:DOC-00001");

    await store.upsertDocument({
      document_uid: "DOC-00001",
      job_uid: "JOB-00003",
      document_type: "service_report",
      status: "published",
      drive_file_id: "drive-doc-001",
      pdf_file_id: "pdf-file-001",
      published_url: "https://drive.google.com/file/d/pdf-file-001/view",
      row_version: 2,
      updated_at: "2026-04-11T10:05:00.000Z",
      updated_by: "USR-001",
      correlation_id: "corr-doc-002",
      client_visible: true
    });


    const published = await store.getDocument("DOC-00001");
    const updatedFileRow = rows.get("Portal_Files")?.[0];

    expect(published).toMatchObject({
      status: "published",
      published_url: "https://drive.google.com/file/d/pdf-file-001/view",
      pdf_file_id: "pdf-file-001"
    });
    expect(updatedFileRow).toMatchObject({
      portal_visible: "TRUE",
      visible_to_client: "TRUE",
      source_url: "https://drive.google.com/file/d/pdf-file-001/view"
    });
  });
});
