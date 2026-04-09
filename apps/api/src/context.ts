import type { SessionUser } from "@kharon/domain";

export interface AppBindings {
  Variables: {
    correlationId: string;
    sessionUser: SessionUser | null;
  };
}
