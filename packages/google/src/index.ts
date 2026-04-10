import { createLocalWorkspaceRails } from "./local.js";
import { createProductionWorkspaceRails } from "./production.js";
import { GoogleAdapterError } from "./errors.js";
import type { GoogleRuntimeConfig, WorkspaceRails } from "./types.js";

export * from "./types.js";
export * from "./retry.js";
export * from "./errors.js";

function envValue(env: Record<string, string | undefined>, key: string): string {
  return String(env[key] ?? "").trim();
}

function envFirst(env: Record<string, string | undefined>, keys: string[]): string {
  for (const key of keys) {
    const value = envValue(env, key);
    if (value !== "") {
      return value;
    }
  }
  return "";
}

function parseServiceAccountJson(raw: string): { email: string; privateKey: string } {
  if (!raw) {
    return { email: "", privateKey: "" };
  }

  try {
    const parsed = JSON.parse(raw) as { client_email?: string; private_key?: string };
    return {
      email: String(parsed.client_email ?? ""),
      privateKey: String(parsed.private_key ?? "")
    };
  } catch {
    return { email: "", privateKey: "" };
  }
}

export function listMissingGoogleProductionConfig(env: Record<string, string | undefined>): string[] {
  const config = buildGoogleRuntimeConfig(env);
  const required: Array<[string, string]> = [
    ["GOOGLE_CLIENT_ID", config.googleClientId],
    ["GOOGLE_SERVICE_ACCOUNT_EMAIL", config.serviceAccountEmail],
    ["GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY", config.serviceAccountPrivateKey],
    ["WORKBOOK_SPREADSHEET_ID", config.workbookSpreadsheetId],
    ["GOOGLE_DRIVE_ROOT_FOLDER_ID", config.driveRootFolderId],
    ["GOOGLE_DOCCARD_TEMPLATE_ID", config.jobcardTemplateId],
    ["GOOGLE_SERVICE_REPORT_TEMPLATE_ID", config.serviceReportTemplateId],
    ["GMAIL_SENDER_ADDRESS", config.gmailSenderAddress],
    ["GOOGLE_CHAT_WEBHOOK_URL", config.chatWebhookUrl]
  ];

  return required.filter(([, value]) => value === "").map(([name]) => name);
}

export function buildGoogleRuntimeConfig(env: Record<string, string | undefined>): GoogleRuntimeConfig {
  const modeValue = envFirst(env, ["KHARON_MODE", "NODE_ENV"]);
  const mode = modeValue === "production" ? "production" : "local";
  const serviceAccount = parseServiceAccountJson(envValue(env, "GOOGLE_SERVICE_ACCOUNT_JSON"));

  return {
    mode,
    googleClientId: envFirst(env, ["GOOGLE_CLIENT_ID", "GOOGLE_OAUTH_CLIENT_ID", "KHARON_GOOGLE_CLIENT_ID"]),
    serviceAccountEmail:
      envFirst(env, ["GOOGLE_SERVICE_ACCOUNT_EMAIL"]) || serviceAccount.email,
    serviceAccountPrivateKey:
      envFirst(env, ["GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY"]) || serviceAccount.privateKey,
    workbookSpreadsheetId: envFirst(env, ["WORKBOOK_SPREADSHEET_ID", "KHARON_JOBS_SPREADSHEET_ID"]),
    driveRootFolderId: envFirst(env, ["GOOGLE_DRIVE_ROOT_FOLDER_ID", "KHARON_DRIVE_ROOT_FOLDER_ID"]),
    jobcardTemplateId: envFirst(env, ["GOOGLE_DOCCARD_TEMPLATE_ID", "KHARON_DOC_TEMPLATE_JOBCARD_ID"]),
    serviceReportTemplateId: envFirst(env, ["GOOGLE_SERVICE_REPORT_TEMPLATE_ID", "KHARON_DOC_TEMPLATE_SERVICE_REPORT_ID"]),
    calendarId: envFirst(env, ["GOOGLE_CALENDAR_ID", "KHARON_CALENDAR_ID"]) || "primary",
    gmailSenderAddress: envFirst(env, ["GMAIL_SENDER_ADDRESS", "KHARON_GMAIL_FROM", "SUPPORT_EMAIL"]),
    chatWebhookUrl: envFirst(env, ["GOOGLE_CHAT_WEBHOOK_URL", "KHARON_CHAT_WEBHOOK_URL"])
  };
}

function canUseProduction(config: GoogleRuntimeConfig): boolean {
  if (config.mode !== "production") {
    return false;
  }

  return [
    config.googleClientId,
    config.serviceAccountEmail,
    config.serviceAccountPrivateKey,
    config.workbookSpreadsheetId,
    config.driveRootFolderId,
    config.jobcardTemplateId,
    config.serviceReportTemplateId,
    config.gmailSenderAddress,
    config.chatWebhookUrl
  ].every((value) => value !== "");
}

export function createWorkspaceRails(env: Record<string, string | undefined>): WorkspaceRails {
  const config = buildGoogleRuntimeConfig(env);
  if (canUseProduction(config)) {
    return createProductionWorkspaceRails(config);
  }
  return createLocalWorkspaceRails();
}

export async function verifyGoogleIdToken(args: {
  idToken: string;
  expectedAudience: string;
}): Promise<{ sub: string; email: string; name: string; picture: string }> {
  const response = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(args.idToken)}`
  );

  const body = (await response.json()) as Record<string, string>;
  if (!response.ok) {
    throw new GoogleAdapterError({
      message: "Google token verification failed",
      code: "google_auth_error",
      service: "oidc",
      status: response.status,
      transient: false,
      details: { response: body }
    });
  }

  const aud = body.aud ?? "";
  const iss = body.iss ?? "";
  const exp = Number(body.exp ?? "0");
  const now = Math.floor(Date.now() / 1_000);

  if (aud !== args.expectedAudience) {
    throw new GoogleAdapterError({
      message: "Google ID token audience mismatch",
      code: "google_auth_error",
      service: "oidc",
      status: 401,
      transient: false,
      details: { aud }
    });
  }

  if (!iss.includes("accounts.google.com")) {
    throw new GoogleAdapterError({
      message: "Google ID token issuer mismatch",
      code: "google_auth_error",
      service: "oidc",
      status: 401,
      transient: false,
      details: { iss }
    });
  }

  if (exp <= now) {
    throw new GoogleAdapterError({
      message: "Google ID token expired",
      code: "google_auth_error",
      service: "oidc",
      status: 401,
      transient: false,
      details: { exp }
    });
  }

  return {
    sub: body.sub ?? "",
    email: body.email ?? "",
    name: body.name ?? body.email ?? "",
    picture: body.picture ?? ""
  };
}
