/**
 * KharonOps Portal - DashboardView Component
 * Purpose: Role-specific landing dashboard that groups functional areas into
 *          lean, purpose-specific sections. Each section contains only the
 *          actions that belong to that function — no cross-contamination.
 *          super_admin sees all sections from all roles in a single view.
 * Dependencies: apiClient (PortalSession), @kharon/domain (Role)
 * Structural Role: Rendered by App.tsx when portalView === "dashboard".
 */
import React from "react";
import type { PortalSession } from "../apiClient";

// ─── Icon primitives ──────────────────────────────────────────────────────────
function Icon({ d, size = 20 }: { d: string; size?: number }): React.JSX.Element {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

const ICONS = {
  dispatch:   "M3 6h18M3 12h18M3 18h18",
  comms:      "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",
  people:     "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
  admin:      "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  documents:  "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z",
  jobs:       "M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11",
  scheduling: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
  compliance: "M22 11.08V12a10 10 0 1 1-5.93-9.14",
  audit:      "M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7",
  workspace:  "M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z",
  checklist:  "M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 0 2-2h2a2 2 0 0 0 2 2m-6 9l2 2 4-4",
  visibility: "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z",
};

// ─── Action card ──────────────────────────────────────────────────────────────
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
    <article
      className={`action-card action-card--${accent}`}
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); } }}
      role="button"
      tabIndex={0}
      aria-label={label}
    >
      <div className="action-card__icon">
        <Icon d={icon} size={18} />
        {badge !== undefined && <span className="action-card__badge">{badge}</span>}
      </div>
      <div className="action-card__body">
        <span className="action-card__label">{label}</span>
        <span className="action-card__desc">{description}</span>
      </div>
      <span className="action-card__arrow" aria-hidden="true">→</span>
    </article>
  );
}

// ─── Section group ─────────────────────────────────────────────────────────────
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

// ─── Role label map ────────────────────────────────────────────────────────────
const ROLE_DISPLAY: Record<string, { label: string; sub: string }> = {
  technician:  { label: "Field Technician",     sub: "FIELD OPERATIONS" },
  dispatcher:  { label: "Dispatch Controller",  sub: "SCHEDULING & COMMS" },
  client:      { label: "Client Portal",        sub: "SERVICE VISIBILITY" },
  admin:       { label: "Administration",       sub: "PLATFORM ADMIN" },
  super_admin: { label: "Platform Command",     sub: "SUPER ADMIN — FULL ACCESS" },
};

// ─── Props ─────────────────────────────────────────────────────────────────────
interface DashboardViewProps {
  session: PortalSession;
  openJobCount: number;
  onEnterWorkspace: (tool: string) => void;
  onLogout: () => void;
}

// ─── Main component ────────────────────────────────────────────────────────────
export function DashboardView({ session, openJobCount, onEnterWorkspace, onLogout }: DashboardViewProps): React.JSX.Element {
  const role = session.session.role;
  const meta = ROLE_DISPLAY[role] ?? { label: "Operations", sub: role.toUpperCase() };

  // ── TECHNICIAN ───────────────────────────────────────────────────────────────
  // Purpose: Field execution. Show only the jobs they're assigned to and the
  //          tools needed to execute and close them out on site. No admin noise.
  if (role === "technician") {
    return (
      <main className="dashboard-view">
        <DashHeader name={session.session.display_name} label={meta.label} sub={meta.sub} onLogout={onLogout} />

        <DashSection title="My Jobs">
          <ActionCard
            icon={ICONS.jobs}
            label="Open Work Orders"
            description={`${openJobCount} jobs assigned to you — open the workspace to begin or update`}
            onClick={() => onEnterWorkspace("jobs")}
            accent="green"
            badge={openJobCount}
          />
        </DashSection>

        <DashSection title="On-Site Closeout">
          <ActionCard
            icon={ICONS.checklist}
            label="Generate Jobcard"
            description="Capture readings, photos, and sign-off before leaving site"
            onClick={() => onEnterWorkspace("jobs")}
            accent="blue"
          />
          <ActionCard
            icon={ICONS.documents}
            label="Prior Reports"
            description="Review previously generated jobcards and service reports for reference"
            onClick={() => onEnterWorkspace("documents")}
            accent="slate"
          />
        </DashSection>
      </main>
    );
  }

  // ── DISPATCHER ───────────────────────────────────────────────────────────────
  // Purpose: Scheduling coordination and client-facing communication.
  //          No job execution detail — that belongs to technicians.
  if (role === "dispatcher") {
    return (
      <main className="dashboard-view">
        <DashHeader name={session.session.display_name} label={meta.label} sub={meta.sub} onLogout={onLogout} />

        <DashSection title="Dispatch">
          <ActionCard
            icon={ICONS.dispatch}
            label="Job Queue"
            description={`${openJobCount} open engagements awaiting schedule or technician assignment`}
            onClick={() => onEnterWorkspace("schedule")}
            accent="amber"
            badge={openJobCount}
          />
          <ActionCard
            icon={ICONS.scheduling}
            label="Scheduling"
            description="Confirm, assign, or reschedule maintenance windows for open jobs"
            onClick={() => onEnterWorkspace("schedule")}
            accent="amber"
          />
        </DashSection>

        <DashSection title="Communication">
          <ActionCard
            icon={ICONS.comms}
            label="Client Updates"
            description="Send Gmail or chat rail messages tied directly to a selected job record"
            onClick={() => onEnterWorkspace("comms")}
            accent="blue"
          />
        </DashSection>

        <DashSection title="Documents">
          <ActionCard
            icon={ICONS.documents}
            label="Document Control"
            description="Release or review controlled outputs — jobcards, service reports, certificates"
            onClick={() => onEnterWorkspace("documents")}
            accent="slate"
          />
        </DashSection>
      </main>
    );
  }

  // ── CLIENT ───────────────────────────────────────────────────────────────────
  // Purpose: Read-only visibility into active service records and published documents.
  //          No scheduling, no job execution, no admin functions.
  if (role === "client") {
    return (
      <main className="dashboard-view">
        <DashHeader name={session.session.display_name} label={meta.label} sub={meta.sub} onLogout={onLogout} />

        <DashSection title="Active Services">
          <ActionCard
            icon={ICONS.visibility}
            label="Service Status"
            description={`${openJobCount} active service records — track live job progress for your sites`}
            onClick={() => onEnterWorkspace("jobs")}
            accent="blue"
            badge={openJobCount}
          />
        </DashSection>

        <DashSection title="Compliance Documents">
          <ActionCard
            icon={ICONS.compliance}
            label="Reports & Evidence"
            description="Review published jobcards, service reports, and SANS compliance certificates"
            onClick={() => onEnterWorkspace("documents")}
            accent="green"
          />
        </DashSection>
      </main>
    );
  }

  // ── ADMIN ────────────────────────────────────────────────────────────────────
  // Purpose: Platform operations oversight — full job visibility, governance controls,
  //          and document management. No on-site field execution functions.
  if (role === "admin") {
    return (
      <main className="dashboard-view">
        <DashHeader name={session.session.display_name} label={meta.label} sub={meta.sub} onLogout={onLogout} />

        <DashSection title="Jobs">
          <ActionCard
            icon={ICONS.jobs}
            label="All Engagements"
            description={`${openJobCount} open jobs platform-wide — search, filter, and act on any record`}
            onClick={() => onEnterWorkspace("jobs")}
            accent="blue"
            badge={openJobCount}
          />
        </DashSection>

        <DashSection title="Documents">
          <ActionCard
            icon={ICONS.documents}
            label="Document Control"
            description="Review, release, and manage all controlled outputs across every job"
            onClick={() => onEnterWorkspace("documents")}
            accent="purple"
          />
        </DashSection>

        <DashSection title="Administration">
          <ActionCard
            icon={ICONS.admin}
            label="Platform Governance"
            description="Health checks, configuration audit, and privileged recovery actions"
            onClick={() => onEnterWorkspace("admin")}
            accent="slate"
          />
          <ActionCard
            icon={ICONS.audit}
            label="Audit Trail"
            description="Forensic log of platform activity — certification posture and closeout verification"
            onClick={() => onEnterWorkspace("admin")}
            accent="slate"
          />
        </DashSection>
      </main>
    );
  }

  // ── SUPER ADMIN ──────────────────────────────────────────────────────────────
  // Purpose: Full-access view combining all role capabilities in labelled sections.
  //          Each section is purpose-specific and scoped to one functional domain.
  //          Technician | Dispatcher | Client | Admin — all visible, no overlap.
  return (
    <main className="dashboard-view">
      <DashHeader name={session.session.display_name} label={meta.label} sub={meta.sub} onLogout={onLogout} />

      {/* ── Field technician domain ── */}
      <DashSection title="Field Operations">
        <ActionCard
          icon={ICONS.jobs}
          label="Open Work Orders"
          description={`${openJobCount} open jobs — technician job list with assign, note, and closeout`}
          onClick={() => onEnterWorkspace("jobs")}
          accent="green"
          badge={openJobCount}
        />
        <ActionCard
          icon={ICONS.checklist}
          label="Jobcard Generator"
          description="Generate jobcards and service reports from the field execution workspace"
          onClick={() => onEnterWorkspace("jobs")}
          accent="green"
        />
      </DashSection>

      {/* ── Dispatcher domain ── */}
      <DashSection title="Dispatch & Scheduling">
        <ActionCard
          icon={ICONS.dispatch}
          label="Job Queue"
          description="Assign technicians and confirm maintenance windows for open engagements"
          onClick={() => onEnterWorkspace("schedule")}
          accent="amber"
        />
        <ActionCard
          icon={ICONS.scheduling}
          label="Schedule Control"
          description="Confirm requests, adjust windows, and manage reschedule flows"
          onClick={() => onEnterWorkspace("schedule")}
          accent="amber"
        />
      </DashSection>

      {/* ── Client-facing domain ── */}
      <DashSection title="Client Visibility">
        <ActionCard
          icon={ICONS.comms}
          label="Client Communications"
          description="Send Gmail and chat rail updates — linked per job record"
          onClick={() => onEnterWorkspace("comms")}
          accent="blue"
        />
        <ActionCard
          icon={ICONS.compliance}
          label="Client-Facing Reports"
          description="Review published compliance documents from the client view posture"
          onClick={() => onEnterWorkspace("documents")}
          accent="blue"
        />
      </DashSection>

      {/* ── People & registry ── */}
      <DashSection title="People Sync">
        <ActionCard
          icon={ICONS.people}
          label="People Registry"
          description="Sync technicians, clients, and provisioned users from the master roster"
          onClick={() => onEnterWorkspace("people")}
          accent="purple"
        />
      </DashSection>

      {/* ── Document control ── */}
      <DashSection title="Documents">
        <ActionCard
          icon={ICONS.documents}
          label="Document Control"
          description="Platform-wide controlled output review — release, publish, and audit"
          onClick={() => onEnterWorkspace("documents")}
          accent="slate"
        />
      </DashSection>

      {/* ── Platform administration ── */}
      <DashSection title="Administration">
        <ActionCard
          icon={ICONS.admin}
          label="Platform Governance"
          description="Health checks, configuration audit, and privileged recovery"
          onClick={() => onEnterWorkspace("admin")}
          accent="rose"
        />
        <ActionCard
          icon={ICONS.audit}
          label="Forensic Audit Trail"
          description="Immutable activity log — certification posture, closeout verification"
          onClick={() => onEnterWorkspace("admin")}
          accent="rose"
        />
      </DashSection>
    </main>
  );
}

// ─── Shared header ─────────────────────────────────────────────────────────────
function DashHeader({ name, label, sub, onLogout }: { name: string; label: string; sub: string; onLogout: () => void }): React.JSX.Element {
  return (
    <header className="dashboard-header">
      <div>
        <h1>{label}</h1>
        <p className="role-tag">{sub}</p>
        <p className="dashboard-header__welcome">Welcome back, {name}</p>
      </div>
      <button type="button" className="logout-button" onClick={onLogout}>Sign out</button>
    </header>
  );
}
