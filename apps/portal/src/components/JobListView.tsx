import React from "react";
import type { JobStatus } from "@kharon/domain";

export interface JobRecord {
  job_uid: string;
  title: string;
  status: JobStatus;
  row_version: number;
  client_uid: string;
  technician_uid: string;
  last_note: string;
}

export function statusTone(status: string): "active" | "warning" | "critical" | "neutral" {
  switch (status) {
    case "performed":
    case "approved":
    case "certified":
      return "active";
    case "draft":
    case "rejected":
      return "warning";
    case "cancelled":
      return "critical";
    default:
      return "neutral";
  }
}

interface JobItemProps {
  job: JobRecord;
  isActive: boolean;
  onClick: (uid: string) => void;
}

export function JobItem({ job, isActive, onClick }: JobItemProps): React.JSX.Element {
  return (
    <button
      className={isActive ? "job-item job-item--active" : "job-item"}
      onClick={() => onClick(job.job_uid)}
    >
      <div className="job-item__top">
        <strong>{job.job_uid}</strong>
        <span className={`status-chip status-chip--${statusTone(job.status)}`}>{job.status}</span>
      </div>
      <span className="job-item__title">{job.title}</span>
      <span className="job-item__meta">
        client {job.client_uid || "unassigned"} | tech {job.technician_uid || "pending"}
      </span>
    </button>
  );
}

interface JobListViewProps {
  jobs: JobRecord[];
  selectedJobUid: string;
  onSelectJob: (uid: string) => void;
  title: string;
}

export function JobListView({ jobs, selectedJobUid, onSelectJob, title }: JobListViewProps): React.JSX.Element {
  return (
    <section className="workspace-card">
      <div className="panel-heading panel-heading--inline">
        <div>
          <p className="panel-eyebrow">Jobs</p>
          <h2>{title}</h2>
        </div>
        <span className="count-pill">{jobs.length}</span>
      </div>

      <div className="job-list">
        {jobs.length === 0 ? (
          <p className="muted-copy">No jobs currently available for this role.</p>
        ) : (
          jobs.map((job) => (
            <JobItem 
              key={job.job_uid} 
              job={job} 
              isActive={job.job_uid === selectedJobUid} 
              onClick={onSelectJob} 
            />
          ))
        )}
      </div>
    </section>
  );
}
