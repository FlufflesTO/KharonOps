import { Hono } from "hono";
import { ZodError } from "zod";
import {
  canConfirmSchedule,
  canGenerateDocument,
  canPublishDocument,
  canReadJob,
  canRequestSchedule,
  canTransitionStatus,
  canUpdateJobStatus,
  canUseAdmin,
  canWriteJobNote,
  listAllowedStatusTransitions,
  bumpMutableMeta,
  chatAlertSchema,
  documentGenerateSchema,
  documentPublishSchema,
  envelopeError,
  envelopeSuccess,
  financeEscrowLockSchema,
  financeInvoiceFromQuoteSchema,
  financeQuoteCreateSchema,
  financeQuoteStatusSchema,
  gmailNotifySchema,
  googleLoginSchema,
  noteSchema,
  peopleSyncSchema,
  publicContactRequestSchema,
  resolveConflictSchema,
  scheduleConfirmSchema,
  scheduleRequestSchema,
  scheduleRescheduleSchema,
  skillMatrixUpsertSchema,
  statusUpdateSchema,
  syncPushSchema,
  type FinanceDebtorRow,
  type FinanceInvoiceRow,
  type FinanceStatementRow,
  type JobDocumentRow,
  type JobRow,
  type ScheduleRequestRow,
  type ScheduleRow
} from "@kharon/domain";
import { GoogleAdapterError } from "@kharon/google";
import { createRuntimeConfig } from "./config.js";
import type { AppBindings } from "./context.js";
import { verifyIdentity } from "./auth/google.js";
import { clearSessionCookie, createSessionToken, setSessionCookie } from "./auth/session.js";
import { accessMiddleware, getSessionUser, requireRoles, requireSession, sessionMiddleware } from "./middleware/auth.js";
import { correlationMiddleware } from "./middleware/correlation.js";
import { apiSecurityHeadersMiddleware } from "./middleware/security.js";
import { buildDocumentTokens } from "./services/documentTokens.js";
import { parseJsonBody } from "./services/parse.js";
import { createWorkbookStore } from "./store/factory.js";
import { createMutable, createStoreContext } from "./services/meta.js";

function rowVersionConflictResponse(correlationId: string, rowVersion: number, conflict: NonNullable<ReturnType<typeof envelopeError>["conflict"]>) {
  return envelopeError({
    correlationId,
    rowVersion,
    conflict,
    error: {
      code: "row_version_conflict",
      message: "The record was modified by another actor"
    }
  });
}

function parseEnvBindings(bindings: Record<string, unknown>): Record<string, string | undefined> {
  const env: Record<string, string | undefined> = {};
  for (const [key, value] of Object.entries(bindings)) {
    env[key] = typeof value === "string" ? value : undefined;
  }
  return env;
}

function envCacheKey(env: Record<string, string | undefined>): string {
  const entries = Object.entries(env)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([key, value]) => [key, value ?? ""]);
  return JSON.stringify(entries);
}

function logApiEvent(level: "info" | "warn" | "error", event: string, details: Record<string, unknown>): void {
  const payload = {
    timestamp: new Date().toISOString(),
    level,
    event,
    ...details
  };
  const line = JSON.stringify(payload);
  if (level === "error") {
    console.error(line);
  } else if (level === "warn") {
    console.warn(line);
  } else {
    console.log(line);
  }
}

function parseGoogleTokenAudienceFromJwt(idToken: string): string | null {
  const parts = idToken.split(".");
  if (parts.length !== 3) {
    return null;
  }

  try {
    const payloadRaw = Buffer.from(parts[1] ?? "", "base64url").toString("utf8");
    const payload = JSON.parse(payloadRaw) as { aud?: unknown };
    return typeof payload.aud === "string" ? payload.aud : null;
  } catch {
    return null;
  }
}

function enquiryTypeLabel(type: "project" | "maintenance" | "urgent_callout" | "compliance" | "resource" | "general"): string {
  switch (type) {
    case "project":
      return "New Project";
    case "maintenance":
      return "Maintenance Contract";
    case "urgent_callout":
      return "Urgent Callout";
    case "compliance":
      return "Compliance Request";
    case "resource":
      return "Resource Request";
    default:
      return "General Enquiry";
  }
}

function nowIso(): string {
  return new Date().toISOString();
}

export function createApp(env: Record<string, string | undefined> = {}): Hono<AppBindings> {
  const config = createRuntimeConfig(env);
  const store = createWorkbookStore(config);
  let schemaInitPromise: Promise<void> | null = null;

  const app = new Hono<AppBindings>();
  app.use("*", correlationMiddleware);
  app.use("*", apiSecurityHeadersMiddleware());
  app.use("/api/v1/*", accessMiddleware(config));
  app.use("*", sessionMiddleware(config));

  app.use("/api/v1/*", async (_c, next) => {
    const path = _c.req.path;
    const skipSchemaInit =
      path === "/api/v1/auth/config" ||
      path === "/api/v1/auth/session" ||
      path === "/api/v1/auth/logout";
    if (skipSchemaInit) {
      await next();
      return;
    }

    if (!schemaInitPromise) {
      schemaInitPromise = store.ensureSchema();
    }
    await schemaInitPromise;
    await next();
  });

  app.onError((error, c) => {
    const correlationId = c.get("correlationId") ?? crypto.randomUUID();

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
            details: {
              issues: error.issues
            }
          }
        }),
        400
      );
    }

    if (error instanceof Error && error.message.startsWith("Invalid status transition from")) {
      return c.json(
        envelopeError({
          correlationId,
          error: {
            code: "invalid_status_transition",
            message: error.message
          }
        }),
        400
      );
    }

    return c.json(
      envelopeError({
        correlationId,
        error: {
          code: "internal_error",
          message: String(error)
        }
      }),
      500
    );
  });

  const api = new Hono<AppBindings>();

  api.post("/auth/google-login", async (c) => {
    const correlationId = c.get("correlationId");
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

    // Local dev tokens can point to a specific seeded user_uid so role simulation
    // continues to work even when all users share one mailbox address.
    if (config.mode === "local" && identity.localUserUid) {
      const users = await store.listUsers();
      userRow = users.find((row) => row.user_uid === identity.localUserUid && row.active === "true") ?? null;
    }

    if (!userRow) {
      userRow = await store.getUserByEmail(identity.email);
    }

    if (!userRow) {
      await store.appendAudit({
        action: "auth.login.denied",
        entry_type: "auth_audit",
        payload: {
          email: identity.email,
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

    const sessionUser = {
      user_uid: userRow.user_uid,
      email: userRow.email,
      role: userRow.role,
      display_name: userRow.display_name,
      client_uid: userRow.client_uid,
      technician_uid: userRow.technician_uid
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
        user_uid: sessionUser.user_uid,
        email: sessionUser.email,
        role: sessionUser.role
      },
      ctx: createStoreContext(sessionUser.user_uid, correlationId)
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

  api.get("/auth/config", async (c) => {
    const correlationId = c.get("correlationId");
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

  api.get("/auth/session", async (c) => {
    const correlationId = c.get("correlationId");
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


  api.post("/auth/logout", async (c) => {
    const correlationId = c.get("correlationId");
    const user = c.get("sessionUser");
    
    if (user) {
      await store.appendAudit({
        action: "auth.logout",
        entry_type: "auth_audit",
        payload: {
          user_uid: user.user_uid,
          email: user.email
        },
        ctx: createStoreContext(user.user_uid, correlationId)
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

  api.post("/public/contact", async (c) => {
    const correlationId = c.get("correlationId");
    const body = await parseJsonBody(c.req.raw, publicContactRequestSchema);

    if (body.honey !== "") {
      logApiEvent("warn", "public.contact.honeypot_triggered", {
        correlationId,
        email: body.email
      });

      return c.json(
        envelopeSuccess({
          correlationId,
          data: {
            submitted: true
          }
        })
      );
    }

    const subject = `[Website] ${enquiryTypeLabel(body.enquiry_type)} | ${body.name}`;
    const message = [
      `Name: ${body.name}`,
      `Email: ${body.email}`,
      `Phone: ${body.phone}`,
      `Company: ${body.company || "Not provided"}`,
      `Site Location: ${body.site_location || "Not provided"}`,
      `Company Size: ${body.company_size || "Not provided"}`,
      `Enquiry Type: ${enquiryTypeLabel(body.enquiry_type)}`,
      "",
      "Message:",
      body.message
    ].join("\n");

    await config.rails.gmail.sendNotification({
      to: config.gmailSenderAddress,
      subject,
      body: message
    });

    if (body.enquiry_type === "urgent_callout") {
      await config.rails.chat.sendAlert({
        severity: "critical",
        message: `Urgent website enquiry from ${body.name} (${body.phone})`
      });
    }

    await store.appendAudit({
      action: "public.contact.submit",
      entry_type: "public_contact",
      payload: {
        name: body.name,
        email: body.email,
        phone: body.phone,
        company: body.company,
        site_location: body.site_location,
        enquiry_type: body.enquiry_type
      },
      ctx: createStoreContext("public:web", correlationId)
    });

    return c.json(
      envelopeSuccess({
        correlationId,
        data: {
          submitted: true
        }
      })
    );
  });

  api.get("/jobs", requireSession(), async (c) => {
    const correlationId = c.get("correlationId");
    const user = getSessionUser(c);
    const jobs = await store.listJobsForUser(user);

    return c.json(
      envelopeSuccess({
        correlationId,
        data: jobs
      })
    );
  });

  api.get("/jobs/:job_uid", requireSession(), async (c) => {
    const correlationId = c.get("correlationId");
    const user = getSessionUser(c);
    const jobUid = c.req.param("job_uid");
    const job = await store.getJob(jobUid);

    if (!job) {
      return c.json(
        envelopeError({
          correlationId,
          error: {
            code: "not_found",
            message: "Job not found"
          }
        }),
        404
      );
    }

    if (!canReadJob(user, job)) {
      return c.json(
        envelopeError({
          correlationId,
          error: {
            code: "forbidden",
            message: "Ownership check failed"
          }
        }),
        403
      );
    }

    return c.json(
      envelopeSuccess({
        correlationId,
        rowVersion: job.row_version,
        data: job
      })
    );
  });

  api.post("/jobs/:job_uid/status", requireSession(), async (c) => {
    const correlationId = c.get("correlationId");
    const user = getSessionUser(c);
    const jobUid = c.req.param("job_uid");
    const body = await parseJsonBody(c.req.raw, statusUpdateSchema);

    const existing = await store.getJob(jobUid);
    if (!existing) {
      return c.json(
        envelopeError({
          correlationId,
          error: { code: "not_found", message: "Job not found" }
        }),
        404
      );
    }

    if (!canUpdateJobStatus(user, existing, body.status)) {
      return c.json(
        envelopeError({
          correlationId,
          error: {
            code: "forbidden",
            message: "Role is not allowed to update this job to the requested status"
          }
        }),
        403
      );
    }

    if (!canTransitionStatus(existing.status, body.status)) {
      return c.json(
        envelopeError({
          correlationId,
          rowVersion: existing.row_version,
          error: {
            code: "invalid_status_transition",
            message: `Invalid status transition from ${existing.status} to ${body.status}`,
            details: {
              from: existing.status,
              to: body.status,
              allowed: listAllowedStatusTransitions(existing.status)
            }
          }
        }),
        400
      );
    }

    const update = await store.updateJobStatus({
      jobUid,
      status: body.status,
      expectedRowVersion: body.row_version,
      ctx: createStoreContext(user.user_uid, correlationId)
    });

    if (update.conflict) {
      return c.json(rowVersionConflictResponse(correlationId, update.job.row_version, update.conflict), 409);
    }

    if (user.role === "dispatcher" || user.role === "admin") {
      await store.appendAudit({
        action: "jobs.status.update",
        payload: {
          job_uid: jobUid,
          status: body.status,
          actor_role: user.role
        },
        ctx: createStoreContext(user.user_uid, correlationId)
      });
    }

    return c.json(
      envelopeSuccess({
        correlationId,
        rowVersion: update.job.row_version,
        data: update.job
      })
    );
  });

  api.post("/jobs/:job_uid/note", requireSession(), async (c) => {
    const correlationId = c.get("correlationId");
    const user = getSessionUser(c);
    const jobUid = c.req.param("job_uid");
    const body = await parseJsonBody(c.req.raw, noteSchema);

    const existing = await store.getJob(jobUid);
    if (!existing) {
      return c.json(
        envelopeError({
          correlationId,
          error: { code: "not_found", message: "Job not found" }
        }),
        404
      );
    }

    if (!canWriteJobNote(user, existing)) {
      return c.json(
        envelopeError({
          correlationId,
          error: {
            code: "forbidden",
            message: "Role is not allowed to add notes on this job"
          }
        }),
        403
      );
    }

    const update = await store.appendJobNote({
      jobUid,
      note: body.note,
      expectedRowVersion: body.row_version,
      ctx: createStoreContext(user.user_uid, correlationId)
    });

    if (update.conflict) {
      return c.json(rowVersionConflictResponse(correlationId, update.job.row_version, update.conflict), 409);
    }

    await store.appendAudit({
      action: "jobs.note.create",
      payload: {
        job_uid: jobUid,
        note_length: body.note.length
      },
      ctx: createStoreContext(user.user_uid, correlationId)
    });

    return c.json(
      envelopeSuccess({
        correlationId,
        rowVersion: update.job.row_version,
        data: update.job
      })
    );
  });

  api.post("/schedules/request-slot", requireSession(), async (c) => {
    const correlationId = c.get("correlationId");
    const user = getSessionUser(c);
    if (!canRequestSchedule(user.role)) {
      return c.json(
        envelopeError({
          correlationId,
          error: { code: "forbidden", message: "Role cannot request scheduling" }
        }),
        403
      );
    }

    const body = await parseJsonBody(c.req.raw, scheduleRequestSchema);
    const job = await store.getJob(body.job_uid);

    if (!job) {
      return c.json(
        envelopeError({ correlationId, error: { code: "not_found", message: "Job not found" } }),
        404
      );
    }

    if (!canReadJob(user, job)) {
      return c.json(
        envelopeError({ correlationId, error: { code: "forbidden", message: "Ownership check failed" } }),
        403
      );
    }

    if (job.row_version !== body.row_version) {
      const conflict = {
        type: "row_version_conflict" as const,
        entity: "Jobs_Master",
        entity_id: job.job_uid,
        client_row_version: body.row_version,
        server_row_version: job.row_version,
        server_state: job as unknown as Record<string, unknown>
      };
      return c.json(rowVersionConflictResponse(correlationId, job.row_version, conflict), 409);
    }

    const row: ScheduleRequestRow = {
      request_uid: `REQ-${crypto.randomUUID()}`,
      job_uid: body.job_uid,
      client_uid: job.client_uid,
      preferred_slots_json: JSON.stringify(body.preferred_slots),
      timezone: body.timezone,
      notes: body.notes ?? "",
      status: "requested",
      ...createMutable(user.user_uid, correlationId)
    };

    await store.createScheduleRequest(row);

    await store.appendAudit({
      action: "schedules.request",
      payload: {
        job_uid: body.job_uid,
        request_uid: row.request_uid
      },
      ctx: createStoreContext(user.user_uid, correlationId)
    });

    return c.json(
      envelopeSuccess({
        correlationId,
        rowVersion: row.row_version,
        data: row
      })
    );
  });

  api.post("/schedules/confirm", requireSession(), async (c) => {
    const correlationId = c.get("correlationId");
    const user = getSessionUser(c);
    if (!canConfirmSchedule(user.role)) {
      return c.json(
        envelopeError({ correlationId, error: { code: "forbidden", message: "Role cannot confirm schedule" } }),
        403
      );
    }

    const body = await parseJsonBody(c.req.raw, scheduleConfirmSchema);
    let request = await store.getScheduleRequest(body.request_uid);
    if (!request && config.mode === "local" && body.job_uid) {
      const fallbackJob = await store.getJob(body.job_uid);
      if (fallbackJob) {
        request = {
          request_uid: body.request_uid,
          job_uid: fallbackJob.job_uid,
          client_uid: fallbackJob.client_uid,
          preferred_slots_json: JSON.stringify([{ start_at: body.start_at, end_at: body.end_at }]),
          timezone: "Africa/Johannesburg",
          notes: "auto-created fallback request",
          status: "requested",
          ...createMutable(user.user_uid, correlationId)
        };
      }
    }

    if (!request) {
      return c.json(
        envelopeError({
          correlationId,
          error: {
            code: "not_found",
            message: "Schedule request not found. Create/request a slot first, then confirm using that request UID."
          }
        }),
        404
      );
    }

    if (request.row_version !== body.row_version) {
      const conflict = {
        type: "row_version_conflict" as const,
        entity: "Schedule_Requests",
        entity_id: request.request_uid,
        client_row_version: body.row_version,
        server_row_version: request.row_version,
        server_state: request as unknown as Record<string, unknown>
      };
      return c.json(rowVersionConflictResponse(correlationId, request.row_version, conflict), 409);
    }

    const scheduleUid = `SCH-${crypto.randomUUID()}`;
    const calendar = await config.rails.calendar.confirmEvent({
      jobUid: request.job_uid,
      scheduleUid,
      startAt: body.start_at,
      endAt: body.end_at,
      technicianUid: body.technician_uid
    });

    const updatedRequest: ScheduleRequestRow = {
      ...request,
      status: "confirmed",
      ...bumpMutableMeta(request, user.user_uid, correlationId)
    };

    const schedule: ScheduleRow = {
      schedule_uid: scheduleUid,
      request_uid: request.request_uid,
      job_uid: request.job_uid,
      calendar_event_id: calendar.eventId,
      start_at: body.start_at,
      end_at: body.end_at,
      technician_uid: body.technician_uid,
      status: "confirmed",
      ...createMutable(user.user_uid, correlationId)
    };

    await store.upsertScheduleRequest(updatedRequest);
    await store.createSchedule(schedule);

    await store.appendAudit({
      action: "schedules.confirm",
      payload: {
        request_uid: request.request_uid,
        schedule_uid: schedule.schedule_uid
      },
      ctx: createStoreContext(user.user_uid, correlationId)
    });

    return c.json(
      envelopeSuccess({
        correlationId,
        rowVersion: schedule.row_version,
        data: schedule
      })
    );
  });

  api.post("/schedules/reschedule", requireSession(), async (c) => {
    const correlationId = c.get("correlationId");
    const user = getSessionUser(c);
    if (!canConfirmSchedule(user.role)) {
      return c.json(
        envelopeError({ correlationId, error: { code: "forbidden", message: "Role cannot reschedule" } }),
        403
      );
    }

    const body = await parseJsonBody(c.req.raw, scheduleRescheduleSchema);
    let schedule = await store.getSchedule(body.schedule_uid);
    if (!schedule && config.mode === "local" && body.job_uid) {
      const fallbackJob = await store.getJob(body.job_uid);
      schedule = {
        schedule_uid: body.schedule_uid,
        request_uid: body.request_uid ?? `REQ-${crypto.randomUUID()}`,
        job_uid: body.job_uid,
        calendar_event_id: body.calendar_event_id ?? "",
        start_at: body.start_at,
        end_at: body.end_at,
        technician_uid: body.technician_uid ?? fallbackJob?.technician_uid ?? "TECH-001",
        status: "confirmed",
        ...createMutable(user.user_uid, correlationId)
      };
    }

    if (!schedule) {
      return c.json(
        envelopeError({
          correlationId,
          error: {
            code: "not_found",
            message: "Schedule not found. Confirm a request first, then reschedule that schedule UID."
          }
        }),
        404
      );
    }

    if (schedule.row_version !== body.row_version) {
      const conflict = {
        type: "row_version_conflict" as const,
        entity: "Schedules_Master",
        entity_id: schedule.schedule_uid,
        client_row_version: body.row_version,
        server_row_version: schedule.row_version,
        server_state: schedule as unknown as Record<string, unknown>
      };
      return c.json(rowVersionConflictResponse(correlationId, schedule.row_version, conflict), 409);
    }

    const calendar = await config.rails.calendar.confirmEvent({
      jobUid: schedule.job_uid,
      scheduleUid: schedule.schedule_uid,
      startAt: body.start_at,
      endAt: body.end_at,
      technicianUid: schedule.technician_uid,
      existingEventId: schedule.calendar_event_id
    });

    const updated: ScheduleRow = {
      ...schedule,
      start_at: body.start_at,
      end_at: body.end_at,
      status: "rescheduled",
      calendar_event_id: calendar.eventId,
      ...bumpMutableMeta(schedule, user.user_uid, correlationId)
    };

    await store.upsertSchedule(updated);

    await store.appendAudit({
      action: "schedules.reschedule",
      payload: {
        schedule_uid: updated.schedule_uid
      },
      ctx: createStoreContext(user.user_uid, correlationId)
    });

    return c.json(
      envelopeSuccess({
        correlationId,
        rowVersion: updated.row_version,
        data: updated
      })
    );
  });

  api.post("/documents/generate", requireSession(), async (c) => {
    const correlationId = c.get("correlationId");
    const user = getSessionUser(c);
    if (!canGenerateDocument(user.role)) {
      return c.json(
        envelopeError({ correlationId, error: { code: "forbidden", message: "Role cannot generate documents" } }),
        403
      );
    }

    const body = await parseJsonBody(c.req.raw, documentGenerateSchema);
    const job = await store.getJob(body.job_uid);
    if (!job) {
      return c.json(
        envelopeError({ correlationId, error: { code: "not_found", message: "Job not found" } }),
        404
      );
    }

    if (!canReadJob(user, job) && user.role === "technician") {
      return c.json(
        envelopeError({ correlationId, error: { code: "forbidden", message: "Ownership check failed" } }),
        403
      );
    }

    const documentUid = `DOC-${crypto.randomUUID()}`;
    const overrides = body.tokens ?? {};
    const users = await store.listUsers();
    const isGas = job.title.toLowerCase().includes("gas");
    const isFire = job.title.toLowerCase().includes("fire") || !isGas;
    const subType = isGas ? "gas" : "fire";

    const generated = await config.rails.docs.generateDocument({
      jobUid: body.job_uid,
      documentType: body.document_type,
      subType,
      tokens: buildDocumentTokens({
        documentUid,
        documentType: body.document_type,
        job,
        actor: user,
        users,
        ...(Object.keys(overrides).length > 0 ? { overrides } : {})
      })
    });

    const document: JobDocumentRow = {
      document_uid: documentUid,
      job_uid: body.job_uid,
      document_type: body.document_type,
      status: "generated",
      drive_file_id: generated.drive_file_id,
      pdf_file_id: generated.pdf_file_id,
      published_url: "",
      client_visible: false,
      ...createMutable(user.user_uid, correlationId)
    };


    await store.createDocument(document);

    await store.appendAudit({
      action: "documents.generate",
      payload: {
        job_uid: body.job_uid,
        document_uid: documentUid,
        document_type: body.document_type
      },
      ctx: createStoreContext(user.user_uid, correlationId)
    });

    return c.json(
      envelopeSuccess({
        correlationId,
        rowVersion: document.row_version,
        data: document
      })
    );
  });

  api.post("/documents/publish", requireSession(), async (c) => {
    const correlationId = c.get("correlationId");
    const user = getSessionUser(c);
    if (!canPublishDocument(user.role)) {
      return c.json(
        envelopeError({ correlationId, error: { code: "forbidden", message: "Role cannot publish documents" } }),
        403
      );
    }

    const body = await parseJsonBody(c.req.raw, documentPublishSchema);
    let document = await store.getDocument(body.document_uid);
    if (!document && config.mode === "local") {
      document = {
        document_uid: body.document_uid,
        job_uid: body.job_uid ?? "JOB-1001",
        document_type: body.document_type ?? "jobcard",
        status: "generated",
        drive_file_id: body.document_uid,
        pdf_file_id: body.document_uid,
        published_url: "",
        client_visible: body.client_visible ?? false,
        ...createMutable(user.user_uid, correlationId)
      };

    }

    if (!document) {
      return c.json(
        envelopeError({
          correlationId,
          error: {
            code: "not_found",
            message: "Document not found. Generate a document first, then publish using that document UID."
          }
        }),
        404
      );
    }

    if (document.row_version !== body.row_version) {
      const conflict = {
        type: "row_version_conflict" as const,
        entity: "Job_Documents",
        entity_id: document.document_uid,
        client_row_version: body.row_version,
        server_row_version: document.row_version,
        server_state: document as unknown as Record<string, unknown>
      };
      return c.json(rowVersionConflictResponse(correlationId, document.row_version, conflict), 409);
    }

    const publish = await config.rails.drive.publishFile({
      fileId: document.pdf_file_id,
      clientVisible: body.client_visible ?? false
    });

    const updated: JobDocumentRow = {
      ...document,
      status: "published",
      published_url: publish.publishedUrl,
      client_visible: body.client_visible ?? false,
      ...bumpMutableMeta(document, user.user_uid, correlationId)
    };

    await store.upsertDocument(updated);
    await store.appendAudit({
      action: "documents.publish",
      payload: {
        document_uid: updated.document_uid,
        published_url: updated.published_url
      },
      ctx: createStoreContext(user.user_uid, correlationId)
    });

    return c.json(
      envelopeSuccess({
        correlationId,
        rowVersion: updated.row_version,
        data: updated
      })
    );
  });

  api.get("/documents/history", requireSession(), async (c) => {
    const correlationId = c.get("correlationId");
    const user = getSessionUser(c);
    const jobUid = c.req.query("job_uid");
    const documents = await store.listDocuments(jobUid);

    const internalDocumentRoles = new Set(["admin", "dispatcher", "finance", "super_admin"]);
    if (internalDocumentRoles.has(String(user.role))) {
      return c.json(
        envelopeSuccess({
          correlationId,
          data: documents
        })
      );
    }

    const readableJobs = await store.listJobsForUser(user);
    const readableJobUids = new Set(readableJobs.map((job) => job.job_uid));
    
    // Non-internal roles only see documents that are published AND marked client_visible
    const visibleDocuments = documents.filter((document) => 
      readableJobUids.has(document.job_uid) && 
      document.status === "published" && 
      document.client_visible === true
    );

    return c.json(
      envelopeSuccess({
        correlationId,
        data: visibleDocuments
      })
    );
  });

  api.get("/sync/pull", requireSession(), async (c) => {
    const correlationId = c.get("correlationId");
    const user = getSessionUser(c);
    const since = c.req.query("since") ?? "1970-01-01T00:00:00.000Z";

    const pulled = await store.pullSyncData({
      actor: user,
      since
    });

    return c.json(
      envelopeSuccess({
        correlationId,
        data: pulled
      })
    );
  });

  api.post("/sync/push", requireSession(), async (c) => {
    const correlationId = c.get("correlationId");
    const user = getSessionUser(c);
    const body = await parseJsonBody(c.req.raw, syncPushSchema);

    const result = await store.applySyncMutations({
      actor: user,
      mutations: body.mutations,
      ctx: createStoreContext(user.user_uid, correlationId)
    });

    const status = result.applied.length === 0 && result.conflicts.length > 0 && result.failed.length === 0 ? 409 : 200;
    const conflict = result.conflicts[0]?.conflict ?? null;

    return c.json(
      status === 409
        ? envelopeError({
            correlationId,
            conflict,
            error: {
              code: "sync_conflict",
              message: "One or more mutations conflicted"
            }
          })
        : envelopeSuccess({
            correlationId,
            conflict,
            data: result
          }),
      status
    );
  });

  api.post("/sync/conflict/resolve", requireSession(), async (c) => {
    const correlationId = c.get("correlationId");
    const user = getSessionUser(c);
    const body = await parseJsonBody(c.req.raw, resolveConflictSchema);

    const resolved = await store.resolveSyncConflict({
      actor: user,
      jobUid: body.job_uid,
      strategy: body.strategy,
      serverRowVersion: body.server_row_version,
      clientRowVersion: body.client_row_version,
      ...(body.merge_patch ? { mergePatch: body.merge_patch } : {}),
      ctx: createStoreContext(user.user_uid, correlationId)
    });

    if (resolved.conflict) {
      return c.json(rowVersionConflictResponse(correlationId, resolved.job.row_version, resolved.conflict), 409);
    }

    return c.json(
      envelopeSuccess({
        correlationId,
        rowVersion: resolved.job.row_version,
        data: resolved.job
      })
    );
  });

  api.post("/workspace/gmail/notify", requireSession(), requireRoles("dispatcher", "admin"), async (c) => {
    const correlationId = c.get("correlationId");
    const user = getSessionUser(c);
    const body = await parseJsonBody(c.req.raw, gmailNotifySchema);

    const result = await config.rails.gmail.sendNotification({
      to: body.to,
      subject: body.subject,
      body: body.body
    });

    await store.appendAudit({
      action: "workspace.gmail.notify",
      payload: body,
      ctx: createStoreContext(user.user_uid, correlationId)
    });

    return c.json(
      envelopeSuccess({
        correlationId,
        data: result
      })
    );
  });

  api.post("/workspace/chat/alert", requireSession(), requireRoles("dispatcher", "admin"), async (c) => {
    const correlationId = c.get("correlationId");
    const user = getSessionUser(c);
    const body = await parseJsonBody(c.req.raw, chatAlertSchema);

    await config.rails.chat.sendAlert({
      severity: body.severity,
      message: body.message
    });

    await store.appendAudit({
      action: "workspace.chat.alert",
      payload: body,
      ctx: createStoreContext(user.user_uid, correlationId)
    });

    return c.json(
      envelopeSuccess({
        correlationId,
        data: {
          sent: true
        }
      })
    );
  });

  api.post("/workspace/people/sync", requireSession(), requireRoles("dispatcher", "admin"), async (c) => {
    const correlationId = c.get("correlationId");
    const user = getSessionUser(c);
    const body = await parseJsonBody(c.req.raw, peopleSyncSchema);

    const result = await config.rails.people.syncContact({
      name: body.name,
      email: body.email,
      phone: body.phone,
      ...(body.role_hint ? { roleHint: body.role_hint } : {})
    });

    await store.appendAudit({
      action: "workspace.people.sync",
      payload: body,
      ctx: createStoreContext(user.user_uid, correlationId)
    });

    return c.json(
      envelopeSuccess({
        correlationId,
        data: result
      })
    );
  });

  api.get("/workspace/people", requireSession(), requireRoles("dispatcher", "admin"), async (c) => {
    const correlationId = c.get("correlationId");
    const users = await store.listUsers();
    const activeUsers = users
      .filter((row) => row.active === "true")
      .sort((a, b) => a.display_name.localeCompare(b.display_name));

    return c.json(
      envelopeSuccess({
        correlationId,
        data: activeUsers
      })
    );
  });

  api.get("/workspace/upgrade/state", requireSession(), requireRoles("dispatcher", "admin", "finance"), async (c) => {
    const correlationId = c.get("correlationId");
    const data = await store.getUpgradeWorkspaceState();
    return c.json(
      envelopeSuccess({
        correlationId,
        data
      })
    );
  });

  api.post("/workspace/upgrade/quotes", requireSession(), requireRoles("finance", "admin"), async (c) => {
    const correlationId = c.get("correlationId");
    const user = getSessionUser(c);
    const body = await parseJsonBody(c.req.raw, financeQuoteCreateSchema);
    const quote = {
      quote_uid: `QTE-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
      job_uid: body.job_uid,
      client_uid: body.client_uid,
      description: body.description,
      amount: body.amount,
      status: "draft" as const,
      created_at: nowIso(),
      ...createMutable(user.user_uid, correlationId)
    };

    await store.createFinanceQuote(quote);
    await store.appendAudit({
      action: "workspace.upgrade.finance.quote.create",
      payload: quote,
      ctx: createStoreContext(user.user_uid, correlationId)
    });

    return c.json(envelopeSuccess({ correlationId, rowVersion: quote.row_version, data: quote }));
  });

  api.post("/workspace/upgrade/quotes/:quote_uid/status", requireSession(), requireRoles("finance", "admin"), async (c) => {
    const correlationId = c.get("correlationId");
    const user = getSessionUser(c);
    const quote_uid = c.req.param("quote_uid");
    const body = await parseJsonBody(c.req.raw, financeQuoteStatusSchema);
    const updated = await store.updateFinanceQuoteStatus({
      quote_uid,
      status: body.status,
      ctx: createStoreContext(user.user_uid, correlationId)
    });
    if (!updated) {
      return c.json(
        envelopeError({
          correlationId,
          error: { code: "not_found", message: "Quote not found" }
        }),
        404
      );
    }
    return c.json(envelopeSuccess({ correlationId, rowVersion: updated.row_version, data: updated }));
  });

  api.post("/workspace/upgrade/invoices/from-quote", requireSession(), requireRoles("finance", "admin"), async (c) => {
    const correlationId = c.get("correlationId");
    const user = getSessionUser(c);
    const body = await parseJsonBody(c.req.raw, financeInvoiceFromQuoteSchema);
    const quotes = await store.listFinanceQuotes();
    const quote = quotes.find((item) => item.quote_uid === body.quote_uid) ?? null;
    if (!quote) {
      return c.json(
        envelopeError({
          correlationId,
          error: { code: "not_found", message: "Quote not found" }
        }),
        404
      );
    }

    const invoice = {
      invoice_uid: `INV-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
      job_uid: quote.job_uid,
      quote_uid: quote.quote_uid,
      client_uid: quote.client_uid,
      amount: quote.amount,
      due_date: body.due_date,
      status: "issued" as const,
      reconciled_at: "",
      ...createMutable(user.user_uid, correlationId)
    };

    await store.createFinanceInvoice(invoice);
    await store.updateFinanceQuoteStatus({
      quote_uid: quote.quote_uid,
      status: "invoiced",
      ctx: createStoreContext(user.user_uid, correlationId)
    });

    return c.json(envelopeSuccess({ correlationId, rowVersion: invoice.row_version, data: invoice }));
  });

  api.post("/workspace/upgrade/invoices/:invoice_uid/reconcile", requireSession(), requireRoles("finance", "admin"), async (c) => {
    const correlationId = c.get("correlationId");
    const user = getSessionUser(c);
    const invoice_uid = c.req.param("invoice_uid");
    const invoices = await store.listFinanceInvoices();
    const current = invoices.find((item) => item.invoice_uid === invoice_uid) ?? null;
    if (!current) {
      return c.json(
        envelopeError({
          correlationId,
          error: { code: "not_found", message: "Invoice not found" }
        }),
        404
      );
    }

    const updated = {
      ...current,
      status: "paid" as const,
      reconciled_at: nowIso(),
      ...bumpMutableMeta(current, user.user_uid, correlationId)
    };
    await store.updateFinanceInvoice(updated);

    const escrowRows = await store.listEscrowRows();
    for (const escrow of escrowRows.filter((item) => item.invoice_uid === invoice_uid && item.status === "locked")) {
      await store.upsertEscrow({
        ...escrow,
        status: "released",
        released_at: nowIso(),
        ...bumpMutableMeta(escrow, user.user_uid, correlationId)
      });
    }

    return c.json(envelopeSuccess({ correlationId, rowVersion: updated.row_version, data: updated }));
  });

  api.post("/workspace/upgrade/escrow/lock", requireSession(), requireRoles("finance", "admin"), async (c) => {
    const correlationId = c.get("correlationId");
    const user = getSessionUser(c);
    const body = await parseJsonBody(c.req.raw, financeEscrowLockSchema);
    const existing = await store.getEscrowByDocument(body.document_uid);
    const row = {
      document_uid: body.document_uid,
      invoice_uid: body.invoice_uid,
      status: "locked" as const,
      locked_at: existing?.locked_at || nowIso(),
      released_at: "",
      ...(existing
        ? bumpMutableMeta(existing, user.user_uid, correlationId)
        : createMutable(user.user_uid, correlationId))
    };
    await store.upsertEscrow(row);
    return c.json(envelopeSuccess({ correlationId, rowVersion: row.row_version, data: row }));
  });

  api.get("/workspace/upgrade/escrow/:document_uid", requireSession(), requireRoles("dispatcher", "admin", "finance"), async (c) => {
    const correlationId = c.get("correlationId");
    const document_uid = c.req.param("document_uid");
    const row = await store.getEscrowByDocument(document_uid);
    return c.json(envelopeSuccess({ correlationId, data: row }));
  });

  api.put("/workspace/upgrade/skills/:user_uid", requireSession(), requireRoles("dispatcher", "admin", "finance"), async (c) => {
    const correlationId = c.get("correlationId");
    const user = getSessionUser(c);
    const user_uid = c.req.param("user_uid");
    const body = await parseJsonBody(c.req.raw, skillMatrixUpsertSchema);
    const skills = await store.listSkillMatrix();
    const existing = skills.find((item) => item.user_uid === user_uid) ?? null;
    const row = {
      user_uid,
      saqcc_type: body.saqcc_type ?? "",
      saqcc_expiry: body.saqcc_expiry ?? "",
      medical_expiry: body.medical_expiry ?? "",
      rest_hours_last_24h: body.rest_hours_last_24h,
      ...(existing
        ? bumpMutableMeta(existing, user.user_uid, correlationId)
        : createMutable(user.user_uid, correlationId))
    };
    await store.upsertSkillMatrix(row);
    return c.json(envelopeSuccess({ correlationId, rowVersion: row.row_version, data: row }));
  });

  api.post("/workspace/upgrade/analytics/rebuild", requireSession(), requireRoles("finance", "admin"), async (c) => {
    const correlationId = c.get("correlationId");
    const user = getSessionUser(c);
    const invoices = await store.listFinanceInvoices();
    const byClient = new Map<string, FinanceInvoiceRow[]>();
    for (const invoice of invoices) {
      const list = byClient.get(invoice.client_uid) ?? [];
      list.push(invoice);
      byClient.set(invoice.client_uid, list);
    }

    const debtors: FinanceDebtorRow[] = [];
    const statements: FinanceStatementRow[] = [];
    const today = Date.now();
    const period = nowIso().slice(0, 7);

    for (const [client_uid, rows] of byClient.entries()) {
      let total = 0;
      let c0 = 0;
      let c30 = 0;
      let c60 = 0;
      let c90 = 0;
      let billed = 0;
      let paid = 0;

      for (const invoice of rows) {
        billed += invoice.amount;
        if (invoice.status === "paid") {
          paid += invoice.amount;
          continue;
        }
        total += invoice.amount;
        const ageDays = Math.floor((today - Date.parse(invoice.due_date)) / 86400000);
        if (ageDays <= 0) c0 += invoice.amount;
        else if (ageDays <= 30) c30 += invoice.amount;
        else if (ageDays <= 60) c60 += invoice.amount;
        else c90 += invoice.amount;
      }

      const risk_band: FinanceDebtorRow["risk_band"] = c90 > 0 ? "high" : c60 > 0 ? "medium" : "low";
      debtors.push({
        client_uid,
        total_due: total,
        current_bucket: c0,
        bucket_30: c30,
        bucket_60: c60,
        bucket_90_plus: c90,
        risk_band,
        ...createMutable(user.user_uid, correlationId)
      });

      const safeClient = client_uid.replace(/[^A-Za-z0-9]/g, "").slice(0, 10).toUpperCase();
      statements.push({
        statement_uid: `STM-${period.replace("-", "")}-${safeClient || "CLIENT"}`,
        client_uid,
        period_label: period,
        opening_balance: Math.max(0, total - billed + paid),
        billed,
        paid,
        closing_balance: total,
        generated_at: nowIso(),
        ...createMutable(user.user_uid, correlationId)
      });
    }

    await store.replaceFinanceDebtors(debtors);
    await store.replaceFinanceStatements(statements);

    return c.json(
      envelopeSuccess({
        correlationId,
        data: {
          debtors: debtors.length,
          statements: statements.length
        }
      })
    );
  });

  api.get("/workspace/dispatch-context", requireSession(), requireRoles("dispatcher", "admin"), async (c) => {
    const correlationId = c.get("correlationId");
    const user = getSessionUser(c);
    const jobUid = (c.req.query("job_uid") ?? "").trim();

    if (jobUid === "") {
      return c.json(
        envelopeError({
          correlationId,
          error: {
            code: "validation_error",
            message: "job_uid query parameter is required"
          }
        }),
        400
      );
    }

    const job = await store.getJob(jobUid);
    if (!job) {
      return c.json(
        envelopeError({
          correlationId,
          error: {
            code: "not_found",
            message: "Job not found"
          }
        }),
        404
      );
    }

    if (!canReadJob(user, job)) {
      return c.json(
        envelopeError({
          correlationId,
          error: {
            code: "forbidden",
            message: "Ownership check failed"
          }
        }),
        403
      );
    }

    const [requests, schedules, documents, users] = await Promise.all([
      store.listScheduleRequests(jobUid),
      store.listSchedules(jobUid),
      store.listDocuments(jobUid),
      store.listUsers()
    ]);

    const technicians = users
      .filter((row) => row.active === "true" && row.role === "technician")
      .sort((a, b) => a.display_name.localeCompare(b.display_name));

    return c.json(
      envelopeSuccess({
        correlationId,
        data: {
          requests,
          schedules,
          documents,
          technicians
        }
      })
    );
  });

  api.get("/admin/health", requireSession(), requireRoles("admin"), async (c) => {
    const correlationId = c.get("correlationId");
    const health = {
      status: "ok",
      mode: config.mode,
      rails_mode: config.rails.mode,
      timestamp: new Date().toISOString()
    };

    return c.json(
      envelopeSuccess({
        correlationId,
        data: health
      })
    );
  });

  api.get("/admin/audits", requireSession(), requireRoles("admin"), async (c) => {
    const correlationId = c.get("correlationId");
    const user = getSessionUser(c);
    if (!canUseAdmin(user.role)) {
      return c.json(
        envelopeError({
          correlationId,
          error: { code: "forbidden", message: "Admin role required" }
        }),
        403
      );
    }

    const audits = await store.listAudits();
    return c.json(
      envelopeSuccess({
        correlationId,
        data: audits
      })
    );
  });

  api.get("/admin/automation-jobs", requireSession(), requireRoles("admin"), async (c) => {
    const correlationId = c.get("correlationId");
    const jobs = await store.listAutomationJobs();
    return c.json(
      envelopeSuccess({
        correlationId,
        data: jobs
      })
    );
  });

  api.post("/admin/retries/:automation_job_uid", requireSession(), requireRoles("admin"), async (c) => {
    const correlationId = c.get("correlationId");
    const user = getSessionUser(c);
    const automationJobUid = c.req.param("automation_job_uid");
    const automationJob = await store.getAutomationJob(automationJobUid);

    if (!automationJob) {
      return c.json(
        envelopeError({
          correlationId,
          error: {
            code: "not_found",
            message: "Automation job not found"
          }
        }),
        404
      );
    }

    const updated = {
      ...automationJob,
      status: "queued" as const,
      retry_count: automationJob.retry_count + 1,
      last_error: "",
      ...bumpMutableMeta(automationJob, user.user_uid, correlationId)
    };

    await store.upsertAutomationJob(updated);
    await store.appendAudit({
      action: "admin.automation.retry",
      payload: {
        automation_job_uid: automationJobUid,
        retry_count: updated.retry_count,
        trigger_user_uid: user.user_uid
      },
      ctx: createStoreContext(user.user_uid, correlationId)
    });

    return c.json(
      envelopeSuccess({
        correlationId,
        rowVersion: updated.row_version,
        data: updated
      })
    );
  });

  app.route("/api/v1", api);

  // Fallback to static assets for non-API routes.
  // run_worker_first = ["*"] in wrangler.toml means ALL requests now enter the
  // worker. This catch-all proxies non-API GET requests to the Cloudflare Assets
  // binding so the CDN continues to serve static files, while the middleware stack
  // above (apiSecurityHeadersMiddleware) has already set the correct security
  // headers including Cross-Origin-Opener-Policy: same-origin-allow-popups.
  app.get("*", async (c) => {
    // API routes that reach this point have no registered handler — 404.
    if (c.req.path.startsWith("/api/")) {
      return c.json(
        envelopeError({
          correlationId: c.get("correlationId"),
          error: { code: "not_found", message: "API endpoint not found" }
        }),
        404
      );
    }

    // Fetch the static asset from the CDN binding.
    // GUARD: ASSETS binding must be declared via `binding = "ASSETS"` in the
    // [assets] section of wrangler.toml. If undefined, the deployment config is
    // missing the explicit binding declaration — not a runtime code error.
    if (!c.env.ASSETS) {
      return c.json(
        envelopeError({
          correlationId: c.get("correlationId"),
          error: {
            code: "assets_binding_unavailable",
            message: "Static assets binding is not configured. Ensure `binding = \"ASSETS\"` is declared in wrangler.toml [assets]."
          }
        }),
        503
      );
    }

    let assetResponse = await c.env.ASSETS.fetch(c.req.raw);

    // SPA Fallback routing for React apps (Site and Portal)
    if (assetResponse.status === 404 && c.req.method === "GET") {
      const isApi = c.req.path.startsWith("/api/");
      if (!isApi) {
        const fallbackUrl = new URL(c.req.url);
        const isPortal = c.req.path.startsWith("/portal/");
        fallbackUrl.pathname = isPortal ? "/portal/index.html" : "/index.html";
        const fallbackReq = new Request(fallbackUrl.toString(), c.req.raw);
        assetResponse = await c.env.ASSETS.fetch(fallbackReq);
      }
    }

    // IMPORTANT: The ASSETS binding returns a Response whose Headers object is
    // immutable (Web API spec). We must clone it and explicitly merge in the
    // security headers that apiSecurityHeadersMiddleware set via c.header().
    // Without this clone, COOP and other security headers are silently dropped
    // for all static asset responses including the portal index.html.
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

const runtimeAppCache = new Map<string, Hono<AppBindings>>();
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
    try {
      const runtimeEnv = parseEnvBindings(env);
      if (Object.keys(runtimeEnv).length > 0) {
        return getRuntimeApp(runtimeEnv).fetch(request, env);
      }
      return getProcessEnvApp().fetch(request, env);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(
        JSON.stringify({
          timestamp: new Date().toISOString(),
          level: "error",
          event: "api.bootstrap.failed",
          message,
          stack: error instanceof Error ? error.stack : undefined
        })
      );
      return new Response(
        JSON.stringify({
          ok: false,
          error: {
            code: "bootstrap_error",
            message: "API bootstrap failed"
          }
        }),
        {
          status: 500,
          headers: {
            "content-type": "application/json; charset=utf-8"
          }
        }
      );
    }
  }
};
