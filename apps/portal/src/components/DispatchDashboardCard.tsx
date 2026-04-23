import React from "react";
import type { OpsIntelligencePayload } from "../apiClient";

interface DispatchDashboardCardProps {
  opsIntelligence: OpsIntelligencePayload | null;
  onEnterTool: (tool: string) => void;
  isLoading: boolean;
}

export function DispatchDashboardCard({ opsIntelligence, onEnterTool, isLoading }: DispatchDashboardCardProps): React.JSX.Element {
  return (
    <article className="workspace-card">
      <div className="panel-heading">
        <p className="panel-eyebrow">Dispatch Control</p>
        <h2>Workforce and job coordination</h2>
      </div>

      {!opsIntelligence ? (
        <div className="highlight-box">
          <p>Dispatch data is synchronizing. This summary will refresh automatically.</p>
        </div>
      ) : (
        <div className="admin-grid">
          <section className="summary-grid">
            <div className="summary-card" onClick={() => onEnterTool("dispatch_unassigned")} style={{ cursor: 'pointer' }}>
              <span className="summary-card__label">Unassigned Jobs</span>
              <strong className={opsIntelligence.jobs.stale_over_24h > 0 ? "text-warning" : ""}>
                {opsIntelligence.jobs.stale_over_24h}
              </strong>
              <small>Waiting for team assignment</small>
            </div>
            <div className="summary-card" onClick={() => onEnterTool("schedule")} style={{ cursor: 'pointer' }}>
              <span className="summary-card__label">Pending Visits</span>
              <strong>{opsIntelligence.jobs.open}</strong>
              <small>Scheduled or in progress today</small>
            </div>
            <div className="summary-card" onClick={() => onEnterTool("dispatch_daily")} style={{ cursor: 'pointer' }}>
              <span className="summary-card__label">Alerts</span>
              <strong className={opsIntelligence.jobs.critical > 0 ? "text-critical" : ""}>
                {opsIntelligence.jobs.critical}
              </strong>
              <small>Urgent field issues</small>
            </div>
          </section>

          <section className="control-block">
            <div className="control-block__head">
              <h3>Dispatch Priorities</h3>
              <p>Top operational items requiring your attention.</p>
            </div>
            <div className="fact-list">
              <div className="highlight-box border-warning">
                <span className="highlight-box__label">Unassigned Load</span>
                <p>There are {opsIntelligence.jobs.stale_over_24h} jobs that have not been updated in 24 hours. Review assignments.</p>
                <button className="button button--secondary mt-2" onClick={() => onEnterTool("dispatch_unassigned")}>
                  Assign Work
                </button>
              </div>

              {opsIntelligence.jobs.critical > 0 && (
                <div className="highlight-box border-critical mt-4">
                  <span className="highlight-box__label">Urgent Field Response</span>
                  <p>{opsIntelligence.jobs.critical} jobs are marked critical. Verify team location and status.</p>
                  <button className="button button--secondary mt-2" onClick={() => onEnterTool("jobs")}>
                    View Critical Jobs
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
        .text-warning { color: var(--color-warning); }
        .border-warning { border-left: 4px solid var(--color-warning); }
        .border-critical { border-left: 4px solid var(--color-critical); }
        .mt-2 { margin-top: 0.5rem; }
        .mt-4 { margin-top: 1rem; }
      `}</style>
    </article>
  );
}
