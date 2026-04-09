import type { RuntimeConfig } from "../config.js";
import type { WorkbookStore } from "./types.js";
import { LocalWorkbookStore } from "./localStore.js";
import { SheetsWorkbookStore } from "./sheetsStore.js";

export function createWorkbookStore(config: RuntimeConfig): WorkbookStore {
  return config.rails.mode === "production" ? new SheetsWorkbookStore(config.rails) : new LocalWorkbookStore();
}
