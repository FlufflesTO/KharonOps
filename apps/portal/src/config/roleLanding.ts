import type { Role } from "@kharon/domain";
import { ROLE_LANDING_TOOL } from "./roleNavigation";

export function getRoleLandingTool(role: Role | ""): string {
  if (!role) {
    return ROLE_LANDING_TOOL.client;
  }
  return ROLE_LANDING_TOOL[role as Role];
}

