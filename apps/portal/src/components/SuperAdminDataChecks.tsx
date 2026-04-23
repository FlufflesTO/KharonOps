import React from "react";
import type { SchemaDriftPayload } from "../apiClient";

interface SuperAdminDataChecksProps {
  schemaDrift: SchemaDriftPayload | null;
  onRefresh: () => void;
  isLoading: boolean;
}

export function SuperAdminDataChecks({ schemaDrift, onRefresh, isLoading }: SuperAdminDataChecksProps): React.JSX.Element {
  return (
    <article className="workspace-card">
      <div className="panel-heading panel-heading--inline">
        <div>
          <p className="panel-eyebrow">Data Integrity</p>
          <h2>Ledger and schema health checks</h2>
        </div>
        <button 
          className="button button--secondary" 
          onClick={onRefresh}
          disabled={isLoading}
        >
          {isLoading ? "Scanning..." : "Run Scan"}
        </button>
      </div>

      {!schemaDrift ? (
        <div className="highlight-box">
          <p>Perform a scan to validate the structural integrity of the workbook and detect any schema drift.</p>
        </div>
      ) : (
        <div className="control-stack">
          <section className={`highlight-box ${schemaDrift.healthy ? "border-active" : "border-critical"}`}>
            <span className={`status-chip ${schemaDrift.healthy ? "status-chip--active" : "status-chip--critical"}`}>
              {schemaDrift.healthy ? "Healthy" : "Attention Required"}
            </span>
            <p className="mt-4">
              {schemaDrift.healthy 
                ? "The workbook schema matches the expected definition across all collections." 
                : "Structural inconsistencies detected between the ledger and application code."}
            </p>
          </section>

          <section className="control-block">
            <div className="control-block__head">
              <h3>Detection Report</h3>
              <p>Detailed list of detected issues and required remediations.</p>
            </div>
            
            {schemaDrift.issues.length === 0 ? (
              <p className="muted-copy">No structural issues detected.</p>
            ) : (
              <div className="history-table">
                {schemaDrift.issues.map((issue) => (
                  <div key={issue.code} className="history-row">
                    <div className="flex-1">
                      <strong className={issue.severity === "critical" ? "text-critical" : "text-warning"}>
                        {issue.severity.toUpperCase()}
                      </strong>
                      <p className="job-item__meta">{issue.detail}</p>
                    </div>
                    <span className="status-chip status-chip--neutral">{issue.code}</span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      <style>{`
        .border-active { border-left: 4px solid var(--color-positive); }
        .border-critical { border-left: 4px solid var(--color-critical); }
        .mt-4 { margin-top: 1rem; }
        .text-critical { color: var(--color-critical); }
        .text-warning { color: var(--color-warning); }
      `}</style>
    </article>
  );
}
