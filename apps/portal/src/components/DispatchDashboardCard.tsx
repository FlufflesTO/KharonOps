/**
 * KharonOps - Dispatch Command Center
 * Purpose: Level 4 Logistical Coordination and Resource Visibility
 * Dependencies: dispatch-hardened.css, @kharon/domain
 * Structural Role: Central hub for dispatcher workforce coordination.
 */

import React from "react";
import type { OpsIntelligencePayload } from "../apiClient";

interface DispatchDashboardCardProps {
  opsIntelligence: OpsIntelligencePayload | null;
  onEnterTool: (tool: string) => void;
  isLoading: boolean;
}

export function DispatchDashboardCard({ opsIntelligence, onEnterTool, isLoading }: DispatchDashboardCardProps): React.JSX.Element {
  return (
    <article className="workspace-card workspace-card--hardened">
      <div className="panel-heading">
        <div className="flex justify-between items-end w-full">
          <div>
            <p className="panel-eyebrow">Logistical Coordination</p>
            <h2 className="text-2xl font-bold tracking-tight">Dispatch Command Center</h2>
          </div>
          <div className="text-right hidden md:block">
            <span className="status-chip status-chip--active">Real-time Feed</span>
          </div>
        </div>
      </div>

      {!opsIntelligence ? (
        <div className="conduct-hero text-center mt-8">
          <div className="conduct-hero__glow"></div>
          <h3 className="text-xl opacity-60">Synchronizing Logistics...</h3>
          <p className="muted-copy mt-2">Pulling latest workforce and job data from the canonical ledger.</p>
        </div>
      ) : (
        <div className="control-stack mt-8">
          {/* Workforce Utilization Grid */}
          <section className="summary-grid">
            <div className="summary-card shadow-glow" onClick={() => onEnterTool("dispatch_unassigned")} style={{ cursor: 'pointer' }}>
              <span className="summary-card__label">Unassigned Load</span>
              <strong className={opsIntelligence.jobs.stale_over_24h > 0 ? "text-warning" : ""}>
                {opsIntelligence.jobs.stale_over_24h}
              </strong>
              <div className="utilization-bar">
                <div 
                  className="utilization-bar__fill bg-warning" 
                  style={{ width: `${Math.min(100, (opsIntelligence.jobs.stale_over_24h / 10) * 100)}%` }}
                ></div>
              </div>
              <small className="opacity-60">Awaiting technician pairing</small>
            </div>
            
            <div className="summary-card" onClick={() => onEnterTool("schedule")} style={{ cursor: 'pointer' }}>
              <span className="summary-card__label">Active Deployments</span>
              <strong>{opsIntelligence.jobs.open}</strong>
              <div className="utilization-bar">
                <div 
                  className="utilization-bar__fill" 
                  style={{ width: `${Math.min(100, (opsIntelligence.jobs.open / 20) * 100)}%` }}
                ></div>
              </div>
              <small className="opacity-60">Operations in progress</small>
            </div>
            
            <div className="summary-card" onClick={() => onEnterTool("dispatch_daily")} style={{ cursor: 'pointer' }}>
              <span className="summary-card__label">Critical Alerts</span>
              <strong className={opsIntelligence.jobs.critical > 0 ? "text-critical" : ""}>
                {opsIntelligence.jobs.critical}
              </strong>
              <div className="utilization-bar">
                <div 
                  className="utilization-bar__fill bg-critical" 
                  style={{ width: `${Math.min(100, (opsIntelligence.jobs.critical / 5) * 100)}%` }}
                ></div>
              </div>
              <small className="opacity-60">Immediate intervention required</small>
            </div>
          </section>

          {/* Coordination Priorities */}
          <section className="control-block mt-8">
            <div className="control-block__head">
              <h3 className="text-lg font-bold">Operational Priorities</h3>
              <p className="muted-copy">High-impact items requiring logistical intervention.</p>
            </div>
            
            <div className="priority-feed mt-6">
              {opsIntelligence.jobs.critical > 0 && (
                <div className="priority-item priority-item--critical">
                  <div className="indicator-dot indicator-dot--live"></div>
                  <div className="flex-1">
                    <p className="font-bold text-sm">Critical Field Anomalies</p>
                    <p className="text-xs opacity-70 mt-1">{opsIntelligence.jobs.critical} jobs flagged for urgent technical review or site delay.</p>
                  </div>
                  <button className="button button--secondary-glass" onClick={() => onEnterTool("jobs")}>
                    Review
                  </button>
                </div>
              )}

              {opsIntelligence.jobs.stale_over_24h > 0 && (
                <div className="priority-item priority-item--warning">
                  <div className="indicator-dot"></div>
                  <div className="flex-1">
                    <p className="font-bold text-sm">Stale Workload Detected</p>
                    <p className="text-xs opacity-70 mt-1">{opsIntelligence.jobs.stale_over_24h} items have exceeded the 24h assignment window.</p>
                  </div>
                  <button className="button button--secondary-glass" onClick={() => onEnterTool("dispatch_unassigned")}>
                    Assign
                  </button>
                </div>
              )}

              <div className="priority-item">
                <div className="indicator-dot indicator-dot--live"></div>
                <div className="flex-1">
                  <p className="font-bold text-sm">Fleet Status: Synchronized</p>
                  <p className="text-xs opacity-70 mt-1">All field technicians are currently reporting within expected spatial parameters.</p>
                </div>
                <span className="text-xs opacity-50">Log ID: {new Date().getTime().toString().slice(-6)}</span>
              </div>
            </div>
          </section>
        </div>
      )}
      
      <style>{`
        .bg-warning { background: var(--color-warning) !important; box-shadow: 0 0 8px var(--color-warning) !important; }
        .bg-critical { background: var(--color-critical) !important; box-shadow: 0 0 8px var(--color-critical) !important; }
        .text-critical { color: var(--color-critical); }
        .text-warning { color: var(--color-warning); }
      `}</style>
    </article>
  );
}
