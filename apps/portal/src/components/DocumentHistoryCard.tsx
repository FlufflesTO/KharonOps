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
            <div key={String(document.document_uid)} className="history-row">
              <strong>{String(document.document_uid)}</strong>
              <span>{String(document.document_type)}</span>
              <span className={`status-chip status-chip--${statusTone(String(document.status))}`}>{String(document.status)}</span>
              <span className="history-row__url">{String(document.published_url || "not published")}</span>
            </div>
          ))
        )}
      </div>
    </article>
  );
}
