/**
 * KharonOps Portal - JobListView Component
 * Purpose: Scrollable sidebar list of jobs with status filter and text search.
 *          Reduces cognitive load when 100+ jobs are active (e.g. admin view).
 *          Default filter is "draft" (Open / Ready) so the list opens showing
 *          only actionable jobs — user must explicitly change filter to see
 *          performed, approved, certified, or cancelled records.
 * Dependencies: @kharon/domain (JobStatus)
 * Structural Role: Left sidebar in the workspace view; drives job context for all cards.
 */
import React, { useState, useMemo } from "react";
import type { JobStatus } from "@kharon/domain";

const JOB_STATUS_LABELS: Record<JobStatus, string> = {
  draft: "Open / Ready",
  performed: "Work Performed",
  rejected: "Correction Required",
  approved: "Office Approved",
  certified: "Legally Certified",
  cancelled: "Cancelled / Void"
};

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

function JobItem({ job, isActive, onClick }: JobItemProps): React.JSX.Element {
  return (
    <button
      className={isActive ? "job-item job-item--active" : "job-item"}
      onClick={() => onClick(job.job_uid)}
    >
      <div className="job-item__top">
        <strong>{job.job_uid}</strong>
        <span className={`status-chip status-chip--${statusTone(job.status)}`}>{JOB_STATUS_LABELS[job.status]}</span>
      </div>
      <span className="job-item__title">{job.title}</span>
      <span className="job-item__meta">
        client {job.client_uid || "unassigned"} | tech {job.technician_uid || "pending"}
      </span>
    </button>
  );
}

// "all" is the sentinel value meaning no status filter is active.
type StatusFilter = JobStatus | "all";

// Default filter: "draft" (Open / Ready) — ensures the list opens showing only
// immediately actionable jobs. Users must opt-in to see other statuses.
// This is a deliberate UX decision: dispatchers and admins managing 200+ jobs
// should land on work that needs action, not a wall of closed records.
const DEFAULT_STATUS_FILTER: StatusFilter = "draft";

interface JobListViewProps {
  jobs: JobRecord[];
  selectedJobUid: string;
  onSelectJob: (uid: string) => void;
  title: string;
}

export function JobListView({ jobs, selectedJobUid, onSelectJob, title }: JobListViewProps): React.JSX.Element {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(DEFAULT_STATUS_FILTER);
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = useMemo(() => {
    let result = jobs;

    // Status filter — "all" bypasses the status check entirely
    if (statusFilter !== "all") {
      result = result.filter((j) => j.status === statusFilter);
    }

    // Text search — matches job_uid, title, client_uid, technician_uid
    const q = searchQuery.trim().toLowerCase();
    if (q !== "") {
      result = result.filter(
        (j) =>
          j.job_uid.toLowerCase().includes(q) ||
          j.title.toLowerCase().includes(q) ||
          j.client_uid.toLowerCase().includes(q) ||
          j.technician_uid.toLowerCase().includes(q)
      );
    }

    return result;
  }, [jobs, statusFilter, searchQuery]);

  return (
    <section className="workspace-card job-list-panel">
      <div className="panel-heading panel-heading--inline">
        <div>
          <p className="panel-eyebrow">Jobs</p>
          <h2>{title}</h2>
        </div>
        {/* Show filtered count / total to signal filter is active */}
        <span className="count-pill" title={`${filtered.length} of ${jobs.length} total`}>
          {filtered.length}
          {filtered.length !== jobs.length && <span className="count-pill__total"> / {jobs.length}</span>}
        </span>
      </div>

      {/* Filter controls */}
      <div className="job-list-filters">
        <input
          id="job-list-search"
          className="job-list-filters__search"
          type="search"
          placeholder="Search job ID, title, client…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          aria-label="Search jobs"
        />
        <select
          id="job-list-status-filter"
          className="job-list-filters__select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          aria-label="Filter by status"
        >
          <option value="all">All statuses</option>
          {(Object.keys(JOB_STATUS_LABELS) as JobStatus[]).map((s) => (
            <option key={s} value={s}>{JOB_STATUS_LABELS[s]}</option>
          ))}
        </select>
      </div>

      <div className="job-list">
        {filtered.length === 0 ? (
          <p className="muted-copy">
            {jobs.length === 0
              ? "No jobs currently available for this role."
              : "No jobs match the current filter. Adjust the search or status filter above."}
          </p>
        ) : (
          filtered.map((job) => (
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
