/**
 * Project KharonOps - Rate Limiting Middleware
 * Purpose: Prevent brute-force or accidental DoS on mutation endpoints.
 * Dependencies: hono
 * Structural Role: Middleware layer for traffic governance.
 */

import { createMiddleware } from "hono/factory";
import type { AppBindings } from "../context.js";

const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export function rateLimitMiddleware(options: { windowMs: number; max: number }) {
  return createMiddleware<AppBindings>(async (c, next) => {
    const ip = c.req.header("cf-connecting-ip") || "unknown";
    const now = Date.now();
    const key = `${ip}:${c.req.path}`;

    const record = rateLimitStore.get(key);

    if (!record || now > record.resetTime) {
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + options.windowMs,
      });
      return next();
    }

    if (record.count >= options.max) {
      return c.json(
        { error: "Too many requests", message: "Rate limit exceeded. Please try again later." },
        429
      );
    }

    record.count++;
    return next();
  });
}
