import React from "react";
import type { Role } from "@kharon/domain";
import type { OpsIntelligencePayload } from "../apiClient";
import { DASHBOARD_COPY } from "../copy/portalCopy";

interface AdminDashboardProps {
  opsIntelligence: OpsIntelligencePayload | null;
  adminAudits: Array<Record<string, unknown>>;
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

export function AdminDashboard({ opsIntelligence, adminAudits, onEnterTool, canSwitchRoles, emulatedRole, onEmulateRole, isLoading }: AdminDashboardProps): React.JSX.Element {
  return (
    <article className="workspace-card workspace-card--primary">
      {/* ... existing header ... */}
      <div className="panel-header-premium">
        <div className="panel-title-stack">
          <span className="panel-eyebrow-premium">Administrative Control</span>
          <h2 className="panel-title-premium">Operational Command Center</h2>
        </div>
        {!opsIntelligence && (
          <div className="button button--premium-action button--loading">
            <div className="button-inner">
              <span className="loader-mini" />
              <span>Synchronizing Ledger...</span>
            </div>
          </div>
        )}
      </div>

      {!opsIntelligence ? (
        <div className="telemetry-loading-state">
          <div className="telemetry-pulse" />
          <h3>Initializing Command Substrate</h3>
          <p>Syncing with office records and field telemetry. This ensures forensic accuracy before any action.</p>
        </div>
      ) : (
        <div className="admin-intelligence-layout">
          {canSwitchRoles ? (
            <section className="governance-section">
              <div className="section-head-premium">
                <h3>Authority Emulation</h3>
                <p>Verify role-specific workflows and dashboard integrity.</p>
              </div>
              <div className="emulation-grid">
                {ROLE_CHOICES.map((choice) => (
                  <button
                    key={choice.label}
                    className={`emulation-pill ${emulatedRole === choice.role ? "emulation-pill--active" : ""}`}
                    type="button"
                    onClick={() => onEmulateRole(choice.role)}
                  >
                    <span>{choice.label}</span>
                  </button>
                ))}
              </div>
            </section>
          ) : null}

          <section className="stats-grid-premium">
            <div className="intelligence-card intelligence-card--interactive" onClick={() => onEnterTool("jobs")}>
              <div className="intel-header">
                <span className="intel-label">Attention Required</span>
                <div className={`intel-icon ${opsIntelligence.jobs.critical > 0 ? "intel-icon--red" : "intel-icon--blue"}`} />
              </div>
              <strong className="intel-value">{opsIntelligence.jobs.critical}</strong>
              <p className="intel-description">Critical engagements requiring immediate forensic review.</p>
              <div className="intel-footer-action">
                <span>View Registry</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14m-7-7 7 7-7 7"/></svg>
              </div>
            </div>

            <div className="intelligence-card intelligence-card--interactive" onClick={() => onEnterTool("documents")}>
              <div className="intel-header">
                <span className="intel-label">Evidence Verification</span>
                <div className="intel-icon intel-icon--amber" />
              </div>
              <strong className="intel-value">{opsIntelligence.operations.documents_pending_publish}</strong>
              <p className="intel-description">Unpublished certificates awaiting final publication authority.</p>
              <div className="intel-footer-action">
                <span>Review Files</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14m-7-7 7 7-7 7"/></svg>
              </div>
            </div>

            <div className="intelligence-card intelligence-card--interactive" onClick={() => onEnterTool("schedule")}>
              <div className="intel-header">
                <span className="intel-label">Total Active State</span>
                <div className="intel-icon intel-icon--blue" />
              </div>
              <strong className="intel-value">{opsIntelligence.jobs.open}</strong>
              <p className="intel-description">Engagements currently within the operational lifecycle.</p>
              <div className="intel-footer-action">
                <span>Open Scheduler</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14m-7-7 7 7-7 7"/></svg>
              </div>
            </div>
          </section>

          <section className="governance-section">
            <div className="section-head-premium">
              <h3>Priority Operational Actions</h3>
              <p>System-identified interventions to maintain compliance flow.</p>
            </div>
            <div className="risk-registry">
              {opsIntelligence.jobs.critical > 0 ? (
                <div className="risk-item risk-item--critical">
                  <div className="risk-indicator" />
                  <div className="risk-content">
                    <strong>Critical Compliance Block</strong>
                    <p>{opsIntelligence.jobs.critical} jobs are at risk of state transition failure.</p>
                  </div>
                  <button className="button button--secondary-glass ml-auto" onClick={() => onEnterTool("jobs")}>
                    Resolve Now
                  </button>
                </div>
              ) : (
                <div className="risk-item risk-item--safe">
                  <div className="risk-indicator" />
                  <div className="risk-content">
                    <strong>Job Governance Nominal</strong>
                    <p>All active engagements are within standard temporal thresholds.</p>
                  </div>
                </div>
              )}

              {opsIntelligence.operations.documents_pending_publish > 0 && (
                <div className="risk-item risk-item--warning">
                  <div className="risk-indicator" />
                  <div className="risk-content">
                    <strong>Evidence Publication Queue</strong>
                    <p>{opsIntelligence.operations.documents_pending_publish} certificates are ready for dispatch.</p>
                  </div>
                  <button className="button button--secondary-glass ml-auto" onClick={() => onEnterTool("documents")}>
                    Review & Publish
                  </button>
                </div>
              )}
            </div>
          </section>

          <section className="governance-section">
            <div className="section-head-premium">
              <h3>Forensic Audit Trail</h3>
              <p>Recent authoritative actions and state transitions recorded in the ledger.</p>
            </div>
            <div className="audit-list-premium">
              {adminAudits.length > 0 ? (
                adminAudits.slice(0, 5).map((audit, idx) => (
                  <div key={idx} className="audit-row-premium">
                    <div className="audit-time">{String(audit.timestamp).split('T')[1]?.split('.')[0] || 'NOW'}</div>
                    <div className="audit-actor">{String(audit.performed_by || 'SYSTEM').toUpperCase()}</div>
                    <div className="audit-action">{String(audit.action)}</div>
                    <div className="audit-detail truncate">{String(audit.details)}</div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 opacity-40 text-xs italic">
                  No authoritative actions recorded in current session.
                </div>
              )}
            </div>
          </section>
        </div>
      )}
    </article>
  );
}

