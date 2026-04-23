import type { Role } from "@kharon/domain";
import { ROLE_PRIMARY_TOOLS, WORKSPACE_TOOL_META } from "./helpers";

export function formatWorkspaceToolLabel(tool: string, role: Role | ""): string {
  if (tool === "jobs" && role === "client") {
    return "Approvals";
  }
  return WORKSPACE_TOOL_META[tool]?.label ?? tool;
}

export function getWorkspaceToolGroups(effectiveRole: Role | "", allowedWorkspaceTools: string[]): {
  primaryTools: string[];
  moreTools: string[];
} {
  const primaryRoleTools = ROLE_PRIMARY_TOOLS[effectiveRole || "client"] ?? ["jobs", "documents"];
  return {
    primaryTools: allowedWorkspaceTools.filter((tool) => primaryRoleTools.includes(tool)),
    moreTools: allowedWorkspaceTools.filter((tool) => !primaryRoleTools.includes(tool))
  };
}
