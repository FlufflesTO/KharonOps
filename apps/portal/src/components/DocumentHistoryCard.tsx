import React from "react";
import { statusTone } from "./JobListView";

interface DocumentHistoryCardProps {
  documents: Array<Record<string, unknown>>;
  selectedJobUid: string;
  onRefresh: () => void;
}

export function DocumentHistoryCard({
  documents,
  selectedJobUid: _selectedJobUid,
  onRefresh,
}: DocumentHistoryCardProps): React.JSX.Element {
  return (
    <article className="workspace-card">
      <div className="panel-heading panel-heading--inline">
        <div>
          <p className="panel-eyebrow">Documents</p>
          <h2>Document history</h2>
        </div>
        <button className="button button--ghost" onClick={onRefresh}>
          Refresh
        </button>
      </div>
      <div className="history-table">
        {(documents ?? []).length === 0 ? (
          <p className="muted-copy">No document history loaded for the current context.</p>
        ) : (
          (documents ?? []).map((document) => (
            <div key={String(document.document_uid)} className="history-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', gap: '1rem', alignItems: 'center' }}>
              <strong>{String(document.document_uid)}</strong>
              <span>{String(document.document_type)}</span>
              <span className={`status-chip status-chip--${statusTone(String(document.status))}`}>{String(document.status)}</span>
              <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>
                <div>Gen: {document.created_at ? new Date(String(document.created_at)).toLocaleString() : "n/a"}</div>
                <div>Pub: {document.published_at ? new Date(String(document.published_at)).toLocaleString() : "pending"}</div>
              </div>
              <span className="history-row__url" style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                {document.published_url ? <a href={String(document.published_url)} target="_blank" rel="noreferrer">View</a> : "n/a"}
              </span>
            </div>
          ))
        )}
      </div>
    </article>
  );
}
