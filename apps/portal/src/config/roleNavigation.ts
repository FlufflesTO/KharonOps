import type { Role } from "@kharon/domain";

export type RoleMenuItem = {
  tool: string;
  label: string;
};

export const ROLE_PRIMARY_NAV: Record<Role, RoleMenuItem[]> = {
  client: [
    { tool: "client_support", label: "Request" },
    { tool: "jobs", label: "My Jobs" },
    { tool: "client_overview", label: "Follow Up" }
  ],
  technician: [
    { tool: "tech_day", label: "Today" },
    { tool: "jobs", label: "Assigned Jobs" },
    { tool: "tech_checkin", label: "Check In / Out" },
    { tool: "documents", label: "Reports" },
    { tool: "tech_help", label: "Help" }
  ],
  dispatcher: [
    { tool: "schedule", label: "Schedule" },
    { tool: "dispatch_unassigned", label: "Unassigned" },
    { tool: "dispatch_dashboard", label: "Confirm" },
    { tool: "comms", label: "Messages" }
  ],
  finance: [
    { tool: "finance_invoices", label: "Invoices" },
    { tool: "finance_payments", label: "Payments" },
    { tool: "finance_statements", label: "Statements" }
  ],
  admin: [
    { tool: "admin", label: "Settings" },
    { tool: "admin_dashboard", label: "Audit" },
    { tool: "sa_health", label: "Recovery" }
  ],
  super_admin: [
    { tool: "sa_health", label: "Health" },
    { tool: "sa_checks", label: "Checks" },
    { tool: "sa_overview", label: "Governance" },
    { tool: "sa_users", label: "Users" },
    { tool: "sa_activity", label: "Activity" }
  ]
};

export const ROLE_LANDING_TOOL: Record<Role, string> = {
  client: "client_support",
  technician: "tech_day",
  dispatcher: "dispatch_unassigned",
  finance: "finance_invoices",
  admin: "admin_dashboard",
  super_admin: "sa_health"
};

