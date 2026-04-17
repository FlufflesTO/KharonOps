import React from "react";
import type { AutomationJobEntry } from "../apiClient";

interface AdminPanelCardProps {
  adminHealth: Record<string, unknown> | null;
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

}

export function AdminPanelCard({
  adminHealth,
  adminAutomationJobs,
  adminAuditCount,
  automationJobs,
  selectedAutomationJobUid,
  setSelectedAutomationJobUid,
  onLoadHealth,
  onLoadAudits,
  onLoadAutomationJobs,
  onRetryAutomation,
  onFeedback: _onFeedback,

}: AdminPanelCardProps): React.JSX.Element {
  const selectedAutomationJob =
    automationJobs.find((job) => job.automation_job_uid === selectedAutomationJobUid) ?? null;

  return (
    <article className="workspace-card">
      <div className="panel-heading">
        <p className="panel-eyebrow">Admin</p>
        <h2>Health & Automation</h2>
      </div>
      
      <div className="button-row" style={{ marginBottom: '2rem' }}>
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

      <div className="admin-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        <section className="admin-section">
          <h3>System Health</h3>
          <div className="feedback-panel">
            <pre style={{ fontSize: '0.75rem' }}>{JSON.stringify(adminHealth, null, 2)}</pre>
          </div>
        </section>

        <section className="admin-section">
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
                    padding: '0.75rem', 
                    background: 'rgba(255,255,255,0.03)', 
                    borderRadius: '8px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    border: '1px solid rgba(255,255,255,0.05)'
                  }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{uid}</span>
                      <span style={{ fontSize: '0.7rem', opacity: 0.6 }}>{String(job.action)}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <span className={`status-chip status-chip--${status === 'done' ? 'active' : status === 'failed' ? 'critical' : 'warning'}`}>
                        {status}
                      </span>
                      {status === 'failed' && (
                        <button 
                          className="button button--ghost button--compact" 
                          onClick={() => onRetryAutomation(uid)}
                          style={{ fontSize: '0.7rem' }}
                        >
                          Retry
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>
    </article>
  );
}

