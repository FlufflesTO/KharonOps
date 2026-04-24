import React, { useState } from "react";
import type { JobDocumentRow } from "@kharon/domain";

interface DispatchPublisherCardProps {
  selectedJobid: string;
  documents: JobDocumentRow[];
  selectedDocumentid: string;
  setSelectedDocumentid: (id: string) => void;
  onDocumentPublish: () => void;
}

export function DispatchPublisherCard({
  selectedJobid,
  documents,
  selectedDocumentid,
  setSelectedDocumentid,
  onDocumentPublish
}: DispatchPublisherCardProps): React.JSX.Element {
  const [isPublishing, setIsPublishing] = useState(false);
  const disableActions = selectedJobid === "";
  const selectedDocument = documents.find((d) => d.document_id === selectedDocumentid) ?? null;

  return (
    <article className="workspace-card glass-panel">
      <div className="panel-heading">
        <p className="panel-eyebrow">Publisher</p>
        <h2>Release Documents</h2>
      </div>

      <div className="control-block interaction-panel">
        <div className="control-block__head">
          <h3>Go Live</h3>
          <p>Publish a generated file for this job to make it available to clients.</p>
        </div>

        {disableActions ? (
          <div className="highlight-box">
            <p>Please select a job from the list to manage its documents.</p>
          </div>
        ) : documents.length === 0 ? (
          <div className="highlight-box empty-state-enhanced mt-4">
            <span className="empty-state__icon">📄</span>
            <h3>No Documents</h3>
            <p className="muted-copy mt-2">Generate a document from the job detail view before publishing it here.</p>
          </div>
        ) : (
          <div className="form-grid mt-4">
            <label className="field-stack">
              <span>Document</span>
              <div className="combo-input">
                <select value={selectedDocumentid} onChange={(e) => setSelectedDocumentid(e.target.value)} className="enhanced-select">
                  <option value="">Select a document...</option>
                  {documents.map((document) => (
                    <option key={document.document_id} value={document.document_id}>{document.document_id} | {document.document_type}</option>
                  ))}
                </select>
              </div>
            </label>

            <div className="field-stack">
              <span>Current Status</span>
              <div className="info-readout flex items-center gap-2">
                {selectedDocument ? (
                  <>
                    <span className={`status-chip status-chip--${selectedDocument.status === "published" ? "active" : "neutral"}`}>
                      {selectedDocument.status}
                    </span>
                    <span>{selectedDocument.document_type}</span>
                  </>
                ) : (
                  "No selection"
                )}
              </div>
            </div>

            <div className="field-stack field-stack--full flex justify-end mt-4">
                <button 
                  className={`button button--large ${isPublishing ? "button--loading" : "button--primary"}`} 
                  type="button" 
                  onClick={() => {
                    setIsPublishing(true);
                    setTimeout(() => {
                      onDocumentPublish();
                      setIsPublishing(false);
                    }, 600);
                  }} 
                  disabled={!selectedDocumentid || selectedDocument?.status === "published"}
                >
                  {isPublishing ? "Publishing..." : selectedDocument?.status === "published" ? "Already Published" : "Publish Now"}
                </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .interaction-panel { background: rgba(255,255,255,0.02); padding: var(--space-6); border-radius: var(--radius-lg); border: 1px solid rgba(255,255,255,0.05); }
        .enhanced-select { width: 100%; padding: 0.875rem 1rem; background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.15); border-radius: var(--radius-md); color: white; font-size: 0.95rem; transition: border-color 0.2s; }
        .enhanced-select:focus { outline: none; border-color: var(--color-primary); box-shadow: 0 0 0 3px rgba(99,102,241,0.2); }
        .info-readout { padding: 0.875rem 1rem; background: rgba(99,102,241,0.05); border-left: 3px solid var(--color-primary); border-radius: 0 var(--radius-md) var(--radius-md) 0; color: #cbd5e1; font-size: 0.9rem; min-height: 48px; }
        .button--large { padding: 1rem 2.5rem; font-size: 1.1rem; font-weight: 600; }
        .button--loading { opacity: 0.8; cursor: wait; }
        .mt-4 { margin-top: 1rem; }
        .mt-2 { margin-top: 0.5rem; }
        .flex { display: flex; }
        .items-center { align-items: center; }
        .gap-2 { gap: 0.5rem; }
        .justify-end { justify-content: flex-end; }
      `}</style>
    </article>
  );
}