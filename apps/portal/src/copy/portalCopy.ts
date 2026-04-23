import type { Role } from "@kharon/domain";

export const DASHBOARD_COPY: Record<Role, { title: string; subtitle: string; prompt: string; support: string }> = {
  client: {
    title: "What needs your attention today",
    subtitle: "Client workspace",
    prompt: "How can we help?",
    support: "Need help?"
  },
  technician: {
    title: "What needs your attention today",
    subtitle: "Technician workspace",
    prompt: "Today",
    support: "Need help?"
  },
  dispatcher: {
    title: "What needs your attention today",
    subtitle: "Dispatch workspace",
    prompt: "What needs assigning?",
    support: "Need help?"
  },
  finance: {
    title: "What needs your attention today",
    subtitle: "Finance workspace",
    prompt: "What needs billing attention?",
    support: "Need help?"
  },
  admin: {
    title: "What needs your attention today",
    subtitle: "Admin workspace",
    prompt: "Office actions needing review",
    support: "Need help?"
  },
  super_admin: {
    title: "What needs your attention today",
    subtitle: "Platform oversight",
    prompt: "Platform health",
    support: "Need help?"
  }
};

export const ROLE_SCREEN_COPY = {
  jobs: {
    title: "Jobs",
    statusLabels: ["Work form", "Update status", "Add note"]
  },
  finance: {
    title: "Finance",
    sections: ["Overview", "Quotes", "Invoices", "Money Owed", "Statements"]
  },
  admin: {
    title: "Admin Tools",
    sections: ["View as Role", "System Summary", "Data Checks"]
  },
  super_admin: {
    title: "Platform health",
    sections: ["Checks needing review", "Governance actions", "Recent activity"]
  }
};

