import React from "react";
import type { OpsIntelligencePayload } from "../apiClient";

interface SuperAdminOverviewProps {
  opsIntelligence: OpsIntelligencePayload | null;
  onRefresh: () => void;
  isLoading: boolean;
}

export function SuperAdminOverview({ opsIntelligence, onRefresh, isLoading }: SuperAdminOverviewProps): React.JSX.Element {
  return (
    <article className="workspace-card workspace-card--primary">
      <div className="panel-header-premium">
        <div className="panel-title-stack">
          <span className="panel-eyebrow-premium">System Intelligence</span>
          <h2 className="panel-title-premium">Platform Governance Overview</h2>
        </div>
        <button 
          className={`button button--premium-action ${isLoading ? "button--loading" : ""}`} 
          onClick={onRefresh}
          disabled={isLoading}
        >
          <div className="button-inner">
            {isLoading ? (
              <span className="loader-mini" />
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>
            )}
            <span>{isLoading ? "Synchronizing..." : "Refresh Intelligence"}</span>
          </div>
        </button>
      </div>

      {!opsIntelligence ? (
        <div className="telemetry-loading-state">
          <div className="telemetry-pulse" />
          <h3>Aggregating Real-Time Data</h3>
          <p>Connecting to secure ledger nodes. This may take a few moments...</p>
        </div>
      ) : (
        <div className="admin-intelligence-layout">
          <section className="stats-grid-premium">
            <div className="intelligence-card">
              <div className="intel-header">
                <span className="intel-label">Operational Backlog</span>
                <div className="intel-icon intel-icon--blue" />
              </div>
              <strong className="intel-value">{opsIntelligence.jobs.open}</strong>
              <p className="intel-description">Open engagements requiring active coordination.</p>
            </div>

            <div className="intelligence-card intelligence-card--critical">
              <div className="intel-header">
                <span className="intel-label">Critical Alerts</span>
                <div className="intel-icon intel-icon--red" />
              </div>
              <strong className="intel-value">{opsIntelligence.jobs.critical}</strong>
              <p className="intel-description">High-priority systemic risks detected.</p>
            </div>

            <div className="intelligence-card intelligence-card--warning">
              <div className="intel-header">
                <span className="intel-label">Temporal Drift</span>
                <div className="intel-icon intel-icon--amber" />
              </div>
              <strong className="intel-value">{opsIntelligence.jobs.stale_over_24h}</strong>
              <p className="intel-description">Stagnant engagements exceeding 24h threshold.</p>
            </div>

            <div className="intelligence-card">
              <div className="intel-header">
                <span className="intel-label">Evidence Queue</span>
                <div className="intel-icon intel-icon--green" />
              </div>
              <strong className="intel-value">{opsIntelligence.operations.documents_pending_publish}</strong>
              <p className="intel-description">Unpublished certificates awaiting final verification.</p>
            </div>
          </section>

          <section className="governance-section">
            <div className="section-head-premium">
              <h3>Financial Forensic Integrity</h3>
              <p>Canonical record of outstanding liabilities and escrow status.</p>
            </div>
            <div className="posture-grid-premium">
              <div className="posture-card">
                <span className="posture-label">Aggregated Outstanding</span>
                <strong className="posture-value">R {opsIntelligence.finance.outstanding_amount.toLocaleString()}</strong>
              </div>
              <div className="posture-card">
                <span className="posture-label">Escrow Lock Protocol</span>
                <strong className="posture-value">{opsIntelligence.operations.escrow_locked} <small>Items Secured</small></strong>
              </div>
            </div>
          </section>
          
          <section className="governance-section">
            <div className="section-head-premium">
              <h3>Risk Mitigation Registry</h3>
              <p>Prioritized interventions based on systemic telemetry.</p>
            </div>
            <div className="risk-registry">
              {opsIntelligence.jobs.critical > 0 ? (
                <div className="risk-item risk-item--critical">
                  <div className="risk-indicator" />
                  <div className="risk-content">
                    <strong>Critical Systemic Breach</strong>
                    <p>{opsIntelligence.jobs.critical} jobs are operating outside of safe compliance boundaries.</p>
                  </div>
                </div>
              ) : null}
              {opsIntelligence.operations.documents_pending_publish > 10 ? (
                <div className="risk-item risk-item--warning">
                  <div className="risk-indicator" />
                  <div className="risk-content">
                    <strong>Publication Backlog Overflow</strong>
                    <p>Evidence generation is exceeding processing capacity. Delay in client transparency expected.</p>
                  </div>
                </div>
              ) : null}
              {opsIntelligence.jobs.critical === 0 && opsIntelligence.operations.documents_pending_publish <= 10 ? (
                <div className="risk-item risk-item--safe">
                  <div className="risk-indicator" />
                  <div className="risk-content">
                    <strong>System Parameters Nominal</strong>
                    <p>All governance protocols are reporting stable state transitions.</p>
                  </div>
                </div>
              ) : null}
            </div>
          </section>
        </div>
      )}
    </article>
  );
}

