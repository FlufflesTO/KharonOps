import { newMutableMeta } from "@kharon/domain";
import type { StoreContext } from "../store/types.js";

export function createMutable(actorUserUid: string, correlationId: string) {
  return newMutableMeta(actorUserUid, correlationId);
}

export function createStoreContext(actorUserUid: string, correlationId: string): StoreContext {
  return {
    actorUserUid,
    correlationId
  };
}
