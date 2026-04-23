import React from "react";
import type { AutomationJobEntry } from "../apiClient";

interface SuperAdminAutomationsProps {
  automationJobs: Array<Record<string, unknown>>;
  onRefresh: () => void;
  onRetry: (id: string) => void;
  isLoading: boolean;
}

export function SuperAdminAutomations({ automationJobs, onRefresh, onRetry, isLoading }: SuperAdminAutomationsProps): React.JSX.Element {
  return (
    <article className="workspace-card">
      <div className="panel-heading panel-heading--inline">
        <div>
          <p className="panel-eyebrow">Workflows</p>
          <h2>Background automations queue</h2>
        </div>
        <button 
          className="button button--secondary" 
          onClick={onRefresh}
          disabled={isLoading}
        >
          {isLoading ? "Loading..." : "Refresh Queue"}
        </button>
      </div>

      <div className="control-block">
        <div className="control-block__head">
          <h3>Active Queue</h3>
          <p>Monitor the status of background tasks, document generations, and sync operations.</p>
        </div>
        
        <div className="automation-list">
          {automationJobs.length === 0 ? (
            <p className="muted-copy">No automation jobs detected in the current queue.</p>
          ) : (
            <div className="history-table">
              {automationJobs.map((job, index) => {
                const id = String(job.automation_job_id ?? index);
                const status = String(job.status);
                const tone = status === "done" ? "active" : status === "failed" ? "critical" : "warning";
                return (
                  <div key={id} className="history-row">
                    <div className="flex-1">
                      <strong>{String(job.action ?? "Unnamed Action")}</strong>
                      <span className="job-item__meta">{id}</span>
                    </div>
                    <div className="button-row">
                      <span className={`status-chip status-chip--${tone}`}>{status}</span>
                      {status === "failed" && (
                        <button className="button button--ghost" onClick={() => onRetry(id)}>
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
      </div>
    </article>
  );
}
