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

export function buildGoogleRuntimeConfig(env: Record<string, string | undefined>): GoogleRuntimeConfig {
  const mode = envValue(env, "KHARON_MODE") === "production" ? "production" : "local";
  return {
    mode,
    googleClientId: envValue(env, "GOOGLE_CLIENT_ID"),
    serviceAccountEmail: envValue(env, "GOOGLE_SERVICE_ACCOUNT_EMAIL"),
    serviceAccountPrivateKey: envValue(env, "GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY"),
    workbookSpreadsheetId: envValue(env, "WORKBOOK_SPREADSHEET_ID"),
    driveRootFolderId: envValue(env, "GOOGLE_DRIVE_ROOT_FOLDER_ID"),
    jobcardTemplateId: envValue(env, "GOOGLE_DOCCARD_TEMPLATE_ID"),
    serviceReportTemplateId: envValue(env, "GOOGLE_SERVICE_REPORT_TEMPLATE_ID"),
    calendarId: envValue(env, "GOOGLE_CALENDAR_ID") || "primary",
    gmailSenderAddress: envValue(env, "GMAIL_SENDER_ADDRESS"),
    chatWebhookUrl: envValue(env, "GOOGLE_CHAT_WEBHOOK_URL")
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
