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
      <div className="document-history-list">
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
              <article key={docid} className="document-history-item">
                <div className="document-history-item__head">
                  <div className="field-stack">
                    <span className="doc-id">{docid}</span>
                    <span className="doc-type-label">{String(document.document_type)}</span>
                  </div>

                  <span className={`status-chip status-chip--${statusTone(status)}`}>{status}</span>
                </div>

                <div className="document-history-item__meta">
                  <div>
                    <span>Generated</span>
                    <strong>{document.created_at ? new Date(String(document.created_at)).toLocaleDateString() : "n/a"}</strong>
                  </div>
                  <div>
                    <span>Published</span>
                    <strong>{document.published_at ? new Date(String(document.published_at)).toLocaleDateString() : "pending"}</strong>
                  </div>
                </div>

                <div className="document-history-item__actions">
                  {status === "generated" && isInternal && !escrowLocked && (
                    <button
                      className="button button--secondary button--compact"
                      onClick={() => onPublish(docid, rowVersion, true)}
                      title="Publish and make visible to client"
                    >
                      Publish to Client
                    </button>
                  )}
                  {status === "generated" && isInternal && escrowLocked ? (
                    <span className="status-chip status-chip--warning">Escrow Locked</span>
                  ) : null}
                  {status === "published" && (
                    <span className="document-history-item__url">
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

                <div className="document-history-item__badge">
                  {document.client_visible ? (
                    <span className="status-chip status-chip--active">Client Visible</span>
                  ) : escrowLocked ? (
                    <span className="status-chip status-chip--warning">Escrow Hold</span>
                  ) : status === "published" ? (
                    <span className="status-chip status-chip--warning">Internal Only</span>
                  ) : null}
                </div>
              </article>
            );
          })
        )}
      </div>
      <style>{`
        .document-history-list {
          display: grid;
          gap: 0.75rem;
          max-height: 460px;
          overflow-y: auto;
          padding-right: 0.25rem;
        }
        .document-history-item {
          display: grid;
          gap: 0.75rem;
          padding: 0.9rem;
          border: 1px solid var(--color-border);
          border-radius: 0.9rem;
          background: rgba(12, 20, 35, 0.8);
        }
        .document-history-item__head {
          display: flex;
          justify-content: space-between;
          gap: 0.75rem;
          align-items: flex-start;
        }
        .document-history-item__meta {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 0.75rem;
          color: var(--color-text-muted);
          font-size: 0.78rem;
        }
        .document-history-item__meta strong {
          display: block;
          margin-top: 0.2rem;
          color: var(--color-text);
          font-size: 0.88rem;
        }
        .document-history-item__actions {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          align-items: center;
        }
        .document-history-item__url {
          overflow-wrap: anywhere;
        }
        .document-history-item__badge {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          align-items: center;
        }
        @media (max-width: 768px) {
          .document-history-item__meta {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </article>
  );
}

