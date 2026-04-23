/**
 * KharonOps — Auth Routes
 * Purpose: Authentication endpoints (login, logout, session, config).
 * Dependencies: @kharon/domain, ../services/utils.js, ../services/cache.js, ../auth/google.js, ../auth/session.js
 */

import { Hono } from "hono";
import { envelopeError, envelopeSuccess } from "@kharon/domain";
import { verifyIdentity } from "../auth/google.js";
import { createSessionToken, setSessionCookie, clearSessionCookie } from "../auth/session.js";
import { parseJsonBody } from "../services/parse.js";
import { createStoreContext } from "../services/meta.js";
import { logApiEvent, parseGoogleTokenAudienceFromJwt } from "../services/utils.js";
import { googleLoginSchema } from "../schemas/requests.js";
import type { AppBindings } from "../context.js";
import { GoogleAdapterError } from "@kharon/google";

const auth = new Hono<AppBindings>();

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function syntheticSuperAdminUserid(email: string): string {
  const compact = normalizeEmail(email).replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
  return `SUPER-${compact}`.slice(0, 64);
}

auth.post("/google-login", async (c) => {
  const correlationId = c.get("correlationId");
  const config = c.get("config");
  const store = c.get("store");
  const body = await parseJsonBody(c.req.raw, googleLoginSchema);
  const frontendClientId = (c.req.header("x-gsi-client-id") ?? "").trim();
  const tokenAudienceHint = parseGoogleTokenAudienceFromJwt(body.id_token);

  if (frontendClientId !== "" && frontendClientId !== config.googleClientId) {
    logApiEvent("warn", "auth.google_login.frontend_client_id_mismatch", {
      correlationId,
      frontendClientId,
      backendClientId: config.googleClientId
    });
  }

  if (tokenAudienceHint && tokenAudienceHint !== config.googleClientId) {
    logApiEvent("warn", "auth.google_login.token_audience_mismatch_hint", {
      correlationId,
      tokenAudienceHint,
      backendClientId: config.googleClientId
    });
  }

  let identity: Awaited<ReturnType<typeof verifyIdentity>>;
  try {
    identity = await verifyIdentity({
      mode: config.mode,
      idToken: body.id_token,
      googleClientId: config.googleClientId
    });
  } catch (error) {
    logApiEvent("error", "auth.google_login.failed", {
      correlationId,
      backendClientId: config.googleClientId,
      frontendClientId: frontendClientId || null,
      tokenAudienceHint,
      error: String(error),
      stack: error instanceof Error ? error.stack : undefined,
      googleStatus: error instanceof GoogleAdapterError ? error.status : undefined,
      googleCode: error instanceof GoogleAdapterError ? error.code : undefined,
      googleDetails: error instanceof GoogleAdapterError ? error.details : undefined
    });
    throw error;
  }

  let userRow: Awaited<ReturnType<typeof store.getUserByEmail>> = null;

  if (config.mode === "local" && identity.localUserid) {
    const users = await store.listUsers();
    userRow = users.find((row) => row.user_id === identity.localUserid && row.active === "true") ?? null;
  }

  if (!userRow) {
    userRow = await store.getUserByEmail(identity.email);
  }

  const normalizedEmail = normalizeEmail(identity.email);
  const isConfiguredSuperAdmin = config.superAdminEmails.includes(normalizedEmail);

  if (!userRow && !isConfiguredSuperAdmin) {
    await store.appendAudit({
      action: "auth.login.denied",
      entry_type: "auth_audit",
      payload: {
        email: normalizedEmail,
        reason: "not_provisioned"
      },
      ctx: createStoreContext("system:unauthenticated", correlationId)
    });

    return c.json(
      envelopeError({
        correlationId,
        error: {
          code: "forbidden",
          message: "User is not provisioned in Users_Master"
        }
      }),
      403
    );
  }

  if (userRow?.role === "super_admin" && !isConfiguredSuperAdmin) {
    await store.appendAudit({
      action: "auth.login.denied",
      entry_type: "auth_audit",
      payload: {
        email: normalizedEmail,
        reason: "super_admin_requires_configured_email"
      },
      ctx: createStoreContext("system:unauthenticated", correlationId)
    });
    return c.json(
      envelopeError({
        correlationId,
        error: {
          code: "forbidden",
          message: "super_admin requires configured SUPER_ADMIN_EMAILS allow-list"
        }
      }),
      403
    );
  }

  const sessionUser = {
    user_id: userRow?.user_id ?? syntheticSuperAdminUserid(normalizedEmail),
    email: userRow?.email ?? normalizedEmail,
    role: isConfiguredSuperAdmin ? "super_admin" : userRow!.role,
    display_name: userRow?.display_name ?? identity.displayName ?? normalizedEmail,
    client_id: userRow?.client_id ?? "",
    technician_id: userRow?.technician_id ?? ""
  };

  const token = await createSessionToken({
    user: sessionUser,
    ttlSeconds: config.sessionTtlSeconds,
    signingKey: config.sessionKeys[0] ?? config.sessionKeys.at(-1) ?? "fallback-session-key"
  });

  await setSessionCookie({
    c,
    cookieName: config.sessionCookieName,
    token,
    ttlSeconds: config.sessionTtlSeconds
  });

  await store.appendAudit({
    action: "auth.login.success",
    entry_type: "auth_audit",
    payload: {
      user_id: sessionUser.user_id,
      email: sessionUser.email,
      role: sessionUser.role
    },
    ctx: createStoreContext(sessionUser.user_id, correlationId)
  });

  return c.json(
    envelopeSuccess({
      correlationId,
      data: {
        session: sessionUser,
        mode: config.mode,
        rails_mode: config.rails.mode
      }
    })
  );
});

auth.get("/config", async (c) => {
  const correlationId = c.get("correlationId");
  const config = c.get("config");
  return c.json(
    envelopeSuccess({
      correlationId,
      data: {
        mode: config.mode,
        google_client_id: config.googleClientId,
        dev_tokens_enabled: config.mode === "local"
      }
    })
  );
});

auth.get("/session", async (c) => {
  const correlationId = c.get("correlationId");
  const config = c.get("config");
  const user = c.get("sessionUser");
  return c.json(
    envelopeSuccess({
      correlationId,
      data: {
        authenticated: Boolean(user),
        session: user,
        mode: config.mode,
        rails_mode: config.rails.mode
      }
    })
  );
});

auth.post("/logout", async (c) => {
  const correlationId = c.get("correlationId");
  const config = c.get("config");
  const store = c.get("store");
  const user = c.get("sessionUser");

  if (user) {
    await store.appendAudit({
      action: "auth.logout",
      entry_type: "auth_audit",
      payload: {
        user_id: user.user_id,
        email: user.email
      },
      ctx: createStoreContext(user.user_id, correlationId)
    });
  }

  clearSessionCookie({ c, cookieName: config.sessionCookieName });
  return c.json(
    envelopeSuccess({
      correlationId,
      data: {
        logged_out: true
      }
    })
  );
});

export default auth;
