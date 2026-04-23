/**
 * KharonOps — Context Middleware
 * Purpose: Initializes and attaches RuntimeConfig and WorkbookStore to the request context.
 * Dependencies: ../config.js, ../store/factory.js, ../services/utils.js
 */

import { createMiddleware } from "hono/factory";
import { createRuntimeConfig } from "../config.js";
import { createWorkbookStore } from "../store/factory.js";
import { parseEnvBindings } from "../services/utils.js";
import type { AppBindings } from "../context.js";

export const contextualMiddleware = createMiddleware<AppBindings>(async (c, next) => {
  const config = createRuntimeConfig(parseEnvBindings(c.env));
  const store = createWorkbookStore(config);

  c.set("config", config);
  c.set("store", store);

  await next();
});
