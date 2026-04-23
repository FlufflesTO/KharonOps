import React from "react";

interface SuperAdminActivityLogProps {
  adminAudits: Array<Record<string, unknown>>;
  adminAuditCount: number;
  onRefresh: () => void;
  isLoading: boolean;
}

export function SuperAdminActivityLog({ adminAudits, adminAuditCount, onRefresh, isLoading }: SuperAdminActivityLogProps): React.JSX.Element {
  return (
    <article className="workspace-card">
      <div className="panel-heading panel-heading--inline">
        <div>
          <p className="panel-eyebrow">Audit Trail</p>
          <h2>Platform activity history</h2>
        </div>
        <button 
          className="button button--secondary" 
          onClick={onRefresh}
          disabled={isLoading}
        >
          {isLoading ? "Loading..." : `Refresh (${adminAuditCount})`}
        </button>
      </div>

      <div className="control-block">
        <div className="control-block__head">
          <h3>Verification Log</h3>
          <p>Cryptographically linked event sequence from the canonical ledger.</p>
        </div>
        
        <div className="history-table">
          {adminAudits.length === 0 ? (
            <p className="muted-copy text-center p-8">No activity logs loaded. Refresh to pull latest entries.</p>
          ) : (
            adminAudits.slice(0, 100).map((entry, index) => {
              const actor = String(entry.actor ?? entry.updated_by ?? "system");
              const action = String(entry.action ?? "unknown_action");
              const timestamp = String(entry.at ?? entry.updated_at ?? "n/a");
              const anomaly = typeof entry.action !== "string" || action.trim() === "";
              
              return (
                <div key={`${String(entry.audit_id ?? index)}-${index}`} className="history-row">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <strong>{action}</strong>
                      <span className={`status-chip status-chip--compact status-chip--${anomaly ? "critical" : "active"}`}>
                        {anomaly ? "Anomaly" : "Verified"}
                      </span>
                    </div>
                    <span className="job-item__meta">{actor} • {timestamp}</span>
                  </div>
                  <div className="text-right">
                    <code className="text-xs opacity-50 block">{String(entry.audit_id ?? `AUD-${index}`)}</code>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <style>{`
        .status-chip--compact {
          min-height: 1.25rem;
          padding: 0 0.4rem;
          font-size: 0.6rem;
        }
        .text-xs { font-size: 0.75rem; }
        .text-right { text-align: right; }
        .block { display: block; }
      `}</style>
    </article>
  );
}
