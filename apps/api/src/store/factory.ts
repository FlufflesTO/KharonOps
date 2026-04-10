import type { RuntimeConfig } from "../config.js";
import { DualWorkbookStore } from "./dualStore.js";
import type { WorkbookStore } from "./types.js";
import { LocalWorkbookStore } from "./localStore.js";
import { PostgresWorkbookStore } from "./postgresStore.js";
import { SheetsWorkbookStore } from "./sheetsStore.js";

export function createWorkbookStore(config: RuntimeConfig): WorkbookStore {
  switch (config.storeBackend) {
    case "local":
      return new LocalWorkbookStore();
    case "sheets":
      return new SheetsWorkbookStore(config.rails);
    case "postgres":
      return new PostgresWorkbookStore(config.postgres);
    case "dual":
      return new DualWorkbookStore({
        primaryBackend: config.mode === "production" ? "sheets" : "local",
        mirrorBackend: "postgres"
      });
  }
}
