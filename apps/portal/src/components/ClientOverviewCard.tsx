/**
 * KharonOps - Client Executive Summary
 * Purpose: Level 4 Operational Peace of Mind and Service Visibility
 * Dependencies: client-hardened.css, @kharon/domain
 * Structural Role: Central dashboard for clients to monitor service status.
 */

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
  const complianceRate = jobs.length > 0 ? Math.round((jobs.filter(j => j.status === "certified").length / jobs.length) * 100) : 100;

  return (
    <article className="workspace-card workspace-card--hardened">
      <div className="panel-heading">
        <div className="flex justify-between items-end w-full">
          <div>
            <p className="panel-eyebrow">Operational Peace of Mind</p>
            <h2 className="text-3xl font-bold tracking-tight">Executive Dashboard</h2>
          </div>
          <div className="text-right hidden md:block">
            <span className="status-chip status-chip--active">Facility Guarded</span>
          </div>
        </div>
      </div>

      <div className="control-stack mt-8">
        {/* Compliance and Engagement Grid */}
        <section className="summary-grid">
          <div className="service-pulse-card shadow-glow" onClick={() => onEnterTool("jobs")} style={{ cursor: 'pointer' }}>
            <div className="compliance-status">
              <div className="compliance-status__ring">{complianceRate}%</div>
              <div>
                <p className="text-xs uppercase tracking-widest opacity-40 font-bold">Facility Compliance</p>
                <h3 className="text-xl font-bold">Service Status</h3>
              </div>
            </div>
            <p className="text-xs opacity-60 mt-4">{activeJobs.length} active service engagements in progress.</p>
          </div>
          
          <div className="service-pulse-card" onClick={() => onEnterTool("client_invoices")} style={{ cursor: 'pointer' }}>
            <div className="compliance-status">
              <div className="compliance-status__ring" style={{ borderColor: unpaidInvoices.length > 0 ? 'var(--color-warning)' : 'var(--color-positive)', color: unpaidInvoices.length > 0 ? 'var(--color-warning)' : 'var(--color-positive)' }}>
                {unpaidInvoices.length}
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest opacity-40 font-bold">Fiduciary State</p>
                <h3 className="text-xl font-bold">Open Items</h3>
              </div>
            </div>
            <p className="text-xs opacity-60 mt-4">Review outstanding settlements for your facility.</p>
          </div>
        </section>

        {/* Live Service Feed */}
        <section className="control-block mt-8">
          <div className="control-block__head">
            <h3 className="text-lg font-bold">Operational Timeline</h3>
            <p className="muted-copy">Real-time visibility into current site interventions.</p>
          </div>
          
          <div className="client-activity-feed mt-6">
            {activeJobs.length === 0 ? (
              <div className="conduct-hero bg-positive-subtle border-positive p-8 text-center">
                <p className="opacity-80">All facility systems are currently verified and operational.</p>
                <p className="text-xs opacity-50 mt-1">Next scheduled audit: Quarterly Q3</p>
              </div>
            ) : (
              activeJobs.slice(0, 4).map(job => (
                <div key={job.job_id} className="activity-row shadow-glow-hover">
                  <div className="activity-row__icon">
                    <span className="text-xs font-bold">JS</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <strong className="text-sm">{job.title}</strong>
                      <span className="text-[10px] uppercase opacity-40 font-mono">{job.job_id}</span>
                    </div>
                    <p className="text-xs opacity-60 mt-0.5">{job.site_id} • Status: {job.status}</p>
                  </div>
                  <div className="text-right">
                    <button className="button button--secondary-glass py-1 px-3 text-xs" onClick={() => onEnterTool("jobs")}>
                      Details
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      <style>{`
        .bg-positive-subtle { background: rgba(16, 185, 129, 0.05); }
        .border-positive { border: 1px solid rgba(16, 185, 129, 0.2); }
        .shadow-glow-hover:hover {
          box-shadow: 0 0 20px var(--client-glow);
          border-color: var(--client-accent);
          background: rgba(255,255,255,0.02);
        }
      `}</style>
    </article>
  );
}
