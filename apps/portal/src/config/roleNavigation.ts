import type { Role } from "@kharon/domain";
import { ROLE_PRIMARY_TOOLS, WORKSPACE_TOOL_META } from "../appShell/helpers";

export type RoleMenuItem = {
  tool: string;
  label: string;
};

const ROLE_MENU_LABELS: Record<string, string> = {
  client_support: "Request",
  client_overview: "Follow Up",
  tech_day: "Today",
  jobs: "My Jobs",
  tech_checkin: "Check In / Out",
  dispatch_unassigned: "Unassigned",
  dispatch_dashboard: "Overview",
  finance_debtors: "Money Owed",
  admin_dashboard: "Office",
  sa_overview: "Overview",
  sa_checks: "Checks",
  sa_automations: "Automations",
  sa_activity: "Activity"
};

function menuItem(tool: string): RoleMenuItem {
  return {
    tool,
    label: ROLE_MENU_LABELS[tool] ?? WORKSPACE_TOOL_META[tool]?.label ?? tool
  };
}

function roleTools(role: Role): string[] {
  return ROLE_PRIMARY_TOOLS[role] ?? [];
}

export const ROLE_PRIMARY_NAV: Record<Role, RoleMenuItem[]> = {
  client: roleTools("client").map(menuItem),
  technician: roleTools("technician").map(menuItem),
  dispatcher: roleTools("dispatcher").map(menuItem),
  finance: roleTools("finance").map(menuItem),
  admin: roleTools("admin").map(menuItem),
  super_admin: roleTools("super_admin").map(menuItem)
};

export const ROLE_LANDING_TOOL: Record<Role, string> = {
  client: roleTools("client")[0] ?? "jobs",
  technician: roleTools("technician")[0] ?? "jobs",
  dispatcher: roleTools("dispatcher")[0] ?? "jobs",
  finance: roleTools("finance")[0] ?? "jobs",
  admin: roleTools("admin")[0] ?? "jobs",
  super_admin: roleTools("super_admin")[0] ?? "jobs"
};
