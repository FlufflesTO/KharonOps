import type { SessionUser } from "@kharon/domain";
import type { WorkbookStore } from "../types.js";

export async function loadSchemaDriftInputs(store: WorkbookStore, actor: SessionUser) {
  const [jobs, users, clients, technicians] = await Promise.all([
    store.listJobsForUser(actor),
    store.listUsers(),
    store.listClients(),
    store.listTechnicians()
  ]);

  return { jobs, users, clients, technicians };
}
