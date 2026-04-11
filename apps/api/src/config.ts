import { createWorkspaceRails, listMissingGoogleProductionConfig } from "@kharon/google";
import type { WorkspaceRails } from "@kharon/google";

export type StoreBackend = "local" | "sheets" | "postgres" | "dual";
export type PostgresSslMode = "require" | "prefer" | "disable";

export interface PostgresStoreConfig {
  connectionString: string;
  directUrl: string;
  schema: string;
  sslMode: PostgresSslMode;
  applicationName: string;
}

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
  storeBackend: StoreBackend;
  postgres: PostgresStoreConfig;
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

function hasStrongSessionKey(keys: string[]): boolean {
  return keys.some((key) => key.length >= 32);
}

function parseStoreBackend(env: Record<string, string | undefined>, mode: RuntimeConfig["mode"]): StoreBackend {
  const raw = envFirst(env, ["STORE_BACKEND"]).toLowerCase();
  if (raw === "") {
    return mode === "production" ? "sheets" : "local";
  }

  if (raw === "local" || raw === "sheets" || raw === "postgres" || raw === "dual") {
    return raw;
  }

  throw new Error("STORE_BACKEND must be one of: local, sheets, postgres, dual.");
}

function parsePostgresSslMode(env: Record<string, string | undefined>): PostgresSslMode {
  const raw = envFirst(env, ["POSTGRES_SSL_MODE"]).toLowerCase();
  if (raw === "disable" || raw === "prefer" || raw === "require") {
    return raw;
  }
  return "require";
}

function validateStoreConfig(storeBackend: StoreBackend, postgres: PostgresStoreConfig): void {
  if ((storeBackend === "postgres" || storeBackend === "dual") && postgres.connectionString === "" && postgres.directUrl === "") {
    throw new Error(`STORE_BACKEND=${storeBackend} requires POSTGRES_URL, DATABASE_URL, or POSTGRES_DIRECT_URL.`);
  }
}

function validateProductionConfig(args: {
  env: Record<string, string | undefined>;
  sessionKeys: string[];
  googleClientId: string;
  rails: WorkspaceRails;
  allowLocalRailsInProduction: boolean;
  cloudflareAccess: RuntimeConfig["cloudflareAccess"];
}): void {
  if (!hasStrongSessionKey(args.sessionKeys)) {
    throw new Error("Production configuration requires SESSION_KEYS (or PORTAL_SESSION_SECRET) with at least one 32+ character value.");
  }

  if (args.googleClientId === "") {
    throw new Error("Production configuration requires GOOGLE_CLIENT_ID.");
  }

  if (args.rails.mode !== "production" && !args.allowLocalRailsInProduction) {
    const missing = listMissingGoogleProductionConfig(args.env);
    const detail = missing.length > 0 ? missing.join(", ") : "unknown production Google rails requirements";
    throw new Error(`Production configuration is incomplete. Missing Google rails configuration: ${detail}.`);
  }

  if (args.cloudflareAccess.enabled) {
    if (args.cloudflareAccess.audience === "") {
      throw new Error("Cloudflare Access is enabled but CF_ACCESS_AUD is missing.");
    }
    if (args.cloudflareAccess.jwksUrl === "" && args.cloudflareAccess.jwksJson === "") {
      throw new Error("Cloudflare Access is enabled but neither CF_ACCESS_JWKS_URL nor CF_ACCESS_JWKS_JSON is configured.");
    }
  }
}

export function createRuntimeConfig(env: Record<string, string | undefined>): RuntimeConfig {
  const modeValue = envFirst(env, ["KHARON_MODE", "NODE_ENV"]);
  const mode = modeValue === "production" ? "production" : "local";

  const sessionKeysRaw = envFirst(env, ["SESSION_KEYS", "PORTAL_SESSION_SECRET"]);
  const sessionKeys = splitKeys(sessionKeysRaw);

  const effectiveKeys =
    mode === "production"
      ? sessionKeys
      : sessionKeys.length > 0
        ? sessionKeys
        : ["local-dev-session-key-change-me-1234567890"];
  const accessAudience = envFirst(env, ["CF_ACCESS_AUD", "CLOUDFLARE_ACCESS_AUD"]);
  const accessJwksUrl = envFirst(env, ["CF_ACCESS_JWKS_URL", "CLOUDFLARE_ACCESS_JWKS_URL"]);
  const accessIssuer = envFirst(env, ["CF_ACCESS_ISSUER", "CLOUDFLARE_ACCESS_ISSUER"]);
  const accessJwksJson = envFirst(env, ["CF_ACCESS_JWKS_JSON", "CLOUDFLARE_ACCESS_JWKS_JSON"]);
  const accessEnabledRaw = envFirst(env, ["CF_ACCESS_ENABLED", "CLOUDFLARE_ACCESS_ENABLED"]);
  const accessEnabled = accessEnabledRaw === "true" || (accessAudience !== "" && (accessJwksUrl !== "" || accessJwksJson !== ""));
  const googleClientId = envFirst(env, ["GOOGLE_CLIENT_ID", "GOOGLE_OAUTH_CLIENT_ID", "KHARON_GOOGLE_CLIENT_ID"]);
  const rails = createWorkspaceRails(env);
  const railsModeOverride = envFirst(env, ["GOOGLE_RAILS_MODE", "KHARON_RAILS_MODE"]).toLowerCase();
  const allowLocalRailsInProduction = railsModeOverride === "local";
  const storeBackend = parseStoreBackend(env, mode);
  const postgres: PostgresStoreConfig = {
    connectionString: envFirst(env, ["POSTGRES_URL", "DATABASE_URL"]),
    directUrl: envFirst(env, ["POSTGRES_DIRECT_URL"]),
    schema: envFirst(env, ["POSTGRES_SCHEMA"]) || "public",
    sslMode: parsePostgresSslMode(env),
    applicationName: envFirst(env, ["POSTGRES_APPLICATION_NAME"]) || "kharon-api"
  };

  const config: RuntimeConfig = {
    mode,
    sessionKeys: effectiveKeys,
    sessionCookieName: envFirst(env, ["SESSION_COOKIE_NAME"]) || "kharon_session",
    sessionTtlSeconds: Number(envFirst(env, ["SESSION_TTL_SECONDS"]) || 28_800),
    googleClientId,
    cloudflareAccess: {
      enabled: accessEnabled,
      audience: accessAudience,
      jwksUrl: accessJwksUrl,
      issuer: accessIssuer,
      jwksJson: accessJwksJson
    },
    rails,
    storeBackend,
    postgres
  };

  validateStoreConfig(storeBackend, postgres);

  if (mode === "production") {
    validateProductionConfig({
      env,
      sessionKeys: effectiveKeys,
      googleClientId,
      rails,
      allowLocalRailsInProduction,
      cloudflareAccess: config.cloudflareAccess
    });
  }

  return config;
}
