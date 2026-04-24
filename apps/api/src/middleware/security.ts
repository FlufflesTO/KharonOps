/**
 * Project KharonOps - Security Middleware
 * Purpose: Enforce security headers and CSP policies for the API.
 * Dependencies: hono
 * Structural Role: Middleware layer for infrastructure hardening.
 */

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
    try {
      await next();
    } finally {
      c.header("Cache-Control", "no-store, private");
      c.header("Pragma", "no-cache");
      c.header("X-Content-Type-Options", "nosniff");
      c.header("X-Frame-Options", "DENY");
      c.header("Referrer-Policy", "strict-origin-when-cross-origin");
      c.header("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
      
      const csp = [
        "default-src 'self'",
        "script-src 'self' https://accounts.google.com/gsi/client https://static.cloudflareinsights.com",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://accounts.google.com/gsi/style",
        "font-src 'self' https://fonts.gstatic.com",
        "img-src 'self' data: https://*.googleusercontent.com https://accounts.google.com",
        "connect-src 'self' https://accounts.google.com https://cloudflareinsights.com",
        "frame-src https://accounts.google.com",
        "object-src 'none'",
        "base-uri 'self'"
      ].join("; ");
      c.header("Content-Security-Policy", csp);

      c.header("Vary", mergeVary(c.res.headers.get("Vary"), "Cookie, Cf-Access-Jwt-Assertion"));
    }
  });
}
