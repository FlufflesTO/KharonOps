/**
 * KharonOps — Admin Routes
 * Purpose: Elevated administrative endpoints (audits, automation retries).
 * Dependencies: @kharon/domain, ../services/responses.js
 */

import { Hono } from "hono";
import { envelopeSuccess, envelopeError, bumpMutableMeta } from "@kharon/domain";
import { requireRoles, requireSession, getSessionUser } from "../middleware/auth.js";
import { createStoreContext } from "../services/meta.js";
import type { AppBindings } from "../context.js";

const admin = new Hono<AppBindings>();

admin.use("*", requireSession());
admin.use("*", requireRoles("admin"));

admin.get("/health", async (c) => {
  const correlationId = c.get("correlationId");
  const config = c.get("config");
  return c.json(envelopeSuccess({
    correlationId,
    data: {
      status: "ok",
      mode: config.mode,
      rails_mode: config.rails.mode,
      timestamp: new Date().toISOString()
    }
  }));
});

admin.get("/audits", async (c) => {
  const correlationId = c.get("correlationId");
  const store = c.get("store");
  const audits = await store.listAudits();
  return c.json(envelopeSuccess({ correlationId, data: audits }));
});

admin.get("/automation-jobs", async (c) => {
  const correlationId = c.get("correlationId");
  const store = c.get("store");
  const jobs = await store.listAutomationJobs();
  return c.json(envelopeSuccess({ correlationId, data: jobs }));
});

admin.post("/retries/:automation_job_id", async (c) => {
  const correlationId = c.get("correlationId");
  const user = getSessionUser(c);
  const store = c.get("store");
  const automationJobId = c.req.param("automation_job_id");
  const automationJob = await store.getAutomationJob(automationJobId);

  if (!automationJob) {
    return c.json(envelopeError({ correlationId, error: { code: "not_found", message: "Job not found" } }), 404);
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
    payload: { automation_job_id: automationJobId, retry_count: updated.retry_count },
    ctx: createStoreContext(user.user_id, correlationId)
  });

  return c.json(envelopeSuccess({ correlationId, rowVersion: updated.row_version, data: updated }));
});

export default admin;
