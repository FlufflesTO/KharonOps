import React from "react";
import type { Role } from "@kharon/domain";
import type { OpsIntelligencePayload } from "../apiClient";
import { DASHBOARD_COPY } from "../copy/portalCopy";

interface AdminDashboardProps {
  opsIntelligence: OpsIntelligencePayload | null;
  onEnterTool: (tool: string) => void;
  canSwitchRoles: boolean;
  emulatedRole: Role | "";
  onEmulateRole: (role: Role | "") => void;
  isLoading: boolean;
}

const ROLE_CHOICES: Array<{ role: Role | ""; label: string }> = [
  { role: "client", label: "Client" },
  { role: "technician", label: "Technician" },
  { role: "dispatcher", label: "Dispatcher" },
  { role: "finance", label: "Finance" },
  { role: "admin", label: "Admin" },
  { role: "", label: "Clear" }
];

export function AdminDashboard({ opsIntelligence, onEnterTool, canSwitchRoles, emulatedRole, onEmulateRole, isLoading }: AdminDashboardProps): React.JSX.Element {
  return (
    <article className="workspace-card glass-panel">
      <div className="panel-heading">
        <p className="panel-eyebrow">{DASHBOARD_COPY.admin.subtitle}</p>
        <h2>{DASHBOARD_COPY.admin.prompt}</h2>
      </div>

      {!opsIntelligence ? (
        <div className="highlight-box empty-state-enhanced mt-4">
          <div className="loader-spinner mb-4 inline-block"></div>
          <h3>Synchronizing</h3>
          <p className="muted-copy mt-2">Office data is being synchronized. This summary will update automatically.</p>
        </div>
      ) : (
        <div className="admin-grid">
          {canSwitchRoles ? (
            <section className="control-block interaction-panel">
              <div className="control-block__head">
                <h3>View as role</h3>
                <p>Switch into a role to verify what that person sees and can do.</p>
              </div>
              <div className="button-row mt-4 flex flex-wrap gap-2">
                {ROLE_CHOICES.map((choice) => (
                  <button
                    key={choice.label}
                    className={`button ${emulatedRole === choice.role ? "button--primary" : "button--ghost enhanced-btn"}`}
                    type="button"
                    onClick={() => onEmulateRole(choice.role)}
                  >
                    {choice.label}
                  </button>
                ))}
              </div>
            </section>
          ) : null}

          <section className="summary-grid mt-6">
            <div className="summary-card hover-scale" onClick={() => onEnterTool("jobs")}>
              <span className="summary-card__label">Jobs needing attention</span>
              <strong className={`text-4xl ${opsIntelligence.jobs.critical > 0 ? "text-critical" : "text-white"}`}>
                {opsIntelligence.jobs.critical}
              </strong>
              <small className="text-muted block mt-2">Critical jobs requiring review</small>
            </div>
            <div className="summary-card hover-scale" onClick={() => onEnterTool("documents")}>
              <span className="summary-card__label">Pending files</span>
              <strong className="text-4xl text-white">{opsIntelligence.operations.documents_pending_publish}</strong>
              <small className="text-muted block mt-2">Ready to be reviewed and published</small>
            </div>
            <div className="summary-card hover-scale" onClick={() => onEnterTool("schedule")}>
              <span className="summary-card__label">Active work</span>
              <strong className="text-4xl text-white">{opsIntelligence.jobs.open}</strong>
              <small className="text-muted block mt-2">Jobs currently in progress</small>
            </div>
          </section>

          <section className="control-block mt-8">
            <div className="control-block__head">
              <h3>Office actions</h3>
              <p>Items requiring your immediate review.</p>
            </div>
            <div className="fact-list mt-4 flex flex-col gap-4">
              {opsIntelligence.jobs.critical > 0 ? (
                <div className="highlight-box border-critical glass-panel-subtle flex flex-col items-start gap-3">
                  <div className="flex items-center gap-2">
                    <span className="status-chip status-chip--critical animate-pulse">Critical jobs</span>
                  </div>
                  <p className="text-white">There are {opsIntelligence.jobs.critical} jobs marked as critical. Please check the jobs list for details.</p>
                  <button className="button button--secondary button--large mt-2" onClick={() => onEnterTool("jobs")}>
                    Review jobs
                  </button>
                </div>
              ) : (
                <div className="highlight-box glass-panel-subtle text-center py-6">
                  <span className="text-2xl block mb-2">✅</span>
                  <p className="text-white font-medium">No urgent job actions at this time.</p>
                </div>
              )}

              {opsIntelligence.operations.documents_pending_publish > 0 && (
                <div className="highlight-box border-active glass-panel-subtle flex flex-col items-start gap-3">
                  <span className="status-chip status-chip--active">Files pending</span>
                  <p className="text-white">{opsIntelligence.operations.documents_pending_publish} files are waiting for review before they can be sent to clients.</p>
                  <button className="button button--primary button--large mt-2" onClick={() => onEnterTool("documents")}>
                    Review Documents
                  </button>
                </div>
              )}
            </div>
          </section>
        </div>
      )}

      <style>{`
        .admin-grid { display: grid; gap: 2rem; margin-top: 1.5rem; }
        .text-critical { color: var(--color-critical); }
        .text-white { color: white; }
        .text-muted { color: var(--color-text-muted); }
        .text-2xl { font-size: 1.5rem; }
        .text-4xl { font-size: 2.25rem; font-weight: 700; line-height: 1; }
        .font-medium { font-weight: 500; }
        .border-active { border-left: 4px solid var(--color-positive); }
        .border-critical { border-left: 4px solid var(--color-critical); }
        .interaction-panel { background: rgba(255,255,255,0.02); padding: var(--space-6); border-radius: var(--radius-lg); border: 1px solid rgba(255,255,255,0.05); }
        .glass-panel-subtle { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); border-radius: var(--radius-lg); padding: 1.5rem; }
        .enhanced-btn { background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1); color: white; transition: all 0.2s; }
        .enhanced-btn:hover { background: rgba(255,255,255,0.05); border-color: rgba(255,255,255,0.2); }
        .hover-scale { cursor: pointer; transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); padding: 1.5rem; border-radius: var(--radius-lg); }
        .hover-scale:hover { transform: translateY(-4px); box-shadow: 0 10px 25px -5px rgba(0,0,0,0.5); border-color: rgba(99, 102, 241, 0.3); background: rgba(99, 102, 241, 0.05); }
        .button--large { padding: 0.75rem 1.5rem; font-size: 1rem; font-weight: 600; }
        .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; }
        .loader-spinner { width: 24px; height: 24px; border: 3px solid rgba(255,255,255,0.1); border-top-color: var(--color-primary); border-radius: 50%; animation: spin 1s linear infinite; }
        .animate-pulse { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
        
        .flex { display: flex; }
        .flex-col { flex-direction: column; }
        .flex-wrap { flex-wrap: wrap; }
        .items-start { align-items: flex-start; }
        .items-center { align-items: center; }
        .text-center { text-align: center; }
        .block { display: block; }
        .inline-block { display: inline-block; }
        
        .mt-2 { margin-top: 0.5rem; }
        .mt-4 { margin-top: 1rem; }
        .mt-6 { margin-top: 1.5rem; }
        .mt-8 { margin-top: 2rem; }
        .mb-2 { margin-bottom: 0.5rem; }
        .mb-4 { margin-bottom: 1rem; }
        .py-6 { padding-top: 1.5rem; padding-bottom: 1.5rem; }
        .gap-2 { gap: 0.5rem; }
        .gap-3 { gap: 0.75rem; }
        .gap-4 { gap: 1rem; }
        
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .5; } }
      `}</style>
    </article>
  );
}
