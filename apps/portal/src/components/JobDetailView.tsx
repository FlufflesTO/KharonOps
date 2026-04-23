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
      label: "Job status",
      detail: selectedJob ? selectedJob.status : "Awaiting job selection"
    },
    {
      label: "Assigned technician",
      detail: selectedJob?.technician_name || selectedJob?.technician_id || "Pending assignment"
    }
  ];
  const timeline = [
    { id: "draft", label: "Requested" },
    { id: "approved", label: "Assigned" },
    { id: "performed", label: "Performed" },
    { id: "certified", label: "Certified" },
    { id: "paid", label: "Paid" }
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
    <div className="side-sheet">
      <div className="side-sheet__scroll">
        <div className="panel-heading panel-heading--inline">
          <div>
            <p className="panel-eyebrow">Selected Job</p>
            <h2 style={{ fontSize: '1.6rem' }}>{selectedJob.title}</h2>
          </div>
          <span className={`status-chip status-chip--${statusTone(selectedJob.status)}`}>
            {selectedJob.status}
          </span>
        </div>

        <div className="posture-grid">
          {postureItems.map((item) => (
            <div key={item.label} className="brief-pill">
              <span>{item.label}</span>
              <strong>{item.detail}</strong>
            </div>
          ))}
        </div>
        <div className="timeline-strip" aria-label="Job progress timeline">
          {timeline.map((step, index) => (
            <div key={step.id} className={`timeline-strip__item ${selectedJob.status === step.id ? "timeline-strip__item--active" : ""}`}>
              <span>{index + 1}</span>
              <small>{step.label}</small>
            </div>
          ))}
        </div>

        {selectedJob.last_note ? (
          <div className="highlight-box">
            <span className="highlight-box__label">Latest Note</span>
            <p style={{ margin: '0.5rem 0 0', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
              {selectedJob.last_note}
            </p>
          </div>
        ) : null}

        <details className="telemetry-card">
          <summary>Job Details</summary>
          <div className="telemetry-grid">
            <div className="telemetry-item">
              <label>Job ID</label>
              <code>{selectedJob.job_id}</code>
            </div>
            <div className="telemetry-item">
              <label>Version</label>
              <code>v{selectedJob.row_version}</code>
            </div>
            <div className="telemetry-item">
              <label>Client</label>
              <code>{selectedJob.client_name || selectedJob.client_id || "Not assigned"}</code>
            </div>
            <div className="telemetry-item">
              <label>Technician</label>
              <code>{selectedJob.technician_name || selectedJob.technician_id || "Unassigned"}</code>
            </div>
          </div>
        </details>

      {isFieldRole && (
        <div className="control-block">
          <div className="control-block__head">
            <h3>Update Job</h3>
          </div>

          <div className="control-stack">
            <label className="field-stack">
              <span>Set status</span>
              <div className="button-row">
                <select name="job_status_target" value={statusTarget} onChange={(event) => setStatusTarget(event.target.value as JobStatus)}>
                  {selectableStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
                <button className="button button--primary" onClick={onStatusUpdate} disabled={statusTarget === selectedJob.status}>
                  Update status
                </button>
                {statusTarget === selectedJob.status ? (
                  <small className="inline-note">Status is already set to {selectedJob.status}.</small>
                ) : null}
              </div>
            </label>

            <label className="field-stack">
              <span>Add note</span>
              <div className="button-row">
                <input
                  name="job_operator_note"
                  value={noteValue}
                  onChange={(event) => setNoteValue(event.target.value)}
                  placeholder="Add note to selected job"
                />
                <button className="button button--secondary" onClick={onNote} disabled={noteValue.trim().length === 0}>
                  Save
                </button>
                {noteValue.trim().length === 0 ? <small className="inline-note">Note cannot be empty.</small> : null}
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
            <h3>Documents</h3>
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
              Create document
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

      </div>
    </div>
  );
}
