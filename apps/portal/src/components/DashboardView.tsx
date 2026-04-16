/**
 * KharonOps Portal - DashboardView Component
 * Purpose: High-level landing page to reduce information density upon login.
 *          Provides role-specific "Command Cards" for quick navigation.
 */
import React from "react";
import type { PortalSession } from "../apiClient";

interface DashboardCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  actionLabel: string;
  onClick: () => void;
  accent?: "blue" | "green" | "amber" | "purple";
}

function DashboardCard({ title, description, icon, actionLabel, onClick, accent = "blue" }: DashboardCardProps): React.JSX.Element {
  return (
    // The entire card is the interactive surface. The inner button is a visual affordance
    // only and does not carry its own onClick to prevent double-firing.
    // tabIndex and role make the article keyboard-navigable as a button.
    <article
      className={`dashboard-card dashboard-card--${accent}`}
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); } }}
      role="button"
      tabIndex={0}
      aria-label={actionLabel}
    >
      <div className="dashboard-card__icon">{icon}</div>
      <div className="dashboard-card__content">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
      {/* Visual affordance — pointer-events disabled to prevent event double-fire */}
      <span className="dashboard-card__action" aria-hidden="true">
        {actionLabel}
      </span>
    </article>
  );
}

interface DashboardViewProps {
  session: PortalSession;
  openJobCount: number;
  onEnterWorkspace: () => void;
  onLogout: () => void;
}

export function DashboardView({
  session,
  openJobCount,
  onEnterWorkspace,
  onLogout
}: DashboardViewProps): React.JSX.Element {
  const { role, display_name } = session.session;

  return (
    <main className="dashboard-view">
      <header className="dashboard-header">
        <div className="dashboard-header__welcome">
          <h1>Welcome, {display_name}</h1>
          <p className="role-tag">{role === "super_admin" ? "SUPER ADMIN — FULL ACCESS" : `${role.toUpperCase()} COMMAND`}</p>
        </div>
        <button className="logout-button" onClick={onLogout}>Logout</button>
      </header>

      <section className="dashboard-grid">
        {role === "technician" && (
          <>
            <DashboardCard
              title="Current Field Work"
              description={`You have ${openJobCount} open jobs requiring field execution or sign-off.`}
              icon={<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" /></svg>}
              actionLabel="Open Jobcards"
              onClick={onEnterWorkspace}
              accent="blue"
            />
            <DashboardCard
              title="Capture Evidence"
              description="Quickly upload photos and notes for active site surveys."
              icon={<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" /><circle cx="12" cy="13" r="4" /></svg>}
              actionLabel="New Entry"
              onClick={onEnterWorkspace}
              accent="amber"
            />
          </>
        )}

        {role === "dispatcher" && (
          <>
            <DashboardCard
              title="Schedule Control"
              description="Manage technician slots and confirm pending schedule requests."
              icon={<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>}
              actionLabel="Go to Scheduling"
              onClick={onEnterWorkspace}
              accent="purple"
            />
            <DashboardCard
              title="Job List Overview"
              description={`${openJobCount} active jobs across all technician contexts.`}
              icon={<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></svg>}
              actionLabel="View All Jobs"
              onClick={onEnterWorkspace}
              accent="blue"
            />
          </>
        )}

        {role === "client" && (
          <>
            <DashboardCard
              title="Site Status"
              description={`Monitor the live posture of your ${openJobCount} active service records.`}
              icon={<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>}
              actionLabel="Check Status"
              onClick={onEnterWorkspace}
              accent="green"
            />
            <DashboardCard
              title="Compliance Vault"
              description="Access your historical jobcards, service reports, and certifications."
              icon={<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" /></svg>}
              actionLabel="Download Reports"
              onClick={onEnterWorkspace}
              accent="blue"
            />
          </>
        )}

        {role === "admin" && (
          <>
            <DashboardCard
              title="System Governance"
              description="Monitor audit logs, user provisioning, and organizational health."
              icon={<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>}
              actionLabel="Admin Panel"
              onClick={onEnterWorkspace}
              accent="purple"
            />
            <DashboardCard
              title="Operational Overview"
              description={`Total ${openJobCount} jobs currently executing in the system.`}
              icon={<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.21 15.89A10 10 0 118 2.83M22 12A10 10 0 0012 2v10z" /></svg>}
              actionLabel="Workspace"
              onClick={onEnterWorkspace}
              accent="blue"
            />
          </>
        )}

        {role === "super_admin" && (
          <>
            {/* Field Operations — mirrors technician view */}
            <DashboardCard
              title="Field Operations"
              description={`${openJobCount} open jobs executing across all technician contexts.`}
              icon={<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" /></svg>}
              actionLabel="Open Jobcards"
              onClick={onEnterWorkspace}
              accent="blue"
            />
            {/* Scheduling — mirrors dispatcher view */}
            <DashboardCard
              title="Schedule Control"
              description="Manage technician slots and confirm pending schedule requests."
              icon={<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>}
              actionLabel="Go to Scheduling"
              onClick={onEnterWorkspace}
              accent="purple"
            />
            {/* Client Compliance — mirrors client view */}
            <DashboardCard
              title="Compliance Vault"
              description="Inspect all client jobcards, service reports, and certifications."
              icon={<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" /></svg>}
              actionLabel="View Reports"
              onClick={onEnterWorkspace}
              accent="green"
            />
            {/* System Governance — mirrors admin view */}
            <DashboardCard
              title="Platform Governance"
              description="Full audit trail, user provisioning, and organizational health monitoring."
              icon={<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>}
              actionLabel="Admin Panel"
              onClick={onEnterWorkspace}
              accent="amber"
            />
          </>
        )}
      </section>

      <footer className="dashboard-footer">
        <p>KharonOps Command Centre &copy; 2026</p>
        <small>Proprietary Fire &amp; Security Governance Substrate</small>
      </footer>
    </main>
  );
}
