import React from "react";
import type { Role, JobStatus } from "@kharon/domain";
import { type JobRecord, statusTone } from "./JobListView";
import { CertificationForm } from "./CertificationForm";

interface JobDetailViewProps {
  selectedJob: JobRecord | null;
  role: Role;
  selectableStatuses: JobStatus[];
  statusTarget: JobStatus;
  setStatusTarget: (status: JobStatus) => void;
  noteValue: string;
  setNoteValue: (note: string) => void;
  onStatusUpdate: () => void;
  onNote: () => void;
  preferredStart: string;
  setPreferredStart: (value: string) => void;
  preferredEnd: string;
  setPreferredEnd: (value: string) => void;
  onScheduleRequest: () => void;
  documentType: "jobcard" | "service_report" | "certificate";
  setDocumentType: (type: "jobcard" | "service_report" | "certificate") => void;
  onDocumentGenerate: () => void;
  canGenerateDocuments: boolean;
  documentGenerateDisabledReason?: string;
  onChecklistChange: (data: Record<string, string>) => void;
  selectedJobTitle: string;
}


export function JobDetailView({
  selectedJob,
  role,
  selectableStatuses,
  statusTarget,
  setStatusTarget,
  noteValue,
  setNoteValue,
  onStatusUpdate,
  onNote,
  preferredStart,
  setPreferredStart,
  preferredEnd,
  setPreferredEnd,
  onScheduleRequest,
  documentType,
  setDocumentType,
  onDocumentGenerate,
  canGenerateDocuments,
  documentGenerateDisabledReason,
  onChecklistChange,
  selectedJobTitle
}: JobDetailViewProps): React.JSX.Element {
  const isFieldRole = role === "technician" || role === "dispatcher" || role === "admin" || role === "super_admin";

  const postureItems = [
    {
      label: "Service posture",
      detail: selectedJob ? selectedJob.status : "Awaiting job selection"
    },
    {
      label: "Lead technician",
      detail: selectedJob?.technician_uid || "Pending assignment"
    }
  ];

  if (!selectedJob) {
    return (
      <article className="workspace-card workspace-card--primary">
        <div className="panel-heading">
          <p className="panel-eyebrow">Selected job</p>
          <h2>{selectedJobTitle}</h2>
        </div>
        <p className="muted-copy">Select a job from the sidebar to expose role-specific controls.</p>
      </article>
    );
  }

  return (
    <article className="workspace-card workspace-card--primary">
      <div className="panel-heading panel-heading--inline">
        <div>
          <p className="panel-eyebrow">Selected job</p>
          <h2>{selectedJob.title}</h2>
        </div>
        <span className={`status-chip status-chip--${statusTone(selectedJob.status)}`}>{selectedJob.status}</span>
      </div>

      <div className="posture-grid">
        {postureItems.map((item) => (
          <div key={item.label}>
            <span>{item.label}</span>
            <strong>{item.detail}</strong>
          </div>
        ))}
      </div>

      {selectedJob.last_note ? (
        <div className="highlight-box">
          <span className="highlight-box__label">Latest note</span>
          <p>{selectedJob.last_note}</p>
        </div>
      ) : null}

      <details className="support-details">
        <summary>Technical metadata</summary>
        <dl className="detail-grid" style={{ marginTop: 'var(--space-3)' }}>
          <div>
            <dt>Job UID</dt>
            <dd>{selectedJob.job_uid}</dd>
          </div>
          <div>
            <dt>Row version</dt>
            <dd>{selectedJob.row_version}</dd>
          </div>
          <div>
            <dt>Client UID</dt>
            <dd>{selectedJob.client_uid || "n/a"}</dd>
          </div>
          <div>
            <dt>Technician UID</dt>
            <dd>{selectedJob.technician_uid || "n/a"}</dd>
          </div>
        </dl>
      </details>

      {isFieldRole && (
        <div className="control-block">
          <div className="control-block__head">
            <h3>Field controls</h3>
          </div>

          <div className="control-stack">
            <label className="field-stack">
              <span>Status transition</span>
              <div className="button-row">
                <select name="job_status_target" value={statusTarget} onChange={(event) => setStatusTarget(event.target.value as JobStatus)}>
                  {selectableStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
                <button className="button button--primary" onClick={onStatusUpdate}>
                  Apply
                </button>
              </div>
            </label>

            <label className="field-stack">
              <span>Operator note</span>
              <div className="button-row">
                <input
                  name="job_operator_note"
                  value={noteValue}
                  onChange={(event) => setNoteValue(event.target.value)}
                  placeholder="Add note to selected job"
                />
                <button className="button button--secondary" onClick={onNote}>
                  Save note
                </button>
              </div>
            </label>
          </div>
        </div>
      )}

      {role === "client" && (
        <div className="control-block">
          <div className="control-block__head">
            <h3>Preferred slot request</h3>
          </div>
          <div className="form-grid form-grid--three">
            <label className="field-stack">
              <span>Preferred start</span>
              <input
                name="preferred_start"
                type="datetime-local"
                value={preferredStart}
                onChange={(event) => setPreferredStart(event.target.value)}
              />
            </label>
            <label className="field-stack">
              <span>Preferred end</span>
              <input
                name="preferred_end"
                type="datetime-local"
                value={preferredEnd}
                onChange={(event) => setPreferredEnd(event.target.value)}
              />
            </label>
            <div className="field-stack field-stack--action">
              <span>&nbsp;</span>
              <button className="button button--primary" onClick={onScheduleRequest}>
                Submit request
              </button>
            </div>
          </div>
        </div>
      )}

      {isFieldRole && (
        <div className="control-block">
          <div className="control-block__head">
            <h3>Controlled documents</h3>
          </div>
          <div className="button-row">
            <select
              name="document_type"
              value={documentType}
              onChange={(event) => setDocumentType(event.target.value as "jobcard" | "service_report" | "certificate")}
            >
              <option value="jobcard">Jobcard</option>
              <option value="service_report">Service report</option>
              <option value="certificate">Certificate</option>
            </select>
            <button className="button button--secondary" onClick={onDocumentGenerate} disabled={!canGenerateDocuments}>
              Generate
            </button>
          </div>

          {!canGenerateDocuments ? (
            <p className="inline-note">
              {documentGenerateDisabledReason ?? "Document generation is not available for this account."}
            </p>
          ) : null}

          {(documentType === "service_report" || documentType === "certificate") && (
            <CertificationForm jobTitle={selectedJob.title} onChange={onChecklistChange} />
          )}
        </div>
      )}

    </article>
  );
}
