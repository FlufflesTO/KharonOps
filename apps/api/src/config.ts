import { createWorkspaceRails } from "@kharon/google";
import type { WorkspaceRails } from "@kharon/google";

export interface RuntimeConfig {
  mode: "local" | "production";
  sessionKeys: string[];
  sessionCookieName: string;
  sessionTtlSeconds: number;
  googleClientId: string;
  cloudflareAccess: {
    enabled: boolean;
    audience: string;
    jwksUrl: string;
    issuer: string;
    jwksJson: string;
  };
  rails: WorkspaceRails;
}

function splitKeys(raw: string): string[] {
  return raw
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part.length >= 16);
}

function envFirst(env: Record<string, string | undefined>, keys: string[]): string {
  for (const key of keys) {
    const value = String(env[key] ?? "").trim();
    if (value !== "") {
      return value;
    }
  }
  return "";
}

export function createRuntimeConfig(env: Record<string, string | undefined>): RuntimeConfig {
  const modeValue = envFirst(env, ["KHARON_MODE", "NODE_ENV"]);
  const mode = modeValue === "production" ? "production" : "local";

  const sessionKeysRaw = envFirst(env, ["SESSION_KEYS", "PORTAL_SESSION_SECRET"]);
  const sessionKeys = splitKeys(sessionKeysRaw);

  const effectiveKeys = sessionKeys.length > 0 ? sessionKeys : ["local-dev-session-key-change-me-1234567890"];
  const accessAudience = envFirst(env, ["CF_ACCESS_AUD", "CLOUDFLARE_ACCESS_AUD"]);
  const accessJwksUrl = envFirst(env, ["CF_ACCESS_JWKS_URL", "CLOUDFLARE_ACCESS_JWKS_URL"]);
  const accessIssuer = envFirst(env, ["CF_ACCESS_ISSUER", "CLOUDFLARE_ACCESS_ISSUER"]);
  const accessJwksJson = envFirst(env, ["CF_ACCESS_JWKS_JSON", "CLOUDFLARE_ACCESS_JWKS_JSON"]);
  const accessEnabledRaw = envFirst(env, ["CF_ACCESS_ENABLED", "CLOUDFLARE_ACCESS_ENABLED"]);
  const accessEnabled = accessEnabledRaw === "true" || (accessAudience !== "" && (accessJwksUrl !== "" || accessJwksJson !== ""));

  return {
    mode,
    sessionKeys: effectiveKeys,
    sessionCookieName: envFirst(env, ["SESSION_COOKIE_NAME"]) || "kharon_session",
    sessionTtlSeconds: Number(envFirst(env, ["SESSION_TTL_SECONDS"]) || 28_800),
    googleClientId: envFirst(env, ["GOOGLE_CLIENT_ID", "GOOGLE_OAUTH_CLIENT_ID", "KHARON_GOOGLE_CLIENT_ID"]),
    cloudflareAccess: {
      enabled: accessEnabled,
      audience: accessAudience,
      jwksUrl: accessJwksUrl,
      issuer: accessIssuer,
      jwksJson: accessJwksJson
    },
    rails: createWorkspaceRails(env)
  };
}
