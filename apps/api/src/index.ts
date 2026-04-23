/**
 * KharonOps — Unified API (Production)
 * Purpose: Entry point for Cloudflare Workers API. Handles middleware registration and route modularization.
 * Dependencies: hono, @kharon/domain, ./routes/*
 * Structural Role: Central API Gateway
 */

import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { envelopeError, envelopeSuccess } from "@kharon/domain";

import { createRuntimeConfig } from "./config.js";
import { SheetsWorkbookStore } from "./store/sheetsStore.js";
import { logApiEvent } from "./services/logging.js";
import { contextMiddleware } from "./middleware/context.js";
import { sessionMiddleware, accessMiddleware } from "./middleware/auth.js";

// Routes
import auth from "./routes/auth.js";
import jobs from "./routes/jobs.js";
import schedules from "./routes/schedules.js";
import workspace from "./routes/workspace.js";
import documents from "./routes/documents.js";
import sync from "./routes/sync.js";
import admin from "./routes/admin.js";
import publicRoutes from "./routes/public.js";
import finance from "./routes/finance.js";

import type { AppBindings } from "./context.js";

export function createApp(env?: any) {
  const app = new Hono<AppBindings>();

  // 1. Global Middleware
  app.use("*", logger());
  app.use("*", cors({
    origin: (origin) => {
      if (!origin) return null;
      const allowed = ["tequit.co.za", "kharon.co.za", "localhost"];
      return allowed.some(domain => origin.endsWith(domain)) ? origin : null;
    },
    credentials: true,
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization", "X-Correlation-ID", "Cf-Access-Jwt-Assertion"]
  }));

  // 2. Security Headers
  app.use("*", async (c, next) => {
    c.header("X-Content-Type-Options", "nosniff");
    c.header("X-Frame-Options", "DENY");
    c.header("Referrer-Policy", "strict-origin-when-cross-origin");
    await next();
  });

  // 3. Dependency Injection & Context
  app.use("*", async (c, next) => {
    const correlationId = c.req.header("X-Correlation-ID") || crypto.randomUUID();
    c.set("correlationId", correlationId);

    const config = createRuntimeConfig(c.env || env);
    const store = new SheetsWorkbookStore(config);

    c.set("config", config);
    c.set("store", store);

    await next();
  });

  // 4. Authentication Middleware
  app.use("*", async (c, next) => {
    const config = c.get("config");
    await sessionMiddleware(config)(c, next);
  });
  app.use("*", async (c, next) => {
    const config = c.get("config");
    await accessMiddleware(config)(c, next);
  });

  // 5. Route Registration
  app.route("/api/v1/auth", auth);
  app.route("/api/v1/jobs", jobs);
  app.route("/api/v1/schedules", schedules);
  app.route("/api/v1/workspace", workspace);
  app.route("/api/v1/documents", documents);
  app.route("/api/v1/sync", sync);
  app.route("/api/v1/admin", admin);
  app.route("/api/v1/public", publicRoutes);
  app.route("/api/v1/workspace/upgrade/finance", finance);

  // 6. Root & Health
  app.get("/", (c) => c.text("KharonOps API v1.0.0 (Unified)"));
  app.get("/health", (c) => {
    const correlationId = c.get("correlationId");
    return c.json(envelopeSuccess({
      correlationId,
      data: { status: "ok", timestamp: new Date().toISOString() }
    }));
  });

  // 7. Global Error Handling
  app.onError((err, c) => {
    const correlationId = c.get("correlationId") || "err-ctx-missing";
    logApiEvent("error", "api.global_error", {
      correlationId,
      error: err.message,
      stack: err.stack,
      path: c.req.path
    });

    return c.json(envelopeError({
      correlationId,
      error: {
        code: "internal_error",
        message: err.message || "An unexpected error occurred"
      }
    }), 500);
  });

  app.notFound((c) => {
    const correlationId = c.get("correlationId");
    return c.json(envelopeError({
      correlationId,
      error: {
        code: "not_found",
        message: `Route ${c.req.path} not found`
      }
    }), 404);
  });

  return app;
}

const app = createApp();
export default app;
