import { createLocalWorkspaceRails } from "./local.js";
import { createProductionWorkspaceRails } from "./production.js";
import { GoogleAdapterError } from "./errors.js";
import type { GoogleRuntimeConfig, WorkspaceRails } from "./types.js";

export * from "./types.js";
export * from "./retry.js";
export * from "./errors.js";

function envValue(env: Record<string, string | undefined>, key: string): string {
  const value = String(env[key] ?? "").trim();
  // Handle escaped newlines (\n) for standalone private-key env vars.
  if (value.includes("\\n") && key.includes("PRIVATE_KEY")) {
    return value.replace(/\\n/g, "\n");
  }
  return value;
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
    const privateKeyRaw = String(parsed.private_key ?? "");
    return {
      email: String(parsed.client_email ?? ""),
      privateKey: privateKeyRaw.includes("\\n")
        ? privateKeyRaw.replace(/\\n/g, "\n")
        : privateKeyRaw
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
    ["GOOGLE_JOBCARD_TEMPLATE_ID", config.jobcardTemplateId],
    ["GOOGLE_FIRE_SERVICE_REPORT_TEMPLATE_ID", config.serviceReportTemplateId],
    ["GOOGLE_GAS_SERVICE_REPORT_TEMPLATE_ID", config.gasServiceReportTemplateId],
    ["GOOGLE_FIRE_CERTIFICATE_TEMPLATE_ID", config.fireCertificateTemplateId],
    ["GOOGLE_GAS_CERTIFICATE_TEMPLATE_ID", config.gasCertificateTemplateId],
    ["GMAIL_SENDER_ADDRESS", config.gmailSenderAddress],
    ["GOOGLE_CHAT_WEBHOOK_URL", config.chatWebhookUrl]
  ];

  return required.filter(([, value]) => value === "").map(([name]) => name);
}

export function buildGoogleRuntimeConfig(env: Record<string, string | undefined>): GoogleRuntimeConfig {
  const modeValue = envFirst(env, ["KHARON_MODE", "NODE_ENV"]);
  const mode = modeValue === "production" ? "production" : "local";
  const serviceAccount = parseServiceAccountJson(envValue(env, "GOOGLE_SERVICE_ACCOUNT_JSON"));
  const delegatedServiceAccount = parseServiceAccountJson(envValue(env, "GOOGLE_DELEGATED_SERVICE_ACCOUNT_JSON"));

  return {
    mode,
    googleClientId: envFirst(env, ["GOOGLE_CLIENT_ID", "GOOGLE_OAUTH_CLIENT_ID", "KHARON_GOOGLE_CLIENT_ID"]),
    serviceAccountEmail:
      envFirst(env, ["GOOGLE_SERVICE_ACCOUNT_EMAIL"]) || serviceAccount.email,
    serviceAccountPrivateKey:
      envFirst(env, ["GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY"]) || serviceAccount.privateKey,
    delegatedServiceAccountEmail:
      envFirst(env, ["GOOGLE_DELEGATED_SERVICE_ACCOUNT_EMAIL"]) || delegatedServiceAccount.email,
    delegatedServiceAccountPrivateKey:
      envFirst(env, ["GOOGLE_DELEGATED_SERVICE_ACCOUNT_PRIVATE_KEY"]) || delegatedServiceAccount.privateKey,
    impersonatedUser: envFirst(env, ["GOOGLE_IMPERSONATED_USER", "GOOGLE_IMPERSONATED_USER_EMAIL"]),
    workbookSpreadsheetId: envFirst(env, ["WORKBOOK_SPREADSHEET_ID", "KHARON_JOBS_SPREADSHEET_ID"]),
    driveRootFolderId: envFirst(env, ["GOOGLE_DRIVE_ROOT_FOLDER_ID", "KHARON_DRIVE_ROOT_FOLDER_ID"]),
    jobcardTemplateId: envFirst(env, ["GOOGLE_JOBCARD_TEMPLATE_ID", "GOOGLE_DOCCARD_TEMPLATE_ID", "KHARON_DOC_TEMPLATE_JOBCARD_ID"]),
    serviceReportTemplateId: envFirst(env, ["GOOGLE_FIRE_SERVICE_REPORT_TEMPLATE_ID", "GOOGLE_SERVICE_REPORT_TEMPLATE_ID", "KHARON_DOC_TEMPLATE_FIRE_REPORT_ID"]),
    gasServiceReportTemplateId: envFirst(env, ["GOOGLE_GAS_SERVICE_REPORT_TEMPLATE_ID", "KHARON_DOC_TEMPLATE_GAS_REPORT_ID"]),
    fireCertificateTemplateId: envFirst(env, ["GOOGLE_FIRE_CERTIFICATE_TEMPLATE_ID", "GOOGLE_CERTIFICATE_ID", "KHARON_DOC_TEMPLATE_FIRE_COC_ID"]),
    gasCertificateTemplateId: envFirst(env, ["GOOGLE_GAS_CERTIFICATE_TEMPLATE_ID", "KHARON_DOC_TEMPLATE_GAS_COC_ID"]),
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

function parseRailsModeOverride(env: Record<string, string | undefined>): "local" | "production" | null {
  const raw = envFirst(env, ["GOOGLE_RAILS_MODE", "KHARON_RAILS_MODE"]).toLowerCase();
  if (raw === "local" || raw === "production") {
    return raw;
  }
  return null;
}

export function createWorkspaceRails(env: Record<string, string | undefined>): WorkspaceRails {
  const config = buildGoogleRuntimeConfig(env);
  const modeOverride = parseRailsModeOverride(env);

  if (modeOverride === "local") {
    return createLocalWorkspaceRails();
  }

  if (modeOverride === "production") {
    if (canUseProduction(config)) {
      return createProductionWorkspaceRails(config);
    }
    const missing = listMissingGoogleProductionConfig(env);
    const detail = missing.length > 0 ? missing.join(", ") : "unknown";
    throw new Error(
      `GOOGLE_RAILS_MODE=production but production Google rails configuration is incomplete. Missing: ${detail}.`
    );
  }

  if (canUseProduction(config)) {
    return createProductionWorkspaceRails(config);
  }
  return createLocalWorkspaceRails();
}

// ---------------------------------------------------------------------------
// Google OIDC — Local JWKS RS256 Verification
//
// Replaces the deprecated `tokeninfo` API endpoint. Tokens are now verified
// locally using Google's public JWKS keys, eliminating the server-side
// round-trip latency (~200-500ms) and removing the dependency on an external
// API that was the root cause of intermittent 400 authentication errors.
//
// Architecture decision: mirrors the same JWKS pattern used in auth/access.ts
// for Cloudflare Access JWT verification.
// ---------------------------------------------------------------------------

/** Google's public OIDC signing keys endpoint. */
const GOOGLE_OIDC_JWKS_URL = "https://www.googleapis.com/oauth2/v3/certs";

/**
 * Exact allowlist of trusted Google OIDC issuers (A-004 fix).
 * Using `.includes()` substring matching is bypassable — e.g.,
 * `evil-accounts.google.com.attacker.com` would pass a substring check.
 */
const ALLOWED_OIDC_ISSUERS = new Set<string>([
  "https://accounts.google.com",
  "accounts.google.com"
]);

interface OidcPublicJwk extends JsonWebKey {
  kid?: string;
  alg?: string;
  use?: string;
}

interface OidcJwtHeader {
  alg?: string;
  kid?: string;
  typ?: string;
}

interface OidcJwtClaims {
  sub: string;
  email: string;
  name?: string;
  picture?: string;
  aud: string | string[];
  iss: string;
  exp: number;
  nbf?: number;
  iat?: number;
}

interface OidcJwksCache {
  keys: OidcPublicJwk[];
  expiresAtMs: number;
}

let oidcJwksCache: OidcJwksCache | null = null;

function parseOidcMaxAgeMs(cacheControl: string): number {
  const match = cacheControl.match(/max-age=(\d+)/i);
  if (!match?.[1]) {
    return 300_000; // 5-minute default
  }
  const parsed = Number(match[1]);
  return Number.isFinite(parsed) && parsed > 0 ? parsed * 1_000 : 300_000;
}

function base64UrlDecodeToBytesOidc(input: string): Uint8Array {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function decodeOidcJwtPart<T>(part: string): T {
  const decoded = new TextDecoder().decode(base64UrlDecodeToBytesOidc(part));
  return JSON.parse(decoded) as T;
}

async function loadOidcJwks(): Promise<OidcPublicJwk[]> {
  if (oidcJwksCache !== null && Date.now() < oidcJwksCache.expiresAtMs) {
    return oidcJwksCache.keys;
  }

  const response = await fetch(GOOGLE_OIDC_JWKS_URL, {
    headers: { accept: "application/json" }
  });

  if (!response.ok) {
    throw new GoogleAdapterError({
      message: `Failed to fetch Google OIDC JWKS: ${response.status} ${response.statusText}`,
      code: "google_transient_error",
      service: "oidc",
      status: 502,
      transient: true
    });
  }

  const body = (await response.json()) as { keys?: OidcPublicJwk[] };
  // Filter to RSA signing keys only (exclude encryption keys via use !== "enc")
  const keys = (body.keys ?? []).filter(
    (k) => k.kty === "RSA" && (k.use === undefined || k.use === "sig")
  );

  if (keys.length === 0) {
    throw new GoogleAdapterError({
      message: "Google OIDC JWKS returned no usable RSA signing keys",
      code: "google_transient_error",
      service: "oidc",
      status: 502,
      transient: true
    });
  }

  const cacheControl = response.headers.get("cache-control") ?? "";
  oidcJwksCache = { keys, expiresAtMs: Date.now() + parseOidcMaxAgeMs(cacheControl) };
  return keys;
}

/**
 * Verifies a Google ID Token locally using JWKS RS256 signature validation.
 *
 * This replaces the deprecated `tokeninfo` API endpoint. The token is decoded,
 * its signing key is fetched from Google's public JWKS endpoint (with caching),
 * and the RS256 signature is verified locally via the Web Crypto API.
 * All claims (`aud`, `iss`, `exp`, `nbf`) are then validated without any
 * additional network round-trips.
 */
export async function verifyGoogleIdToken(args: {
  idToken: string;
  expectedAudience: string;
}): Promise<{ sub: string; email: string; name: string; picture: string }> {
  const parts = args.idToken.split(".");
  if (parts.length !== 3) {
    throw new GoogleAdapterError({
      message: "Google ID token format is invalid — expected a 3-part JWT",
      code: "google_auth_error",
      service: "oidc",
      status: 400,
      transient: false
    });
  }

  const [encodedHeader, encodedPayload, encodedSignature] = parts as [string, string, string];

  let header: OidcJwtHeader;
  let claims: OidcJwtClaims;
  try {
    header = decodeOidcJwtPart<OidcJwtHeader>(encodedHeader);
    claims = decodeOidcJwtPart<OidcJwtClaims>(encodedPayload);
  } catch {
    throw new GoogleAdapterError({
      message: "Google ID token could not be decoded — malformed JWT segments",
      code: "google_auth_error",
      service: "oidc",
      status: 400,
      transient: false
    });
  }

  const signatureBytes = base64UrlDecodeToBytesOidc(encodedSignature);

  // --- Key Selection ---
  // Fetch the JWKS (served from module-level cache where possible).
  const keys = await loadOidcJwks();
  let signingKey: OidcPublicJwk | undefined;
  if (header.kid) {
    signingKey = keys.find((k) => k.kid === header.kid);
    if (!signingKey) {
      // Key ID unknown — likely mid-rotation. Mark transient so retry logic fires.
      throw new GoogleAdapterError({
        message: "Google ID token key id is not in the current JWKS — key rotation may be in progress",
        code: "google_auth_error",
        service: "oidc",
        status: 401,
        transient: true,
        details: { kid: header.kid }
      });
    }
  } else {
    // No kid header — use the first available key (Google always sets kid in practice).
    signingKey = keys[0];
  }

  // --- RS256 Signature Verification (Web Crypto API) ---
  // Cast signingKey to JsonWebKey: both node and workers-types environments share
  // this interface. The "jwk" format literal is cast to `const` to select the
  // correct importKey overload under the unified tsconfig.check.json (node types).
  const publicKey = await crypto.subtle.importKey(
    "jwk" as const,
    signingKey as JsonWebKey,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["verify"]
  );

  // The signature input is the unmodified "header.payload" ASCII string.
  const signingInput = new TextEncoder().encode(`${encodedHeader}.${encodedPayload}`);
  // Web Crypto requires a detached ArrayBuffer — copy to avoid view aliasing issues.
  const signatureCopy = new Uint8Array(signatureBytes.byteLength);
  signatureCopy.set(signatureBytes);

  const isValid = await crypto.subtle.verify(
    { name: "RSASSA-PKCS1-v1_5" },
    publicKey,
    signatureCopy.buffer,
    signingInput
  );

  if (!isValid) {
    throw new GoogleAdapterError({
      message: "Google ID token RS256 signature verification failed",
      code: "google_auth_error",
      service: "oidc",
      status: 401,
      transient: false
    });
  }

  // --- Claims Validation ---

  // Audience: must match our configured Google Client ID exactly.
  const audList = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
  if (!audList.includes(args.expectedAudience)) {
    throw new GoogleAdapterError({
      message: "Google ID token audience does not match the configured Google Client ID",
      code: "google_auth_error",
      service: "oidc",
      status: 401,
      transient: false,
      details: { aud: claims.aud, expectedAudience: args.expectedAudience }
    });
  }

  // Issuer: exact set membership check — substring matching is bypassable.
  if (!ALLOWED_OIDC_ISSUERS.has(claims.iss)) {
    throw new GoogleAdapterError({
      message: "Google ID token issuer is not in the trusted allowlist",
      code: "google_auth_error",
      service: "oidc",
      status: 401,
      transient: false,
      details: { iss: claims.iss, allowedIssuers: [...ALLOWED_OIDC_ISSUERS] }
    });
  }

  // Temporal claims: expiry and not-before.
  const now = Math.floor(Date.now() / 1_000);
  if (typeof claims.exp !== "number" || claims.exp <= now) {
    throw new GoogleAdapterError({
      message: "Google ID token has expired",
      code: "google_auth_error",
      service: "oidc",
      status: 401,
      transient: false,
      details: { exp: claims.exp, now }
    });
  }

  if (typeof claims.nbf === "number" && now < claims.nbf) {
    throw new GoogleAdapterError({
      message: "Google ID token is not yet valid (nbf claim)",
      code: "google_auth_error",
      service: "oidc",
      status: 401,
      transient: false,
      details: { nbf: claims.nbf, now }
    });
  }

  return {
    sub: claims.sub ?? "",
    email: claims.email ?? "",
    name: claims.name ?? claims.email ?? "",
    picture: claims.picture ?? ""
  };
}
