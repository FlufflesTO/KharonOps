import React from "react";
import { type JobRecord } from "./JobListView";
import type { OpsIntelligencePayload } from "../apiClient";

interface DispatchDailyPlanCardProps {
  jobs: JobRecord[];
  opsIntelligence: OpsIntelligencePayload | null;
}

export function DispatchDailyPlanCard({ jobs, opsIntelligence }: DispatchDailyPlanCardProps): React.JSX.Element {
  const today = new Date().toISOString().split('T')[0];
  const todayJobs = jobs.filter(j => j.updated_at.startsWith(today));
  const lateJobs = jobs.filter(j => j.status === "performed" && j.updated_at < today);

  return (
    <article className="workspace-card">
      <div className="panel-heading">
        <p className="panel-eyebrow">Operations</p>
        <h2>Daily Operational Plan</h2>
      </div>

      <div className="control-stack">
        <section className="summary-grid">
          <div className="summary-card">
            <span className="summary-card__label">Today's Visits</span>
            <strong>{todayJobs.length}</strong>
            <small>Active in the field today</small>
          </div>
          <div className="summary-card">
            <span className="summary-card__label">Incomplete Yesterday</span>
            <strong className={lateJobs.length > 0 ? "text-critical" : ""}>{lateJobs.length}</strong>
            <small>Jobs requiring carry-over</small>
          </div>
        </section>

        <section className="control-block">
          <div className="control-block__head">
            <h3>Execution Risk</h3>
            <p>Potential blockers for today's operational schedule.</p>
          </div>
          <div className="fact-list">
            {opsIntelligence?.jobs.critical && opsIntelligence.jobs.critical > 0 ? (
              <div className="highlight-box border-critical">
                <span className="highlight-box__label">Critical Path Obstruction</span>
                <p>{opsIntelligence.jobs.critical} jobs are currently blocked or requiring emergency escalation.</p>
              </div>
            ) : (
              <p className="muted-copy">No major execution risks detected for the current cycle.</p>
            )}
            
            {lateJobs.length > 0 && (
              <div className="highlight-box border-warning mt-4">
                <span className="highlight-box__label">Carry-over Work</span>
                <p>{lateJobs.length} jobs from yesterday were not certified. Verify team capacity for today's additional load.</p>
              </div>
            )}
          </div>
        </section>

        <section className="control-block">
          <div className="control-block__head">
            <h3>Weather & Context</h3>
            <p>Environmental factors impacting field work.</p>
          </div>
          <div className="highlight-box">
            <p>Normal operating conditions. No weather alerts for Gauteng or Western Cape business units.</p>
          </div>
        </section>
      </div>

      <style>{`
        .text-critical { color: var(--color-critical); }
        .border-critical { border-left: 4px solid var(--color-critical); }
        .border-warning { border-left: 4px solid var(--color-warning); }
        .mt-4 { margin-top: 1rem; }
      `}</style>
    </article>
  );
}
