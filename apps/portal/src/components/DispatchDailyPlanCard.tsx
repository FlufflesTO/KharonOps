/**
 * KharonOps - Dispatch Daily Operational Plan
 * Purpose: Level 4 Execution Risk and Capacity Monitoring
 * Dependencies: dispatch-hardened.css, JobListView.tsx
 * Structural Role: Strategic daily oversight of field execution status.
 */

import React from "react";
import { type JobRecord } from "./JobListView";
import type { OpsIntelligencePayload } from "../apiClient";

interface DispatchDailyPlanCardProps {
  jobs: JobRecord[];
  opsIntelligence: OpsIntelligencePayload | null;
}

export function DispatchDailyPlanCard({ jobs, opsIntelligence }: DispatchDailyPlanCardProps): React.JSX.Element {
  const today = new Date().toISOString().split('T')[0] ?? "";
  const todayJobs = jobs.filter(j => (j.updated_at ?? "").startsWith(today));
  const lateJobs = jobs.filter(j => j.status === "performed" && (j.updated_at ?? "") < today);

  return (
    <article className="workspace-card workspace-card--hardened">
      <div className="panel-heading">
        <div className="flex justify-between items-end w-full">
          <div>
            <p className="panel-eyebrow">Strategic Execution</p>
            <h2 className="text-2xl font-bold tracking-tight">Daily Operational Plan</h2>
          </div>
        </div>
      </div>

      <div className="control-stack mt-8">
        {/* Capacity Overview */}
        <section className="summary-grid">
          <div className="summary-card shadow-glow">
            <span className="summary-card__label">Active Deployments</span>
            <strong className="text-primary-light">{todayJobs.length}</strong>
            <div className="utilization-bar">
              <div className="utilization-bar__fill" style={{ width: `${Math.min(100, (todayJobs.length / 10) * 100)}%` }}></div>
            </div>
            <small className="opacity-60">Verified field activity today</small>
          </div>
          <div className="summary-card border-warning">
            <span className="summary-card__label">Carry-over Debt</span>
            <strong className={lateJobs.length > 0 ? "text-warning" : "opacity-40"}>{lateJobs.length}</strong>
            <div className="utilization-bar">
              <div className="utilization-bar__fill bg-warning" style={{ width: `${Math.min(100, (lateJobs.length / 5) * 100)}%` }}></div>
            </div>
            <small className="opacity-60">Jobs awaiting closure</small>
          </div>
        </section>

        {/* Risk Assessment */}
        <section className="control-block mt-8">
          <div className="control-block__head">
            <h3 className="text-lg font-bold">Execution Risk Map</h3>
            <p className="muted-copy">Potential bottlenecks detected in the current operational cycle.</p>
          </div>
          
          <div className="priority-feed mt-6">
            {opsIntelligence?.jobs.critical && opsIntelligence.jobs.critical > 0 ? (
              <div className="priority-item priority-item--critical shadow-glow-critical">
                <div className="indicator-dot indicator-dot--live bg-critical"></div>
                <div className="flex-1">
                  <p className="font-bold text-sm">Critical Path Obstruction</p>
                  <p className="text-xs opacity-70 mt-1">
                    {opsIntelligence.jobs.critical} deployments are reporting high-impact blockers. Capacity at risk.
                  </p>
                </div>
              </div>
            ) : (
              <div className="conduct-hero bg-positive-subtle border-positive p-4 flex items-center gap-4">
                <div className="indicator-dot indicator-dot--live"></div>
                <p className="text-xs opacity-80">Path clear: No strategic execution risks detected for the next 4 hours.</p>
              </div>
            )}
            
            {lateJobs.length > 0 && (
              <div className="priority-item priority-item--warning">
                <div className="indicator-dot bg-warning"></div>
                <div className="flex-1">
                  <p className="font-bold text-sm">Temporal Drift: Carry-over Load</p>
                  <p className="text-xs opacity-70 mt-1">
                    {lateJobs.length} tasks from the previous cycle were not certified. Workforce fatigue likely.
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Environmental Context */}
        <section className="control-block mt-8">
          <div className="control-block__head">
            <h3 className="text-lg font-bold">Environmental Stability</h3>
            <p className="muted-copy">Verified external factors impacting field conduct.</p>
          </div>
          <div className="geo-fence-panel flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="fence-pulse fence-pulse--verified"></div>
              <div>
                <p className="text-sm font-semibold">Atmospheric: Nominal</p>
                <p className="text-xs opacity-60">No hazardous conditions reported for regional business units.</p>
              </div>
            </div>
            <span className="text-[10px] opacity-40 font-mono">STABLE_V6</span>
          </div>
        </section>
      </div>

      <style>{`
        .bg-warning { background: var(--color-warning) !important; }
        .bg-critical { background: var(--color-critical) !important; }
        .text-warning { color: var(--color-warning); }
        .border-warning { border-color: hsla(45, 80%, 50%, 0.3) !important; }
        .bg-positive-subtle { background: rgba(16, 185, 129, 0.05); }
        .border-positive { border: 1px solid rgba(16, 185, 129, 0.2); }
        .shadow-glow-critical { box-shadow: 0 0 20px hsla(0, 80%, 50%, 0.1); }
      `}</style>
    </article>
  );
}
