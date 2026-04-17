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
  visibility: "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"
};

interface ActionCardProps {
  icon: string;
  label: string;
  description: string;
  onClick: () => void;
  accent?: "blue" | "green" | "amber" | "purple" | "slate" | "rose";
  badge?: string | number;
}

function ActionCard({ icon, label, description, onClick, accent = "blue", badge }: ActionCardProps): React.JSX.Element {
  return (
    <button type="button" className={`action-card action-card--${accent}`} onClick={onClick}>
      <div className="action-card__icon">
        <Icon d={icon} size={18} />
        {badge !== undefined ? <span className="action-card__badge">{badge}</span> : null}
      </div>
      <div className="action-card__body">
        <span className="action-card__label">{label}</span>
        <span className="action-card__desc">{description}</span>
      </div>
      <span className="action-card__arrow" aria-hidden="true">
        Open
      </span>
    </button>
  );
}

interface SectionProps {
  title: string;
  children: React.ReactNode;
}

function DashSection({ title, children }: SectionProps): React.JSX.Element {
  return (
    <section className="dash-section">
      <h2 className="dash-section__title">{title}</h2>
      <div className="dash-section__grid">{children}</div>
    </section>
  );
}

const ROLE_DISPLAY: Record<string, { label: string; sub: string }> = {
  technician: { label: "Field Technician", sub: "FIELD OPERATIONS" },
  dispatcher: { label: "Dispatch Controller", sub: "SCHEDULING AND COMMS" },
  client: { label: "Client Portal", sub: "SERVICE VISIBILITY" },
  admin: { label: "Administration", sub: "PLATFORM ADMIN" },
  super_admin: { label: "Platform Command", sub: "SUPER ADMIN | FULL ACCESS" }
};

interface DashboardViewProps {
  session: PortalSession;
  openJobCount: number;
  onEnterWorkspace: (tool: string) => void;
  onLogout: () => void;
  overrideRole?: Role;
}

export function DashboardView({ session, openJobCount, onEnterWorkspace, onLogout, overrideRole }: DashboardViewProps): React.JSX.Element {
  const role = overrideRole || session.session.role;
  const meta = ROLE_DISPLAY[role] ?? { label: "Operations", sub: role.toUpperCase() };

  if (role === "technician") {
    return (
      <main className="dashboard-view">
        <DashHeader name={session.session.display_name} label={meta.label} sub={meta.sub} onLogout={onLogout} />

        <DashSection title="My Jobs">
          <ActionCard
            icon={ICONS.jobs}
            label="Open Work Orders"
            description="Manage and update your active jobs."
            onClick={() => onEnterWorkspace("jobs")}
            accent="green"
            badge={openJobCount}
          />
        </DashSection>

        <DashSection title="On-Site Closeout">
          <ActionCard
            icon={ICONS.checklist}
            label="Jobcard Generator"
            description="Capture readings, photos, and sign-off."
            onClick={() => onEnterWorkspace("jobs")}
            accent="blue"
          />
          <ActionCard
            icon={ICONS.documents}
            label="Prior Reports"
            description="Review historical jobcards and service reports."
            onClick={() => onEnterWorkspace("documents")}
            accent="slate"
          />
        </DashSection>
      </main>
    );
  }

  if (role === "dispatcher") {
    return (
      <main className="dashboard-view">
        <DashHeader name={session.session.display_name} label={meta.label} sub={meta.sub} onLogout={onLogout} />

        <DashSection title="Dispatch">
          <ActionCard
            icon={ICONS.dispatch}
            label="Job Queue"
            description="Assign and schedule open engagements."
            onClick={() => onEnterWorkspace("schedule")}
            accent="amber"
            badge={openJobCount}
          />
          <ActionCard
            icon={ICONS.scheduling}
            label="Scheduling"
            description="Confirm or adjust maintenance windows."
            onClick={() => onEnterWorkspace("schedule")}
            accent="amber"
          />
        </DashSection>

        <DashSection title="Communication">
          <ActionCard
            icon={ICONS.comms}
            label="Client Updates"
            description="Send messages linked to service records."
            onClick={() => onEnterWorkspace("comms")}
            accent="blue"
          />
          <ActionCard
            icon={ICONS.people}
            label="People Directory"
            description="Review active contacts and sync operator details."
            onClick={() => onEnterWorkspace("people")}
            accent="purple"
          />
        </DashSection>

        <DashSection title="Documents">
          <ActionCard
            icon={ICONS.documents}
            label="Document Control"
            description="Review and release jobcards and reports."
            onClick={() => onEnterWorkspace("documents")}
            accent="slate"
          />
        </DashSection>
      </main>
    );
  }

  if (role === "client") {
    return (
      <main className="dashboard-view">
        <DashHeader name={session.session.display_name} label={meta.label} sub={meta.sub} onLogout={onLogout} />

        <DashSection title="Active Services">
          <ActionCard
            icon={ICONS.visibility}
            label="Service Status"
            description="Track live progress of your active jobs."
            onClick={() => onEnterWorkspace("jobs")}
            accent="blue"
            badge={openJobCount}
          />
        </DashSection>

        <DashSection title="Compliance Documents">
          <ActionCard
            icon={ICONS.compliance}
            label="Reports and Evidence"
            description="Review published statutory certificates and reports."
            onClick={() => onEnterWorkspace("documents")}
            accent="green"
          />
        </DashSection>
      </main>
    );
  }

  if (role === "admin") {
    return (
      <main className="dashboard-view">
        <DashHeader name={session.session.display_name} label={meta.label} sub={meta.sub} onLogout={onLogout} />

        <DashSection title="Jobs">
          <ActionCard
            icon={ICONS.jobs}
            label="All Engagements"
            description="Global access to active jobs."
            onClick={() => onEnterWorkspace("jobs")}
            accent="blue"
            badge={openJobCount}
          />
        </DashSection>

        <DashSection title="Operations">
          <ActionCard
            icon={ICONS.people}
            label="People Directory"
            description="Review active users and sync shared contacts."
            onClick={() => onEnterWorkspace("people")}
            accent="purple"
          />
          <ActionCard
            icon={ICONS.documents}
            label="Document Control"
            description="Manage platform-wide reports and certificates."
            onClick={() => onEnterWorkspace("documents")}
            accent="slate"
          />
        </DashSection>

        <DashSection title="Administration">
          <ActionCard
            icon={ICONS.admin}
            label="Platform Governance"
            description="Health checks, automation queues, and audits."
            onClick={() => onEnterWorkspace("admin")}
            accent="rose"
          />
        </DashSection>
      </main>
    );
  }

  return (
    <main className="dashboard-view">
      <DashHeader name={session.session.display_name} label={meta.label} sub={meta.sub} onLogout={onLogout} />

      <DashSection title="Field Operations">
        <ActionCard
          icon={ICONS.jobs}
          label="Work Orders"
          description="Technician context for active jobs."
          onClick={() => onEnterWorkspace("jobs")}
          accent="green"
          badge={openJobCount}
        />
        <ActionCard
          icon={ICONS.checklist}
          label="Generate Jobcard"
          description="Field jobcard builder context."
          onClick={() => onEnterWorkspace("jobs")}
          accent="green"
        />
      </DashSection>

      <DashSection title="Dispatch">
        <ActionCard
          icon={ICONS.dispatch}
          label="Job Queue"
          description="Assignment and triage context."
          onClick={() => onEnterWorkspace("schedule")}
          accent="amber"
          badge={openJobCount}
        />
        <ActionCard
          icon={ICONS.scheduling}
          label="Schedule Control"
          description="Modify and confirm service windows."
          onClick={() => onEnterWorkspace("schedule")}
          accent="amber"
        />
      </DashSection>

      <DashSection title="Client and Communications">
        <ActionCard
          icon={ICONS.comms}
          label="Client Comms"
          description="Job-linked messaging interface."
          onClick={() => onEnterWorkspace("comms")}
          accent="blue"
        />
        <ActionCard
          icon={ICONS.people}
          label="People Registry"
          description="Sync users, clients, and technicians."
          onClick={() => onEnterWorkspace("people")}
          accent="purple"
        />
      </DashSection>

      <DashSection title="Admin and Governance">
        <ActionCard
          icon={ICONS.documents}
          label="Document Control"
          description="Global management of jobs and reports."
          onClick={() => onEnterWorkspace("documents")}
          accent="slate"
        />
        <ActionCard
          icon={ICONS.audit}
          label="Platform Governance"
          description="Health checks and structural configuration."
          onClick={() => onEnterWorkspace("admin")}
          accent="rose"
        />
      </DashSection>
    </main>
  );
}

function DashHeader({ name, label, sub, onLogout }: { name: string; label: string; sub: string; onLogout: () => void }): React.JSX.Element {
  return (
    <header className="dashboard-header">
      <div>
        <h1>{label}</h1>
        <p className="role-tag">{sub}</p>
        <p className="dashboard-header__welcome">Welcome back, {name}</p>
      </div>
      <button type="button" className="logout-button" onClick={onLogout}>
        Sign out
      </button>
    </header>
  );
}

