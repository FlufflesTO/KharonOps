import type { PostgresStoreConfig } from "../config.js";
import { ScaffoldWorkbookStore } from "./scaffoldStore.js";

export class PostgresWorkbookStore extends ScaffoldWorkbookStore {
  protected readonly label = "PostgresWorkbookStore";

  constructor(readonly config: PostgresStoreConfig) {
    super();
  }
}
