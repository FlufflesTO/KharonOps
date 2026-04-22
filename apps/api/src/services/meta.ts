import { newMutableMeta } from "@kharon/domain";
import type { StoreContext } from "../store/types.js";

export function createMutable(actorUserid: string, correlationId: string) {
  return newMutableMeta(actorUserid, correlationId);
}

export function createStoreContext(actorUserid: string, correlationId: string): StoreContext {
  return {
    actorUserid,
    correlationId
  };
}
