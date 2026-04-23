/**
 * Project KharonOps - Job List View (Refactored with Virtualization)
 * Purpose: High-density operational dashboard with grid-safety and robust truncation.
 * Performance: Virtualization enabled for scale (>1000 rows).
 */

import React, { useMemo, useState, useCallback } from "react";
import { List, type RowComponentProps } from "react-window";
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
  updated_at?: string;
  site_id?: string;
  site_lat?: number | null;
  site_lng?: number | null;
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

function Highlight({ text, query }: { text: string; query: string }): React.JSX.Element {
  const trimmed = query.trim();
  if (!trimmed) return <>{text}</>;
  const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = text.split(new RegExp(`(${escaped})`, "ig"));
  return (
    <>
      {parts.map((part, idx) =>
        part.toLowerCase() === trimmed.toLowerCase()
          ? <mark key={idx} className="highlight">{part}</mark>
          : <span key={idx}>{part}</span>
      )}
    </>
  );
}

const JobItem = React.memo(function JobItem({ job, isActive, checked, onToggle, onClick, query, style }: {
  job: JobRecord;
  isActive: boolean;
  checked: boolean;
  onToggle: (id: string) => void;
  onClick: (id: string) => void;
  query: string;
  style?: React.CSSProperties;
}): React.JSX.Element {
  const riskScore = useMemo(() => {
    const baseByStatus: Record<JobStatus, number> = {
      draft: 55, performed: 35, rejected: 78, approved: 22, certified: 10, cancelled: 5
    };
    const noteBoost = /urgent|critical|fault|overdue/i.test(job.last_note ?? "") ? 12 : 0;
    return Math.min(99, baseByStatus[job.status] + noteBoost);
  }, [job.status, job.last_note]);

  return (
    <div style={style}>
      <div className={`job-card-wrapper ${isActive ? 'job-card-wrapper--active' : ''}`} style={{ margin: '0 8px 12px 0' }}>
        <div className="job-card-checkbox">
          <input
            type="checkbox"
            checked={checked}
            onChange={() => onToggle(job.job_id)}
            aria-label={`Select ${job.job_id}`}
          />
        </div>
        <button
          type="button"
          className="job-card"
          onClick={() => onClick(job.job_id)}
        >
          <div className="job-card__header">
            <span className="job-card__id truncate">
              <Highlight text={job.job_id} query={query} />
            </span>
            <span className={`status-chip status-chip--${statusTone(job.status)}`}>
              {JOB_STATUS_LABELS[job.status]}
            </span>
          </div>

          <div className="job-card__title truncate">
            <Highlight text={job.title} query={query} />
          </div>

          <div className="job-card__client truncate">
            <Highlight text={job.client_name || "Unassigned Client"} query={query} />
          </div>

          <div className="job-card__meta">
            <div className="job-card__meta-item truncate">
              <span className="meta-icon">👤</span>
              <span><Highlight text={job.technician_name || "Pending Tech"} query={query} /></span>
            </div>
            <div className="job-card__meta-item">
              <div className={`risk-indicator risk-indicator--${riskScore > 70 ? 'high' : riskScore > 30 ? 'med' : 'low'}`}>
                <div className="risk-bar" style={{ width: `${riskScore}%` }}></div>
                <span>Risk {riskScore}%</span>
              </div>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
});

type StatusFilter = JobStatus | "all" | "open";

export interface JobListViewProps {
  jobs: JobRecord[];
  selectedJobid: string | null;
  onSelectJob: (id: string) => void;
  title: string;
  globalQuery: string;
  onGlobalQueryChange: (q: string) => void;
  onBulkStatusUpdate?: (ids: string[], status: JobStatus) => void;
  limit?: number;
}

type VirtualRowProps = {
  jobs: JobRecord[];
  selectedJobid: string | null;
  selectedJobIds: string[];
  onToggle: (id: string) => void;
  onSelectJob: (id: string) => void;
  query: string;
};

function VirtualRow({
  index,
  style,
  jobs,
  selectedJobid,
  selectedJobIds,
  onToggle,
  onSelectJob,
  query
}: RowComponentProps<VirtualRowProps>): React.JSX.Element | null {
  const job = jobs[index];
  if (!job) {
    return null;
  }

  return (
    <JobItem
      job={job}
      isActive={job.job_id === selectedJobid}
      checked={selectedJobIds.includes(job.job_id)}
      onToggle={onToggle}
      onClick={onSelectJob}
      query={query}
      style={style}
    />
  );
}

export function JobListView({
    jobs,
    selectedJobid,
    onSelectJob,
    title,
    globalQuery,
    onGlobalQueryChange,
    onBulkStatusUpdate,
    limit
  }: JobListViewProps): React.JSX.Element {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("open");
  const [selectedJobIds, setSelectedJobIds] = useState<string[]>([]);

  const filtered = useMemo(() => {
    let result = jobs;
    if (statusFilter === "open") {
      result = result.filter((j: JobRecord) => j.status !== "cancelled" && j.status !== "certified");
    } else if (statusFilter !== "all") {
      result = result.filter((j: JobRecord) => j.status === statusFilter);
    }
    const q = globalQuery.toLowerCase();
    if (q) {
      result = result.filter((j: JobRecord) => j.job_id.toLowerCase().includes(q) ||
        j.title.toLowerCase().includes(q) ||
        (j.client_name ?? "").toLowerCase().includes(q)
      );
    }
    return limit ? result.slice(0, limit) : result;
  }, [jobs, globalQuery, statusFilter, limit]);

  const handleToggle = useCallback((id: string) => {
    setSelectedJobIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }, []);

  const useVirtualization = filtered.length > 1000 && !limit;

  return (
    <section className="job-panel glass-panel">
      <div className="panel-header">
        <div className="panel-title-block">
          <span className="eyebrow">OPERATIONAL LEDGER</span>
          <h2>{title}</h2>
        </div>
        <div className="badge-group">
          <span className="badge badge--primary">{filtered.length} Active</span>
        </div>
      </div>

      <div className="filter-system">
        <div className="search-wrapper">
          <input
            type="search"
            placeholder="Filter jobs..."
            value={globalQuery}
            onChange={(e) => onGlobalQueryChange(e.target.value)}
          />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}>
          <option value="open">Open State</option>
          <option value="all">All States</option>
          <option value="performed">Performed</option>
          <option value="certified">Certified</option>
        </select>
      </div>

      {selectedJobIds.length > 0 && (
        <div className="bulk-actions animate-in">
          <span>{selectedJobIds.length} Selected</span>
          <button onClick={() => onBulkStatusUpdate?.(selectedJobIds, "performed")}>Batch: Performed</button>
          <button onClick={() => setSelectedJobIds([])} className="btn-ghost">Clear</button>
        </div>
      )}

      <div className="job-scroller" style={{ height: '100%', minHeight: 0 }}>
        {useVirtualization ? (
          <List
            rowCount={filtered.length}
            rowHeight={140}
            rowComponent={VirtualRow}
            rowProps={{
              jobs: filtered,
              selectedJobid,
              selectedJobIds,
              onToggle: handleToggle,
              onSelectJob,
              query: globalQuery
            }}
            style={{ height: 600, width: "100%" }}
          >
          </List>
        ) : (
          filtered.map((job: JobRecord) => (
            <JobItem
              key={job.job_id}
              job={job}
              isActive={job.job_id === selectedJobid}
              checked={selectedJobIds.includes(job.job_id)}
              onToggle={handleToggle}
              onClick={onSelectJob}
              query={globalQuery}
            />
          ))
        )}
      </div>

      <style>{`
        .job-panel {
          height: 100%;
          display: flex;
          flex-direction: column;
          padding: 1.5rem;
          overflow: hidden;
        }
        .panel-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-bottom: 1.5rem;
        }
        .eyebrow {
          font-size: 0.6rem;
          font-weight: 900;
          letter-spacing: 0.2em;
          color: var(--color-primary);
          margin-bottom: 0.25rem;
          display: block;
        }
        .filter-system {
          display: grid;
          grid-template-columns: 1fr 180px;
          gap: 0.75rem;
          margin-bottom: 1.5rem;
        }
        @media (max-width: 640px) {
          .filter-system { grid-template-columns: 1fr; }
        }
        .search-wrapper input {
          width: 100%;
          background: rgba(0,0,0,0.2);
          border: 1px solid rgba(255,255,255,0.1);
          padding: 0.6rem 1rem;
          border-radius: 8px;
          color: #fff;
        }
        .job-scroller {
          flex: 1;
          overflow-y: auto;
          padding-right: 0.5rem;
        }
        .bulk-actions {
          background: var(--color-primary);
          padding: 0.75rem 1rem;
          border-radius: 8px;
          margin-bottom: 1rem;
          display: flex;
          align-items: center;
          gap: 1rem;
          font-size: 0.8rem;
          font-weight: 700;
        }
        .job-card-wrapper {
          display: flex;
          align-items: stretch;
          gap: 0.5rem;
          margin-bottom: 0.75rem;
          position: relative;
        }
        .job-card-checkbox {
          display: flex;
          align-items: center;
          padding: 0 0.5rem;
          background: rgba(255, 255, 255, 0.02);
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }
        .job-card {
          flex: 1;
          min-width: 0;
          text-align: left;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          padding: 1rem;
          border-radius: 12px;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }
        .job-card-wrapper--active .job-card {
          background: rgba(var(--color-primary-rgb), 0.1);
          border-color: var(--color-primary);
          box-shadow: 0 0 20px rgba(var(--color-primary-rgb), 0.1);
        }
        .job-card:hover {
          background: rgba(255, 255, 255, 0.06);
          border-color: rgba(255, 255, 255, 0.2);
          transform: translateY(-2px);
        }
        .job-card__header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 0.75rem;
          gap: 0.5rem;
          flex-wrap: wrap;
        }
        .job-card__id {
          font-family: monospace;
          font-size: 0.75rem;
          color: var(--color-primary);
          opacity: 0.8;
          font-weight: 600;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .job-card__title {
          font-size: 1rem;
          font-weight: 700;
          margin-bottom: 0.25rem;
          color: #fff;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .job-card__client {
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.5);
          margin-bottom: 1rem;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .job-card__meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 0.75rem;
          flex-wrap: wrap;
          margin-top: auto;
        }
        .job-card__meta-item {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.4);
          min-width: 0;
        }
        .job-card__meta-item span:not(.meta-icon) {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .meta-icon {
          flex-shrink: 0;
        }
        .risk-indicator {
          width: 100px;
          height: 18px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 100px;
          position: relative;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .risk-indicator span {
          position: relative;
          z-index: 1;
          font-size: 0.6rem;
          font-weight: 800;
          color: #fff;
          text-shadow: 0 1px 2px rgba(0,0,0,0.5);
        }
        .risk-bar {
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          opacity: 0.6;
        }
        .risk-indicator--high .risk-bar { background: var(--color-critical); }
        .risk-indicator--med .risk-bar { background: var(--color-warning); }
        .risk-indicator--low .risk-bar { background: var(--color-active); }
      `}</style>
    </section>
  );
}
