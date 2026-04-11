import { describe, expect, it } from "vitest";
import { createRuntimeConfig } from "../../apps/api/src/config";
import { createWorkbookStore } from "../../apps/api/src/store/factory";
import { DualWorkbookStore } from "../../apps/api/src/store/dualStore";
import { LocalWorkbookStore } from "../../apps/api/src/store/localStore";
import { PostgresWorkbookStore } from "../../apps/api/src/store/postgresStore";
import { SheetsWorkbookStore } from "../../apps/api/src/store/sheetsStore";

const productionBaseEnv = {
  KHARON_MODE: "production",
  SESSION_KEYS: "prod-session-key-11111111111111111111111111111111,prod-session-key-22222222222222222222222222222222",
  GOOGLE_CLIENT_ID: "client-id.apps.googleusercontent.com",
  GOOGLE_SERVICE_ACCOUNT_EMAIL: "service-account@example.iam.gserviceaccount.com",
  GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY: "-----BEGIN PRIVATE KEY-----\nabc\n-----END PRIVATE KEY-----\n",
  WORKBOOK_SPREADSHEET_ID: "spreadsheet-id",
  GOOGLE_DRIVE_ROOT_FOLDER_ID: "drive-root-id",
  GOOGLE_JOBCARD_TEMPLATE_ID: "jobcard-template-id",
  GOOGLE_SERVICE_REPORT_TEMPLATE_ID: "service-report-template-id",
  GOOGLE_CHAT_WEBHOOK_URL: "https://chat.googleapis.com/v1/spaces/example/messages?key=x&token=y",
  GMAIL_SENDER_ADDRESS: "connor@kharon.co.za"
};

describe("workbook store factory", () => {
  it("keeps the local store as the local-mode default", () => {
    const store = createWorkbookStore(createRuntimeConfig({ KHARON_MODE: "local" }));
    expect(store).toBeInstanceOf(LocalWorkbookStore);
  });

  it("keeps the Sheets store as the production default", () => {
    const store = createWorkbookStore(createRuntimeConfig(productionBaseEnv));
    expect(store).toBeInstanceOf(SheetsWorkbookStore);
  });

  it("builds the Postgres scaffold only when explicitly selected", () => {
    const store = createWorkbookStore(
      createRuntimeConfig({
        KHARON_MODE: "local",
        STORE_BACKEND: "postgres",
        POSTGRES_URL: "postgres://example"
      })
    );

    expect(store).toBeInstanceOf(PostgresWorkbookStore);
  });

  it("builds the dual-write scaffold only when explicitly selected", () => {
    const store = createWorkbookStore(
      createRuntimeConfig({
        ...productionBaseEnv,
        STORE_BACKEND: "dual",
        POSTGRES_URL: "postgres://example"
      })
    );

    expect(store).toBeInstanceOf(DualWorkbookStore);
  });
});
