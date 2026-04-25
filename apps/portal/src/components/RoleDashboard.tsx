/**
 * KharonOps — Unified Role Dashboard
 * Purpose: Quad-Super-Heavy hardened landing experience per role.
 * Standard: Premium Aesthetics, Forensic Audit Trails, Zero-Any, <100ms interactions.
 */

import React from "react";
import type { Role } from "@kharon/domain";
import type {
  OpsIntelligencePayload,
  PortalSession,
  UpgradeWorkspaceState
} from "../apiClient";
import type { JobRecord } from "./JobListView";
import { TechnicianDashboard } from "./TechnicianDashboard";
import { ClientOverviewCard } from "./ClientOverviewCard";
import { FinanceOverviewCard } from "./FinanceOverviewCard";
import { DispatchDashboardCard } from "./DispatchDashboardCard";
import { AdminDashboard } from "./AdminDashboard";
import { SuperAdminOverview } from "./SuperAdminOverview";
import { PresenceIndicator } from "./PresenceIndicator";
import { DASHBOARD_COPY } from "../copy/portalCopy";

interface RoleDashboardProps {
  session: PortalSession;
  effectiveRole: Role;
  openJobCount: number;
  jobs: JobRecord[];
  upgradeState: UpgradeWorkspaceState;
  opsIntelligence: OpsIntelligencePayload | null;
  geoVerification: {
    status: "idle" | "verified" | "warning" | "error";
    capturedAt: string;
    distanceMeters: number | null;
    accuracyMeters: number | null;
    message: string;
    latitude: number | null;
    longitude: number | null;
  };
  onVerifyLocation: () => void;
  adminHealth: Record<string, unknown> | null;
  adminHealthState: "idle" | "loading" | "ready" | "error" | "unauthorized";
  adminHealthMessage: string;
  adminAudits: Array<Record<string, unknown>>;
  onLoadHealth: () => void;
  onLoadAudits: () => void;
  onEnterWorkspace: (tool: string) => void;
  onLogout: () => void;
  onboardingDismissed?: boolean;
  onDismissOnboarding?: () => void;
  actionPending: boolean;
  isRealSuperAdmin: boolean;
  emulatedRole: Role | "";
  onEmulateRole: (role: Role | "") => void;
  syncPulseText: string;
}

function Icon({ d, size = 20 }: { d: string; size?: number }): React.JSX.Element {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

const ICONS = {
  arrowRight: "M5 12h14M12 5l7 7-7 7",
  checklist: "M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 0 2-2h2a2 2 0 0 0 2 2m-6 9l2 2 4-4"
};

function DashboardShell({
  session,
  effectiveRole,
  onLogout,
  children,
  onboardingDismissed,
  onDismissOnboarding
}: {
  session: PortalSession;
  effectiveRole: Role;
  onLogout: () => void;
  children: React.ReactNode;
  onboardingDismissed?: boolean;
  onDismissOnboarding?: () => void;
}): React.JSX.Element {
  const copy = DASHBOARD_COPY[effectiveRole];
  return (
    <main className="dashboard-view animate-fade-in">
      <header className="dashboard-header glass-panel mb-12 p-8 flex items-center justify-between overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary-light to-transparent opacity-50" />
        <div className="flex items-center gap-8 relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-primary/5 flex items-center justify-center text-primary-light border border-white/5 glow-primary backdrop-blur-xl">
            <Icon d="M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" size={32} />
          </div>
          <div>
            <h1 className="text-4xl font-black text-white tracking-tighter">{copy.title}</h1>
            <div className="flex items-center gap-4 mt-2">
              <span className="status-chip status-chip--active px-4 py-1 text-[10px] uppercase tracking-widest font-bold">{copy.subtitle}</span>
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

      {children}

      {!onboardingDismissed && (
        <section className="mt-12 animate-fade-in" style={{ animationDelay: "0.4s" }}>
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
    </main>
  );
}

export function RoleDashboard({
  session,
  effectiveRole,
  openJobCount,
  jobs,
  upgradeState,
  opsIntelligence,
  geoVerification,
  onVerifyLocation,
  adminAudits,
  onEnterWorkspace,
  onLogout,
  onboardingDismissed,
  onDismissOnboarding,
  actionPending,
  isRealSuperAdmin,
  emulatedRole,
  onEmulateRole,
  syncPulseText
}: RoleDashboardProps): React.JSX.Element {
  const selectedJob = jobs.find(j => j.status === "performed") || jobs.find(j => j.status === "approved") || jobs[0] || null;

  const handleEnterTool = (tool: string) => onEnterWorkspace(tool);

  return (
    <div className={`portal-shell portal-shell--${effectiveRole}`}>
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <DashboardShell
        session={session}
        effectiveRole={effectiveRole}
        onLogout={onLogout}
        onboardingDismissed={onboardingDismissed}
        onDismissOnboarding={onDismissOnboarding}
      >
        {effectiveRole === "technician" && (
          <TechnicianDashboard
            jobs={jobs}
            selectedJob={selectedJob}
            activeTool="tech_day"
            onEnterTool={handleEnterTool}
            onSelectJob={() => {}}
            onUpdateStatus={() => {}}
            onVerifyLocation={onVerifyLocation}
            geoStatus={geoVerification.status}
            syncPulseText={syncPulseText}
          />
        )}

        {effectiveRole === "client" && (
          <ClientOverviewCard jobs={jobs} store={upgradeState} onEnterTool={handleEnterTool} />
        )}

        {effectiveRole === "finance" && (
          <FinanceOverviewCard store={upgradeState} onEnterTool={handleEnterTool} isLoading={actionPending} />
        )}

        {effectiveRole === "dispatcher" && (
          <DispatchDashboardCard opsIntelligence={opsIntelligence} onEnterTool={handleEnterTool} isLoading={actionPending} />
        )}

        {effectiveRole === "admin" && (
          <AdminDashboard
            opsIntelligence={opsIntelligence}
            adminAudits={adminAudits}
            onEnterTool={handleEnterTool}
            canSwitchRoles={isRealSuperAdmin}
            emulatedRole={emulatedRole}
            onEmulateRole={onEmulateRole}
            isLoading={actionPending}
          />
        )}

        {effectiveRole === "super_admin" && (
          <SuperAdminOverview
            opsIntelligence={opsIntelligence}
            onRefresh={() => handleEnterTool("sa_overview")}
            isLoading={actionPending}
          />
        )}

        {/* Fallback for unknown roles */}
        {!(["technician", "client", "finance", "dispatcher", "admin", "super_admin"] as string[]).includes(effectiveRole) && (
          <div className="conduct-hero text-center p-12">
            <h3 className="text-xl opacity-60">Dashboard Unavailable</h3>
            <p className="muted-copy mt-2">Your role ({effectiveRole}) does not have a configured dashboard view.</p>
          </div>
        )}

        <footer className="portal-statusbar mt-8">
          <div className="feedback-line">
            <span>Operational Pulse</span>
            <pre>{openJobCount} active engagements • Ledger Synchronized</pre>
          </div>
        </footer>
      </DashboardShell>
    </div>
  );
}
