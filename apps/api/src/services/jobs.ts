/**
 * KharonOps — Job Services
 * Purpose: Shared logic for fetching and enriching job data.
 * Dependencies: @kharon/domain, ../store/types.js
 */

import type { WorkbookStore } from "../store/types.js";
import type { ClientRow, TechnicianRow, UserRow } from "@kharon/domain";

/**
 * Fetch clients, technicians, and users in parallel with graceful degradation.
 */
export async function fetchNameSources(store: WorkbookStore): Promise<{
  clients: ClientRow[];
  technicians: TechnicianRow[];
  users: UserRow[];
}> {
  const [clientsResult, techniciansResult, usersResult] = await Promise.allSettled([
    store.listClients(),
    store.listTechnicians(),
    store.listUsers()
  ]);

  const clients = clientsResult.status === "fulfilled" ? clientsResult.value : [];
  if (clientsResult.status === "rejected") {
    console.warn("[name-enrichment] listClients failed, degrading gracefully:", clientsResult.reason);
  }

  const technicians = techniciansResult.status === "fulfilled" ? techniciansResult.value : [];
  if (techniciansResult.status === "rejected") {
    console.warn("[name-enrichment] listTechnicians failed, degrading gracefully:", techniciansResult.reason);
  }

  const users = usersResult.status === "fulfilled" ? usersResult.value : [];
  if (usersResult.status === "rejected") {
    console.warn("[name-enrichment] listUsers failed, degrading gracefully:", usersResult.reason);
  }

  return { clients, technicians, users };
}
