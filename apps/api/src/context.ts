import type { SessionUser } from "@kharon/domain";

export interface AppBindings {
  Bindings: {
    ASSETS: {
      fetch: (request: Request) => Promise<Response>;
    };
    [key: string]: unknown;
  };
  Variables: {
    correlationId: string;
    sessionUser: SessionUser | null;
  };
}
