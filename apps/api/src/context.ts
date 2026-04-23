/**
 * KharonOps — Hono App Bindings
 * Purpose: Type-safe context for Cloudflare Workers + Hono middleware chain.
 * Dependencies: @kharon/domain (SessionUser), ../config.js (RuntimeConfig), ../store/types.js (WorkbookStore)
 */

import type { SessionUser } from "@kharon/domain";
<<<<<<< Updated upstream
import type { RuntimeConfig } from "./config.js";
import type { WorkbookStore } from "./store/types.js";
=======
import type { WorkbookStore } from "./store/types.js";
import type { RuntimeConfig } from "./config.js";
>>>>>>> Stashed changes

export interface AppBindings {
  Bindings: {
    ASSETS: {
      fetch: (request: Request) => Promise<Response>;
    };
    KHARON_CACHE?: {
      get(key: string): Promise<string | null>;
      put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
      delete(key: string): Promise<void>;
    };
    [key: string]: unknown;
  };
  Variables: {
    correlationId: string;
    sessionUser: SessionUser | null;
    config: RuntimeConfig;
    store: WorkbookStore;
  };
}

