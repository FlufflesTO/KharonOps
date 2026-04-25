/**
 * KharonOps - Primary Dashboard
 * Purpose: Level 4 Operational Entry Point and Role-Based Navigation
 * Dependencies: dashboard-hardened.css, @kharon/domain
 * Structural Role: Central landing page for all authenticated platform users.
 */

import React from "react";
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

const ROLE_DISPLAY: Record<
  Role,
  {
    label: string;
    sub: string;
    primaryTool: string;
    primaryActionLabel: string;
    quickStart: Array<{ icon: string; label: string; tool: string }>;
  }
> = {
  client: {
    label: DASHBOARD_COPY.client.subtitle,
    sub: DASHBOARD_COPY.client.prompt,
    primaryTool: "client_support",
    primaryActionLabel: "Request service",
    quickStart: [
      { icon: ICONS.comms, label: "Request Support", tool: "client_support" },
      { icon: ICONS.visibility, label: "Facility Jobs", tool: "jobs" },
      { icon: ICONS.documents, label: "Status Overview", tool: "client_overview" }
    ]
  },
  technician: {
    label: DASHBOARD_COPY.technician.subtitle,
    sub: DASHBOARD_COPY.technician.prompt,
    primaryTool: "tech_day",
    primaryActionLabel: "View conduct timeline",
    quickStart: [
      { icon: ICONS.jobs, label: "Operational Day", tool: "tech_day" },
      { icon: ICONS.checklist, label: "Assigned Tasks", tool: "jobs" },
      { icon: ICONS.visibility, label: "Field Check-in", tool: "tech_checkin" },
      { icon: ICONS.documents, label: "Compliance Reports", tool: "documents" }
    ]
  },
  dispatcher: {
    label: DASHBOARD_COPY.dispatcher.subtitle,
    sub: DASHBOARD_COPY.dispatcher.prompt,
    primaryTool: "dispatch_unassigned",
    primaryActionLabel: "Resource coordination",
    quickStart: [
      { icon: ICONS.dispatch, label: "Workforce Schedule", tool: "schedule" },
      { icon: ICONS.jobs, label: "Unassigned Queue", tool: "dispatch_unassigned" },
      { icon: ICONS.audit, label: "Operations Board", tool: "dispatch_dashboard" }
    ]
  },
  finance: {
    label: DASHBOARD_COPY.finance.subtitle,
    sub: DASHBOARD_COPY.finance.prompt,
    primaryTool: "finance_invoices",
    primaryActionLabel: "Audit receivables",
    quickStart: [
      { icon: ICONS.finance, label: "Fiduciary Invoices", tool: "finance_invoices" },
      { icon: ICONS.finance, label: "Ledger Payments", tool: "finance_payments" },
      { icon: ICONS.documents, label: "Asset Statements", tool: "finance_statements" }
    ]
  },
  admin: {
    label: DASHBOARD_COPY.admin.subtitle,
    sub: DASHBOARD_COPY.admin.prompt,
    primaryTool: "admin_dashboard",
    primaryActionLabel: "Governance controls",
    quickStart: [
      { icon: ICONS.admin, label: "Platform Settings", tool: "admin" },
      { icon: ICONS.audit, label: "Compliance Audit", tool: "admin_dashboard" },
      { icon: ICONS.checklist, label: "System Integrity", tool: "sa_health" }
    ]
  },
  super_admin: {
    label: DASHBOARD_COPY.super_admin.subtitle,
    sub: DASHBOARD_COPY.super_admin.prompt,
    primaryTool: "sa_health",
    primaryActionLabel: "Universal Health Audit",
    quickStart: [
      { icon: ICONS.admin, label: "System Health", tool: "sa_health" },
      { icon: ICONS.checklist, label: "Data Integrity", tool: "sa_checks" },
      { icon: ICONS.audit, label: "Forensic Governance", tool: "sa_overview" },
      { icon: ICONS.people, label: "User Registry", tool: "sa_users" }
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
    <main className="dashboard-view animate-fade-in">
      <header className="dashboard-header glass-panel mb-12 p-8 flex items-center justify-between overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary-light to-transparent opacity-50"></div>
        
        <div className="flex items-center gap-8 relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-primary/5 flex items-center justify-center text-primary-light border border-white/5 glow-primary backdrop-blur-xl">
            <Icon d={ICONS.jobs} size={32} />
          </div>
          <div>
            <h1 className="text-4xl font-black text-white tracking-tighter">{DASHBOARD_COPY[role].title}</h1>
            <div className="flex items-center gap-4 mt-2">
              <span className="status-chip status-chip--active px-4 py-1 text-[10px] uppercase tracking-widest font-bold">{meta.label}</span>
              <PresenceIndicator userId={session.session.user_id} className="opacity-60" />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-8 relative z-10">
          <div className="hidden md:block text-right">
            <p className="text-base font-bold text-white tracking-tight leading-none">{session.session.display_name}</p>
            <p className="text-[10px] font-mono opacity-40 uppercase tracking-widest mt-1.5">{session.session.user_id}</p>
          </div>
          <button type="button" className="button button--secondary-glass px-6 py-2.5 text-xs font-bold uppercase tracking-widest" onClick={onLogout}>
            <span>Authorize Exit</span>
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Main Operational Focus */}
        <section className="lg:col-span-2 ops-hero group">
          <div className="relative z-10">
            <p className="text-primary-light text-xs font-bold uppercase tracking-[0.3em] mb-6">Operational Continuity</p>
            <h2 className="text-4xl font-black text-white mb-6 leading-[1.1] max-w-lg">{DASHBOARD_COPY[role].prompt}</h2>
            
            <p className="text-xl opacity-60 leading-relaxed max-w-xl mb-12">
              The canonical ledger reports <strong className="text-white border-b-2 border-primary-light/40">{openJobCount} active engagements</strong> currently requiring your intervention or oversight.
            </p>
            
            <button 
              type="button" 
              className="button button--primary button--large group px-10 py-5 text-lg font-bold shadow-glow" 
              onClick={() => onEnterWorkspace(meta.primaryTool)}
            >
              <span>{meta.primaryActionLabel}</span>
              <Icon d={ICONS.arrowRight} size={24} className="ml-4 group-hover:translate-x-2 transition-transform" />
            </button>

            <div className="dash-status">
              <div className="dash-status__item">
                <span className="dash-status__label">Session Integrity</span>
                <span className="dash-status__value text-primary-light">Verified</span>
              </div>
              <div className="dash-status__item">
                <span className="dash-status__label">Ledger State</span>
                <span className="dash-status__value">Synchronized</span>
              </div>
              <div className="dash-status__item">
                <span className="dash-status__label">Active Tasks</span>
                <span className="dash-status__value">{openJobCount}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Registry Navigation */}
        <section className="flex flex-col gap-8">
          <h2 className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-40 px-2">Canonical Registry</h2>
          <div className="flex flex-col gap-4">
            {meta.quickStart.map((item, index) => (
              <button 
                key={index} 
                className="registry-link group shadow-glow-hover"
                onClick={() => onEnterWorkspace(item.tool)}
              >
                <div className="registry-link__icon">
                  <Icon d={item.icon} size={24} />
                </div>
                <div className="flex-1">
                  <span className="text-sm font-bold text-white tracking-tight block">{item.label}</span>
                  <p className="text-[10px] opacity-40 uppercase tracking-wider mt-1">Access Protocol</p>
                </div>
                {item.tool === "jobs" && openJobCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary-light text-[10px] font-bold border border-primary/20">
                    {openJobCount}
                  </span>
                )}
                <Icon d={ICONS.arrowRight} size={16} className="opacity-20 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </button>
            ))}
          </div>
        </section>
      </div>

      {!onboardingDismissed && (
        <section className="mt-12 animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <div className="glass-panel p-10 border-l-4 border-l-primary-light flex flex-col md:flex-row md:items-center justify-between gap-8 hover:bg-white/5 transition-all duration-500 rounded-3xl">
            <div className="flex gap-8 items-start">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary-light shrink-0 border border-white/5">
                <Icon d={ICONS.checklist} size={28} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Constitutional Guidance</h3>
                <p className="text-base opacity-60 leading-relaxed max-w-2xl">
                  Each operational phase is governed by cryptographic logic. Ensure all site artifacts are verified and all conduct handshakes are recorded before attempting state certification.
                </p>
              </div>
            </div>
            <button className="button button--secondary-glass px-8 py-3 text-sm font-bold uppercase tracking-widest" type="button" onClick={onDismissOnboarding}>
              Confirm Understanding
            </button>
          </div>
        </section>
      )}

      <style>{`
        .shadow-glow-hover:hover {
          box-shadow: 0 0 20px rgba(99, 102, 241, 0.15);
        }
        .glow-primary { box-shadow: 0 0 40px rgba(99, 102, 241, 0.15); }
      `}</style>
    </main>
  );
}
