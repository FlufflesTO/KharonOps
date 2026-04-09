import type { MiddlewareHandler } from "hono";
import type { AppBindings } from "../context.js";

export const correlationMiddleware: MiddlewareHandler<AppBindings> = async (c, next) => {
  const inbound = c.req.header("x-correlation-id");
  const correlationId = inbound && inbound.trim() !== "" ? inbound : crypto.randomUUID();
  c.set("correlationId", correlationId);
  c.header("x-correlation-id", correlationId);
  await next();
};
