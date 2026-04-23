import { Hono } from "hono";
import { ZodError } from "zod";
import { envelopeError } from "@kharon/domain";
import { GoogleAdapterError } from "@kharon/google";
import { createRuntimeConfig } from "../../../apps/api/src/config";
import type { AppBindings } from "../../../apps/api/src/context";
import type { RuntimeConfig } from "../../../apps/api/src/config";
import type { WorkbookStore } from "../../../apps/api/src/store/types";
import type { SessionUser } from "@kharon/domain";

type RouteHarnessOptions = {
  route: Hono<AppBindings>;
  mountPath?: string;
  sessionUser?: SessionUser | null;
  store?: WorkbookStore;
  config?: RuntimeConfig;
};

const fallbackConfig = createRuntimeConfig({
  KHARON_MODE: "local",
  SESSION_KEYS: "local-test-session-key-11111111111111111,local-test-session-key-22222222222222"
});

export function makeRouteHarness(options: RouteHarnessOptions): Hono<AppBindings> {
  const app = new Hono<AppBindings>();

  app.use("*", async (c, next) => {
    c.set("correlationId", "test-correlation-id");
    c.set("sessionUser", options.sessionUser ?? null);
    c.set("config", options.config ?? fallbackConfig);
    c.set("store", (options.store ?? {}) as WorkbookStore);
    await next();
  });

  app.onError((error, c) => {
    const correlationId = c.get("correlationId");
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

    return c.json(
      envelopeError({
        correlationId,
        error: {
          code: "internal_error",
          message: error instanceof Error ? error.message : String(error)
        }
      }),
      500
    );
  });

  app.route(options.mountPath ?? "/", options.route);
  return app;
}
