import React, { useMemo, useState } from "react";
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
  active_request_uid?: string;
  active_document_uid?: string;
  suggested_technician_uid?: string;
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
    <button type="button" className={isActive ? "job-item job-item--active" : "job-item"} onClick={() => onClick(job.job_uid)}>
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

type StatusFilter = JobStatus | "all" | "open";
const DEFAULT_STATUS_FILTER: StatusFilter = "open";

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

    if (statusFilter === "open") {
      result = result.filter((job) => job.status !== "cancelled" && job.status !== "certified");
    } else if (statusFilter !== "all") {
      result = result.filter((job) => job.status === statusFilter);
    }

    const query = searchQuery.trim().toLowerCase();
    if (query !== "") {
      result = result.filter(
        (job) =>
          job.job_uid.toLowerCase().includes(query) ||
          job.title.toLowerCase().includes(query) ||
          job.client_uid.toLowerCase().includes(query) ||
          job.technician_uid.toLowerCase().includes(query)
      );
    }

    return result;
  }, [jobs, searchQuery, statusFilter]);

  return (
    <section className="workspace-card job-list-panel">
      <div className="panel-heading panel-heading--inline">
        <div>
          <p className="panel-eyebrow">Jobs</p>
          <h2>{title}</h2>
        </div>
        <span className="count-pill" title={`${filtered.length} of ${jobs.length} total`}>
          {filtered.length}
          {filtered.length !== jobs.length ? <span className="count-pill__total"> / {jobs.length}</span> : null}
        </span>
      </div>

      <div className="job-list-filters">
        <input
          id="job-list-search"
          name="job_list_search"
          className="job-list-filters__search"
          type="search"
          placeholder="Search job ID, title, client…"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          aria-label="Search jobs"
          autoComplete="off"
        />
        <select
          id="job-list-status-filter"
          name="job_list_status_filter"
          className="job-list-filters__select"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
          aria-label="Filter by status"
        >
          <option value="open">Open Jobs</option>
          <option value="all">All Statuses</option>
          <optgroup label="Specific Status">
            {(Object.keys(JOB_STATUS_LABELS) as JobStatus[]).map((status) => (
              <option key={status} value={status}>
                {JOB_STATUS_LABELS[status]}
              </option>
            ))}
          </optgroup>
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
          filtered.map((job) => <JobItem key={job.job_uid} job={job} isActive={job.job_uid === selectedJobUid} onClick={onSelectJob} />)
        )}
      </div>
    </section>
  );
}

