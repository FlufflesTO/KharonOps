/**
 * KharonOps - Dispatch Unassigned Queue
 * Purpose: Level 4 Surgical Resource Allocation
 * Dependencies: dispatch-hardened.css, JobListView.tsx
 * Structural Role: Operational bottleneck visibility and task pairing.
 */

import React from "react";
import { type JobRecord } from "./JobListView";

interface DispatchUnassignedCardProps {
  jobs: JobRecord[];
  onSelectJob: (jobId: string) => void;
  onEnterTool: (tool: string) => void;
}

export function DispatchUnassignedCard({ jobs, onSelectJob, onEnterTool }: DispatchUnassignedCardProps): React.JSX.Element {
  const unassignedJobs = jobs.filter(j => !j.technician_id || j.technician_id.toLowerCase().includes("unassigned"));

  return (
    <article className="workspace-card workspace-card--hardened">
      <div className="panel-heading">
        <div className="flex justify-between items-end w-full">
          <div>
            <p className="panel-eyebrow">Resource Allocation</p>
            <h2 className="text-2xl font-bold tracking-tight">Unassigned Work Queue</h2>
          </div>
          <div className="text-right">
            <span className={`status-chip status-chip--${unassignedJobs.length > 5 ? 'critical' : 'active'}`}>
              {unassignedJobs.length} Items Pending
            </span>
          </div>
        </div>
      </div>

      <div className="control-stack mt-8">
        <section className="control-block">
          <div className="control-block__head">
            <h3 className="text-lg font-bold">Queue Backlog</h3>
            <p className="muted-copy">Jobs awaiting pairing with a verified field technician.</p>
          </div>
          
          <div className="allocation-list mt-6">
            {unassignedJobs.length === 0 ? (
              <div className="conduct-hero text-center bg-positive-subtle border-positive">
                <p className="opacity-80">Full workforce saturation achieved. All tasks are currently assigned.</p>
              </div>
            ) : (
              unassignedJobs.map((job) => (
                <div key={job.job_id} className="allocation-row shadow-glow-hover">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs text-primary-light font-bold">{job.job_id}</span>
                      <strong className="text-sm tracking-tight">{job.client_name}</strong>
                    </div>
                    <p className="text-xs opacity-60 mt-1">{job.title} • {job.site_id}</p>
                  </div>
                  
                  <div className="flex items-center gap-6 px-4">
                    <div className="text-right hidden md:block">
                      <p className="text-[10px] uppercase tracking-widest opacity-40 font-bold">Priority</p>
                      <p className="text-xs font-semibold">Standard</p>
                    </div>
                    <button 
                      className="button button--secondary-glass" 
                      onClick={() => {
                        onSelectJob(job.job_id);
                        onEnterTool("schedule");
                      }}
                    >
                      Pair Resource
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      <style>{`
        .shadow-glow-hover:hover {
          box-shadow: 0 0 15px var(--tech-glow-primary);
          border-color: var(--color-primary-light);
          background: rgba(255,255,255,0.02);
        }
        .bg-positive-subtle { background: rgba(16, 185, 129, 0.05); }
        .border-positive { border: 1px solid rgba(16, 185, 129, 0.2); }
      `}</style>
    </article>
  );
}
