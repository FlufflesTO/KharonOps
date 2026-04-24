/**
 * KharonOps — Schedule Routes
 * Purpose: Endpoints for requesting, confirming, and rescheduling jobs.
 * Dependencies: @kharon/domain, ../services/responses.js
 */

import { Hono } from "hono";
import {
  envelopeError,
  envelopeSuccess,
  canRequestSchedule,
  canConfirmSchedule,
  canReadJob,
  bumpMutableMeta,
  canManageSchedules
} from "@kharon/domain";
import { parseJsonBody } from "../services/parse.js";
import { createMutable, createStoreContext } from "../services/meta.js";
import { rowVersionConflictResponse } from "../services/responses.js";
import { scheduleConfirmSchema, scheduleRequestSchema, scheduleRescheduleSchema } from "../schemas/requests.js";
import { requireSession, getSessionUser } from "../middleware/auth.js";
import type { AppBindings } from "../context.js";
import type { ScheduleRequestRow, ScheduleRow } from "@kharon/domain";

const schedules = new Hono<AppBindings>();

schedules.use("*", requireSession());

schedules.post("/request-slot", async (c) => {
  const correlationId = c.get("correlationId");
  const user = getSessionUser(c);
  const store = c.get("store");

  if (!canRequestSchedule(user.role)) {
    return c.json(envelopeError({ correlationId, error: { code: "forbidden", message: "Role cannot request scheduling" } }), 403);
  }

  const body = await parseJsonBody(c, scheduleRequestSchema);
  const job = await store.getJob(body.job_id);

  if (!job) {
    return c.json(envelopeError({ correlationId, error: { code: "not_found", message: "Job not found" } }), 404);
  }

  if (!canReadJob(user, job)) {
    return c.json(envelopeError({ correlationId, error: { code: "forbidden", message: "Ownership check failed" } }), 403);
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
    payload: { job_id: body.job_id, request_id: row.request_id },
    ctx: createStoreContext(user.user_id, correlationId)
  });

  return c.json(envelopeSuccess({ correlationId, rowVersion: row.row_version, data: row }));
});

schedules.post("/confirm", async (c) => {
  const correlationId = c.get("correlationId");
  const user = getSessionUser(c);
  const config = c.get("config");
  const store = c.get("store");

  // Using enhanced RBAC function
  if (!canManageSchedules(user.role)) {
    return c.json(envelopeError({ correlationId, error: { code: "forbidden", message: "Role cannot confirm schedule" } }), 403);
  }

  const body = await parseJsonBody(c, scheduleConfirmSchema);
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
      } as ScheduleRequestRow;
    }
  }

  if (!request) {
    return c.json(envelopeError({ correlationId, error: { code: "not_found", message: "Schedule request not found" } }), 404);
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
    payload: { request_id: request.request_id, schedule_id: schedule.schedule_id },
    ctx: createStoreContext(user.user_id, correlationId)
  });

  return c.json(envelopeSuccess({ correlationId, rowVersion: schedule.row_version, data: schedule }));
});

schedules.post("/reschedule", async (c) => {
  const correlationId = c.get("correlationId");
  const user = getSessionUser(c);
  const config = c.get("config");
  const store = c.get("store");

  // Using enhanced RBAC function
  if (!canManageSchedules(user.role)) {
    return c.json(envelopeError({ correlationId, error: { code: "forbidden", message: "Role cannot reschedule" } }), 403);
  }

  const body = await parseJsonBody(c, scheduleRescheduleSchema);
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
    } as ScheduleRow;
  }

  if (!schedule) {
    return c.json(envelopeError({ correlationId, error: { code: "not_found", message: "Schedule not found" } }), 404);
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
    payload: { schedule_id: updated.schedule_id },
    ctx: createStoreContext(user.user_id, correlationId)
  });

  return c.json(envelopeSuccess({ correlationId, rowVersion: updated.row_version, data: updated }));
});

export default schedules;