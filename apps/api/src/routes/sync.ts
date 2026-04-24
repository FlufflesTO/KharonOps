/**
 * KharonOps — Sync Routes
 * Purpose: Endpoints for pull/push sync and conflict resolution.
 * Dependencies: @kharon/domain, ../services/cache.js, ../services/responses.js
 */

import { Hono } from "hono";
import {
  envelopeSuccess,
  envelopeError
} from "@kharon/domain";
import { requireSession, getSessionUser } from "../middleware/auth.js";
import { parseJsonBody } from "../services/parse.js";
import { createStoreContext } from "../services/meta.js";
import { getCacheVersion, getCachedJson, putCachedJson } from "../services/cache.js";
import { rowVersionConflictResponse } from "../services/responses.js";
import { readSyncSnapshot } from "../services/syncRead.js";
import { resolveConflictSchema, syncPushSchema } from "../schemas/requests.js";
import type { AppBindings } from "../context.js";
import type { JobRow, SyncQueueRow, JobEventRow } from "@kharon/domain";

const sync = new Hono<AppBindings>();

sync.use("*", requireSession());

sync.get("/pull", async (c) => {
  const correlationId = c.get("correlationId");
  const user = getSessionUser(c);
  const store = c.get("store");
  const since = c.req.query("since") ?? "1970-01-01T00:00:00.000Z";
  const sinceTs = Date.parse(since);

  try {
    const version = await getCacheVersion(c.env);
    const cacheKey = `sync_pull_full:${version}:${user.user_id}`;
    const cached = await getCachedJson<{ jobs: JobRow[]; queue: SyncQueueRow[]; events: JobEventRow[] }>(c.env, cacheKey);

    let data: { jobs: JobRow[]; queue: SyncQueueRow[]; events: JobEventRow[] };
    if (cached) {
      data = {
        jobs: cached.jobs.filter((j) => Date.parse(j.updated_at) >= sinceTs),
        queue: cached.queue.filter((q) => Date.parse(q.updated_at) >= sinceTs),
        events: cached.events.filter((e) => Date.parse(e.updated_at) >= sinceTs)
      };
    } else {
      data = await readSyncSnapshot({ store, actor: user, since: "1970-01-01T00:00:00.000Z" });
      await putCachedJson(c.env, cacheKey, data, 30);
      data = {
        jobs: data.jobs.filter((j) => Date.parse(j.updated_at) >= sinceTs),
        queue: data.queue.filter((q) => Date.parse(q.updated_at) >= sinceTs),
        events: data.events.filter((e) => Date.parse(e.updated_at) >= sinceTs)
      };
    }

    return c.json(envelopeSuccess({ correlationId, data }));
  } catch (error) {
    console.error("sync pull failed, returning empty snapshot", {
      correlationId,
      user: user.user_id,
      error: String(error)
    });
    return c.json(
      envelopeSuccess({
        correlationId,
        data: { jobs: [], queue: [], events: [] }
      })
    );
  }
});

sync.post("/push", async (c) => {
  const correlationId = c.get("correlationId");
  const user = getSessionUser(c);
  const store = c.get("store");
  const body = await parseJsonBody(c, syncPushSchema);

  const result = await store.applySyncMutations({
    actor: user,
    mutations: body.mutations,
    ctx: createStoreContext(user.user_id, correlationId)
  });

  const status = result.applied.length === 0 && result.conflicts.length > 0 && result.failed.length === 0 ? 409 : 200;
  const conflict = result.conflicts[0]?.conflict ?? null;

  return c.json(
    status === 409
      ? envelopeError({ correlationId, conflict, error: { code: "sync_conflict", message: "One or more mutations conflicted" } })
      : envelopeSuccess({ correlationId, conflict, data: result }),
    status
  );
});

sync.post("/conflict/resolve", async (c) => {
  const correlationId = c.get("correlationId");
  const user = getSessionUser(c);
  const store = c.get("store");
  const body = await parseJsonBody(c, resolveConflictSchema);

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

  return c.json(envelopeSuccess({ correlationId, rowVersion: resolved.job.row_version, data: resolved.job }));
});

export default sync;
