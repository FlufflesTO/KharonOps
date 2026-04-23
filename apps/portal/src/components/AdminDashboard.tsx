import React from "react";
import type { Role } from "@kharon/domain";
import type { OpsIntelligencePayload } from "../apiClient";

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
    <article className="workspace-card">
      <div className="panel-heading">
        <p className="panel-eyebrow">Office Dashboard</p>
        <h2>Welcome back to the office</h2>
      </div>

      {!opsIntelligence ? (
        <div className="highlight-box">
          <p>Office data is being synchronized. This summary will update automatically.</p>
        </div>
      ) : (
        <div className="admin-grid">
          {canSwitchRoles ? (
            <section className="control-block">
              <div className="control-block__head">
                <h3>View as role</h3>
                <p>Switch into a role to verify what that person sees and can do.</p>
              </div>
              <div className="button-row">
                {ROLE_CHOICES.map((choice) => (
                  <button
                    key={choice.label}
                    className={`button ${emulatedRole === choice.role ? "button--primary" : "button--secondary"}`}
                    type="button"
                    onClick={() => onEmulateRole(choice.role)}
                  >
                    {choice.label}
                  </button>
                ))}
              </div>
            </section>
          ) : null}

          <section className="summary-grid">
            <div className="summary-card" onClick={() => onEnterTool("jobs")} style={{ cursor: 'pointer' }}>
              <span className="summary-card__label">Jobs Needing Attention</span>
              <strong className={opsIntelligence.jobs.critical > 0 ? "text-critical" : ""}>
                {opsIntelligence.jobs.critical}
              </strong>
              <small>Critical jobs requiring office review</small>
            </div>
            <div className="summary-card" onClick={() => onEnterTool("documents")} style={{ cursor: 'pointer' }}>
              <span className="summary-card__label">Pending Documents</span>
              <strong>{opsIntelligence.operations.documents_pending_publish}</strong>
              <small>Ready to be reviewed and published</small>
            </div>
            <div className="summary-card" onClick={() => onEnterTool("schedule")} style={{ cursor: 'pointer' }}>
              <span className="summary-card__label">Active Work</span>
              <strong>{opsIntelligence.jobs.open}</strong>
              <small>Jobs currently in progress</small>
            </div>
          </section>

          <section className="control-block">
            <div className="control-block__head">
              <h3>Urgent Office Actions</h3>
              <p>Items requiring your immediate signature or approval.</p>
            </div>
            <div className="fact-list">
              {opsIntelligence.jobs.critical > 0 ? (
                <div className="highlight-box border-critical">
                  <span className="highlight-box__label">Critical Jobs</span>
                  <p>There are {opsIntelligence.jobs.critical} jobs marked as critical. Please check the jobs list for details.</p>
                  <button className="button button--secondary mt-2" onClick={() => onEnterTool("jobs")}>
                    View Critical Jobs
                  </button>
                </div>
              ) : (
                <p className="muted-copy">No urgent job actions at this time.</p>
              )}

              {opsIntelligence.operations.documents_pending_publish > 0 && (
                <div className="highlight-box border-active mt-4">
                  <span className="highlight-box__label">Documents Pending</span>
                  <p>{opsIntelligence.operations.documents_pending_publish} documents are waiting for review before they can be sent to clients.</p>
                  <button className="button button--secondary mt-2" onClick={() => onEnterTool("documents")}>
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
        .border-active { border-left: 4px solid var(--color-positive); }
        .border-critical { border-left: 4px solid var(--color-critical); }
        .mt-2 { margin-top: 0.5rem; }
        .mt-4 { margin-top: 1rem; }
      `}</style>
    </article>
  );
}
