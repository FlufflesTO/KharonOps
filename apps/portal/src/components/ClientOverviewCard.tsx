import React from "react";
import { type JobRecord } from "./JobListView";
import type { UpgradeWorkspaceState } from "../apiClient";

interface ClientOverviewCardProps {
  jobs: JobRecord[];
  store: UpgradeWorkspaceState;
  onEnterTool: (tool: string) => void;
}

export function ClientOverviewCard({ jobs, store, onEnterTool }: ClientOverviewCardProps): React.JSX.Element {
  const activeJobs = jobs.filter(j => j.status !== "certified" && j.status !== "cancelled");
  const unpaidInvoices = store.invoices.filter(i => i.status !== "paid");

  return (
    <article className="workspace-card">
      <div className="panel-heading">
        <p className="panel-eyebrow">Client Overview</p>
        <h2>Welcome back to Kharon</h2>
      </div>

      <div className="admin-grid">
        <section className="summary-grid">
          <div className="summary-card" onClick={() => onEnterTool("jobs")} style={{ cursor: 'pointer' }}>
            <span className="summary-card__label">Active Service</span>
            <strong>{activeJobs.length}</strong>
            <small>Jobs currently in progress</small>
          </div>
          <div className="summary-card" onClick={() => onEnterTool("client_invoices")} style={{ cursor: 'pointer' }}>
            <span className="summary-card__label">Unpaid Items</span>
            <strong className={unpaidInvoices.length > 0 ? "text-warning" : ""}>{unpaidInvoices.length}</strong>
            <small>Invoices awaiting payment</small>
          </div>
        </section>

        <section className="control-block">
          <div className="control-block__head">
            <h3>Recent Activity</h3>
            <p>The latest updates from our service team.</p>
          </div>
          <div className="fact-list">
            {activeJobs.slice(0, 3).map(job => (
              <div key={job.job_id} className="highlight-box mt-2">
                <span className="highlight-box__label">{job.status.toUpperCase()}</span>
                <p><strong>{job.job_id}:</strong> {job.title} at {job.site_id}.</p>
              </div>
            ))}
            {activeJobs.length === 0 && (
              <p className="muted-copy">No active service engagements at this time.</p>
            )}
          </div>
        </section>
      </div>

      <style>{`
        .admin-grid { display: grid; gap: 2rem; margin-top: 1.5rem; }
        .text-warning { color: var(--color-warning); }
        .mt-2 { margin-top: 0.5rem; }
      `}</style>
    </article>
  );
}
