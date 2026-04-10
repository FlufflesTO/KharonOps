import type { StoreBackend } from "../config.js";
import { ScaffoldWorkbookStore } from "./scaffoldStore.js";

interface DualWorkbookStoreConfig {
  primaryBackend: Exclude<StoreBackend, "dual">;
  mirrorBackend: Exclude<StoreBackend, "dual">;
}

export class DualWorkbookStore extends ScaffoldWorkbookStore {
  protected readonly label: string;
  readonly config: DualWorkbookStoreConfig;

  constructor(config: DualWorkbookStoreConfig) {
    super();
    this.config = config;
    this.label = `DualWorkbookStore(${config.primaryBackend}->${config.mirrorBackend})`;
  }
}
