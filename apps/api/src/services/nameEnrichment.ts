/**
 * KharonOps — Name Enrichment Service
 * Purpose: Builds client/technician name lookup maps from master data sources.
 * Dependencies: @kharon/domain (ClientRow, TechnicianRow, UserRow)
 * Structural Role: Pure-function service consumed by API route handlers.
 */

import type { ClientRow, TechnicianRow, UserRow } from "@kharon/domain";

/**
 * Source data consumed by the name-enrichment builder.
 * Each field may be an empty array if the corresponding data source is
 * unavailable (graceful degradation).
 */
export interface NameSources {
  readonly clients: readonly ClientRow[];
  readonly technicians: readonly TechnicianRow[];
  readonly users: readonly UserRow[];
}

/**
 * Compiled lookup maps for enriching JobRow records with display names.
 */
export interface NameLookups {
  readonly clientNameByUid: ReadonlyMap<string, string>;
  readonly technicianNameByUid: ReadonlyMap<string, string>;
}

/**
 * Build client/technician name-lookup maps from the given source data.
 *
 * **Priority hierarchy:**
 *  1. `Clients_Master` / `Technicians_Master` (authoritative)
 *  2. `Users_Master` (portal-provisioned fallback)
 *
 * Entries from Users_Master are only added if the UID does not already
 * exist in the primary master sheet — this prevents a stale portal
 * profile from overriding the canonical registration data.
 */
export function buildNameLookups(sources: NameSources): NameLookups {
  // PRIMARY: Clients_Master
  const clientNameByUid = new Map(
    sources.clients
      .filter((row) => row.active === "true" && row.client_id.trim() !== "")
      .map((row) => [row.client_id, row.client_name] as const)
  );

  // FALLBACK: Users_Master client rows
  for (const u of sources.users) {
    if (u.active === "true" && u.role === "client" && u.client_uid.trim() !== "") {
      if (!clientNameByUid.has(u.client_uid)) {
        clientNameByUid.set(u.client_uid, u.display_name);
      }
    }
  }

  // PRIMARY: Technicians_Master
  const technicianNameByUid = new Map(
    sources.technicians
      .filter((row) => row.active === "true" && row.technician_id.trim() !== "")
      .map((row) => [row.technician_id, row.display_name] as const)
  );

  // FALLBACK: Users_Master technician rows
  for (const u of sources.users) {
    if (u.active === "true" && u.role === "technician" && u.technician_uid.trim() !== "") {
      if (!technicianNameByUid.has(u.technician_uid)) {
        technicianNameByUid.set(u.technician_uid, u.display_name);
      }
    }
  }

  return { clientNameByUid, technicianNameByUid };
}
