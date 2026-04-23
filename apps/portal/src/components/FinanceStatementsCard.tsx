import React from "react";
import type { UpgradeWorkspaceState } from "../apiClient";

interface FinanceStatementsCardProps {
  store: UpgradeWorkspaceState;
}

function asMoney(value: number): string {
  return new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR", maximumFractionDigits: 0 }).format(value);
}

export function FinanceStatementsCard({ store }: FinanceStatementsCardProps): React.JSX.Element {
  return (
    <article className="workspace-card">
      <div className="panel-heading panel-heading--inline">
        <div>
          <p className="panel-eyebrow">Reporting</p>
          <h2>Account Statements</h2>
        </div>
      </div>

      <div className="control-stack">
        <section className="control-block">
          <div className="control-block__head">
            <h3>Recent Statements</h3>
            <p>Monthly account summaries generated for customer reconciliation.</p>
          </div>
          
          <div className="history-table">
            {store.statements.length === 0 ? (
              <p className="muted-copy">No statements generated for the current period.</p>
            ) : (
              store.statements.map((statement) => (
                <div key={statement.statement_id} className="history-row">
                  <div className="flex-1">
                    <strong>{statement.statement_id}</strong>
                    <span className="job-item__meta">{statement.client_id} • {statement.period_label}</span>
                  </div>
                  <div className="button-row">
                    <strong>{asMoney(statement.closing_balance)}</strong>
                    <button className="button button--secondary">View PDF</button>
                    <button className="button button--ghost">Send</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
        
        <section className="control-block">
          <div className="control-block__head">
            <h3>Generate Statements</h3>
            <p>Initiate a batch generation of statements for the previous billing cycle.</p>
          </div>
          <div className="highlight-box">
            <p>Batch statement generation is scheduled automatically at the end of each month. Use this tool for mid-cycle manual generation if required.</p>
            <button className="button button--primary mt-4">Generate Batch</button>
          </div>
        </section>
      </div>

      <style>{`
        .mt-4 { margin-top: 1rem; }
      `}</style>
    </article>
  );
}
