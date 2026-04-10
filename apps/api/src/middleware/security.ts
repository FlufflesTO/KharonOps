import { createMiddleware } from "hono/factory";
import type { AppBindings } from "../context.js";

function mergeVary(existing: string | null, incoming: string): string {
  const current = new Set(
    String(existing ?? "")
      .split(",")
      .map((part) => part.trim())
      .filter((part) => part !== "")
  );

  for (const value of incoming.split(",")) {
    const trimmed = value.trim();
    if (trimmed !== "") {
      current.add(trimmed);
    }
  }

  return Array.from(current).join(", ");
}

export function apiSecurityHeadersMiddleware() {
  return createMiddleware<AppBindings>(async (c, next) => {
    await next();

    c.header("Cache-Control", "no-store, private");
    c.header("Pragma", "no-cache");
    c.header("X-Content-Type-Options", "nosniff");
    c.header("X-Frame-Options", "DENY");
    c.header("Referrer-Policy", "strict-origin-when-cross-origin");
    c.header("Vary", mergeVary(c.res.headers.get("Vary"), "Cookie, Cf-Access-Jwt-Assertion"));
  });
}
