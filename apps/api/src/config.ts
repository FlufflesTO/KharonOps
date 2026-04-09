import { createWorkspaceRails } from "@kharon/google";
import type { WorkspaceRails } from "@kharon/google";

export interface RuntimeConfig {
  mode: "local" | "production";
  sessionKeys: string[];
  sessionCookieName: string;
  sessionTtlSeconds: number;
  googleClientId: string;
  rails: WorkspaceRails;
}

function splitKeys(raw: string): string[] {
  return raw
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part.length >= 16);
}

export function createRuntimeConfig(env: Record<string, string | undefined>): RuntimeConfig {
  const mode = env.KHARON_MODE === "production" ? "production" : "local";
  const sessionKeys = splitKeys(String(env.SESSION_KEYS ?? ""));

  const effectiveKeys = sessionKeys.length > 0 ? sessionKeys : ["local-dev-session-key-change-me-1234567890"];

  return {
    mode,
    sessionKeys: effectiveKeys,
    sessionCookieName: String(env.SESSION_COOKIE_NAME ?? "kharon_session"),
    sessionTtlSeconds: Number(env.SESSION_TTL_SECONDS ?? 28_800),
    googleClientId: String(env.GOOGLE_CLIENT_ID ?? ""),
    rails: createWorkspaceRails(env)
  };
}
