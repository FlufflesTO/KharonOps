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
  type JobEventRow,
  type JobRow,
  type ScheduleRequestRow,
  type ScheduleRow,
  type SyncQueueRow,
  type UpgradeWorkspaceState,
  type UserRow
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
import type { WorkbookStore } from "./store/types.js";
import { buildNameLookups } from "./services/nameEnrichment.js";
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

type KvLikeNamespace = {
  get: (key: string) => Promise<string | null>;
  put: (key: string, value: string, options?: { expirationTtl?: number }) => Promise<void>;
};

const memoryCache = new Map<string, { expiresAt: number; value: string }>();
let memoryCacheVersion = 1;

function getKvNamespace(env: AppBindings["Bindings"] | undefined): KvLikeNamespace | null {
  if (!env) return null;
  const candidate = env.KHARON_CACHE as Partial<KvLikeNamespace> | undefined;
  if (candidate && typeof candidate.get === "function" && typeof candidate.put === "function") {
    return candidate as KvLikeNamespace;
  }
  return null;
}

async function getCacheVersion(env: AppBindings["Bindings"] | undefined): Promise<number> {
  const kv = getKvNamespace(env);
  if (!kv) {
    return memoryCacheVersion;
  }
  try {
    const raw = await kv.get("cache:workspace:version");
    const parsed = Number(raw ?? "1");
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }
    await kv.put("cache:workspace:version", "1");
    return 1;
  } catch (error) {
    console.error("KV getCacheVersion failed, falling back to memory:", error);
    return memoryCacheVersion;
  }
}

async function bumpCacheVersion(env: AppBindings["Bindings"] | undefined): Promise<void> {
  const kv = getKvNamespace(env);
  if (!kv) {
    memoryCacheVersion += 1;
    memoryCache.clear();
    return;
  }
  try {
    const current = await getCacheVersion(env);
    await kv.put("cache:workspace:version", String(current + 1));
  } catch (error) {
    console.error("KV bumpCacheVersion failed, falling back to memory:", error);
    memoryCacheVersion += 1;
    memoryCache.clear();
  }
}

async function getCachedJson<T>(env: AppBindings["Bindings"] | undefined, key: string): Promise<T | null> {
  const kv = getKvNamespace(env);
  if (!kv) {
    const hit = memoryCache.get(key);
    if (!hit || hit.expiresAt < Date.now()) {
      return null;
    }
    return JSON.parse(hit.value) as T;
  }
  try {
    const value = await kv.get(key);
    if (!value) {
      return null;
    }
    return JSON.parse(value) as T;
  } catch (error) {
    console.error("KV getCachedJson failed:", error);
    return null;
  }
}

async function putCachedJson(env: AppBindings["Bindings"] | undefined, key: string, value: unknown, ttlSeconds = 60): Promise<void> {
  const payload = JSON.stringify(value);
  const kv = getKvNamespace(env);
  if (!kv) {
    memoryCache.set(key, { value: payload, expiresAt: Date.now() + ttlSeconds * 1000 });
    return;
  }
  try {
    // Cloudflare KV requires a minimum of 60 seconds for expirationTtl
    const finalTtl = Math.max(60, ttlSeconds);
    await kv.put(key, payload, { expirationTtl: finalTtl });
  } catch (error) {
    console.error("KV putCachedJson failed, falling back to memory:", error);
    memoryCache.set(key, { value: payload, expiresAt: Date.now() + ttlSeconds * 1000 });
  }
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

    // Local dev tokens can point to a specific seeded user_id so role simulation
    // continues to work even when all users share one mailbox address.
    if (config.mode === "local" && identity.localUserid) {
      const users = await store.listUsers();
      userRow = users.find((row) => row.user_id === identity.localUserid && row.active === "true") ?? null;
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
      user_id: userRow.user_id,
      email: userRow.email,
      role: userRow.role,
      display_name: userRow.display_name,
      client_id: userRow.client_id,
      technician_id: userRow.technician_id
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

  // ---------------------------------------------------------------------------
  // Name-enrichment helper — shared by GET /jobs and GET /jobs/:job_id
  // ---------------------------------------------------------------------------

  /**
   * Fetch clients, technicians, and users in parallel with graceful
   * degradation. If any reference-sheet fetch fails, we log a warning
   * and degrade to an empty list — the endpoint still returns job data,
   * just without enriched names.
   */
  async function fetchNameSources(store: WorkbookStore): Promise<{
    clients: Awaited<ReturnType<WorkbookStore["listClients"]>>;
    technicians: Awaited<ReturnType<WorkbookStore["listTechnicians"]>>;
    users: Awaited<ReturnType<WorkbookStore["listUsers"]>>;
  }> {
    const [clientsResult, techniciansResult, usersResult] = await Promise.allSettled([
      store.listClients(),
      store.listTechnicians(),
      store.listUsers()
    ]);

    const clients = clientsResult.status === "fulfilled" ? clientsResult.value : [];
    if (clientsResult.status === "rejected") {
      console.warn("[name-enrichment] listClients failed, degrading gracefully:", clientsResult.reason);
    }

    const technicians = techniciansResult.status === "fulfilled" ? techniciansResult.value : [];
    if (techniciansResult.status === "rejected") {
      console.warn("[name-enrichment] listTechnicians failed, degrading gracefully:", techniciansResult.reason);
    }

    const users = usersResult.status === "fulfilled" ? usersResult.value : [];
    if (usersResult.status === "rejected") {
      console.warn("[name-enrichment] listUsers failed, degrading gracefully:", usersResult.reason);
    }

    return { clients, technicians, users };
  }

  function detectSchemaDrift(args: {
    jobs: JobRow[];
    users: Awaited<ReturnType<WorkbookStore["listUsers"]>>;
    clients: Awaited<ReturnType<WorkbookStore["listClients"]>>;
    technicians: Awaited<ReturnType<WorkbookStore["listTechnicians"]>>;
  }): {
    healthy: boolean;
    issues: Array<{ code: string; severity: "warning" | "critical"; detail: string }>;
  } {
    const issues: Array<{ code: string; severity: "warning" | "critical"; detail: string }> = [];

    const missingJobIds = args.jobs.filter((row) => row.job_id.trim() === "").length;
    if (missingJobIds > 0) {
      issues.push({
        code: "jobs_missing_id",
        severity: "critical",
        detail: `${missingJobIds} job row(s) are missing job_id`
      });
    }

    const missingClientRefs = args.jobs.filter((row) => row.client_id.trim() === "").length;
    if (missingClientRefs > 0) {
      issues.push({
        code: "jobs_missing_client_id",
        severity: "warning",
        detail: `${missingClientRefs} job row(s) are missing client_id`
      });
    }

    const missingUserIds = args.users.filter((row) => row.user_id.trim() === "").length;
    if (missingUserIds > 0) {
      issues.push({
        code: "users_missing_id",
        severity: "critical",
        detail: `${missingUserIds} user row(s) are missing user_id`
      });
    }

    const missingClientNames = args.clients.filter((row) => row.client_name.trim() === "").length;
    if (missingClientNames > 0) {
      issues.push({
        code: "clients_missing_name",
        severity: "warning",
        detail: `${missingClientNames} client row(s) are missing client_name`
      });
    }

    const missingTechnicianNames = args.technicians.filter((row) => row.display_name.trim() === "").length;
    if (missingTechnicianNames > 0) {
      issues.push({
        code: "technicians_missing_name",
        severity: "warning",
        detail: `${missingTechnicianNames} technician row(s) are missing display_name`
      });
    }

    return {
      healthy: !issues.some((issue) => issue.severity === "critical"),
      issues
    };
  }

  async function assertComplianceGuardrails(job: JobRow, nextStatus: JobRow["status"], correlationId: string): Promise<string | null> {
    if (nextStatus === "performed" && job.technician_id.trim() === "") {
      return "A technician must be assigned before marking a job as performed.";
    }
    if (nextStatus === "certified") {
      const documents = await store.listDocuments(job.job_id);
      const hasCertificate = documents.some((document) => document.document_type === "certificate");
      if (!hasCertificate) {
        return "Generate a certificate document before setting job status to certified.";
      }
      const lockedEscrow = await store.getEscrowByDocument(
        documents.find((document) => document.document_type === "certificate")?.document_id ?? ""
      );
      if (lockedEscrow?.status === "locked") {
        return "Certificate escrow is locked. Reconcile the related invoice before certification.";
      }
    }
    await store.appendAudit({
      action: "compliance.guardrail.check",
      payload: {
        job_id: job.job_id,
        next_status: nextStatus,
        result: "pass"
      },
      ctx: createStoreContext("system:guardrail", correlationId),
      entry_type: "compliance_guardrail"
    });
    return null;
  }

  api.get("/jobs", requireSession(), async (c) => {
    const correlationId = c.get("correlationId");
    const user = getSessionUser(c);
    const version = await getCacheVersion(c.env);
    const cacheKey = `jobs:${version}:${user.user_id}:${user.role}`;
    const cached = await getCachedJson<Array<Record<string, unknown>>>(c.env, cacheKey);

    if (cached) {
      return c.json(
        envelopeSuccess({
          correlationId,
          data: cached
        })
      );
    }

    const [jobs, sources] = await Promise.all([
      store.listJobsForUser(user),
      fetchNameSources(store)
    ]);

    const { clientNameByid, technicianNameByid } = buildNameLookups(sources);

    const enrichedJobs = jobs.map((job) => ({
      ...job,
      client_name: clientNameByid.get(job.client_id) ?? "",
      technician_name: technicianNameByid.get(job.technician_id) ?? ""
    }));

    await putCachedJson(c.env, cacheKey, enrichedJobs, 60);

    return c.json(
      envelopeSuccess({
        correlationId,
        data: enrichedJobs
      })
    );
  });

  api.get("/jobs/:job_id", requireSession(), async (c) => {
    const correlationId = c.get("correlationId");
    const user = getSessionUser(c);
    const jobid = c.req.param("job_id");
    const job = await store.getJob(jobid);

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

    // Enrich the single-job view using the shared name-lookup helper.
    const sources = await fetchNameSources(store);
    const { clientNameByid, technicianNameByid } = buildNameLookups(sources);

    const enrichedJob = {
      ...job,
      client_name: clientNameByid.get(job.client_id) ?? "",
      technician_name: technicianNameByid.get(job.technician_id) ?? ""
    };

    return c.json(
      envelopeSuccess({
        correlationId,
        rowVersion: job.row_version,
        data: enrichedJob
      })
    );
  });

  api.post("/jobs/:job_id/status", requireSession(), async (c) => {
    const correlationId = c.get("correlationId");
    const user = getSessionUser(c);
    const jobid = c.req.param("job_id");
    const body = await parseJsonBody(c.req.raw, statusUpdateSchema);

    const existing = await store.getJob(jobid);
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

    const guardrailFailure = await assertComplianceGuardrails(existing, body.status, correlationId);
    if (guardrailFailure) {
      await store.appendAudit({
        action: "compliance.guardrail.block",
        payload: {
          job_id: existing.job_id,
          from_status: existing.status,
          to_status: body.status,
          reason: guardrailFailure
        },
        ctx: createStoreContext(user.user_id, correlationId),
        entry_type: "compliance_guardrail"
      });
      return c.json(
        envelopeError({
          correlationId,
          rowVersion: existing.row_version,
          error: {
            code: "compliance_guardrail_failed",
            message: guardrailFailure
          }
        }),
        400
      );
    }

    const update = await store.updateJobStatus({
      jobid,
      status: body.status,
      expectedRowVersion: body.row_version,
      ctx: createStoreContext(user.user_id, correlationId)
    });

    if (update.conflict) {
      return c.json(rowVersionConflictResponse(correlationId, update.job.row_version, update.conflict), 409);
    }

    if (user.role === "dispatcher" || user.role === "admin") {
      await store.appendAudit({
        action: "jobs.status.update",
        payload: {
          job_id: jobid,
          status: body.status,
          actor_role: user.role
        },
        ctx: createStoreContext(user.user_id, correlationId)
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

  api.post("/jobs/:job_id/note", requireSession(), async (c) => {
    const correlationId = c.get("correlationId");
    const user = getSessionUser(c);
    const jobid = c.req.param("job_id");
    const body = await parseJsonBody(c.req.raw, noteSchema);

    const existing = await store.getJob(jobid);
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
      jobid,
      note: body.note,
      expectedRowVersion: body.row_version,
      ctx: createStoreContext(user.user_id, correlationId)
    });

    if (update.conflict) {
      return c.json(rowVersionConflictResponse(correlationId, update.job.row_version, update.conflict), 409);
    }

    await store.appendAudit({
      action: "jobs.note.create",
      payload: {
        job_id: jobid,
        note_length: body.note.length
      },
      ctx: createStoreContext(user.user_id, correlationId)
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
    const job = await store.getJob(body.job_id);

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
        entity_id: job.job_id,
        client_row_version: body.row_version,
        server_row_version: job.row_version,
        server_state: job as unknown as Record<string, unknown>
      };
      return c.json(rowVersionConflictResponse(correlationId, job.row_version, conflict), 409);
    }

    const row: ScheduleRequestRow = {
      request_id: `REQ-${crypto.randomUUID()}`,
      job_id: body.job_id,
      client_id: job.client_id,
      preferred_slots_json: JSON.stringify(body.preferred_slots),
      timezone: body.timezone,
      notes: body.notes ?? "",
      status: "requested",
      ...createMutable(user.user_id, correlationId)
    };

    await store.createScheduleRequest(row);

    await store.appendAudit({
      action: "schedules.request",
      payload: {
        job_id: body.job_id,
        request_id: row.request_id
      },
      ctx: createStoreContext(user.user_id, correlationId)
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
    let request = await store.getScheduleRequest(body.request_id);
    if (!request && config.mode === "local" && body.job_id) {
      const fallbackJob = await store.getJob(body.job_id);
      if (fallbackJob) {
        request = {
          request_id: body.request_id,
          job_id: fallbackJob.job_id,
          client_id: fallbackJob.client_id,
          preferred_slots_json: JSON.stringify([{ start_at: body.start_at, end_at: body.end_at }]),
          timezone: "Africa/Johannesburg",
          notes: "auto-created fallback request",
          status: "requested",
          ...createMutable(user.user_id, correlationId)
        };
      }
    }

    if (!request) {
      return c.json(
        envelopeError({
          correlationId,
          error: {
            code: "not_found",
            message: "Schedule request not found. Create/request a slot first, then confirm using that request id."
          }
        }),
        404
      );
    }

    if (request.row_version !== body.row_version) {
      const conflict = {
        type: "row_version_conflict" as const,
        entity: "Schedule_Requests",
        entity_id: request.request_id,
        client_row_version: body.row_version,
        server_row_version: request.row_version,
        server_state: request as unknown as Record<string, unknown>
      };
      return c.json(rowVersionConflictResponse(correlationId, request.row_version, conflict), 409);
    }

    const scheduleid = `SCH-${crypto.randomUUID()}`;
    const calendar = await config.rails.calendar.confirmEvent({
      jobid: request.job_id,
      scheduleid,
      startAt: body.start_at,
      endAt: body.end_at,
      technicianid: body.technician_id
    });

    const updatedRequest: ScheduleRequestRow = {
      ...request,
      status: "confirmed",
      ...bumpMutableMeta(request, user.user_id, correlationId)
    };

    const schedule: ScheduleRow = {
      schedule_id: scheduleid,
      request_id: request.request_id,
      job_id: request.job_id,
      calendar_event_id: calendar.eventId,
      start_at: body.start_at,
      end_at: body.end_at,
      technician_id: body.technician_id,
      status: "confirmed",
      ...createMutable(user.user_id, correlationId)
    };

    await store.upsertScheduleRequest(updatedRequest);
    await store.createSchedule(schedule);

    await store.appendAudit({
      action: "schedules.confirm",
      payload: {
        request_id: request.request_id,
        schedule_id: schedule.schedule_id
      },
      ctx: createStoreContext(user.user_id, correlationId)
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
    let schedule = await store.getSchedule(body.schedule_id);
    if (!schedule && config.mode === "local" && body.job_id) {
      const fallbackJob = await store.getJob(body.job_id);
      schedule = {
        schedule_id: body.schedule_id,
        request_id: body.request_id ?? `REQ-${crypto.randomUUID()}`,
        job_id: body.job_id,
        calendar_event_id: body.calendar_event_id ?? "",
        start_at: body.start_at,
        end_at: body.end_at,
        technician_id: body.technician_id ?? fallbackJob?.technician_id ?? "TECH-001",
        status: "confirmed",
        ...createMutable(user.user_id, correlationId)
      };
    }

    if (!schedule) {
      return c.json(
        envelopeError({
          correlationId,
          error: {
            code: "not_found",
            message: "Schedule not found. Confirm a request first, then reschedule that schedule id."
          }
        }),
        404
      );
    }

    if (schedule.row_version !== body.row_version) {
      const conflict = {
        type: "row_version_conflict" as const,
        entity: "Schedules_Master",
        entity_id: schedule.schedule_id,
        client_row_version: body.row_version,
        server_row_version: schedule.row_version,
        server_state: schedule as unknown as Record<string, unknown>
      };
      return c.json(rowVersionConflictResponse(correlationId, schedule.row_version, conflict), 409);
    }

    const calendar = await config.rails.calendar.confirmEvent({
      jobid: schedule.job_id,
      scheduleid: schedule.schedule_id,
      startAt: body.start_at,
      endAt: body.end_at,
      technicianid: schedule.technician_id,
      existingEventId: schedule.calendar_event_id
    });

    const updated: ScheduleRow = {
      ...schedule,
      start_at: body.start_at,
      end_at: body.end_at,
      status: "rescheduled",
      calendar_event_id: calendar.eventId,
      ...bumpMutableMeta(schedule, user.user_id, correlationId)
    };

    await store.upsertSchedule(updated);

    await store.appendAudit({
      action: "schedules.reschedule",
      payload: {
        schedule_id: updated.schedule_id
      },
      ctx: createStoreContext(user.user_id, correlationId)
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
    const job = await store.getJob(body.job_id);
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

    const documentid = `DOC-${crypto.randomUUID()}`;
    const overrides = body.tokens ?? {};
    const users = await store.listUsers();
    const isGas = job.title.toLowerCase().includes("gas");
    const isFire = job.title.toLowerCase().includes("fire") || !isGas;
    const subType = isGas ? "gas" : "fire";

    const generated = await config.rails.docs.generateDocument({
      jobid: body.job_id,
      documentType: body.document_type,
      subType,
      tokens: buildDocumentTokens({
        documentid,
        documentType: body.document_type,
        job,
        actor: user,
        users,
        ...(Object.keys(overrides).length > 0 ? { overrides } : {})
      })
    });

    const document: JobDocumentRow = {
      document_id: documentid,
      job_id: body.job_id,
      document_type: body.document_type,
      status: "generated",
      drive_file_id: generated.drive_file_id,
      pdf_file_id: generated.pdf_file_id,
      published_url: "",
      client_visible: false,
      ...createMutable(user.user_id, correlationId)
    };


    await store.createDocument(document);

    await store.appendAudit({
      action: "documents.generate",
      payload: {
        job_id: body.job_id,
        document_id: documentid,
        document_type: body.document_type
      },
      ctx: createStoreContext(user.user_id, correlationId)
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
    let document = await store.getDocument(body.document_id);
    if (!document && config.mode === "local") {
      document = {
        document_id: body.document_id,
        job_id: body.job_id ?? "JOB-1001",
        document_type: body.document_type ?? "jobcard",
        status: "generated",
        drive_file_id: body.document_id,
        pdf_file_id: body.document_id,
        published_url: "",
        client_visible: body.client_visible ?? false,
        ...createMutable(user.user_id, correlationId)
      };

    }

    if (!document) {
      return c.json(
        envelopeError({
          correlationId,
          error: {
            code: "not_found",
            message: "Document not found. Generate a document first, then publish using that document id."
          }
        }),
        404
      );
    }

    if (document.row_version !== body.row_version) {
      const conflict = {
        type: "row_version_conflict" as const,
        entity: "Job_Documents",
        entity_id: document.document_id,
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
      ...bumpMutableMeta(document, user.user_id, correlationId)
    };

    await store.upsertDocument(updated);
    await store.appendAudit({
      action: "documents.publish",
      payload: {
        document_id: updated.document_id,
        published_url: updated.published_url
      },
      ctx: createStoreContext(user.user_id, correlationId)
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
    const jobid = c.req.query("job_id");

    const version = await getCacheVersion(c.env);
    const cacheKey = `doc_history:${version}:${user.user_id}:${jobid || "all"}`;
    const cached = await getCachedJson<JobDocumentRow[]>(c.env, cacheKey);
    
    if (cached) {
      return c.json(
        envelopeSuccess({
          correlationId,
          data: cached
        })
      );
    }

    const documents = await store.listDocuments(jobid);

    const internalDocumentRoles = new Set(["admin", "dispatcher", "finance", "super_admin"]);
    let data: JobDocumentRow[];

    if (internalDocumentRoles.has(String(user.role))) {
      data = documents;
    } else {
      const readableJobs = await store.listJobsForUser(user);
      const readableJobids = new Set(readableJobs.map((job) => job.job_id));

      // Non-internal roles only see documents that are published AND marked client_visible
      data = documents.filter((document) =>
        readableJobids.has(document.job_id) &&
        document.status === "published" &&
        document.client_visible === true
      );
    }

    await putCachedJson(c.env, cacheKey, data, 60);

    return c.json(
      envelopeSuccess({
        correlationId,
        data
      })
    );
  });

  api.get("/sync/pull", requireSession(), async (c) => {
    const correlationId = c.get("correlationId");
    const user = getSessionUser(c);
    const since = c.req.query("since") ?? "1970-01-01T00:00:00.000Z";

    // Use KV cache to reduce upstream pressure (GLOBAL-010/429 mitigation)
    const version = await getCacheVersion(c.env);
    const cacheKey = `sync_pull:${version}:${user.user_id}:${since}`;
    const cached = await getCachedJson<{ jobs: JobRow[]; queue: SyncQueueRow[]; events: JobEventRow[] }>(c.env, cacheKey);
    
    if (cached) {
      return c.json(
        envelopeSuccess({
          correlationId,
          data: cached
        })
      );
    }

    const pulled = await store.pullSyncData({
      actor: user,
      since
    });

    // Cache sync results for 60s (minimum KV TTL)
    await putCachedJson(c.env, cacheKey, pulled, 60);

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
      ctx: createStoreContext(user.user_id, correlationId)
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
      jobid: body.job_id,
      strategy: body.strategy,
      serverRowVersion: body.server_row_version,
      clientRowVersion: body.client_row_version,
      ...(body.merge_patch ? { mergePatch: body.merge_patch } : {}),
      ctx: createStoreContext(user.user_id, correlationId)
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
      ctx: createStoreContext(user.user_id, correlationId)
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
      ctx: createStoreContext(user.user_id, correlationId)
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
      ctx: createStoreContext(user.user_id, correlationId)
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
    const user = getSessionUser(c);
    const version = await getCacheVersion(c.env);
    const cacheKey = `people:${version}:${user.role}`;
    const cached = await getCachedJson<UserRow[]>(c.env, cacheKey);
    if (cached) {
      return c.json(
        envelopeSuccess({
          correlationId,
          data: cached
        })
      );
    }
    const users = await store.listUsers();
    const activeUsers = users
      .filter((row) => row.active === "true")
      .sort((a, b) => a.display_name.localeCompare(b.display_name));
    await putCachedJson(c.env, cacheKey, activeUsers, 60);

    return c.json(
      envelopeSuccess({
        correlationId,
        data: activeUsers
      })
    );
  });

  api.get("/workspace/upgrade/state", requireSession(), requireRoles("dispatcher", "admin", "finance"), async (c) => {
    const correlationId = c.get("correlationId");
    const user = getSessionUser(c);
    const version = await getCacheVersion(c.env);
    const cacheKey = `upgrade:${version}:${user.role}`;
    const cached = await getCachedJson<UpgradeWorkspaceState>(c.env, cacheKey);
    if (cached) {
      return c.json(
        envelopeSuccess({
          correlationId,
          data: cached
        })
      );
    }
    const data = await store.getUpgradeWorkspaceState();
    await putCachedJson(c.env, cacheKey, data, 60);
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
      quote_id: `QTE-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
      job_id: body.job_id,
      client_id: body.client_id,
      description: body.description,
      amount: body.amount,
      status: "draft" as const,
      created_at: nowIso(),
      ...createMutable(user.user_id, correlationId)
    };

    await store.createFinanceQuote(quote);
    await store.appendAudit({
      action: "workspace.upgrade.finance.quote.create",
      payload: quote,
      ctx: createStoreContext(user.user_id, correlationId)
    });

    return c.json(envelopeSuccess({ correlationId, rowVersion: quote.row_version, data: quote }));
  });

  api.post("/workspace/upgrade/quotes/:quote_id/status", requireSession(), requireRoles("finance", "admin"), async (c) => {
    const correlationId = c.get("correlationId");
    const user = getSessionUser(c);
    const quote_id = c.req.param("quote_id");
    const body = await parseJsonBody(c.req.raw, financeQuoteStatusSchema);
    const updated = await store.updateFinanceQuoteStatus({
      quote_id,
      status: body.status,
      ctx: createStoreContext(user.user_id, correlationId)
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
    const quote = quotes.find((item) => item.quote_id === body.quote_id) ?? null;
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
      invoice_id: `INV-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
      job_id: quote.job_id,
      quote_id: quote.quote_id,
      client_id: quote.client_id,
      amount: quote.amount,
      due_date: body.due_date,
      status: "issued" as const,
      reconciled_at: "",
      ...createMutable(user.user_id, correlationId)
    };

    await store.createFinanceInvoice(invoice);
    await store.updateFinanceQuoteStatus({
      quote_id: quote.quote_id,
      status: "invoiced",
      ctx: createStoreContext(user.user_id, correlationId)
    });

    return c.json(envelopeSuccess({ correlationId, rowVersion: invoice.row_version, data: invoice }));
  });

  api.post("/workspace/upgrade/invoices/:invoice_id/reconcile", requireSession(), requireRoles("finance", "admin"), async (c) => {
    const correlationId = c.get("correlationId");
    const user = getSessionUser(c);
    const invoice_id = c.req.param("invoice_id");
    const invoices = await store.listFinanceInvoices();
    const current = invoices.find((item) => item.invoice_id === invoice_id) ?? null;
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
      ...bumpMutableMeta(current, user.user_id, correlationId)
    };
    await store.updateFinanceInvoice(updated);

    const escrowRows = await store.listEscrowRows();
    for (const escrow of escrowRows.filter((item) => item.invoice_id === invoice_id && item.status === "locked")) {
      await store.upsertEscrow({
        ...escrow,
        status: "released",
        released_at: nowIso(),
        ...bumpMutableMeta(escrow, user.user_id, correlationId)
      });
    }

    return c.json(envelopeSuccess({ correlationId, rowVersion: updated.row_version, data: updated }));
  });

  api.post("/workspace/upgrade/escrow/lock", requireSession(), requireRoles("finance", "admin"), async (c) => {
    const correlationId = c.get("correlationId");
    const user = getSessionUser(c);
    const body = await parseJsonBody(c.req.raw, financeEscrowLockSchema);
    const existing = await store.getEscrowByDocument(body.document_id);
    const row = {
      document_id: body.document_id,
      invoice_id: body.invoice_id,
      status: "locked" as const,
      locked_at: existing?.locked_at || nowIso(),
      released_at: "",
      ...(existing
        ? bumpMutableMeta(existing, user.user_id, correlationId)
        : createMutable(user.user_id, correlationId))
    };
    await store.upsertEscrow(row);
    return c.json(envelopeSuccess({ correlationId, rowVersion: row.row_version, data: row }));
  });

  api.get("/workspace/upgrade/escrow/:document_id", requireSession(), requireRoles("dispatcher", "admin", "finance"), async (c) => {
    const correlationId = c.get("correlationId");
    const document_id = c.req.param("document_id");
    const row = await store.getEscrowByDocument(document_id);
    return c.json(envelopeSuccess({ correlationId, data: row }));
  });

  api.put("/workspace/upgrade/skills/:user_id", requireSession(), requireRoles("dispatcher", "admin", "finance"), async (c) => {
    const correlationId = c.get("correlationId");
    const user = getSessionUser(c);
    const user_id = c.req.param("user_id");
    const body = await parseJsonBody(c.req.raw, skillMatrixUpsertSchema);
    const skills = await store.listSkillMatrix();
    const existing = skills.find((item) => item.user_id === user_id) ?? null;
    const row = {
      user_id,
      saqcc_type: body.saqcc_type ?? "",
      saqcc_expiry: body.saqcc_expiry ?? "",
      medical_expiry: body.medical_expiry ?? "",
      rest_hours_last_24h: body.rest_hours_last_24h,
      ...(existing
        ? bumpMutableMeta(existing, user.user_id, correlationId)
        : createMutable(user.user_id, correlationId))
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
      const list = byClient.get(invoice.client_id) ?? [];
      list.push(invoice);
      byClient.set(invoice.client_id, list);
    }

    const debtors: FinanceDebtorRow[] = [];
    const statements: FinanceStatementRow[] = [];
    const today = Date.now();
    const period = nowIso().slice(0, 7);

    for (const [client_id, rows] of byClient.entries()) {
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
        client_id,
        total_due: total,
        current_bucket: c0,
        bucket_30: c30,
        bucket_60: c60,
        bucket_90_plus: c90,
        risk_band,
        ...createMutable(user.user_id, correlationId)
      });

      const safeClient = client_id.replace(/[^A-Za-z0-9]/g, "").slice(0, 10).toUpperCase();
      statements.push({
        statement_id: `STM-${period.replace("-", "")}-${safeClient || "CLIENT"}`,
        client_id,
        period_label: period,
        opening_balance: Math.max(0, total - billed + paid),
        billed,
        paid,
        closing_balance: total,
        generated_at: nowIso(),
        ...createMutable(user.user_id, correlationId)
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
    const jobid = (c.req.query("job_id") ?? "").trim();

    if (jobid === "") {
      return c.json(
        envelopeError({
          correlationId,
          error: {
            code: "validation_error",
            message: "job_id query parameter is required"
          }
        }),
        400
      );
    }

    const job = await store.getJob(jobid);
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

    const version = await getCacheVersion(c.env);
    const cacheKey = `dispatch:${version}:${jobid}:${user.user_id}`;
    const cached = await getCachedJson<{
      requests: ScheduleRequestRow[];
      schedules: ScheduleRow[];
      documents: JobDocumentRow[];
      technicians: UserRow[];
    }>(c.env, cacheKey);
    if (cached) {
      return c.json(
        envelopeSuccess({
          correlationId,
          data: cached
        })
      );
    }

    const [requests, schedules, documents, users] = await Promise.all([
      store.listScheduleRequests(jobid),
      store.listSchedules(jobid),
      store.listDocuments(jobid),
      store.listUsers()
    ]);

    const technicians = users
      .filter((row) => row.active === "true" && row.role === "technician")
      .sort((a, b) => a.display_name.localeCompare(b.display_name));
    const payload = {
      requests,
      schedules,
      documents,
      technicians
    };
    await putCachedJson(c.env, cacheKey, payload, 60);

    return c.json(
      envelopeSuccess({
        correlationId,
        data: payload
      })
    );
  });

  api.get("/workspace/schema-drift", requireSession(), requireRoles("dispatcher", "admin", "finance"), async (c) => {
    const correlationId = c.get("correlationId");
    const user = getSessionUser(c);
    const [jobs, users, clients, technicians] = await Promise.all([
      store.listJobsForUser(user),
      store.listUsers(),
      store.listClients(),
      store.listTechnicians()
    ]);
    const drift = detectSchemaDrift({ jobs, users, clients, technicians });
    return c.json(
      envelopeSuccess({
        correlationId,
        data: {
          generated_at: nowIso(),
          healthy: drift.healthy,
          issue_count: drift.issues.length,
          issues: drift.issues
        }
      })
    );
  });

  api.get("/workspace/ops-intelligence", requireSession(), requireRoles("dispatcher", "admin", "finance"), async (c) => {
    const correlationId = c.get("correlationId");
    const user = getSessionUser(c);
    const [jobs, schedules, documents, escrow, invoices, users, clients, technicians] = await Promise.all([
      store.listJobsForUser(user),
      store.listSchedules(),
      store.listDocuments(),
      store.listEscrowRows(),
      store.listFinanceInvoices(),
      store.listUsers(),
      store.listClients(),
      store.listTechnicians()
    ]);

    const drift = detectSchemaDrift({
      jobs,
      users,
      clients,
      technicians
    });

    const openJobs = jobs.filter((job) => !["certified", "cancelled"].includes(job.status)).length;
    const criticalJobs = jobs.filter((job) => /urgent|critical|fault|overdue/i.test(job.last_note)).length;
    const staleJobs = jobs.filter((job) => Date.now() - Date.parse(job.updated_at || "1970-01-01T00:00:00.000Z") > 86400000).length;
    const pendingPublish = documents.filter((doc) => doc.status !== "published").length;
    const lockedEscrow = escrow.filter((row) => row.status === "locked").length;
    const outstanding = invoices
      .filter((invoice) => invoice.status !== "paid")
      .reduce((sum, invoice) => sum + invoice.amount, 0);

    return c.json(
      envelopeSuccess({
        correlationId,
        data: {
          generated_at: nowIso(),
          jobs: {
            open: openJobs,
            critical: criticalJobs,
            stale_over_24h: staleJobs
          },
          operations: {
            schedules_total: schedules.length,
            documents_pending_publish: pendingPublish,
            escrow_locked: lockedEscrow
          },
          finance: {
            outstanding_amount: outstanding
          },
          sync: {
            queue_conflicts: 0
          },
          schema_drift: {
            healthy: drift.healthy,
            issue_count: drift.issues.length
          }
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

  api.post("/admin/retries/:automation_job_id", requireSession(), requireRoles("admin"), async (c) => {
    const correlationId = c.get("correlationId");
    const user = getSessionUser(c);
    const automationJobid = c.req.param("automation_job_id");
    const automationJob = await store.getAutomationJob(automationJobid);

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
      ...bumpMutableMeta(automationJob, user.user_id, correlationId)
    };

    await store.upsertAutomationJob(updated);
    await store.appendAudit({
      action: "admin.automation.retry",
      payload: {
        automation_job_id: automationJobid,
        retry_count: updated.retry_count,
        trigger_user_id: user.user_id
      },
      ctx: createStoreContext(user.user_id, correlationId)
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
