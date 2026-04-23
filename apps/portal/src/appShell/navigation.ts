import type { Role } from "@kharon/domain";
import { WORKSPACE_TOOL_META } from "./helpers";
import { ROLE_PRIMARY_NAV } from "../config/roleNavigation";

export function formatWorkspaceToolLabel(tool: string, role: Role | ""): string {
  if (tool === "jobs" && role === "client") {
    return "Approvals";
  }
  return WORKSPACE_TOOL_META[tool]?.label ?? tool;
}

export function getRoleMenuLabel(tool: string, role: Role | ""): string {
  const roleItems = ROLE_PRIMARY_NAV[(role || "client") as Role] ?? [];
  const match = roleItems.find((item) => item.tool === tool);
  return match?.label ?? formatWorkspaceToolLabel(tool, role);
}

export function getWorkspaceToolGroups(effectiveRole: Role | "", allowedWorkspaceTools: string[]): {
  primaryTools: string[];
} {
  const primaryRoleTools = (ROLE_PRIMARY_NAV[effectiveRole || "client"] ?? []).map((item) => item.tool);
  return {
    primaryTools: allowedWorkspaceTools.filter((tool) => primaryRoleTools.includes(tool))
  };
}
