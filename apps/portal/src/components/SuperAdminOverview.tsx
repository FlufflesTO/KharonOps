import React from "react";
import type { OpsIntelligencePayload } from "../apiClient";

interface SuperAdminOverviewProps {
  opsIntelligence: OpsIntelligencePayload | null;
  onRefresh: () => void;
  isLoading: boolean;
}

export function SuperAdminOverview({ opsIntelligence, onRefresh, isLoading }: SuperAdminOverviewProps): React.JSX.Element {
  return (
    <article className="workspace-card glass-panel">
      <div className="panel-heading panel-heading--inline">
        <div>
          <p className="panel-eyebrow">Platform health</p>
          <h2>Latest checks</h2>
        </div>
        <button 
          className={`button button--secondary ${isLoading ? "button--loading" : ""}`} 
          onClick={onRefresh}
          disabled={isLoading}
        >
          {isLoading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {!opsIntelligence ? (
        <div className="highlight-box empty-state-enhanced mt-4">
          <div className="loader-spinner mb-4 inline-block"></div>
          <h3>Gathering Telemetry</h3>
          <p className="muted-copy mt-2">No summary loaded. Click refresh to pull the latest checks.</p>
        </div>
      ) : (
        <div className="admin-grid">
          <section className="summary-grid mt-4">
            <div className="summary-card hover-scale">
              <span className="summary-card__label">Jobs needing review</span>
              <strong className="text-4xl text-white">{opsIntelligence.jobs.open}</strong>
              <small className="text-muted block mt-2">Open jobs awaiting action</small>
            </div>
            <div className="summary-card hover-scale">
              <span className="summary-card__label">Priority jobs</span>
              <strong className={`text-4xl ${opsIntelligence.jobs.critical > 0 ? "text-critical" : "text-white"}`}>
                {opsIntelligence.jobs.critical}
              </strong>
              <small className="text-muted block mt-2">Critical priority jobs</small>
            </div>
            <div className="summary-card hover-scale">
              <span className="summary-card__label">Older than 24h</span>
              <strong className={`text-4xl ${opsIntelligence.jobs.stale_over_24h > 0 ? "text-warning" : "text-white"}`}>
                {opsIntelligence.jobs.stale_over_24h}
              </strong>
              <small className="text-muted block mt-2">No updates in 24 hours</small>
            </div>
            <div className="summary-card hover-scale">
              <span className="summary-card__label">Pending files</span>
              <strong className="text-4xl text-white">{opsIntelligence.operations.documents_pending_publish}</strong>
              <small className="text-muted block mt-2">Generated but not published</small>
            </div>
          </section>

          <section className="control-block mt-8">
            <div className="control-block__head">
              <h3>Money owed</h3>
              <p>Outstanding balances and held files across the business.</p>
            </div>
            <div className="posture-grid mt-4">
              <div className="glass-panel-subtle flex flex-col justify-center items-center py-6 hover-scale">
                <span className="text-sm text-muted uppercase tracking-wider mb-2">Outstanding</span>
                <strong className="text-3xl text-white">R {opsIntelligence.finance.outstanding_amount.toLocaleString()}</strong>
              </div>
              <div className="glass-panel-subtle flex flex-col justify-center items-center py-6 hover-scale">
                <span className="text-sm text-muted uppercase tracking-wider mb-2">Escrow Locked</span>
                <strong className="text-3xl text-white">{opsIntelligence.operations.escrow_locked} items</strong>
              </div>
            </div>
          </section>
          
          <section className="control-block mt-8">
            <div className="control-block__head">
              <h3>Review items</h3>
              <p>Top priorities for follow-up.</p>
            </div>
            <div className="fact-list mt-4 flex flex-col gap-4">
              {opsIntelligence.jobs.critical > 0 && (
                <div className="highlight-box border-critical glass-panel-subtle flex flex-col items-start gap-3">
                  <span className="status-chip status-chip--critical animate-pulse">Critical jobs</span>
                  <p className="text-white">{opsIntelligence.jobs.critical} jobs are marked critical. Review the jobs list for details.</p>
                </div>
              )}
              {opsIntelligence.operations.documents_pending_publish > 10 && (
                <div className="highlight-box border-warning glass-panel-subtle flex flex-col items-start gap-3">
                  <span className="status-chip status-chip--warning">File queue</span>
                  <p className="text-white">A high volume of files is waiting to be published.</p>
                </div>
              )}
              {opsIntelligence.jobs.critical === 0 && opsIntelligence.operations.documents_pending_publish <= 10 && (
                <div className="highlight-box glass-panel-subtle text-center py-6">
                  <span className="text-2xl block mb-2">✅</span>
                  <p className="text-white font-medium">Platform is operating within normal parameters. No urgent actions detected.</p>
                </div>
              )}
            </div>
          </section>
        </div>
      )}

      <style>{`
        .admin-grid { display: grid; gap: 2rem; margin-top: 1.5rem; }
        .text-critical { color: var(--color-critical); }
        .text-warning { color: var(--color-warning); }
        .text-white { color: white; }
        .text-muted { color: var(--color-text-muted); }
        .text-sm { font-size: 0.875rem; }
        .text-2xl { font-size: 1.5rem; }
        .text-3xl { font-size: 1.875rem; font-weight: 700; }
        .text-4xl { font-size: 2.25rem; font-weight: 700; line-height: 1; }
        .font-medium { font-weight: 500; }
        .uppercase { text-transform: uppercase; }
        .tracking-wider { letter-spacing: 0.05em; }
        .border-warning { border-left: 4px solid var(--color-warning); }
        .border-critical { border-left: 4px solid var(--color-critical); }
        .glass-panel-subtle { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); border-radius: var(--radius-lg); padding: 1.5rem; transition: all 0.2s; }
        .hover-scale { cursor: pointer; transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s; }
        .hover-scale:hover { transform: translateY(-4px); box-shadow: 0 10px 25px -5px rgba(0,0,0,0.5); border-color: rgba(99, 102, 241, 0.3); background: rgba(99, 102, 241, 0.05); }
        .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; }
        .posture-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; }
        .loader-spinner { width: 24px; height: 24px; border: 3px solid rgba(255,255,255,0.1); border-top-color: var(--color-primary); border-radius: 50%; animation: spin 1s linear infinite; }
        .animate-pulse { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
        .button--loading { opacity: 0.8; cursor: wait; }
        
        .flex { display: flex; }
        .flex-col { flex-direction: column; }
        .items-start { align-items: flex-start; }
        .items-center { align-items: center; }
        .justify-center { justify-content: center; }
        .text-center { text-align: center; }
        .block { display: block; }
        .inline-block { display: inline-block; }
        
        .mt-2 { margin-top: 0.5rem; }
        .mt-4 { margin-top: 1rem; }
        .mt-8 { margin-top: 2rem; }
        .mb-2 { margin-bottom: 0.5rem; }
        .mb-4 { margin-bottom: 1rem; }
        .py-6 { padding-top: 1.5rem; padding-bottom: 1.5rem; }
        .gap-3 { gap: 0.75rem; }
        .gap-4 { gap: 1rem; }
        
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .5; } }
      `}</style>
    </article>
  );
}
