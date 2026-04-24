import React from "react";
import { type JobRecord } from "./JobListView";

interface TechMyDayCardProps {
  jobs: JobRecord[];
  onSelectJob: (jobId: string) => void;
  onEnterTool: (tool: string) => void;
}

export function TechMyDayCard({ jobs, onSelectJob, onEnterTool }: TechMyDayCardProps): React.JSX.Element {
  const activeJobs = jobs.filter(j => j.status === "performed" || j.status === "approved");
  const nextJob = activeJobs[0];

  return (
    <article className="workspace-card">
      <div className="panel-heading">
        <p className="panel-eyebrow">My Day</p>
        <h2>Your current field schedule</h2>
      </div>

      {!nextJob ? (
        <div className="highlight-box">
          <p>No active jobs assigned for today. Contact dispatch if you're available for work.</p>
        </div>
      ) : (
        <div className="control-stack">
          <section className="highlight-box border-active">
            <span className="highlight-box__label">Next Job</span>
            <h3>{nextJob.job_id} | {nextJob.client_name}</h3>
            <p className="mt-2"><strong>Site:</strong> {nextJob.site_id}</p>
            <p><strong>Task:</strong> {nextJob.title}</p>
            
            <div className="button-row mt-6">
              <button 
                className="button button--primary button--large"
                onClick={() => {
                  onSelectJob(nextJob.job_id);
                  onEnterTool("tech_start");
                }}
              >
                Start Job Now
              </button>
              <button 
                className="button button--secondary"
                onClick={() => {
                  onSelectJob(nextJob.job_id);
                  onEnterTool("jobs");
                }}
              >
                View Details
              </button>
            </div>
          </section>

          <section className="control-block">
            <div className="control-block__head">
              <h3>Upcoming Today</h3>
            </div>
            <div className="history-table">
              {activeJobs.slice(1, 4).map(job => (
                <div key={job.job_id} className="history-row">
                  <div className="flex-1">
                    <strong>{job.job_id}</strong>
                    <span className="job-item__meta">{job.client_name} • {job.site_id}</span>
                  </div>
                  <span className="status-chip status-chip--neutral">{job.status}</span>
                </div>
              ))}
              {activeJobs.length <= 1 && (
                <p className="muted-copy">No other jobs scheduled for today.</p>
              )}
            </div>
          </section>
        </div>
      )}

      <style>{`
        .mt-2 { margin-top: 0.5rem; }
        .mt-6 { margin-top: 1.5rem; }
        .border-active { border-left: 4px solid var(--color-positive); }
        .button--large { padding: 1rem 2rem; font-size: 1.1rem; flex: 1; }
      `}</style>
    </article>
  );
}
