/**
 * KharonOps — Job Routes
 * Purpose: Endpoints for job management, status updates, and notes.
 * Dependencies: @kharon/domain, ../services/jobs.js, ../services/cache.js, ../services/compliance.js, ../services/responses.js
 */

import { Hono } from "hono";
import {
  envelopeError,
  envelopeSuccess,
  canReadJob,
  canUpdateJobStatus,
  canTransitionStatus,
  canWriteJobNote,
  listAllowedStatusTransitions
} from "@kharon/domain";
import { parseJsonBody } from "../services/parse.js";
import { createStoreContext } from "../services/meta.js";
import { fetchNameSources } from "../services/jobs.js";
import { buildNameLookups } from "../services/nameEnrichment.js";
import { getCacheVersion, getCachedJson, putCachedJson } from "../services/cache.js";
import { assertComplianceGuardrails } from "../services/compliance.js";
import { rowVersionConflictResponse } from "../services/responses.js";
import { noteSchema, statusUpdateSchema } from "../schemas/requests.js";
import { getSessionUser, requireSession } from "../middleware/auth.js";
import { rateLimitMiddleware } from "../middleware/rateLimit.js";
import type { AppBindings } from "../context.js";
import type { JobRow } from "@kharon/domain";

const jobs = new Hono<AppBindings>();

jobs.use("*", requireSession());

async function enrichJobs(store: AppBindings["Variables"]["store"], rows: JobRow[]) {
  const sources = await fetchNameSources(store);
  const { clientNameByid, technicianNameByid } = buildNameLookups(sources);
  return rows.map((job) => ({
    ...job,
    client_name: clientNameByid.get(job.client_id) ?? "",
    technician_name: technicianNameByid.get(job.technician_id) ?? ""
  }));
}

jobs.get("/", async (c) => {
  const correlationId = c.get("correlationId");
  const user = getSessionUser(c);
  const store = c.get("store");
  const version = await getCacheVersion(c.env);
  const cacheKey = `jobs:${version}:${user.user_id}:${user.role}`;
  const cached = await getCachedJson<Array<Record<string, unknown>>>(c.env, cacheKey);

  if (cached) {
    return c.json(envelopeSuccess({ correlationId, data: cached }));
  }

  const rows = await store.listJobsForUser(user);
  const data = await enrichJobs(store, rows);
  await putCachedJson(c.env, cacheKey, data, 60);

  return c.json(envelopeSuccess({ correlationId, data }));
});

jobs.get("/:job_id", async (c) => {
  const correlationId = c.get("correlationId");
  const user = getSessionUser(c);
  const store = c.get("store");
  const jobid = c.req.param("job_id");
  const job = await store.getJob(jobid);

  if (!job) {
    return c.json(envelopeError({ correlationId, error: { code: "not_found", message: "Job not found" } }), 404);
  }

  if (!canReadJob(user, job)) {
    return c.json(envelopeError({ correlationId, error: { code: "forbidden", message: "Ownership check failed" } }), 403);
  }

  const [enrichedJob] = await enrichJobs(store, [job]);

  return c.json(envelopeSuccess({ correlationId, rowVersion: job.row_version, data: enrichedJob }));
});

jobs.on(["POST", "PATCH"], "/:job_id/status",
  rateLimitMiddleware({ windowMs: 60000, max: 10 }), 
  async (c) => {
    const correlationId = c.get("correlationId");
    const user = getSessionUser(c);
    const store = c.get("store");
    const jobid = c.req.param("job_id");
    const payload = await parseJsonBody(c.req.raw, statusUpdateSchema);
    const { status, row_version } = payload;

    const job = await store.getJob(jobid);
    if (!job) {
      return c.json(envelopeError({ correlationId, error: { code: "not_found", message: "Job not found" } }), 404);
    }

    if (!canUpdateJobStatus(user, job, status)) {
      return c.json(envelopeError({ correlationId, error: { code: "forbidden", message: "Role cannot update job to requested status" } }), 403);
    }

    if (!canTransitionStatus(job.status, status)) {
      return c.json(envelopeError({ 
        correlationId,
        rowVersion: job.row_version,
        error: { 
          code: "invalid_status_transition",
          message: `Invalid transition ${job.status} -> ${status}`,
          details: { allowed: listAllowedStatusTransitions(job.status) }
        } 
      }), 400);
    }

    const guardrailFailure = await assertComplianceGuardrails(store, job, status, correlationId, user.user_id);
    if (guardrailFailure) {
      await store.appendAudit({
        action: "compliance.guardrail.block",
        payload: { job_id: job.job_id, reason: guardrailFailure },
        ctx: createStoreContext(user.user_id, correlationId),
        entry_type: "compliance_guardrail"
      });
      return c.json(envelopeError({ correlationId, rowVersion: job.row_version, error: { code: "compliance_failed", message: guardrailFailure } }), 400);
    }

    const result = await store.updateJobStatus({
      jobid,
      status,
      expectedRowVersion: row_version,
      ctx: createStoreContext(user.user_id, correlationId)
    });

    if (result.conflict) {
      return c.json(rowVersionConflictResponse(correlationId, result.job.row_version, result.conflict), 409);
    }

    return c.json(envelopeSuccess({ correlationId, rowVersion: result.job.row_version, data: result.job }));
});

jobs.post("/:job_id/note", 
  rateLimitMiddleware({ windowMs: 60000, max: 15 }), 
  async (c) => {
    const correlationId = c.get("correlationId");
    const user = getSessionUser(c);
    const store = c.get("store");
    const jobid = c.req.param("job_id");
    const payload = await parseJsonBody(c.req.raw, noteSchema);

    const job = await store.getJob(jobid);
    if (!job) {
      return c.json(envelopeError({ correlationId, error: { code: "not_found", message: "Job not found" } }), 404);
    }

    if (!canWriteJobNote(user, job)) {
      return c.json(envelopeError({ correlationId, error: { code: "forbidden", message: "Role cannot write job notes" } }), 403);
    }

    const result = await store.appendJobNote({
      jobid,
      note: payload.note,
      expectedRowVersion: payload.row_version,
      ctx: createStoreContext(user.user_id, correlationId)
    });

    if (result.conflict) {
      return c.json(rowVersionConflictResponse(correlationId, result.job.row_version, result.conflict), 409);
    }

    return c.json(envelopeSuccess({ correlationId, rowVersion: result.job.row_version, data: result.job }));
});

export default jobs;
