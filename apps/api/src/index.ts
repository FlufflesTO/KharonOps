import { Hono } from "hono";
import { ZodError } from "zod";
import { envelopeError } from "@kharon/domain";
import { GoogleAdapterError } from "@kharon/google";
import { createRuntimeConfig } from "./config.js";
import type { AppBindings } from "./context.js";
import { accessMiddleware, sessionMiddleware } from "./middleware/auth.js";
import { correlationMiddleware } from "./middleware/correlation.js";
import { apiSecurityHeadersMiddleware } from "./middleware/security.js";
import { bumpCacheVersion } from "./services/cache.js";
import { envCacheKey, logApiEvent, parseEnvBindings } from "./services/utils.js";
import { createWorkbookStore } from "./store/factory.js";
import auth from "./routes/auth.js";
import jobs from "./routes/jobs.js";
import schedules from "./routes/schedules.js";
import workspace from "./routes/workspace.js";
import documents from "./routes/documents.js";
import sync from "./routes/sync.js";
import admin from "./routes/admin.js";
import publicRoutes from "./routes/public.js";
import finance from "./routes/finance.js";

export function createApp(env: Record<string, string | undefined> = {}): Hono<AppBindings> {
  const config = createRuntimeConfig(env);
  const store = createWorkbookStore(config);
  let schemaInitPromise: Promise<void> | null = null;
  let schemaReady = false;

  const ensureSchemaReady = async (): Promise<void> => {
    if (schemaReady) {
      return;
    }

    if (!schemaInitPromise) {
      schemaInitPromise = store.ensureSchema()
        .then(() => {
          schemaReady = true;
        })
        .catch((error) => {
          // Reset the promise on error so subsequent calls can retry
          schemaInitPromise = null;
          throw error;
        });
    }

    // Wait for the schema initialization to complete
    await schemaInitPromise;
  };

  const app = new Hono<AppBindings>();
  app.use("*", correlationMiddleware);
  app.use("*", apiSecurityHeadersMiddleware());
  app.use("*", async (c, next) => {
    c.set("config", config);
    c.set("store", store);
    await next();
  });
  app.use("/api/v1/*", accessMiddleware(config));
  app.use("*", sessionMiddleware(config));

  app.use("/api/v1/*", async (c, next) => {
    const path = c.req.path;
    const skipSchemaInit =
      path === "/api/v1/auth/config" ||
      path === "/api/v1/auth/session" ||
      path === "/api/v1/auth/logout" ||
      path === "/api/v1/auth/google-login";

    if (skipSchemaInit) {
      await next();
      return;
    }

    await ensureSchemaReady();
    await next();
  });

  app.use("/api/v1/*", async (c, next) => {
    await next();
    const method = c.req.method.toUpperCase();
    const isMutation = method === "POST" || method === "PUT" || method === "PATCH" || method === "DELETE";
    const skipPaths = new Set(["/api/v1/auth/google-login", "/api/v1/auth/logout"]);

    if (!isMutation || c.res.status >= 400 || skipPaths.has(c.req.path)) {
      return;
    }

    try {
      await bumpCacheVersion(c.env);
    } catch (error) {
      logApiEvent("warn", "cache.version.bump_failed", {
        correlationId: c.get("correlationId"),
        path: c.req.path,
        error: String(error)
      });
    }
  });

  app.onError((error, c) => {
    const correlationId = c.get("correlationId") ?? crypto.randomUUID();
    logApiEvent("error", "api.request_failed", {
      correlationId,
      path: c.req.path,
      method: c.req.method,
      userAgent: c.req.header("user-agent"),
      ip: c.req.header("cf-connecting-ip"),
      message: error instanceof Error ? error.message : String(error),
      errorName: error instanceof Error ? error.name : "UnknownError",
      stack: error instanceof Error ? error.stack : undefined
    });

    if (error instanceof SyntaxError) {
      return c.json(
        envelopeError({
          correlationId,
          error: {
            code: "invalid_json",
            message: "Request body must be valid JSON"
          }
        }),
        400
      );
    }

    if (error instanceof GoogleAdapterError) {
      const status = (error.status >= 400 && error.status <= 599 ? error.status : 500) as
        | 400
        | 401
        | 403
        | 404
        | 429
        | 500;

      return c.json(
        envelopeError({
          correlationId,
          error: {
            code: error.code,
            message: error.message,
            details: error.details
          }
        }),
        status
      );
    }

    if (error instanceof ZodError) {
      return c.json(
        envelopeError({
          correlationId,
          error: {
            code: "validation_error",
            message: "Request validation failed",
            details: { issues: error.issues }
          }
        }),
        400
      );
    }

    logApiEvent("error", "api.unhandled_error", {
      correlationId,
      path: c.req.path,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });

    return c.json(
      envelopeError({
        correlationId,
        error: {
          code: "internal_error",
          message: "Unexpected server error"
        }
      }),
      500
    );
  });

  app.route("/api/v1/auth", auth);
  app.get("/health", (c) => c.json({ status: "ok" }));

app.route("/api/v1/jobs", jobs);
  app.route("/api/v1/schedules", schedules);
  app.route("/api/v1/workspace", workspace);
  app.route("/api/v1/documents", documents);
  app.route("/api/v1/sync", sync);
  app.route("/api/v1/admin", admin);
  app.route("/api/v1/public", publicRoutes);
  app.route("/api/v1/workspace/upgrade/finance", finance);

  app.get("*", async (c) => {
    if (c.req.path.startsWith("/api/")) {
      return c.json(
        envelopeError({
          correlationId: c.get("correlationId"),
          error: { code: "not_found", message: "API endpoint not found" }
        }),
        404
      );
    }

    if (!c.env.ASSETS) {
      return c.json(
        envelopeError({
          correlationId: c.get("correlationId"),
          error: {
            code: "assets_binding_unavailable",
            message: "Static assets binding is not configured."
          }
        }),
        503
      );
    }

    let assetResponse = await c.env.ASSETS.fetch(c.req.raw);
    if (assetResponse.status === 404 && c.req.method === "GET") {
      const fallbackUrl = new URL(c.req.url);
      const isPortal = c.req.path.startsWith("/portal/");
      fallbackUrl.pathname = isPortal ? "/portal/index.html" : "/index.html";
      const fallbackReq = new Request(fallbackUrl.toString(), c.req.raw);
      assetResponse = await c.env.ASSETS.fetch(fallbackReq);
    }

    const mergedHeaders = new Headers(assetResponse.headers);
    c.res.headers.forEach((value, key) => {
      mergedHeaders.set(key, value);
    });

    return new Response(assetResponse.body, {
      status: assetResponse.status,
      statusText: assetResponse.statusText,
      headers: mergedHeaders
    });
  });

  return app;
}

const MAX_CACHE_SIZE = 100; // Maximum number of cached apps

class LRUCache<K, V> {
  private cache = new Map<K, V>();
  private keys: K[] = [];

  constructor(private maxSize: number = MAX_CACHE_SIZE) {}

  get(key: K): V | undefined {
    const value = this.cache.get(key);
    if (value !== undefined) {
      // Move key to end to mark as recently used
      this.keys = [...this.keys.filter(k => k !== key), key];
    }
    return value;
  }

  set(key: K, value: V): void {
    if (this.cache.size >= this.maxSize) {
      // Remove least recently used item
      const lruKey = this.keys.shift();
      if (lruKey !== undefined) {
        this.cache.delete(lruKey);
      }
    }
    
    this.cache.set(key, value);
    this.keys.push(key);
  }

  delete(key: K): boolean {
    const result = this.cache.delete(key);
    this.keys = this.keys.filter(k => k !== key);
    return result;
  }

  clear(): void {
    this.cache.clear();
    this.keys = [];
  }

  get size(): number {
    return this.cache.size;
  }
}

const runtimeAppCache = new LRUCache<string, Hono<AppBindings>>();
let processEnvApp: Hono<AppBindings> | null = null;

function getProcessEnvApp(): Hono<AppBindings> {
  if (processEnvApp) {
    return processEnvApp;
  }

  const processEnv = parseEnvBindings((globalThis as { process?: { env?: Record<string, string> } }).process?.env ?? {});
  processEnvApp = createApp(processEnv);
  return processEnvApp;
}

function getRuntimeApp(runtimeEnv: Record<string, string | undefined>): Hono<AppBindings> {
  const key = envCacheKey(runtimeEnv);
  const cached = runtimeAppCache.get(key);
  if (cached) {
    return cached;
  }

  const created = createApp(runtimeEnv);
  runtimeAppCache.set(key, created);
  return created;
}

export default {
  fetch(request: Request, env: Record<string, unknown>) {
    const runtimeEnv = parseEnvBindings(env);
    if (Object.keys(runtimeEnv).length > 0) {
      return getRuntimeApp(runtimeEnv).fetch(request, env);
    }
    return getProcessEnvApp().fetch(request, env);
  }
};
