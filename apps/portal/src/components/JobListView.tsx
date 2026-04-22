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
  job_id: string;
  title: string;
  status: JobStatus;
  row_version: number;
  client_id: string;
  technician_id: string;
  client_name?: string;
  technician_name?: string;
  last_note: string;
  active_request_id?: string;
  active_document_id?: string;
  suggested_technician_id?: string;
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
  onClick: (id: string) => void;
}

function JobItem({ job, isActive, onClick }: JobItemProps): React.JSX.Element {
  const riskScore = (() => {
    const baseByStatus: Record<JobStatus, number> = {
      draft: 55,
      performed: 35,
      rejected: 78,
      approved: 22,
      certified: 10,
      cancelled: 5
    };
    const noteBoost = /urgent|critical|fault|overdue/i.test(job.last_note ?? "") ? 12 : 0;
    return Math.min(99, baseByStatus[job.status] + noteBoost);
  })();

  const clientDisplay = job.client_name?.trim() || "Not Assigned";
  const technicianDisplay = job.technician_name?.trim() || "Pending Assignment";

  return (
    <button type="button" className={isActive ? "job-item job-item--active" : "job-item"} onClick={() => onClick(job.job_id)}>
      <div className="job-item__top">
        <strong>{job.job_id}</strong>
        <span className={`status-chip status-chip--${statusTone(job.status)}`}>{JOB_STATUS_LABELS[job.status]}</span>
      </div>
      <span className="job-item__title">{job.title}</span>
      <span className="job-item__meta">
        Client: {clientDisplay}
      </span>
      <span className="job-item__meta">
        Tech: {technicianDisplay}
      </span>
      <span className="job-item__meta">
        Risk Score {riskScore}
      </span>
    </button>
  );
}

type StatusFilter = JobStatus | "all" | "open";
const DEFAULT_STATUS_FILTER: StatusFilter = "open";

interface JobListViewProps {
  jobs: JobRecord[];
  selectedJobid: string;
  onSelectJob: (id: string) => void;
  title: string;
}

export function JobListView({ jobs, selectedJobid, onSelectJob, title }: JobListViewProps): React.JSX.Element {
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
          job.job_id.toLowerCase().includes(query) ||
          job.title.toLowerCase().includes(query) ||
          job.client_id.toLowerCase().includes(query) ||
          job.technician_id.toLowerCase().includes(query) ||
          (job.client_name ?? "").toLowerCase().includes(query) ||
          (job.technician_name ?? "").toLowerCase().includes(query)
      );
    }

    return result;
  }, [jobs, searchQuery, statusFilter]);

  const heatmap = useMemo(() => {
    const buckets = { high: 0, medium: 0, low: 0 };
    for (const job of filtered) {
      const score = /urgent|critical|fault|overdue/i.test(job.last_note ?? "")
        ? 75
        : job.status === "rejected"
          ? 80
          : job.status === "draft"
            ? 60
            : job.status === "performed"
              ? 40
              : 15;
      if (score >= 70) buckets.high += 1;
      else if (score >= 40) buckets.medium += 1;
      else buckets.low += 1;
    }
    return buckets;
  }, [filtered]);

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
          placeholder="Search job ID, title, client..."
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

      <div className="button-row" style={{ padding: "0.5rem 0.75rem", borderBottom: "1px solid var(--color-border)" }}>
        <span className="status-chip status-chip--critical">High risk {heatmap.high}</span>
        <span className="status-chip status-chip--warning">Medium {heatmap.medium}</span>
        <span className="status-chip status-chip--active">Low {heatmap.low}</span>
      </div>

      <div className="job-list">
        {filtered.length === 0 ? (
          <p className="muted-copy">
            {jobs.length === 0
              ? "No jobs currently available for this role."
              : "No jobs match the current filter. Adjust the search or status filter above."}
          </p>
        ) : (
          filtered.map((job) => <JobItem key={job.job_id} job={job} isActive={job.job_id === selectedJobid} onClick={onSelectJob} />)
        )}
      </div>
    </section>
  );
}


