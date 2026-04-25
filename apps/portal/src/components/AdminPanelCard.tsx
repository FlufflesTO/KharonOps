import React from "react";
import type { Role } from "@kharon/domain";
import type { AutomationJobEntry, OpsIntelligencePayload, SchemaDriftPayload } from "../apiClient";

interface AdminPanelCardProps {
  adminHealth: Record<string, unknown> | null;
  adminHealthState: "idle" | "loading" | "ready" | "error" | "unauthorized";
  adminHealthMessage: string;
  adminAudits: Array<Record<string, unknown>>;
  adminAutomationJobs: Array<Record<string, unknown>>;
  adminAuditCount: number;
  automationJobs: AutomationJobEntry[];
  selectedAutomationJobid: string;
  setSelectedAutomationJobid: (id: string) => void;
  onLoadHealth?: () => void;
  onLoadAudits?: () => void;
  onLoadAutomationJobs?: () => void;
  onRetryAutomation?: (id: string) => void;
  onFeedback: (msg: string) => void;
  emulatedRole: Role | "";
  onEmulateRole: (role: Role | "") => void;
  schemaDrift: SchemaDriftPayload | null;
  opsIntelligence: OpsIntelligencePayload | null;
  onLoadSchemaDrift: () => void;
  onLoadOpsIntelligence: () => void;
  isRealSuperAdmin?: boolean;
}

export function AdminPanelCard({
  adminHealth,
  adminHealthState,
  adminHealthMessage,
  adminAudits,
  adminAutomationJobs,
  adminAuditCount,
  automationJobs: _automationJobs,
  selectedAutomationJobid: _selectedAutomationJobid,
  setSelectedAutomationJobid: _setSelectedAutomationJobid,
  onLoadHealth,
  onLoadAudits,
  onLoadAutomationJobs,
  onRetryAutomation,
  onFeedback: _onFeedback,
  emulatedRole,
  onEmulateRole,
  schemaDrift,
  opsIntelligence,
  onLoadSchemaDrift,
  onLoadOpsIntelligence,
  isRealSuperAdmin
}: AdminPanelCardProps): React.JSX.Element {
  return (
    <article className="workspace-card workspace-card--primary">
      <div className="panel-header-premium">
        <div className="panel-title-stack">
          <span className="panel-eyebrow-premium">Forensic Governance</span>
          <h2 className="panel-title-premium">Platform Audit Registry</h2>
        </div>
        <div className="action-row-premium">
          <button className="button button--secondary-glass" onClick={onLoadHealth} disabled={!onLoadHealth}>
            Telemetry Sync
          </button>
          <button className="button button--secondary-glass" onClick={onLoadAudits} disabled={!onLoadAudits}>
            Audit Handshake ({adminAuditCount})
          </button>
          <button className="button button--secondary-glass" onClick={onLoadSchemaDrift} disabled={!onLoadSchemaDrift}>
            Data Integrity
          </button>
          <button className="button button--secondary-glass" onClick={onLoadOpsIntelligence} disabled={!onLoadOpsIntelligence}>
            Intelligence
          </button>
          <button className="button button--premium-action" onClick={onLoadAutomationJobs} disabled={!onLoadAutomationJobs}>
            <div className="button-inner">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
              <span>Automations</span>
            </div>
          </button>
        </div>
      </div>

      <div className="admin-intelligence-layout">
        {isRealSuperAdmin && (
          <section className="governance-section">
            <div className="section-head-premium">
              <h3>Authority Emulation Protocol</h3>
              <p>Temporarily assume another role to verify end-to-end workflow integrity.</p>
            </div>
            <div className="emulation-grid">
              {(["client", "technician", "dispatcher", "finance", "admin"] as const).map((role) => (
                <button
                  key={role}
                  className={`emulation-pill ${emulatedRole === role ? "emulation-pill--active" : ""}`}
                  onClick={() => onEmulateRole(role)}
                >
                  <span>{role.charAt(0).toUpperCase() + role.slice(1)}</span>
                </button>
              ))}
              <button className={`emulation-pill ${emulatedRole === "" ? "emulation-pill--active" : ""}`} onClick={() => onEmulateRole("")}>
                <span>Default (SuperAdmin)</span>
              </button>
            </div>
          </section>
        )}

        <div className="intelligence-dual-column">
          <section className="governance-section">
            <div className="section-head-premium">
              <h3>Systemic KPIs</h3>
              <p>Aggregated operational metrics from office telemetry.</p>
            </div>
            {opsIntelligence ? (
              <div className="stats-grid-premium stats-grid-premium--compact">
                <div className="intelligence-card">
                  <span className="intel-label">Attention</span>
                  <strong className={`intel-value ${opsIntelligence.jobs.critical > 0 ? "text-critical-glow" : ""}`}>{opsIntelligence.jobs.critical}</strong>
                </div>
                <div className="intelligence-card">
                  <span className="intel-label">Total Open</span>
                  <strong className="intel-value">{opsIntelligence.jobs.open}</strong>
                </div>
                <div className="intelligence-card">
                  <span className="intel-label">Stale {">"}24h</span>
                  <strong className={`intel-value ${opsIntelligence.jobs.stale_over_24h > 0 ? "text-warning-glow" : ""}`}>{opsIntelligence.jobs.stale_over_24h}</strong>
                </div>
                <div className="intelligence-card">
                  <span className="intel-label">Documents</span>
                  <strong className="intel-value">{opsIntelligence.operations.documents_pending_publish}</strong>
                </div>
              </div>
            ) : (
              <div className="empty-state-placeholder">Synchronize intelligence to populate telemetry metrics.</div>
            )}
          </section>

          <section className="governance-section">
            <div className="section-head-premium">
              <h3>Data Integrity Guard</h3>
              <p>Real-time validation of workbook schema and relational consistency.</p>
            </div>
            {schemaDrift ? (
              <div className={`risk-item ${schemaDrift.healthy ? "risk-item--safe" : "risk-item--critical"}`}>
                <div className="risk-indicator" />
                <div className="risk-content">
                  <strong>{schemaDrift.healthy ? "Workbook Health Verified" : "Systemic Data Drift Detected"}</strong>
                  {schemaDrift.issues.length === 0 ? (
                    <p>No relational anomalies found across active ledger sheets.</p>
                  ) : (
                    <ul className="forensic-list">
                      {schemaDrift.issues.map((issue) => (
                        <li key={issue.code}>
                          <strong>{issue.severity.toUpperCase()}</strong>: {issue.detail}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            ) : (
              <div className="empty-state-placeholder">Initiate integrity check to audit workbook schema.</div>
            )}
          </section>
        </div>

        <section className="governance-section">
          <div className="section-head-premium">
            <h3>Substrate Handshake Log</h3>
            <p>Raw technical response from the Cloudflare and Google API clusters.</p>
          </div>
          {adminHealth ? (
            <div className="forensic-json-container">
              <pre>{JSON.stringify(adminHealth, null, 2)}</pre>
            </div>
          ) : (
            <div className="empty-state-placeholder">Check telemetry for low-level node diagnostics.</div>
          )}
        </section>

        <section className="governance-section">
          <div className="section-head-premium">
            <h3>Asynchronous Task Queue</h3>
            <p>Verification status for background processes and ledger synchronizations.</p>
          </div>
          <div className="task-registry-premium">
            {adminAutomationJobs.length === 0 ? (
              <div className="empty-state-placeholder">No tasks currently in the processing buffer.</div>
            ) : (
              <div className="history-table">
                {adminAutomationJobs.map((job) => {
                  const id = String(job.automation_job_id);
                  const status = String(job.status);
                  return (
                    <div key={id} className="history-row-premium">
                      <div className="row-id-stack">
                        <strong>{id}</strong>
                        <span>{String(job.action)}</span>
                      </div>
                      <div className={`status-pill-premium status-pill-premium--${status === "done" ? "active" : status === "failed" ? "critical" : "warning"}`}>
                        {status}
                      </div>
                      {status === "failed" && onRetryAutomation && (
                        <button className="button button--ghost-action" onClick={() => onRetryAutomation(id)}>
                          Retry Operation
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        <section className="governance-section">
          <div className="section-head-premium">
            <h3>Forensic Event Audit</h3>
            <p>Tamper-evident chain of custody for all system-state mutations.</p>
          </div>
          <div className="audit-timeline-container">
            {adminAudits.length === 0 ? (
              <div className="empty-state-placeholder text-center">No forensic events captured in current session.</div>
            ) : (
              <div className="audit-timeline-table">
                <header className="timeline-header">
                  <span>Reference ID</span>
                  <span>Mutation Action</span>
                  <span>Timestamp</span>
                  <span>Forensic Hash</span>
                  <span>Result State</span>
                </header>
                {(() => {
                  let prevHash = "ROOT";
                  return adminAudits.slice(0, 50).map((entry, index) => {
                    const payload = JSON.stringify(entry);
                    const hash = btoa(`${prevHash}:${payload}`).slice(0, 16);
                    const anomaly = typeof entry.action !== "string" || String(entry.action).trim() === "";
                    const actor = String(entry.actor ?? entry.updated_by ?? "system");
                    const row = (
                      <div key={`${String(entry.audit_id ?? index)}-${index}`} className="timeline-row">
                        <strong className="text-primary">{String(entry.audit_id ?? `A${index}`)}</strong>
                        <span className="font-semibold">{String(entry.action ?? "unknown")}</span>
                        <span className="opacity-60">{String(entry.at ?? entry.updated_at ?? "n/a")}</span>
                        <span className="font-mono text-xs text-soft" title={`${hash} | Actor: ${actor}`}>{hash}..</span>
                        <div className="row-end">
                          <span className={`status-pill-premium status-pill-premium--${anomaly ? "critical" : "active"}`}>
                            {anomaly ? "ANOMALY" : "VERIFIED"}
                          </span>
                        </div>
                      </div>
                    );
                    prevHash = hash;
                    return row;
                  });
                })()}
              </div>
            )}
          </div>
        </section>
      </div>
    </article>
  );
}

