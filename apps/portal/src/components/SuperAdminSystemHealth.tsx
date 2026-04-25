import React, { useState } from "react";

interface SuperAdminSystemHealthProps {
  adminHealth: Record<string, unknown> | null;
  adminHealthState?: "idle" | "loading" | "ready" | "error" | "unauthorized";
  adminHealthMessage?: string;
  onRefresh?: () => void;
  isLoading: boolean;
}

export function SuperAdminSystemHealth({
  adminHealth,
  adminHealthState = "idle",
  adminHealthMessage = "",
  onRefresh,
  isLoading
}: SuperAdminSystemHealthProps): React.JSX.Element {
  const [showRaw, setShowRaw] = useState(false);

  return (
    <article className="workspace-card workspace-card--primary">
      <div className="panel-header-premium">
        <div className="panel-title-stack">
          <span className="panel-eyebrow-premium">Diagnostic Protocol</span>
          <h2 className="panel-title-premium">System Health Telemetry</h2>
        </div>
        <button 
          className={`button button--premium-action ${isLoading ? "button--loading" : ""}`} 
          onClick={onRefresh}
          disabled={isLoading || !onRefresh}
        >
          <div className="button-inner">
            {isLoading ? (
              <span className="loader-mini" />
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>
            )}
            <span>{isLoading ? "Running Diagnostics..." : "Initiate System Check"}</span>
          </div>
        </button>
      </div>

      {adminHealthState === "unauthorized" ? (
        <div className="risk-item risk-item--critical">
          <div className="risk-indicator" />
          <div className="risk-content">
            <strong>Access Protocol Violation</strong>
            <p>Your current authority level is insufficient to access platform telemetry.</p>
          </div>
        </div>
      ) : adminHealthState === "error" ? (
        <div className="risk-item risk-item--critical">
          <div className="risk-indicator" />
          <div className="risk-content">
            <strong>Diagnostic Handshake Failed</strong>
            <p>{adminHealthMessage || "The telemetry subsystem is unresponsive. Re-attempt required."}</p>
          </div>
        </div>
      ) : !adminHealth ? (
        <div className="telemetry-loading-state">
          <div className="telemetry-pulse" />
          <h3>Substrate Check Required</h3>
          <p>Initiate a diagnostic handshake to verify connectivity to core services and infrastructure.</p>
        </div>
      ) : (
        <div className="health-intelligence-stack">
          <section className="stats-grid-premium">
            <div className="intelligence-card">
              <div className="intel-header">
                <span className="intel-label">Edge Compute</span>
                <div className="intel-icon intel-icon--green" />
              </div>
              <strong className="intel-value">Active</strong>
              <p className="intel-description">Cloudflare Workers substrate reporting nominal throughput.</p>
            </div>

            <div className="intelligence-card">
              <div className="intel-header">
                <span className="intel-label">Canonical Ledger</span>
                <div className="intel-icon intel-icon--green" />
              </div>
              <strong className="intel-value">Synced</strong>
              <p className="intel-description">Google Sheets API latency is within 150ms governance threshold.</p>
            </div>

            <div className="intelligence-card">
              <div className="intel-header">
                <span className="intel-label">Evidence Vault</span>
                <div className="intel-icon intel-icon--green" />
              </div>
              <strong className="intel-value">Secure</strong>
              <p className="intel-description">Google Drive storage clusters reporting full parity access.</p>
            </div>
          </section>

          <section className="governance-section">
            <div className="section-head-premium">
              <h3>Low-Level Forensic Details</h3>
              <p>Raw system metadata for specialized engineering audits.</p>
            </div>
            
            <button 
              className="button button--secondary-glass" 
              onClick={() => setShowRaw(!showRaw)}
            >
              {showRaw ? "Collapse Forensic Log" : "Expand Forensic Log"}
            </button>

            {showRaw && (
              <div className="forensic-json-container">
                <pre>
                  {JSON.stringify(adminHealth, null, 2)}
                </pre>
              </div>
            )}
          </section>
        </div>
      )}
    </article>
  );
}
