/**
 * KharonOps — Utility Services
 * Purpose: General-purpose helper functions for formatting, logging, and env parsing.
 * Dependencies: None
 * Structural Role: Pure utility functions consumed by API and Services.
 */

export function nowIso(): string {
  return new Date().toISOString();
}

export function logApiEvent(level: "info" | "warn" | "error", event: string, details: Record<string, unknown>): void {
  const payload = {
    timestamp: new Date().toISOString(),
    level,
    event,
    ...details
  };
  const line = JSON.stringify(payload);
  if (level === "error") {
    console.error(line);
  } else if (level === "warn") {
    console.warn(line);
  } else {
    console.log(line);
  }
}

export function enquiryTypeLabel(type: "project" | "maintenance" | "urgent_callout" | "compliance" | "resource" | "general"): string {
  switch (type) {
    case "project":
      return "New Project";
    case "maintenance":
      return "Maintenance Contract";
    case "urgent_callout":
      return "Urgent Callout";
    case "compliance":
      return "Compliance Request";
    case "resource":
      return "Resource Request";
    default:
      return "General Enquiry";
  }
}

export function parseEnvBindings(bindings: Record<string, unknown>): Record<string, string | undefined> {
  const env: Record<string, string | undefined> = {};
  for (const [key, value] of Object.entries(bindings)) {
    env[key] = typeof value === "string" ? value : undefined;
  }
  return env;
}

export function envCacheKey(env: Record<string, string | undefined>): string {
  const entries = Object.entries(env)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([key, value]) => [key, value ?? ""]);
  return JSON.stringify(entries);
}

export function parseGoogleTokenAudienceFromJwt(idToken: string): string | null {
  const parts = idToken.split(".");
  if (parts.length !== 3) {
    return null;
  }

  try {
    const payloadRaw = Buffer.from(parts[1] ?? "", "base64url").toString("utf8");
    const payload = JSON.parse(payloadRaw) as { aud?: unknown };
    return typeof payload.aud === "string" ? payload.aud : null;
  } catch {
    return null;
  }
}
