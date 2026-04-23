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
    <article className="workspace-card">
      <div className="panel-heading panel-heading--inline">
        <div>
          <p className="panel-eyebrow">Work Queue</p>
          <h2>Unassigned Jobs</h2>
        </div>
      </div>

      <div className="control-stack">
        <section className="control-block">
          <div className="control-block__head">
            <h3>Pending Assignment</h3>
            <p>The following jobs are ready for workforce allocation. Select a job to assign it via the Schedule Board.</p>
          </div>
          
          <div className="history-table">
            {unassignedJobs.length === 0 ? (
              <p className="muted-copy p-4">All active jobs have been assigned to teams.</p>
            ) : (
              unassignedJobs.map((job) => (
                <div key={job.job_id} className="history-row">
                  <div className="flex-1">
                    <strong>{job.job_id}</strong>
                    <span className="job-item__meta">{job.client_name} • {job.title}</span>
                  </div>
                  <div className="button-row">
                    <span className="status-chip status-chip--warning">Unassigned</span>
                    <button 
                      className="button button--secondary" 
                      onClick={() => {
                        onSelectJob(job.job_id);
                        onEnterTool("schedule");
                      }}
                    >
                      Assign
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      <style>{`
        .p-4 { padding: 1rem; }
      `}</style>
    </article>
  );
}
