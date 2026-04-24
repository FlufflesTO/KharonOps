import { createMiddleware } from "hono/factory";
import { envelopeError } from "@kharon/domain";
import type { Role, SessionUser } from "@kharon/domain";
import type { RuntimeConfig } from "../config.js";
import type { AppBindings } from "../context.js";
import { readSessionCookie, verifySessionToken } from "../auth/session.js";
import { verifyAccessJwt } from "../auth/access.js";

const CF_ACCESS_ASSERTION_HEADER = "Cf-Access-Jwt-Assertion";

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

    if (!sessionUser) {
      c.set("sessionUser", null);
      const correlationId = c.get("correlationId");
      return c.json(
        envelopeError({
          correlationId,
          error: {
            code: "session_invalid",
            message: "Invalid or expired session token"
          }
        }),
        401
      );
    }

    c.set("sessionUser", sessionUser);
    await next();
  });
}

export function accessMiddleware(config: RuntimeConfig) {
  return createMiddleware<AppBindings>(async (c, next) => {
    const correlationId = c.get("correlationId");
    const accessConfig = config.cloudflareAccess;

    if (!accessConfig.enabled) {
      await next();
      return;
    }

    const token = c.req.header(CF_ACCESS_ASSERTION_HEADER) ?? "";
    if (token.trim() === "") {
      return c.json(
        envelopeError({
          correlationId,
          error: {
            code: "access_unauthorized",
            message: `Missing ${CF_ACCESS_ASSERTION_HEADER} header`
          }
        }),
        401
      );
    }

    try {
      await verifyAccessJwt({
        token,
        audience: accessConfig.audience,
        jwksUrl: accessConfig.jwksUrl,
        jwksJson: accessConfig.jwksJson,
        issuer: accessConfig.issuer
      });
      await next();
      return;
    } catch (error) {
      return c.json(
        envelopeError({
          correlationId,
          error: {
            code: "access_unauthorized",
            message: String(error)
          }
        }),
        401
      );
    }
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

    // Enhanced security: Super admin bypass with audit trail
    if (user.role === "super_admin") {
      // Log super admin access for audit purposes
      console.log(`[auth.audit] Super admin access granted for user ${user.user_id} (${user.email})`);
      await next();
      return;
    }

    if (!roles.includes(user.role)) {
      return c.json(
        envelopeError({
          correlationId,
          error: {
            code: "forbidden",
            message: `Insufficient role. Required: ${roles.join(', ')}, Current: ${user.role}`
          }
        }),
        403
      );
    }

    await next();
  });
}

export function requireAdminOrSuperAdmin() {
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

    if (user.role !== "admin" && user.role !== "super_admin") {
      return c.json(
        envelopeError({
          correlationId,
          error: {
            code: "forbidden",
            message: `Insufficient role. Admin or Super Admin required. Current: ${user.role}`
          }
        }),
        403
      );
    }

    // Enhanced audit logging for admin actions
    if (user.role === "admin") {
      console.log(`[auth.audit] Admin action by user ${user.user_id} (${user.email})`);
    } else if (user.role === "super_admin") {
      console.log(`[auth.audit] Super admin action by user ${user.user_id} (${user.email})`);
    }

    await next();
  });
}

export function requireSuperAdmin() {
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

    if (user.role !== "super_admin") {
      return c.json(
        envelopeError({
          correlationId,
          error: {
            code: "forbidden",
            message: `Super admin access required. Current: ${user.role}`
          }
        }),
        403
      );
    }

    console.log(`[auth.audit] Super admin access by user ${user.user_id} (${user.email})`);
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