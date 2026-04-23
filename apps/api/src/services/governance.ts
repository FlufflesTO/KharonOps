/**
 * KharonOps — Governance Service
 * Purpose: Detects structural inconsistencies and schema drift in workbook data.
 * Dependencies: @kharon/domain (JobRow, UserRow, ClientRow, TechnicianRow)
 * Structural Role: Audit and health check service.
 */

import type { JobRow, UserRow, ClientRow, TechnicianRow } from "@kharon/domain";

export interface SchemaDriftResult {
  healthy: boolean;
  issues: Array<{
    code: string;
    severity: "warning" | "critical";
    detail: string;
  }>;
}

/**
 * Validates active records across all master sheets to identify governance failures.
 */
export function detectSchemaDrift(args: {
  jobs: readonly JobRow[];
  users: readonly UserRow[];
  clients: readonly ClientRow[];
  technicians: readonly TechnicianRow[];
}): SchemaDriftResult {
  const issues: SchemaDriftResult["issues"] = [];

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
