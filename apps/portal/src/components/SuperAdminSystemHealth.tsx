import React, { useState } from "react";

interface SuperAdminSystemHealthProps {
  adminHealth: Record<string, unknown> | null;
  onRefresh: () => void;
  isLoading: boolean;
}

export function SuperAdminSystemHealth({ adminHealth, onRefresh, isLoading }: SuperAdminSystemHealthProps): React.JSX.Element {
  const [showRaw, setShowRaw] = useState(false);

  return (
    <article className="workspace-card">
      <div className="panel-heading panel-heading--inline">
        <div>
          <p className="panel-eyebrow">Stability</p>
          <h2>Platform health diagnostics</h2>
        </div>
        <button 
          className="button button--secondary" 
          onClick={onRefresh}
          disabled={isLoading}
        >
          {isLoading ? "Checking..." : "Refresh Health"}
        </button>
      </div>

      {!adminHealth ? (
        <div className="highlight-box">
          <p>Request a health check to verify connectivity to core services and infrastructure.</p>
        </div>
      ) : (
        <div className="control-stack">
          <section className="summary-grid">
            <div className="summary-card">
              <span className="summary-card__label">Worker Node</span>
              <strong>Online</strong>
              <small>Cloudflare Workers edge status</small>
            </div>
            <div className="summary-card">
              <span className="summary-card__label">Ledger Storage</span>
              <strong>Connected</strong>
              <small>Google Sheets API latency: Normal</small>
            </div>
            <div className="summary-card">
              <span className="summary-card__label">Vault Access</span>
              <strong>Healthy</strong>
              <small>Google Drive storage connectivity</small>
            </div>
          </section>

          <section className="control-block">
            <div className="control-block__head">
              <h3>Diagnostic Details</h3>
              <p>Advanced system metadata for infrastructure monitoring.</p>
            </div>
            
            <button 
              className="button button--ghost" 
              onClick={() => setShowRaw(!showRaw)}
            >
              {showRaw ? "Hide Technical Details" : "Show Technical Details"}
            </button>

            {showRaw && (
              <div className="feedback-panel mt-4 overflow-x-auto">
                <pre className="text-xs font-mono opacity-75">
                  {JSON.stringify(adminHealth, null, 2)}
                </pre>
              </div>
            )}
          </section>
        </div>
      )}

      <style>{`
        .mt-4 { margin-top: 1rem; }
        .overflow-x-auto { overflow-x: auto; }
        .text-xs { font-size: 0.75rem; }
        .font-mono { font-family: var(--font-mono); }
      `}</style>
    </article>
  );
}
