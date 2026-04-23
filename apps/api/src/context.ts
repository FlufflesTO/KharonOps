import type { SessionUser } from "@kharon/domain";

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
  };
}
