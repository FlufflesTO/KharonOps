import React, { useState } from "react";
import type { Role } from "@kharon/domain";
import type { PortalSession } from "../apiClient";
import { PresenceIndicator } from "./PresenceIndicator";
import { DASHBOARD_COPY } from "../copy/portalCopy";

function Icon({ d, size = 20, className }: { d: string; size?: number; className?: string }): React.JSX.Element {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      <path d={d} />
    </svg>
  );
}

const ICONS = {
  dispatch: "M3 6h18M3 12h18M3 18h18",
  comms: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",
  people: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
  admin: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  documents: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z",
  jobs: "M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11",
  checklist: "M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 0 2-2h2a2 2 0 0 0 2 2m-6 9l2 2 4-4",
  visibility: "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z",
  finance: "M12 1v22M5 6h8a4 4 0 0 1 0 8H9a4 4 0 0 0 0 8h10",
  arrowRight: "M5 12h14M12 5l7 7-7 7",
  audit: "M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
};

interface QuickStartCardProps {
  icon: string;
  label: string;
  tool: string;
  onClick: (tool: string) => void;
  badge?: string | number | undefined;
}

function QuickStartCard({ icon, label, tool, onClick, badge }: QuickStartCardProps): React.JSX.Element {
  const hasBadge = badge !== undefined && (typeof badge === "number" ? badge > 0 : badge.length > 0);
  return (
    <button type="button" className="quick-start-card glass-panel-interactive" onClick={() => onClick(tool)}>
      <div className="quick-start-card__icon text-primary">
        <Icon d={icon} size={24} />
      </div>
      <div className="flex-1 text-left">
        <span className="quick-start-card__label font-semibold text-white">{label}</span>
      </div>
      {hasBadge ? <span className="quick-start-card__badge">{badge}</span> : null}
      <div className="quick-start-card__arrow opacity-50 transition-transform">
        <Icon d={ICONS.arrowRight} size={16} />
      </div>
    </button>
  );
}

const ROLE_DISPLAY: Record<
  Role,
  { label: string; sub: string; primaryTool: string; quickStart: Array<{ icon: string; label: string; tool: string }> }
> = {
  client: {
    label: DASHBOARD_COPY.client.subtitle,
    sub: DASHBOARD_COPY.client.prompt,
    primaryTool: "client_support",
    quickStart: [
      { icon: ICONS.comms, label: "Request", tool: "client_support" },
      { icon: ICONS.visibility, label: "My Jobs", tool: "jobs" },
      { icon: ICONS.documents, label: "Follow Up", tool: "client_overview" }
    ]
  },
  technician: {
    label: DASHBOARD_COPY.technician.subtitle,
    sub: DASHBOARD_COPY.technician.prompt,
    primaryTool: "tech_day",
    quickStart: [
      { icon: ICONS.jobs, label: "Today", tool: "tech_day" },
      { icon: ICONS.checklist, label: "Assigned Jobs", tool: "jobs" },
      { icon: ICONS.checklist, label: "Check In / Out", tool: "tech_checkin" },
      { icon: ICONS.documents, label: "Reports", tool: "documents" }
    ]
  },
  dispatcher: {
    label: DASHBOARD_COPY.dispatcher.subtitle,
    sub: DASHBOARD_COPY.dispatcher.prompt,
    primaryTool: "dispatch_unassigned",
    quickStart: [
      { icon: ICONS.dispatch, label: "Schedule", tool: "schedule" },
      { icon: ICONS.jobs, label: "Unassigned", tool: "dispatch_unassigned" },
      { icon: ICONS.audit, label: "Confirm", tool: "dispatch_dashboard" },
      { icon: ICONS.comms, label: "Messages", tool: "comms" }
    ]
  },
  finance: {
    label: DASHBOARD_COPY.finance.subtitle,
    sub: DASHBOARD_COPY.finance.prompt,
    primaryTool: "finance_invoices",
    quickStart: [
      { icon: ICONS.finance, label: "Invoices", tool: "finance_invoices" },
      { icon: ICONS.finance, label: "Payments", tool: "finance_payments" },
      { icon: ICONS.documents, label: "Statements", tool: "finance_statements" }
    ]
  },
  admin: {
    label: DASHBOARD_COPY.admin.subtitle,
    sub: DASHBOARD_COPY.admin.prompt,
    primaryTool: "admin_dashboard",
    quickStart: [
      { icon: ICONS.admin, label: "Settings", tool: "admin" },
      { icon: ICONS.audit, label: "Audit", tool: "admin_dashboard" },
      { icon: ICONS.checklist, label: "Recovery", tool: "sa_health" }
    ]
  },
  super_admin: {
    label: DASHBOARD_COPY.super_admin.subtitle,
    sub: DASHBOARD_COPY.super_admin.prompt,
    primaryTool: "sa_health",
    quickStart: [
      { icon: ICONS.admin, label: "Health", tool: "sa_health" },
      { icon: ICONS.checklist, label: "Checks", tool: "sa_checks" },
      { icon: ICONS.audit, label: "Governance", tool: "sa_overview" },
      { icon: ICONS.people, label: "Users", tool: "sa_users" },
      { icon: ICONS.comms, label: "Activity", tool: "sa_activity" }
    ]
  }
};

interface DashboardViewProps {
  session: PortalSession;
  openJobCount: number;
  onEnterWorkspace: (tool: string) => void;
  onLogout: () => void;
  overrideRole?: Role;
  onboardingDismissed?: boolean;
  onDismissOnboarding?: () => void;
}

export function DashboardView({
  session,
  openJobCount,
  onEnterWorkspace,
  onLogout,
  overrideRole,
  onboardingDismissed,
  onDismissOnboarding
}: DashboardViewProps): React.JSX.Element {
  const role = (overrideRole || session.session.role) as Role;
  const meta = ROLE_DISPLAY[role] ?? ROLE_DISPLAY.client;

  return (
    <main className="dashboard-view">
      <header className="dashboard-header glass-panel mb-8 p-6 lg:p-8 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">{DASHBOARD_COPY[role].title}</h1>
            <p className="status-chip status-chip--active">{meta.label}</p>
          </div>
          <PresenceIndicator userId={session.session.user_id} className="mt-6" />
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden sm:block text-right">
            <p className="font-semibold text-white">{session.session.display_name}</p>
            <p className="text-xs opacity-50">{session.session.user_id}</p>
          </div>
          <button type="button" className="button button--ghost shrink-0" onClick={onLogout}>
            Sign out
          </button>
        </div>
      </header>

      <section className="dashboard-intro glass-panel p-6 lg:p-8 mb-8 relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-xl font-semibold text-white mb-2">{DASHBOARD_COPY[role].prompt}</h2>
          <p className="dashboard-intro__text mb-6 opacity-75 max-w-2xl">
            You currently have <strong className="text-white">{openJobCount} active job{openJobCount !== 1 ? "s" : ""}</strong> needing attention.
            {role === "client" ? "Review the open work and send the next request." : "Open the main workspace and continue with the next step."}
          </p>
          <button type="button" className="button button--primary" onClick={() => onEnterWorkspace(meta.primaryTool)}>
            <Icon d={ICONS.jobs} size={18} className="mr-2" />
            Open {meta.primaryTool === "dispatch_unassigned" ? "Dispatch" : meta.primaryTool.charAt(0).toUpperCase() + meta.primaryTool.slice(1)}
          </button>
        </div>
        <div className="absolute -right-20 -top-20 w-64 h-64 rounded-full bg-primary opacity-10 blur-3xl pointer-events-none"></div>
      </section>

      <section className="quick-start-section mb-8">
        <h2 className="text-sm font-bold uppercase tracking-wider opacity-50 mb-4 px-1">Your next steps</h2>
        <div className="quick-start-grid">
          {meta.quickStart.map((item, index) => (
            <QuickStartCard
              key={index}
              icon={item.icon}
              label={item.label}
              tool={item.tool}
              onClick={onEnterWorkspace}
              badge={item.tool === "jobs" ? openJobCount : undefined}
            />
          ))}
        </div>
      </section>

      {!onboardingDismissed ? (
        <section className="dashboard-help mb-8">
          <div className="glass-panel p-6 border-l-4 border-l-primary flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex gap-4 items-start">
              <div className="mt-1 text-primary">
                <Icon d={ICONS.checklist} size={24} />
              </div>
              <div>
                <h3 className="font-semibold text-white mb-1">Need help?</h3>
                <p className="text-sm opacity-75">Open the main section, review the current record, then use the next action that fits the task.</p>
              </div>
            </div>
            <button className="button button--ghost shrink-0" type="button" onClick={onDismissOnboarding}>
              Dismiss
            </button>
          </div>
        </section>
      ) : null}

      <section className="dashboard-help">
        <div className="glass-panel p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex gap-4 items-start">
            <div className="mt-1 opacity-50">
              <Icon d={ICONS.checklist} size={24} />
            </div>
            <div>
              <h3 className="font-semibold text-white mb-1">Need help?</h3>
              <p className="text-sm opacity-75">Contact support or check the guidance pages if you need help using the portal.</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
