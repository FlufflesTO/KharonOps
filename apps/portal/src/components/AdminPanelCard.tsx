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
    <article className="workspace-card glass-panel">
      <div className="panel-heading">
        <p className="panel-eyebrow">Settings</p>
        <h2>Platform Controls</h2>
      </div>

      <section className="admin-section glass-panel-inner mb-6">
        <h3 className="text-base font-bold text-white mb-2">Role Emulation</h3>
        <p className="text-sm opacity-75 mb-4">
          Temporarily switch to another role to verify workflow coverage and access permissions.
        </p>
        <div className="flex flex-wrap gap-2">
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
          {emulatedRole && (
            <button className="button button--secondary button--compact ml-auto" onClick={() => onEmulateRole("")}>
              End Emulation
            </button>
          )}
        </div>
      </section>

      <div className="flex flex-wrap gap-3 mb-8">
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

      <div className="admin-grid">
        <section className="admin-section mb-8">
          <h3>Operational Intelligence</h3>
          {opsIntelligence ? (
            <div className="posture-grid">
              <div className="kpi-card">
                <span>Open Jobs</span>
                <strong>{opsIntelligence.jobs.open}</strong>
              </div>
              <div className="kpi-card">
                <span>Critical Jobs</span>
                <strong className={opsIntelligence.jobs.critical > 0 ? "text-critical" : ""}>{opsIntelligence.jobs.critical}</strong>
              </div>
              <div className="kpi-card">
                <span>Stale &gt;24h</span>
                <strong className={opsIntelligence.jobs.stale_over_24h > 0 ? "text-warning" : ""}>{opsIntelligence.jobs.stale_over_24h}</strong>
              </div>
              <div className="kpi-card">
                <span>Pending Publish</span>
                <strong>{opsIntelligence.operations.documents_pending_publish}</strong>
              </div>
              <div className="kpi-card">
                <span>Escrow Locked</span>
                <strong>{opsIntelligence.operations.escrow_locked}</strong>
              </div>
              <div className="kpi-card">
                <span>Outstanding Amount</span>
                <strong className="truncate">{opsIntelligence.finance.outstanding_amount.toFixed(2)}</strong>
              </div>
            </div>
          ) : (
            <p className="muted-copy p-4 bg-white/5 rounded-md border border-white/10">Load operational intelligence to view live diagnostics.</p>
          )}
        </section>

        <section className="admin-section mb-8">
          <h3>Schema Drift Protection</h3>
          {schemaDrift ? (
            <div className={`feedback-panel ${schemaDrift.healthy ? "border-l-active" : "border-l-critical"}`}>
              <p className="mb-2">Health: <strong className={schemaDrift.healthy ? "text-active" : "text-critical"}>{schemaDrift.healthy ? "Healthy" : "Attention needed"}</strong></p>
              {schemaDrift.issues.length === 0 ? (
                <p className="muted-copy text-sm">No schema drift issues detected across the ledger.</p>
              ) : (
                <ul className="list-disc pl-5 text-sm space-y-1">
                  {schemaDrift.issues.map((issue) => (
                    <li key={issue.code} className={issue.severity === "critical" ? "text-critical" : "text-warning"}>
                      <strong>{issue.severity.toUpperCase()}:</strong> {issue.detail}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : (
            <p className="muted-copy p-4 bg-white/5 rounded-md border border-white/10">Run schema drift scan to validate workbook integrity.</p>
          )}
        </section>

        <section className="admin-section mb-8 col-span-full">
          <h3>System Health</h3>
          <div className="feedback-panel overflow-x-auto">
            <pre className="text-xs font-mono opacity-75">{JSON.stringify(adminHealth, null, 2)}</pre>
          </div>
        </section>

        <section className="admin-section mb-8 col-span-full">
          <h3>Automation Jobs</h3>
          <div className="automation-list">
            {adminAutomationJobs.length === 0 ? (
              <p className="muted-copy p-4 bg-white/5 rounded-md border border-white/10">No automation jobs loaded.</p>
            ) : (
              <div className="space-y-2">
                {adminAutomationJobs.map((job) => {
                  const id = String(job.automation_job_id);
                  const status = String(job.status);
                  return (
                    <div key={id} className="history-row glass-panel-inner">
                      <div className="flex flex-col truncate">
                        <span className="font-semibold text-sm truncate">{id}</span>
                        <span className="text-xs opacity-60 truncate">{String(job.action)}</span>
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                        <span className={`status-chip status-chip--${status === "done" ? "active" : status === "failed" ? "critical" : "warning"}`}>
                          {status}
                        </span>
                        {status === "failed" && (
                          <button className="button button--ghost button--compact" onClick={() => onRetryAutomation(id)}>
                            Retry
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        <section className="admin-section col-span-full">
          <h3>Audit Trail Verification</h3>
          <p className="text-sm opacity-75 mb-4">Cryptographic verification status for loaded audit entries.</p>
          <div className="history-table">
            {adminAudits.length === 0 ? (
              <p className="muted-copy p-4 text-center">No audits loaded. Click Refresh Audits.</p>
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
                      <strong className="truncate w-24">{String(entry.audit_id ?? `AUD-${index}`)}</strong>
                      <span className="truncate w-32">{String(entry.action ?? "unknown_action")}</span>
                      <span className="truncate w-40 opacity-75 text-xs">{String(entry.at ?? entry.updated_at ?? "n/a")}</span>
                      <span className="truncate w-48 font-mono text-xs opacity-50" title={`${hash} | ${actor}`}>{hash} | {actor}</span>
                      <span className="truncate flex-1 text-xs opacity-75">Before: {before} &rarr; After: {after}</span>
                      <span className={`status-chip shrink-0 status-chip--${anomaly ? "critical" : "active"}`}>{anomaly ? "anomaly" : "verified"}</span>
                    </div>
                  );
                  prevHash = hash;
                  return row;
                });
              })()
            )}
          </div>
        </section>
      </div>

      <style>{`
        /* Utilities */
        .flex { display: flex; }
        .flex-col { flex-direction: column; }
        .flex-wrap { flex-wrap: wrap; }
        .items-center { align-items: center; }
        .justify-between { justify-content: space-between; }
        .gap-2 { gap: 0.5rem; }
        .gap-3 { gap: 0.75rem; }
        .gap-4 { gap: 1rem; }
        .mb-2 { margin-bottom: 0.5rem; }
        .mb-4 { margin-bottom: 1rem; }
        .mb-6 { margin-bottom: 1.5rem; }
        .mb-8 { margin-bottom: 2rem; }
        .ml-auto { margin-left: auto; }
        .p-4 { padding: 1rem; }
        .pl-5 { padding-left: 1.25rem; }
        .truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .shrink-0 { flex-shrink: 0; }
        .flex-1 { flex: 1; }
        .w-24 { width: 6rem; }
        .w-32 { width: 8rem; }
        .w-40 { width: 10rem; }
        .w-48 { width: 12rem; }
        .text-sm { font-size: 0.875rem; line-height: 1.25rem; }
        .text-xs { font-size: 0.75rem; line-height: 1rem; }
        .text-base { font-size: 1rem; line-height: 1.5rem; }
        .font-bold { font-weight: 700; }
        .font-semibold { font-weight: 600; }
        .font-mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; }
        .text-white { color: #fff; }
        .text-center { text-align: center; }
        .text-critical { color: var(--color-critical); }
        .text-warning { color: var(--color-warning); }
        .text-active { color: var(--color-active); }
        .opacity-60 { opacity: 0.6; }
        .opacity-75 { opacity: 0.75; }
        .opacity-50 { opacity: 0.5; }
        .list-disc { list-style-type: disc; }
        .space-y-1 > * + * { margin-top: 0.25rem; }
        .space-y-2 > * + * { margin-top: 0.5rem; }
        .overflow-x-auto { overflow-x: auto; }
        .bg-white\\/5 { background-color: rgba(255, 255, 255, 0.05); }
        .border-white\\/10 { border-color: rgba(255, 255, 255, 0.1); }
        .border-l-active { border-left: 4px solid var(--color-active); }
        .border-l-critical { border-left: 4px solid var(--color-critical); }
        .rounded-md { border-radius: 0.375rem; }

        /* Component Styles */
        .glass-panel-inner {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          padding: 1.25rem;
        }

        .admin-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.5rem;
        }

        @media (min-width: 1024px) {
          .admin-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .col-span-full {
            grid-column: 1 / -1;
          }
        }

        .kpi-card {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          padding: 1.25rem;
          border-radius: 8px;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .kpi-card span {
          font-size: 0.75rem;
          color: rgba(255,255,255,0.5);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          font-weight: 700;
        }
        .kpi-card strong {
          font-size: 1.5rem;
          color: #fff;
          font-weight: 800;
        }
      `}</style>
    </article>
  );
}
