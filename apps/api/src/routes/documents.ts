/**
 * KharonOps — Document Routes
 * Purpose: Endpoints for generating, publishing, and viewing document history.
 * Dependencies: @kharon/domain, ../services/responses.js
 */

import { Hono } from "hono";
import {
  envelopeError,
  envelopeSuccess,
  canGenerateDocument,
  canPublishDocument,
  canReadJob,
  bumpMutableMeta
} from "@kharon/domain";
import { buildDocumentTokens } from "../services/documentTokens.js";
import { parseJsonBody } from "../services/parse.js";
import { createMutable, createStoreContext } from "../services/meta.js";
import { rowVersionConflictResponse } from "../services/responses.js";
import { getCacheVersion, getCachedJson, putCachedJson } from "../services/cache.js";
import { documentGenerateSchema, documentPublishSchema } from "../schemas/requests.js";
import { requireSession, getSessionUser } from "../middleware/auth.js";
import type { AppBindings } from "../context.js";
import type { JobDocumentRow } from "@kharon/domain";


const documents = new Hono<AppBindings>();

documents.use("*", requireSession());

documents.post("/generate", async (c) => {
  const correlationId = c.get("correlationId");
  const user = getSessionUser(c);
  const config = c.get("config");
  const store = c.get("store");

  if (!canGenerateDocument(user.role)) {
    return c.json(envelopeError({ correlationId, error: { code: "forbidden", message: "Role cannot generate documents" } }), 403);
  }

  const body = await parseJsonBody(c, documentGenerateSchema);
  const job = await store.getJob(body.job_id);
  if (!job) {
    return c.json(envelopeError({ correlationId, error: { code: "not_found", message: "Job not found" } }), 404);
  }

  if (!canReadJob(user, job) && user.role === "technician") {
    return c.json(envelopeError({ correlationId, error: { code: "forbidden", message: "Ownership check failed" } }), 403);
  }

  const documentid = `DOC-${crypto.randomUUID()}`;
  const overrides = body.tokens ?? {};
  const users = await store.listUsers();
  const isGas = job.title.toLowerCase().includes("gas");
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
    payload: { job_id: body.job_id, document_id: documentid, document_type: body.document_type },
    ctx: createStoreContext(user.user_id, correlationId)
  });

  return c.json(envelopeSuccess({ correlationId, rowVersion: document.row_version, data: document }));
});

documents.post("/publish", async (c) => {
  const correlationId = c.get("correlationId");
  const user = getSessionUser(c);
  const config = c.get("config");
  const store = c.get("store");

  if (!canPublishDocument(user.role)) {
    return c.json(envelopeError({ correlationId, error: { code: "forbidden", message: "Role cannot publish documents" } }), 403);
  }

  const body = await parseJsonBody(c, documentPublishSchema);
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
    } as JobDocumentRow;
  }

  if (!document) {
    return c.json(envelopeError({ correlationId, error: { code: "not_found", message: "Document not found" } }), 404);
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
    payload: { document_id: updated.document_id, published_url: updated.published_url },
    ctx: createStoreContext(user.user_id, correlationId)
  });

  return c.json(envelopeSuccess({ correlationId, rowVersion: updated.row_version, data: updated }));
});

documents.get("/history", async (c) => {
  const correlationId = c.get("correlationId");
  const user = getSessionUser(c);
  const store = c.get("store");
  const jobid = c.req.query("job_id");

  const version = await getCacheVersion(c.env);
  const cacheKey = `doc_history:${version}:${user.user_id}:${jobid || "all"}`;
  const cached = await getCachedJson<JobDocumentRow[]>(c.env, cacheKey);

  if (cached) {
    return c.json(envelopeSuccess({ correlationId, data: cached }));
  }

  const documentsResult = await store.listDocuments(jobid);
  const internalDocumentRoles = new Set(["admin", "dispatcher", "finance", "super_admin"]);
  let data: JobDocumentRow[];

  if (internalDocumentRoles.has(String(user.role))) {
    data = documentsResult;
  } else {
    const readableJobs = await store.listJobsForUser(user);
    const readableJobids = new Set(readableJobs.map((job) => job.job_id));
    data = documentsResult.filter((doc) =>
      readableJobids.has(doc.job_id) && doc.status === "published" && doc.client_visible === true
    );
  }

  await putCachedJson(c.env, cacheKey, data, 60);
  return c.json(envelopeSuccess({ correlationId, data }));
});

export default documents;
