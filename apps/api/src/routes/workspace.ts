/**
 * KharonOps — Workspace Routes
 * Purpose: Endpoints for workspace entities, people, skills, and ops intelligence.
 * Dependencies: @kharon/domain, ../services/cache.js, ../services/governance.js, ../services/utils.js
 */

import { Hono } from "hono";
import {
  envelopeSuccess,
  envelopeError,
  bumpMutableMeta,
  canReadJob
} from "@kharon/domain";
import { requireRoles, requireSession, getSessionUser } from "../middleware/auth.js";
import { parseJsonBody } from "../services/parse.js";
import { createMutable, createStoreContext } from "../services/meta.js";
import { getCacheVersion, getCachedJson, putCachedJson } from "../services/cache.js";
import { detectSchemaDrift } from "../services/governance.js";
import { nowIso } from "../services/utils.js";
import { readUpgradeWorkspaceState } from "../services/workspaceState.js";
import { loadSchemaDriftInputs } from "../store/repositories/workspaceRepository.js";
import { chatAlertSchema, gmailNotifySchema, peopleSyncSchema, skillMatrixUpsertSchema } from "../schemas/requests.js";
import type { AppBindings } from "../context.js";
import type { UserRow, ScheduleRequestRow, ScheduleRow, JobDocumentRow, UpgradeWorkspaceState, OpsIntelligencePayload } from "@kharon/domain";

type DispatchContextPayload = {
  requests: ScheduleRequestRow[];
  schedules: ScheduleRow[];
  documents: JobDocumentRow[];
  technicians: UserRow[];
};


const workspace = new Hono<AppBindings>();

workspace.use("*", requireSession());

workspace.get("/people", async (c) => {
  const correlationId = c.get("correlationId");
  const store = c.get("store");
  const users = await store.listUsers();
  const technicians = await store.listTechnicians();
  const activeTechnicianIds = new Set(technicians.filter((t) => t.active === "true").map((t) => t.technician_id));

  const people = users
    .filter((u) => u.active === "true" && (u.role === "technician" || u.role === "dispatcher"))
    .map((u) => ({
      user_id: u.user_id,
      display_name: u.display_name,
      role: u.role,
      technician_id: u.technician_id,
      is_active_technician: activeTechnicianIds.has(u.technician_id)
    }))
    .sort((a, b) => (a.display_name ?? "").localeCompare(b.display_name ?? ""));

  return c.json(envelopeSuccess({ correlationId, data: people }));
});

workspace.get("/upgrade/state", requireRoles("dispatcher", "admin", "finance"), async (c) => {
  const correlationId = c.get("correlationId");
  const user = getSessionUser(c);
  const store = c.get("store");
  const version = await getCacheVersion(c.env);
  const cacheKey = `upgrade:${version}:${user.role}`;
  const cached = await getCachedJson<UpgradeWorkspaceState>(c.env, cacheKey);

  if (cached) return c.json(envelopeSuccess({ correlationId, data: cached }));

  const data = await readUpgradeWorkspaceState(store);
  await putCachedJson(c.env, cacheKey, data, 60);
  return c.json(envelopeSuccess({ correlationId, data }));
});

workspace.post("/gmail/notify", requireRoles("dispatcher", "admin"), async (c) => {
  const correlationId = c.get("correlationId");
  const user = getSessionUser(c);
  const config = c.get("config");
  const store = c.get("store");
  const body = await parseJsonBody(c, gmailNotifySchema);

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

  return c.json(envelopeSuccess({ correlationId, data: result }));
});

workspace.post("/chat/alert", requireRoles("dispatcher", "admin"), async (c) => {
  const correlationId = c.get("correlationId");
  const user = getSessionUser(c);
  const config = c.get("config");
  const store = c.get("store");
  const body = await parseJsonBody(c, chatAlertSchema);

  await config.rails.chat.sendAlert({ severity: body.severity, message: body.message });
  await store.appendAudit({
    action: "workspace.chat.alert",
    payload: body,
    ctx: createStoreContext(user.user_id, correlationId)
  });

  return c.json(envelopeSuccess({ correlationId, data: { sent: true } }));
});

workspace.post("/people/sync", requireRoles("dispatcher", "admin"), async (c) => {
  const correlationId = c.get("correlationId");
  const user = getSessionUser(c);
  const config = c.get("config");
  const store = c.get("store");
  const body = await parseJsonBody(c, peopleSyncSchema);

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

  return c.json(envelopeSuccess({ correlationId, data: result }));
});

workspace.put("/upgrade/skills/:user_id", requireRoles("dispatcher", "admin", "finance"), async (c) => {
  const correlationId = c.get("correlationId");
  const user = getSessionUser(c);
  const store = c.get("store");
  const user_id = c.req.param("user_id");
  const body = await parseJsonBody(c, skillMatrixUpsertSchema);
  const skills = await store.listSkillMatrix();
  const existing = skills.find((item) => item.user_id === user_id) ?? null;
  const row = {
    user_id,
    saqcc_type: body.saqcc_type ?? "",
    saqcc_expiry: body.saqcc_expiry ?? "",
    medical_expiry: body.medical_expiry ?? "",
    rest_hours_last_24h: body.rest_hours_last_24h,
    ...(existing ? bumpMutableMeta(existing, user.user_id, correlationId) : createMutable(user.user_id, correlationId))
  };
  await store.upsertSkillMatrix(row);
  return c.json(envelopeSuccess({ correlationId, rowVersion: row.row_version, data: row }));
});

workspace.get("/dispatch-context", requireRoles("dispatcher", "admin"), async (c) => {
  const correlationId = c.get("correlationId");
  const user = getSessionUser(c);
  const store = c.get("store");
  const jobid = (c.req.query("job_id") ?? "").trim();

  if (jobid === "") return c.json(envelopeError({ correlationId, error: { code: "validation_error", message: "job_id required" } }), 400);

  const job = await store.getJob(jobid);
  if (!job) return c.json(envelopeError({ correlationId, error: { code: "not_found", message: "Job not found" } }), 404);
  if (!canReadJob(user, job)) return c.json(envelopeError({ correlationId, error: { code: "forbidden", message: "Ownership check failed" } }), 403);

  const version = await getCacheVersion(c.env);
  const cacheKey = `dispatch:${version}:${jobid}:${user.user_id}`;
  const cached = await getCachedJson<DispatchContextPayload>(c.env, cacheKey);
  if (cached) return c.json(envelopeSuccess({ correlationId, data: cached }));

  const [requests, schedules, documents, users] = await Promise.all([
    store.listScheduleRequests(jobid),
    store.listSchedules(jobid),
    store.listDocuments(jobid),
    store.listUsers()
  ]);

  const technicians = users.filter((r) => r.active === "true" && r.role === "technician").sort((a, b) => a.display_name.localeCompare(b.display_name));
  const payload = { requests, schedules, documents, technicians };
  await putCachedJson(c.env, cacheKey, payload, 60);
  return c.json(envelopeSuccess({ correlationId, data: payload }));
});

workspace.get("/ops-intelligence", requireRoles("dispatcher", "admin", "finance"), async (c) => {
  const correlationId = c.get("correlationId");
  const user = getSessionUser(c);
  const store = c.get("store");
  const version = await getCacheVersion(c.env);
  const cacheKey = `ops_intel:${version}:${user.role}`;
  const cached = await getCachedJson<OpsIntelligencePayload>(c.env, cacheKey);
  if (cached) return c.json(envelopeSuccess({ correlationId, data: cached }));

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

  const drift = detectSchemaDrift({ jobs, users, clients, technicians });
  const openJobs = jobs.filter((j) => !["certified", "cancelled"].includes(j.status)).length;
  const criticalJobs = jobs.filter((j) => /urgent|critical|fault|overdue/i.test(j.last_note)).length;
  const staleJobs = jobs.filter((j) => Date.now() - Date.parse(j.updated_at || "1970-01-01T00:00:00.000Z") > 86400000).length;
  const payload = {
    generated_at: nowIso(),
    jobs: { open: openJobs, critical: criticalJobs, stale_over_24h: staleJobs },
    operations: { schedules_total: schedules.length, documents_pending_publish: documents.filter(d => d.status !== "published").length, escrow_locked: escrow.filter(r => r.status === "locked").length },
    finance: { outstanding_amount: invoices.filter(i => i.status !== "paid").reduce((s, i) => s + i.amount, 0) },
    schema_drift: { healthy: drift.healthy, issue_count: drift.issues.length }
  };
  await putCachedJson(c.env, cacheKey, payload, 60);
  return c.json(envelopeSuccess({ correlationId, data: payload }));
});

workspace.get("/schema-drift", requireRoles("dispatcher", "admin", "finance"), async (c) => {
  const correlationId = c.get("correlationId");
  const user = getSessionUser(c);
  const store = c.get("store");
  const version = await getCacheVersion(c.env);
  const cacheKey = `schema_drift:${version}:${user.role}`;
  const cached = await getCachedJson<{ generated_at: string; healthy: boolean; issue_count: number; issues: ReturnType<typeof detectSchemaDrift>["issues"] }>(
    c.env,
    cacheKey
  );
  if (cached) {
    return c.json(envelopeSuccess({ correlationId, data: cached }));
  }

  const { jobs, users, clients, technicians } = await loadSchemaDriftInputs(store, user);
  const drift = detectSchemaDrift({ jobs, users, clients, technicians });
  const payload = {
    generated_at: nowIso(),
    healthy: drift.healthy,
    issue_count: drift.issues.length,
    issues: drift.issues
  };

  await putCachedJson(c.env, cacheKey, payload, 60);
  return c.json(envelopeSuccess({ correlationId, data: payload }));
});

export default workspace;
