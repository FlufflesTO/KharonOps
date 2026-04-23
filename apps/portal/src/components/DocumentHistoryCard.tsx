import React from "react";
import { statusTone } from "./JobListView";
import type { EscrowRecord } from "../apiClient";

interface DocumentHistoryCardProps {
  documents: Array<Record<string, unknown>>;
  selectedJobid: string;
  role: string;
  escrowByDocumentid: Record<string, EscrowRecord | undefined>;
  onRefresh: () => void;
  onPublish: (documentid: string, rowVersion: number, clientVisible: boolean) => void;
}

export function DocumentHistoryCard({
  documents,
  selectedJobid,
  role,
  escrowByDocumentid,
  onRefresh,
  onPublish,

}: DocumentHistoryCardProps): React.JSX.Element {
  const isInternal = role === "admin" || role === "dispatcher" || role === "finance" || role === "super_admin";

  return (
    <article className="workspace-card">
      <div className="panel-heading panel-heading--inline">
        <div>
          <p className="panel-eyebrow">Files</p>
          <h2>File History</h2>
        </div>
        <button className="button button--ghost" type="button" onClick={onRefresh}>
          Refresh
        </button>
      </div>
      <p className="muted-copy">
        {selectedJobid ? `Current job: ${selectedJobid}` : "No job selected yet."}
      </p>
      <div className="history-table">
        {(documents ?? []).length === 0 ? (
          <p className="muted-copy">No document history loaded for the current context.</p>
        ) : (
          (documents ?? []).map((document) => {
            const docid = String(document.document_id);
            const rowVersion = Number(document.row_version ?? 1);
            const status = String(document.status);
            const escrow = escrowByDocumentid[docid] ?? null;
            const escrowLocked = escrow?.status === "locked";

            return (
              <div key={docid} className="history-row">
                <div className="field-stack">
                  <span className="doc-id">{docid}</span>
                  <span className="doc-type-label">{String(document.document_type)}</span>
                </div>

                <span className={`status-chip status-chip--${statusTone(status)}`}>{status}</span>

                <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>
                  <div>Gen: {document.created_at ? new Date(String(document.created_at)).toLocaleDateString() : "n/a"}</div>
                  <div>Pub: {document.published_at ? new Date(String(document.published_at)).toLocaleDateString() : "pending"}</div>
                </div>

                <div className="history-row__actions">
                  {status === "generated" && isInternal && !escrowLocked && (
                    <div className="button-group">
                      <button
                        className="button button--secondary button--compact"
                        onClick={() => onPublish(docid, rowVersion, true)}
                        title="Publish and make visible to client"
                      >
                        Publish to Client
                      </button>
                    </div>
                  )}
                  {status === "generated" && isInternal && escrowLocked ? (
                    <span className="status-chip status-chip--warning" style={{ fontSize: '0.65rem' }}>Escrow Locked</span>
                  ) : null}
                  {status === "published" && (
                    <span className="history-row__url">
                      {document.published_url ? (
                        <a href={String(document.published_url)} target="_blank" rel="noreferrer" className="button button--ghost button--compact">
                          View PDF
                        </a>
                      ) : (
                        "Synced"
                      )}
                    </span>
                  )}
                </div>

                <div className="visibility-badge">
                  {document.client_visible ? (
                    <span className="status-chip status-chip--active" style={{ fontSize: '0.65rem' }}>Client Visible</span>
                  ) : escrowLocked ? (
                    <span className="status-chip status-chip--warning" style={{ fontSize: '0.65rem' }}>Escrow Hold</span>
                  ) : status === "published" ? (
                    <span className="status-chip status-chip--warning" style={{ fontSize: '0.65rem' }}>Internal Only</span>
                  ) : null}
                </div>

              </div>
            );
          })
        )}
      </div>
    </article>
  );
}

