import React from "react";
import type { OpsIntelligencePayload } from "../apiClient";

interface SuperAdminOverviewProps {
  opsIntelligence: OpsIntelligencePayload | null;
  onRefresh: () => void;
  isLoading: boolean;
}

export function SuperAdminOverview({ opsIntelligence, onRefresh, isLoading }: SuperAdminOverviewProps): React.JSX.Element {
  return (
    <article className="workspace-card">
      <div className="panel-heading panel-heading--inline">
        <div>
          <p className="panel-eyebrow">Platform Overview</p>
          <h2>System health and performance</h2>
        </div>
        <button 
          className="button button--secondary" 
          onClick={onRefresh}
          disabled={isLoading}
        >
          {isLoading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {!opsIntelligence ? (
        <div className="highlight-box">
          <p>No operational data loaded. Click refresh to pull the latest platform diagnostics.</p>
        </div>
      ) : (
        <div className="admin-grid">
          <section className="summary-grid">
            <div className="summary-card">
              <span className="summary-card__label">Active Work</span>
              <strong>{opsIntelligence.jobs.open}</strong>
              <small>Open jobs in the ledger</small>
            </div>
            <div className="summary-card">
              <span className="summary-card__label">Action Required</span>
              <strong className={opsIntelligence.jobs.critical > 0 ? "text-critical" : ""}>
                {opsIntelligence.jobs.critical}
              </strong>
              <small>Critical priority jobs</small>
            </div>
            <div className="summary-card">
              <span className="summary-card__label">Stale Jobs</span>
              <strong className={opsIntelligence.jobs.stale_over_24h > 0 ? "text-warning" : ""}>
                {opsIntelligence.jobs.stale_over_24h}
              </strong>
              <small>No updates in 24 hours</small>
            </div>
            <div className="summary-card">
              <span className="summary-card__label">Pending Files</span>
              <strong>{opsIntelligence.operations.documents_pending_publish}</strong>
              <small>Generated but not published</small>
            </div>
          </section>

          <section className="control-block">
            <div className="control-block__head">
              <h3>Financial Posture</h3>
              <p>Outstanding balances and escrow status across all business units.</p>
            </div>
            <div className="posture-grid">
              <div>
                <span>Outstanding</span>
                <strong>R {opsIntelligence.finance.outstanding_amount.toLocaleString()}</strong>
              </div>
              <div>
                <span>Escrow Locked</span>
                <strong>{opsIntelligence.operations.escrow_locked} items</strong>
              </div>
            </div>
          </section>
          
          <section className="control-block">
            <div className="control-block__head">
              <h3>Next Actions</h3>
              <p>Top priorities for platform maintenance.</p>
            </div>
            <div className="fact-list">
              {opsIntelligence.jobs.critical > 0 && (
                <div className="highlight-box">
                  <span className="highlight-box__label">Critical Issue</span>
                  <p>{opsIntelligence.jobs.critical} jobs are marked critical. Review the jobs ledger for details.</p>
                </div>
              )}
              {opsIntelligence.operations.documents_pending_publish > 10 && (
                <div className="highlight-box">
                  <span className="highlight-box__label">Document Queue</span>
                  <p>A high volume of documents is waiting to be published. Check automations health.</p>
                </div>
              )}
              {opsIntelligence.jobs.critical === 0 && opsIntelligence.operations.documents_pending_publish <= 10 && (
                <p className="muted-copy">Platform is operating within normal parameters. No urgent actions detected.</p>
              )}
            </div>
          </section>
        </div>
      )}

      <style>{`
        .admin-grid {
          display: grid;
          gap: 2rem;
          margin-top: 1.5rem;
        }
        .text-critical { color: var(--color-critical); }
        .text-warning { color: var(--color-warning); }
      `}</style>
    </article>
  );
}
