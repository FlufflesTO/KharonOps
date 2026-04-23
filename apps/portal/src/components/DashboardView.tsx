import React from "react";
import type { Role } from "@kharon/domain";
import type { PortalSession } from "../apiClient";

// Accessible Icon component with proper ARIA support
function Icon({ d, size = 20, className, title }: { d: string; size?: number; className?: string; title?: string }): React.JSX.Element {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth={1.8} 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
      role={title ? "img" : "presentation"}
      aria-hidden={!title}
      aria-label={title}
    >
      {title && <title>{title}</title>}
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
  badge?: string | number | undefined;
}

function QuickStartCard({ icon, label, tool, onClick, badge }: QuickStartCardProps): React.JSX.Element {
  const hasBadge = badge !== undefined && (typeof badge === "number" ? badge > 0 : badge.length > 0);
  return (
    <button 
      type="button" 
      className="quick-start-card glass-panel" 
      onClick={() => onClick(tool)}
      aria-label={`Navigate to ${label}`}
      tabIndex={0}
    >
      <div className="quick-start-card__icon text-primary" aria-hidden="true">
        <Icon d={icon} size={24} />
      </div>
      <div className="flex-1 text-left">
        <span className="quick-start-card__label font-semibold text-white">{label}</span>
      </div>
      {hasBadge && (
        <span className="quick-start-card__badge" aria-label={`${badge} items`}>
          {badge}
        </span>
      )}
      <div className="quick-start-card__arrow opacity-50 transition-transform" aria-hidden="true">
        <Icon d={ICONS.arrowRight} size={16} />
      </div>
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
    <main className="dashboard-view" role="main" aria-label="Main dashboard">
      <header className="dashboard-header glass-panel mb-8 p-6 lg:p-8 flex items-center justify-between" role="banner">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">{meta.label}</h1>
          <p className="status-chip status-chip--active" role="status">{meta.sub}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden sm:block text-right">
            <p className="font-semibold text-white">{session.session.display_name}</p>
            <p className="text-xs opacity-50">{session.session.user_id}</p>
          </div>
          <button 
            type="button" 
            className="btn btn-secondary shrink-0" 
            onClick={onLogout}
            aria-label="Sign out of your account"
          >
            Sign out
          </button>
        </div>
      </header>

      <section className="dashboard-intro glass-panel p-6 lg:p-8 mb-8 relative overflow-hidden" aria-labelledby="welcome-heading">
        <div className="relative z-10">
          <h2 id="welcome-heading" className="text-xl font-semibold text-white mb-2">
            Welcome back, {session.session.display_name.split(' ')[0]}
          </h2>
          <p className="dashboard-intro__text mb-6 opacity-75 max-w-2xl">
            You currently have <strong className="text-white">{openJobCount} active job{openJobCount !== 1 ? "s" : ""}</strong> requiring attention in the system workflow. 
            Proceed to your primary workspace to continue operations.
          </p>
          <button 
            type="button" 
            className="btn btn-primary"
            onClick={() => onEnterWorkspace(meta.primaryTool)}
            aria-label={`Go to ${meta.primaryTool === "schedule" ? "Dispatch" : meta.primaryTool}`}
          >
            <Icon d={ICONS.jobs} size={18} className="mr-2" title="Jobs" />
            Go to {meta.primaryTool === "schedule" ? "Dispatch" : meta.primaryTool.charAt(0).toUpperCase() + meta.primaryTool.slice(1)}
          </button>
        </div>
        
        {/* Decorative background element */}
        <div className="absolute -right-20 -top-20 w-64 h-64 rounded-full bg-primary opacity-10 blur-3xl pointer-events-none" aria-hidden="true"></div>
      </section>

      <section className="quick-start-section mb-8" aria-labelledby="quick-start-heading">
        <h2 id="quick-start-heading" className="text-sm font-bold uppercase tracking-wider opacity-50 mb-4 px-1">
          Quick Start Modules
        </h2>
        <div className="quick-start-grid" role="list">
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

      {!onboardingDismissed && (
        <section className="dashboard-help mb-8" aria-label="Onboarding information">
          <div className="glass-panel p-6 border-l-4 border-l-primary flex flex-col sm:flex-row sm:items-center justify-between gap-4" role="region">
            <div className="flex gap-4 items-start">
              <div className="mt-1 text-primary" aria-hidden="true">
                <Icon d={ICONS.checklist} size={24} />
              </div>
              <div>
                <h3 className="font-semibold text-white mb-1">First-time Checklist</h3>
                <p className="text-sm opacity-75">
                  1. Open Jobs module. 2. Review assigned jobcard status and notes. 3. Use Schedule or Files for next actions.
                </p>
              </div>
            </div>
            <button 
              className="btn btn-secondary shrink-0" 
              type="button" 
              onClick={onDismissOnboarding}
              aria-label="Dismiss onboarding checklist"
            >
              Dismiss
            </button>
          </div>
        </section>
      )}

      <section className="dashboard-help" aria-label="System support information">
        <div className="glass-panel p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4" role="region">
          <div className="flex gap-4 items-start">
            <div className="mt-1 opacity-50" aria-hidden="true">
              <Icon d={ICONS.compliance} size={24} />
            </div>
            <div>
              <h3 className="font-semibold text-white mb-1">System Support</h3>
              <p className="text-sm opacity-75">
                Contact support or refer to the compliance documentation for guidance on using the portal features and reporting defects.
              </p>
            </div>
          </div>
        </div>
      </section>

      <style>{`
        .dashboard-view {
          max-width: var(--container-max);
          margin: 0 auto;
          width: 100%;
          padding: 0 var(--space-4);
        }
        
        .dashboard-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: var(--space-4);
        }
        
        .dashboard-intro__text {
          font-size: var(--text-base);
          line-height: 1.6;
        }
        
        .quick-start-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: var(--space-4);
        }
        
        @media (min-width: 640px) {
          .quick-start-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        
        @media (min-width: 1024px) {
          .quick-start-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        .quick-start-card {
          display: flex;
          align-items: center;
          padding: var(--space-5);
          gap: var(--space-4);
          width: 100%;
          min-height: var(--touch-target);
          transition: all var(--transition-fast);
        }

        .quick-start-card:hover {
          background: rgba(255, 255, 255, 0.05);
          border-color: var(--color-accent);
          transform: translateY(-2px);
          box-shadow: var(--shadow-md), var(--shadow-glow-sm);
        }

        .quick-start-card:hover .quick-start-card__arrow {
          transform: translateX(4px);
          opacity: 1;
        }

        .quick-start-card__badge {
          background: var(--color-primary);
          color: white;
          font-size: var(--text-xs);
          font-weight: 700;
          padding: var(--space-1) var(--space-2);
          border-radius: var(--radius-full);
          margin-left: var(--space-2);
        }

        .status-chip {
          display: inline-block;
          font-size: var(--text-xs);
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: var(--space-1) var(--space-3);
          border-radius: var(--radius-full);
          background: rgba(16, 185, 129, 0.15);
          color: var(--color-positive);
        }

        .status-chip--active {
          background: rgba(99, 102, 241, 0.15);
          color: var(--color-primary);
        }

        /* Helper Classes */
        .flex { display: flex; }
        .flex-col { flex-direction: column; }
        .flex-1 { flex: 1; }
        .items-center { align-items: center; }
        .items-start { align-items: flex-start; }
        .justify-between { justify-content: space-between; }
        .gap-4 { gap: var(--space-4); }
        .p-6 { padding: var(--space-6); }
        .mb-1 { margin-bottom: var(--space-1); }
        .mb-2 { margin-bottom: var(--space-2); }
        .mb-4 { margin-bottom: var(--space-4); }
        .mb-6 { margin-bottom: var(--space-6); }
        .mb-8 { margin-bottom: var(--space-8); }
        .mt-1 { margin-top: var(--space-1); }
        .px-1 { padding-left: var(--space-1); padding-right: var(--space-1); }
        .mr-2 { margin-right: var(--space-2); }
        .text-2xl { font-size: var(--text-2xl); line-height: 2rem; }
        .text-xl { font-size: var(--text-xl); line-height: 1.75rem; }
        .text-sm { font-size: var(--text-sm); line-height: 1.25rem; }
        .text-xs { font-size: var(--text-xs); line-height: 1rem; }
        .font-bold { font-weight: 700; }
        .font-semibold { font-weight: 600; }
        .text-white { color: var(--color-text); }
        .text-primary { color: var(--color-primary); }
        .text-left { text-align: left; }
        .text-right { text-align: right; }
        .uppercase { text-transform: uppercase; }
        .tracking-wider { letter-spacing: 0.05em; }
        .opacity-50 { opacity: 0.5; }
        .opacity-75 { opacity: 0.75; }
        .max-w-2xl { max-width: 42rem; }
        .shrink-0 { flex-shrink: 0; }
        .relative { position: relative; }
        .absolute { position: absolute; }
        .overflow-hidden { overflow: hidden; }
        .z-10 { z-index: 10; }
        .-right-20 { right: -5rem; }
        .-top-20 { top: -5rem; }
        .w-64 { width: 16rem; }
        .h-64 { height: 16rem; }
        .rounded-full { border-radius: var(--radius-full); }
        .bg-primary { background-color: var(--color-primary); }
        .blur-3xl { filter: blur(64px); }
        .pointer-events-none { pointer-events: none; }
        .border-l-4 { border-left-width: 4px; border-left-style: solid; }
        .border-l-primary { border-left-color: var(--color-primary); }
        .transition-transform { transition-property: transform; transition-duration: 0.2s; }

        @media (min-width: 640px) {
          .sm\\:block { display: block; }
          .sm\\:flex-row { flex-direction: row; }
          .sm\\:items-center { align-items: center; }
        }

        .hidden { display: none; }
        
        @media (min-width: 768px) {
          .lg\\:p-8 { padding: var(--space-8); }
        }
      `}</style>
    </main>
  );
}
