import React from "react";
import type { Role } from "@kharon/domain";
import type { AutomationJobEntry } from "../apiClient";

interface AdminPanelCardProps {
  adminHealth: Record<string, unknown> | null;
  adminAudits: Array<Record<string, unknown>>;
  adminAutomationJobs: Array<Record<string, unknown>>;
  adminAuditCount: number;
  automationJobs: AutomationJobEntry[];
  selectedAutomationJobUid: string;
  setSelectedAutomationJobUid: (uid: string) => void;
  onLoadHealth: () => void;
  onLoadAudits: () => void;
  onLoadAutomationJobs: () => void;
  onRetryAutomation: (uid: string) => void;
  onFeedback: (msg: string) => void;
  emulatedRole: Role | "";
  onEmulateRole: (role: Role | "") => void;
}

export function AdminPanelCard({
  adminHealth,
  adminAudits,
  adminAutomationJobs,
  adminAuditCount,
  automationJobs: _automationJobs,
  selectedAutomationJobUid: _selectedAutomationJobUid,
  setSelectedAutomationJobUid: _setSelectedAutomationJobUid,
  onLoadHealth,
  onLoadAudits,
  onLoadAutomationJobs,
  onRetryAutomation,
  onFeedback: _onFeedback,
  emulatedRole,
  onEmulateRole,
}: AdminPanelCardProps): React.JSX.Element {
  return (
    <article className="workspace-card">
      <div className="panel-heading">
        <p className="panel-eyebrow">Admin</p>
        <h2>Health, Automation, and Forensic Audit</h2>
      </div>

      <section className="admin-section" style={{ marginBottom: "1rem", padding: "1rem", background: "rgba(255,255,255,0.02)", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.05)" }}>
        <h3 style={{ marginTop: 0, marginBottom: "1rem", fontSize: "1rem" }}>Role Emulation (Diagnostic)</h3>
        <p style={{ fontSize: "0.85rem", marginBottom: "1rem", opacity: 0.7 }}>
          Temporarily switch active dashboard view to verify workflow parity.
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
          Refresh Health
        </button>
        <button className="button button--secondary" onClick={onLoadAudits}>
          Refresh Audits ({adminAuditCount})
        </button>
        <button className="button button--primary" onClick={onLoadAutomationJobs}>
          Load Automation Queue
        </button>
      </div>

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
              const uid = String(job.automation_job_uid);
              const status = String(job.status);
              return (
                <div key={uid} className="automation-row" style={{
                  padding: "0.75rem",
                  background: "rgba(255,255,255,0.03)",
                  borderRadius: "8px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  border: "1px solid rgba(255,255,255,0.05)"
                }}>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <span style={{ fontWeight: 600, fontSize: "0.85rem" }}>{uid}</span>
                    <span style={{ fontSize: "0.7rem", opacity: 0.6 }}>{String(job.action)}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                    <span className={`status-chip status-chip--${status === "done" ? "active" : status === "failed" ? "critical" : "warning"}`}>
                      {status}
                    </span>
                    {status === "failed" ? (
                      <button className="button button--ghost button--compact" onClick={() => onRetryAutomation(uid)}>
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
        <h3>Forensic Audit Provenance</h3>
        <p className="muted-copy">Hash-chained verification over loaded audit entries.</p>
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
                const row = (
                  <div key={`${String(entry.audit_uid ?? index)}-${index}`} className="history-row">
                    <strong>{String(entry.audit_uid ?? `AUD-${index}`)}</strong>
                    <span>{String(entry.action ?? "unknown_action")}</span>
                    <span>{String(entry.at ?? entry.updated_at ?? "n/a")}</span>
                    <span className="history-row__url">{hash}</span>
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
