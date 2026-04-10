import { describe, expect, it } from "vitest";
import { createRuntimeConfig } from "../../apps/api/src/config";

const productionBaseEnv = {
  KHARON_MODE: "production",
  SESSION_KEYS: "prod-session-key-11111111111111111111111111111111,prod-session-key-22222222222222222222222222222222",
  GOOGLE_CLIENT_ID: "client-id.apps.googleusercontent.com",
  GOOGLE_SERVICE_ACCOUNT_EMAIL: "service-account@example.iam.gserviceaccount.com",
  GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY: "-----BEGIN PRIVATE KEY-----\nabc\n-----END PRIVATE KEY-----\n",
  WORKBOOK_SPREADSHEET_ID: "spreadsheet-id",
  GOOGLE_DRIVE_ROOT_FOLDER_ID: "drive-root-id",
  GOOGLE_DOCCARD_TEMPLATE_ID: "jobcard-template-id",
  GOOGLE_SERVICE_REPORT_TEMPLATE_ID: "service-report-template-id",
  GOOGLE_CHAT_WEBHOOK_URL: "https://chat.googleapis.com/v1/spaces/example/messages?key=x&token=y",
  GMAIL_SENDER_ADDRESS: "ops@kharonfs.co.za"
};

describe("runtime config", () => {
  it("uses local fallback config in local mode", () => {
    const config = createRuntimeConfig({ KHARON_MODE: "local" });
    expect(config.mode).toBe("local");
    expect(config.rails.mode).toBe("local");
    expect(config.storeBackend).toBe("local");
    expect(config.sessionKeys[0]).toContain("local-dev-session-key");
  });

  it("requires strong production session keys", () => {
    expect(() =>
      createRuntimeConfig({
        ...productionBaseEnv,
        SESSION_KEYS: "too-short-key"
      })
    ).toThrow(/SESSION_KEYS/);
  });

  it("requires complete production Google rails config", () => {
    const { WORKBOOK_SPREADSHEET_ID: _removed, ...env } = productionBaseEnv;

    expect(() => createRuntimeConfig(env)).toThrow(/WORKBOOK_SPREADSHEET_ID/);
  });

  it("requires Cloudflare Access audience when access is enabled", () => {
    expect(() =>
      createRuntimeConfig({
        ...productionBaseEnv,
        CF_ACCESS_ENABLED: "true"
      })
    ).toThrow(/CF_ACCESS_AUD/);
  });

  it("requires a Postgres connection string when postgres is selected", () => {
    expect(() =>
      createRuntimeConfig({
        KHARON_MODE: "local",
        STORE_BACKEND: "postgres"
      })
    ).toThrow(/POSTGRES_URL|DATABASE_URL|POSTGRES_DIRECT_URL/);
  });

  it("builds a production config when required settings are present", () => {
    const config = createRuntimeConfig({
      ...productionBaseEnv,
      CF_ACCESS_ENABLED: "true",
      CF_ACCESS_AUD: "audience",
      CF_ACCESS_JWKS_JSON: "{\"keys\":[]}"
    });

    expect(config.mode).toBe("production");
    expect(config.rails.mode).toBe("production");
    expect(config.storeBackend).toBe("sheets");
    expect(config.cloudflareAccess.enabled).toBe(true);
  });
});
