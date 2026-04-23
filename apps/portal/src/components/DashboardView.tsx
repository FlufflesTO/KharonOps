import React from "react";
import type { Role } from "@kharon/domain";
import type { PortalSession } from "../apiClient";

function Icon({ d, size = 20 }: { d: string; size?: number }): React.JSX.Element {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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
  scheduling: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
  compliance: "M22 11.08V12a10 10 0 1 1-5.93-9.14",
  audit: "M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7",
  checklist: "M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 0 2-2h2a2 2 0 0 0 2 2m-6 9l2 2 4-4",
  visibility: "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z",
  finance: "M12 1v22M5 6h8a4 4 0 0 1 0 8H9a4 4 0 0 0 0 8h10",
  arrowRight: "M5 12h14M12 5l7 7-7 7"
};

interface QuickStartCardProps {
  icon: string;
  label: string;
  tool: string;
  onClick: (tool: string) => void;
  badge?: string | number;
}

function QuickStartCard({ icon, label, tool, onClick, badge }: QuickStartCardProps): React.JSX.Element {
  return (
    <button type="button" className="quick-start-card" onClick={() => onClick(tool)}>
      <div className="quick-start-card__icon">
        <Icon d={icon} size={20} />
        {badge !== undefined && badge > 0 ? <span className="quick-start-card__badge">{badge}</span> : null}
      </div>
      <span className="quick-start-card__label">{label}</span>
      <Icon d={ICONS.arrowRight} size={16} className="quick-start-card__arrow" />
    </button>
  );
}

const ROLE_DISPLAY: Record<string, { label: string; sub: string; primaryTool: string; quickStart: Array<{ icon: string; label: string; tool: string }> }> = {
  technician: {
    label: "Field Technician",
    sub: "FIELD OPERATIONS",
    primaryTool: "jobs",
    quickStart: [
      { icon: ICONS.jobs, label: "My Jobs", tool: "jobs" },
      { icon: ICONS.checklist, label: "Jobcard", tool: "jobs" },
      { icon: ICONS.documents, label: "Reports", tool: "documents" }
    ]
  },
  dispatcher: {
    label: "Dispatch Controller",
    sub: "SCHEDULING AND COMMS",
    primaryTool: "schedule",
    quickStart: [
      { icon: ICONS.dispatch, label: "Job Queue", tool: "schedule" },
      { icon: ICONS.jobs, label: "All Jobs", tool: "jobs" },
      { icon: ICONS.comms, label: "Messages", tool: "comms" },
      { icon: ICONS.people, label: "Directory", tool: "people" }
    ]
  },
  client: {
    label: "Client Portal",
    sub: "SERVICE VISIBILITY",
    primaryTool: "jobs",
    quickStart: [
      { icon: ICONS.visibility, label: "Service Status", tool: "jobs" },
      { icon: ICONS.compliance, label: "Documents", tool: "documents" }
    ]
  },
  finance: {
    label: "Finance Command",
    sub: "BILLING AND INTEGRITY",
    primaryTool: "finance",
    quickStart: [
      { icon: ICONS.finance, label: "Financial Overview", tool: "finance" },
      { icon: ICONS.jobs, label: "Job Portfolio", tool: "jobs" },
      { icon: ICONS.documents, label: "Ledger", tool: "documents" }
    ]
  },
  admin: {
    label: "Administration",
    sub: "PLATFORM ADMIN",
    primaryTool: "admin",
    quickStart: [
      { icon: ICONS.jobs, label: "All Jobs", tool: "jobs" },
      { icon: ICONS.people, label: "Users", tool: "people" },
      { icon: ICONS.documents, label: "Documents", tool: "documents" },
      { icon: ICONS.admin, label: "Settings", tool: "admin" }
    ]
  },
  super_admin: {
    label: "Platform Command",
    sub: "SUPER ADMIN | FULL ACCESS",
    primaryTool: "admin",
    quickStart: [
      { icon: ICONS.admin, label: "System Health", tool: "admin" },
      { icon: ICONS.jobs, label: "All Jobs", tool: "jobs" },
      { icon: ICONS.dispatch, label: "Dispatch", tool: "schedule" },
      { icon: ICONS.finance, label: "Finance", tool: "finance" }
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
  const role = overrideRole || session.session.role;
  const meta = ROLE_DISPLAY[role] ?? { 
    label: "Operations", 
    sub: role.toUpperCase(),
    primaryTool: "jobs",
    quickStart: [{ icon: ICONS.jobs, label: "Get Started", tool: "jobs" }]
  };

  return (
    <main className="dashboard-view">
      <DashHeader name={session.session.display_name} label={meta.label} sub={meta.sub} onLogout={onLogout} />

      <section className="dashboard-intro">
        <p className="dashboard-intro__text">
          Welcome back. You have <strong>{openJobCount} active job{openJobCount !== 1 ? "s" : ""}</strong> in the system.
        </p>
        <button 
          type="button" 
          className="btn-primary btn-primary--large"
          onClick={() => onEnterWorkspace(meta.primaryTool)}
        >
          <Icon d={ICONS.jobs} size={18} />
          Go to {meta.primaryTool === "schedule" ? "Dispatch" : meta.primaryTool.charAt(0).toUpperCase() + meta.primaryTool.slice(1)}
        </button>
      </section>

      <section className="quick-start-section">
        <h2 className="quick-start-section__title">Quick Start</h2>
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

      <section className="dashboard-help">
        <div className="dashboard-help__card">
          <Icon d={ICONS.compliance} size={24} />
          <div>
            <h3>Need Assistance?</h3>
            <p>Contact support or refer to the documentation for guidance on using the portal.</p>
          </div>
        </div>
      </section>

      {!onboardingDismissed ? (
        <section className="dashboard-help">
          <div className="dashboard-help__card">
            <Icon d={ICONS.checklist} size={24} />
            <div>
              <h3>First-time Checklist</h3>
              <p>1. Open Jobs. 2. Review status and notes. 3. Use Schedule or Files for next actions.</p>
            </div>
            <button className="button button--ghost" type="button" onClick={onDismissOnboarding}>
              Dismiss
            </button>
          </div>
        </section>
      ) : null}
    </main>
  );
}

function DashHeader({ name, label, sub, onLogout }: { name: string; label: string; sub: string; onLogout: () => void }): React.JSX.Element {
  return (
    <header className="dashboard-header">
      <div>
        <h1>{label}</h1>
        <p className="role-tag">{sub}</p>
      </div>
      <button type="button" className="logout-button" onClick={onLogout}>
        Sign out
      </button>
    </header>
  );
}

