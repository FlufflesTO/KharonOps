/**
 * KharonOps — Compliance Service
 * Purpose: Enforces SANS and institutional guardrails for state transitions.
 * Dependencies: @kharon/domain (JobRow), ./meta.js (createStoreContext)
 * Structural Role: Business logic service consumed by API routes.
 */

import type { JobRow } from "@kharon/domain";
import type { WorkbookStore } from "../store/types.js";
import { createStoreContext } from "./meta.js";

/**
 * Asserts that a job status transition complies with institutional guardrails.
 * Returns null if valid, or a string describing the failure.
 */
export async function assertComplianceGuardrails(
  store: WorkbookStore,
  job: JobRow,
  nextStatus: JobRow["status"],
  correlationId: string,
  actorUserId: string
): Promise<string | null> {
  if (nextStatus === "performed" && job.technician_id.trim() === "") {
    return "A technician must be assigned before marking a job as performed.";
  }

  if (nextStatus === "certified") {
    const documents = await store.listDocuments(job.job_id);
    const hasCertificate = documents.some((doc) => doc.document_type === "certificate");
    if (!hasCertificate) {
      return "Generate a certificate document before setting job status to certified.";
    }

    const certificate = documents.find((doc) => doc.document_type === "certificate");
    const lockedEscrow = await store.getEscrowByDocument(certificate?.document_id ?? "");
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
