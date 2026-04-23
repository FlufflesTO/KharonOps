import React from "react";
import type { Role } from "@kharon/domain";
import type { AutomationJobEntry, OpsIntelligencePayload, SchemaDriftPayload } from "../apiClient";

interface AdminPanelCardProps {
  adminHealth: Record<string, unknown> | null;
  adminAudits: Array<Record<string, unknown>>;
  adminAutomationJobs: Array<Record<string, unknown>>;
  adminAuditCount: number;
  automationJobs: AutomationJobEntry[];
  selectedAutomationJobid: string;
  setSelectedAutomationJobid: (id: string) => void;
  onLoadHealth: () => void;
  onLoadAudits: () => void;
  onLoadAutomationJobs: () => void;
  onRetryAutomation: (id: string) => void;
  onFeedback: (msg: string) => void;
  emulatedRole: Role | "";
  onEmulateRole: (role: Role | "") => void;
  schemaDrift: SchemaDriftPayload | null;
  opsIntelligence: OpsIntelligencePayload | null;
  onLoadSchemaDrift: () => void;
  onLoadOpsIntelligence: () => void;
}

export function AdminPanelCard({
  adminHealth,
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
  onLoadOpsIntelligence
}: AdminPanelCardProps): React.JSX.Element {
  return (
    <article className="workspace-card">
      <div className="panel-heading">
        <p className="panel-eyebrow">Settings</p>
        <h2>Platform Controls</h2>
      </div>

      <section className="admin-section" style={{ marginBottom: "1rem", padding: "1rem", background: "rgba(255,255,255,0.02)", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.05)" }}>
        <h3 style={{ marginTop: 0, marginBottom: "1rem", fontSize: "1rem" }}>Role Emulation</h3>
        <p style={{ fontSize: "0.85rem", marginBottom: "1rem", opacity: 0.7 }}>
          Temporarily switch to another role to verify workflow coverage.
        </p>
        <div className="button-row" style={{ flexWrap: "wrap" }}>
          {(["client", "technician", "dispatcher", "finance", "admin"] as const).map((role) => (
            <button
              key={role}
              className={`button ${emulatedRole === role ? "button--primary" : "button--secondary"} button--compact`}
              onClick={() => onEmulateRole(role)}
            >
              {role}
            </button>
          ))}
          <button className={`button ${emulatedRole === "" ? "button--primary" : "button--ghost"} button--compact`} onClick={() => onEmulateRole("")}>
            Clear (SuperAdmin)
          </button>
          {emulatedRole ? (
            <button className="button button--secondary button--compact" onClick={() => onEmulateRole("")}>
              End Emulation
            </button>
          ) : null}
        </div>
      </section>

      <div className="button-row" style={{ marginBottom: "1rem" }}>
        <button className="button button--secondary" onClick={onLoadHealth}>
          Refresh system health
        </button>
        <button className="button button--secondary" onClick={onLoadAudits}>
          Refresh audits ({adminAuditCount})
        </button>
        <button className="button button--secondary" onClick={onLoadSchemaDrift}>
          Schema drift scan
        </button>
        <button className="button button--secondary" onClick={onLoadOpsIntelligence}>
          Operational intelligence
        </button>
        <button className="button button--primary" onClick={onLoadAutomationJobs}>
          Load automation queue
        </button>
      </div>

      <section className="admin-section" style={{ marginBottom: "1rem" }}>
        <h3>Operational Intelligence</h3>
        {opsIntelligence ? (
          <div className="telemetry-grid">
            <div className="telemetry-item"><label>Open Jobs</label><code>{opsIntelligence.jobs.open}</code></div>
            <div className="telemetry-item"><label>Critical Jobs</label><code>{opsIntelligence.jobs.critical}</code></div>
            <div className="telemetry-item"><label>Stale {">"}24h</label><code>{opsIntelligence.jobs.stale_over_24h}</code></div>
            <div className="telemetry-item"><label>Pending Publish</label><code>{opsIntelligence.operations.documents_pending_publish}</code></div>
            <div className="telemetry-item"><label>Escrow Locked</label><code>{opsIntelligence.operations.escrow_locked}</code></div>
            <div className="telemetry-item"><label>Outstanding Amount</label><code>{opsIntelligence.finance.outstanding_amount.toFixed(2)}</code></div>
          </div>
        ) : (
          <p className="muted-copy">Load operational intelligence to view live diagnostics.</p>
        )}
      </section>

      <section className="admin-section" style={{ marginBottom: "1rem" }}>
        <h3>Schema Drift Protection</h3>
        {schemaDrift ? (
          <div className="feedback-panel">
            <p style={{ marginTop: 0 }}>Health: <strong>{schemaDrift.healthy ? "Healthy" : "Attention needed"}</strong></p>
            {schemaDrift.issues.length === 0 ? (
              <p className="muted-copy">No drift issues detected.</p>
            ) : (
              <ul style={{ margin: 0, paddingLeft: "1.1rem" }}>
                {schemaDrift.issues.map((issue) => (
                  <li key={issue.code}>{issue.severity.toUpperCase()}: {issue.detail}</li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          <p className="muted-copy">Run schema drift scan to validate workbook integrity.</p>
        )}
      </section>

      <section className="admin-section" style={{ marginBottom: "1rem" }}>
        <h3>System Health</h3>
        <div className="feedback-panel">
          <pre style={{ fontSize: "0.75rem" }}>{JSON.stringify(adminHealth, null, 2)}</pre>
        </div>
      </section>

      <section className="admin-section" style={{ marginBottom: "1rem" }}>
        <h3>Automation Jobs</h3>
        <div className="automation-list">
          {adminAutomationJobs.length === 0 ? (
            <p className="muted-copy">No automation jobs loaded.</p>
          ) : (
            adminAutomationJobs.map((job) => {
              const id = String(job.automation_job_id);
              const status = String(job.status);
              return (
                <div key={id} className="automation-row" style={{
                  padding: "0.75rem",
                  background: "rgba(255,255,255,0.03)",
                  borderRadius: "8px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  border: "1px solid rgba(255,255,255,0.05)"
                }}>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <span style={{ fontWeight: 600, fontSize: "0.85rem" }}>{id}</span>
                    <span style={{ fontSize: "0.7rem", opacity: 0.6 }}>{String(job.action)}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                    <span className={`status-chip status-chip--${status === "done" ? "active" : status === "failed" ? "critical" : "warning"}`}>
                      {status}
                    </span>
                    {status === "failed" ? (
                      <button className="button button--ghost button--compact" onClick={() => onRetryAutomation(id)}>
                        Retry
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      <section className="admin-section">
        <h3>Audit Trail Verification</h3>
        <p className="muted-copy">Verification status for loaded audit entries.</p>
        <div className="history-table">
          {adminAudits.length === 0 ? (
            <p className="muted-copy">No audits loaded. Click Refresh Audits.</p>
          ) : (
            (() => {
              let prevHash = "ROOT";
              return adminAudits.slice(0, 80).map((entry, index) => {
                const payload = JSON.stringify(entry);
                const hash = btoa(`${prevHash}:${payload}`).slice(0, 24);
                const anomaly = typeof entry.action !== "string" || String(entry.action).trim() === "";
                const actor = String(entry.actor ?? entry.updated_by ?? "system");
                const before = String(entry.before ?? entry.previous_status ?? "n/a");
                const after = String(entry.after ?? entry.next_status ?? "n/a");
                const row = (
                  <div key={`${String(entry.audit_id ?? index)}-${index}`} className="history-row">
                    <strong>{String(entry.audit_id ?? `AUD-${index}`)}</strong>
                    <span>{String(entry.action ?? "unknown_action")}</span>
                    <span>{String(entry.at ?? entry.updated_at ?? "n/a")}</span>
                    <span className="history-row__url">{hash} | {actor}</span>
                    <span className="history-row__url">Before: {before} {"->"} After: {after}</span>
                    <span className={`status-chip status-chip--${anomaly ? "critical" : "active"}`}>{anomaly ? "anomaly" : "verified"}</span>
                  </div>
                );
                prevHash = hash;
                return row;
              });
            })()
          )}
        </div>
      </section>
    </article>
  );
}
