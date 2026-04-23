/**
 * Project KharonOps - Job Detail View (Refactored)
 * Purpose: Mission-critical command side-sheet with high spatial quality.
 */

import React from "react";
import type { Role, JobStatus, JobEventRow, DocumentType } from "@kharon/domain";
import { type JobRecord, statusTone } from "./JobListView";
import { CertificationForm } from "./CertificationForm";
import { ForensicTimeline } from "./ForensicTimeline";

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
  documentCountForJob: number;
  geoVerification: {
    status: "idle" | "verified" | "warning" | "error";
    capturedAt: string;
    distanceMeters: number | null;
    accuracyMeters: number | null;
    message: string;
    latitude: number | null;
    longitude: number | null;
  };
  onVerifyLocation: () => void;
  syncPulseText: string;
  events: JobEventRow[];
}

export function JobDetailView(props: JobDetailViewProps): React.JSX.Element {
  const { selectedJob, role, selectableStatuses, statusTarget, setStatusTarget, noteValue, setNoteValue, onStatusUpdate, onNote, events } = props;

  if (!selectedJob) {
    return (
      <div className="detail-empty-state glass-panel">
        <div className="empty-icon">📂</div>
        <h3>Select Engagement</h3>
        <p>Choose an operational record from the left to access controls and forensic history.</p>
      </div>
    );
  }

  return (
    <div className="side-sheet glass-panel">
      <div className="side-sheet__content">
        
        {/* Header Section */}
        <header className="detail-header">
          <div className="title-block">
            <span className="eyebrow">RECORD: {selectedJob.job_id}</span>
            <h1 className="truncate">{selectedJob.title}</h1>
          </div>
          <div className={`status-badge status-badge--${statusTone(selectedJob.status)}`}>
            {selectedJob.status}
          </div>
        </header>

        {/* Telemetry Grid */}
        <section className="detail-section">
          <div className="telemetry-grid">
            <div className="telemetry-cell">
              <label>Client Reference</label>
              <div className="val truncate">{selectedJob.client_name || "N/A"}</div>
            </div>
            <div className="telemetry-cell">
              <label>Assigned Resource</label>
              <div className="val truncate">{selectedJob.technician_name || "Unassigned"}</div>
            </div>
            <div className="telemetry-cell">
              <label>System Version</label>
              <div className="val mono">v{selectedJob.row_version}</div>
            </div>
            <div className="telemetry-cell">
              <label>Last Updated</label>
              <div className="val">{new Date(selectedJob.updated_at || "").toLocaleDateString()}</div>
            </div>
          </div>
        </section>

        {/* Primary Controls */}
        <section className="detail-section command-center">
          <div className="control-group">
            <label className="eyebrow">GOVERNANCE UPDATE</label>
            <div className="input-stack">
              <div className="combo-input">
                <select value={statusTarget} onChange={(e) => setStatusTarget(e.target.value as JobStatus)}>
                  {selectableStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <button 
                  className="btn-primary" 
                  onClick={onStatusUpdate}
                  disabled={statusTarget === selectedJob.status}
                >
                  Confirm Transition
                </button>
              </div>
            </div>
          </div>

          <div className="control-group">
            <label className="eyebrow">APPEND COMMENTARY</label>
            <div className="note-input-wrapper">
              <textarea 
                placeholder="Type forensic note..."
                value={noteValue}
                onChange={(e) => setNoteValue(e.target.value)}
              />
              <button 
                className="btn-secondary" 
                onClick={onNote}
                disabled={!noteValue.trim()}
              >
                Commit Note
              </button>
            </div>
          </div>
        </section>

        {/* Document Generation */}
        <section className="detail-section">
          <div className="control-group">
            <label className="eyebrow">COMPLIANCE & EVIDENCE GENERATION</label>
            <div className="combo-input">
              <select value={props.documentType} onChange={(e) => props.setDocumentType(e.target.value as DocumentType)}>
                <option value="jobcard">Internal Jobcard</option>
                <option value="service_report">SANS Service Report</option>
                <option value="certificate">Certificate of Compliance</option>
              </select>
              <button 
                className="btn-primary" 
                onClick={props.onDocumentGenerate}
                disabled={!props.canGenerateDocuments}
                title={props.documentGenerateDisabledReason || "Generate PDF"}
              >
                Generate & Publish
              </button>
            </div>
            {props.documentGenerateDisabledReason && (
              <p style={{ color: 'var(--color-warning)', fontSize: '0.75rem', marginTop: '0.5rem' }}>
                {props.documentGenerateDisabledReason}
              </p>
            )}
          </div>
        </section>

        {/* Forensic Feed */}
        <section className="detail-section">
          <ForensicTimeline events={events} jobId={selectedJob.job_id} />
        </section>

      </div>

      <style>{`
        .side-sheet {
          height: 100%;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          border-radius: 16px;
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.05);
        }
        .side-sheet__content {
          flex: 1;
          overflow-y: auto;
          padding: 2rem;
          max-width: 1000px;
          margin: 0 auto;
          width: 100%;
        }
        .detail-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 2.5rem;
          gap: 2rem;
        }
        .title-block h1 {
          font-size: 1.75rem;
          font-weight: 800;
          color: #fff;
          margin-top: 0.5rem;
        }
        .status-badge {
          padding: 0.5rem 1rem;
          border-radius: 6px;
          font-size: 0.75rem;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .status-badge--active { background: rgba(34, 197, 94, 0.1); color: #4ade80; border: 1px solid rgba(74, 222, 128, 0.2); }
        .status-badge--warning { background: rgba(234, 179, 8, 0.1); color: #facc15; border: 1px solid rgba(250, 204, 21, 0.2); }
        
        .telemetry-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.5rem;
          background: rgba(255, 255, 255, 0.02);
          padding: 1.5rem;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }
        @media (min-width: 1024px) {
          .telemetry-grid { grid-template-columns: repeat(4, 1fr); }
        }
        .telemetry-cell label {
          font-size: 0.6rem;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.4);
          text-transform: uppercase;
          display: block;
          margin-bottom: 0.5rem;
        }
        .telemetry-cell .val {
          font-size: 0.9rem;
          font-weight: 600;
          color: #fff;
        }
        .mono { font-family: monospace; }
        
        .detail-section { margin-bottom: 3rem; }
        
        .command-center {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }
        .combo-input {
          display: flex;
          gap: 0.5rem;
        }
        .combo-input select {
          flex: 1;
          background: rgba(0,0,0,0.3);
          border: 1px solid rgba(255,255,255,0.1);
          color: #fff;
          padding: 0.75rem;
          border-radius: 8px;
        }
        .btn-primary {
          background: var(--color-primary);
          color: #fff;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          font-weight: 700;
          cursor: pointer;
        }
        .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
        
        .note-input-wrapper textarea {
          width: 100%;
          min-height: 100px;
          background: rgba(0,0,0,0.3);
          border: 1px solid rgba(255,255,255,0.1);
          color: #fff;
          padding: 1rem;
          border-radius: 8px;
          margin-bottom: 0.75rem;
          resize: vertical;
        }
        .btn-secondary {
          background: rgba(255, 255, 255, 0.1);
          color: #fff;
          border: 1px solid rgba(255,255,255,0.1);
          padding: 0.6rem 1.25rem;
          border-radius: 8px;
          font-weight: 600;
        }
        
        .detail-empty-state {
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 4rem;
        }
        .empty-icon { font-size: 3rem; margin-bottom: 1.5rem; opacity: 0.3; }
      `}</style>
    </div>
  );
}