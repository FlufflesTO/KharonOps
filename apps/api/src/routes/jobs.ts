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
import type { AppBindings } from "../context.js";

const jobs = new Hono<AppBindings>();

jobs.use("*", requireSession());

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

  const [jobRows, sources] = await Promise.all([
    store.listJobsForUser(user),
    fetchNameSources(store)
  ]);

  const { clientNameByid, technicianNameByid } = buildNameLookups(sources);

  const enrichedJobs = jobRows.map((job) => ({
    ...job,
    client_name: clientNameByid.get(job.client_id) ?? "",
    technician_name: technicianNameByid.get(job.technician_id) ?? ""
  }));

  await putCachedJson(c.env, cacheKey, enrichedJobs, 60);

  return c.json(envelopeSuccess({ correlationId, data: enrichedJobs }));
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

  const sources = await fetchNameSources(store);
  const { clientNameByid, technicianNameByid } = buildNameLookups(sources);

  const enrichedJob = {
    ...job,
    client_name: clientNameByid.get(job.client_id) ?? "",
    technician_name: technicianNameByid.get(job.technician_id) ?? ""
  };

  return c.json(envelopeSuccess({ correlationId, rowVersion: job.row_version, data: enrichedJob }));
});

jobs.post("/:job_id/status", async (c) => {
  const correlationId = c.get("correlationId");
  const user = getSessionUser(c);
  const store = c.get("store");
  const jobid = c.req.param("job_id");
  const body = await parseJsonBody(c.req.raw, statusUpdateSchema);

  const existing = await store.getJob(jobid);
  if (!existing) {
    return c.json(envelopeError({ correlationId, error: { code: "not_found", message: "Job not found" } }), 404);
  }

  if (!canUpdateJobStatus(user, existing, body.status)) {
    return c.json(envelopeError({ correlationId, error: { code: "forbidden", message: "Access denied" } }), 403);
  }

  if (!canTransitionStatus(existing.status, body.status)) {
    return c.json(envelopeError({
      correlationId,
      rowVersion: existing.row_version,
      error: {
        code: "invalid_status_transition",
        message: `Invalid transition ${existing.status} -> ${body.status}`,
        details: { allowed: listAllowedStatusTransitions(existing.status) }
      }
    }), 400);
  }

  const guardrailFailure = await assertComplianceGuardrails(store, existing, body.status, correlationId, user.user_id);
  if (guardrailFailure) {
    await store.appendAudit({
      action: "compliance.guardrail.block",
      payload: { job_id: existing.job_id, reason: guardrailFailure },
      ctx: createStoreContext(user.user_id, correlationId),
      entry_type: "compliance_guardrail"
    });
    return c.json(envelopeError({ correlationId, rowVersion: existing.row_version, error: { code: "compliance_failed", message: guardrailFailure } }), 400);
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

  return c.json(envelopeSuccess({ correlationId, rowVersion: update.job.row_version, data: update.job }));
});

jobs.post("/:job_id/note", async (c) => {
  const correlationId = c.get("correlationId");
  const user = getSessionUser(c);
  const store = c.get("store");
  const jobid = c.req.param("job_id");
  const body = await parseJsonBody(c.req.raw, noteSchema);

  const existing = await store.getJob(jobid);
  if (!existing) {
    return c.json(envelopeError({ correlationId, error: { code: "not_found", message: "Job not found" } }), 404);
  }

  if (!canWriteJobNote(user, existing)) {
    return c.json(envelopeError({ correlationId, error: { code: "forbidden", message: "Access denied" } }), 403);
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

  return c.json(envelopeSuccess({ correlationId, rowVersion: update.job.row_version, data: update.job }));
});

export default jobs;
