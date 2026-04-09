import { createMiddleware } from "hono/factory";
import { envelopeError } from "@kharon/domain";
import type { Role, SessionUser } from "@kharon/domain";
import type { RuntimeConfig } from "../config.js";
import type { AppBindings } from "../context.js";
import { readSessionCookie, verifySessionToken } from "../auth/session.js";

export function sessionMiddleware(config: RuntimeConfig) {
  return createMiddleware<AppBindings>(async (c, next) => {
    const token = readSessionCookie({ c, cookieName: config.sessionCookieName });
    if (!token) {
      c.set("sessionUser", null);
      await next();
      return;
    }

    const sessionUser = await verifySessionToken({
      token,
      signingKeys: config.sessionKeys
    });

    c.set("sessionUser", sessionUser);
    await next();
  });
}

export function requireSession() {
  return createMiddleware<AppBindings>(async (c, next) => {
    const correlationId = c.get("correlationId");
    const user = c.get("sessionUser");
    if (!user) {
      return c.json(
        envelopeError({
          correlationId,
          error: {
            code: "unauthorized",
            message: "Authentication required"
          }
        }),
        401
      );
    }
    await next();
  });
}

export function requireRoles(...roles: Role[]) {
  return createMiddleware<AppBindings>(async (c, next) => {
    const correlationId = c.get("correlationId");
    const user = c.get("sessionUser");
    if (!user) {
      return c.json(
        envelopeError({
          correlationId,
          error: {
            code: "unauthorized",
            message: "Authentication required"
          }
        }),
        401
      );
    }

    if (!roles.includes(user.role)) {
      return c.json(
        envelopeError({
          correlationId,
          error: {
            code: "forbidden",
            message: "Insufficient role"
          }
        }),
        403
      );
    }

    await next();
  });
}

export function getSessionUser(c: { get(key: "sessionUser"): SessionUser | null }): SessionUser {
  const user = c.get("sessionUser");
  if (!user) {
    throw new Error("Session is required");
  }
  return user;
}
