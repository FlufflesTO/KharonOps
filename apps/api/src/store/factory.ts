import type { RuntimeConfig, StoreBackend } from "../config.js";
import { createDualWorkbookStore } from "./dualStore.js";
import type { WorkbookStore } from "./types.js";
import { LocalWorkbookStore } from "./localStore.js";
import { PostgresWorkbookStore } from "./postgresStore.js";
import { SheetsWorkbookStore } from "./sheetsStore.js";

function createBackendStore(backend: Exclude<StoreBackend, "dual">, config: RuntimeConfig): WorkbookStore {
  switch (backend) {
    case "local":
      return new LocalWorkbookStore();
    case "sheets":
      return new SheetsWorkbookStore(config.rails);
    case "postgres":
      return new PostgresWorkbookStore(config.postgres);
  }
}

export function createWorkbookStore(config: RuntimeConfig): WorkbookStore {
  switch (config.storeBackend) {
    case "local":
      return new LocalWorkbookStore();
    case "sheets":
      return new SheetsWorkbookStore(config.rails);
    case "postgres":
      return new PostgresWorkbookStore(config.postgres);
    case "dual":
      return createDualWorkbookStore({
        config: {
          primaryBackend: config.mode === "production" ? "sheets" : "local",
          mirrorBackend: "postgres"
        },
        createBackendStore: (backend) => createBackendStore(backend, config)
      });
  }
}
