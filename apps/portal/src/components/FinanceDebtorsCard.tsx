import React from "react";
import type { UpgradeWorkspaceState } from "../apiClient";

interface FinanceDebtorsCardProps {
  store: UpgradeWorkspaceState;
  onRebuildAnalytics: () => void;
}

function asMoney(value: number): string {
  return new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR", maximumFractionDigits: 0 }).format(value);
}

export function FinanceDebtorsCard({ store, onRebuildAnalytics }: FinanceDebtorsCardProps): React.JSX.Element {
  return (
    <article className="workspace-card">
      <div className="panel-heading panel-heading--inline">
        <div>
          <p className="panel-eyebrow">Collections</p>
          <h2>Money Owed</h2>
        </div>
        <button className="button button--secondary" onClick={onRebuildAnalytics}>
          Update Profiles
        </button>
      </div>

      <div className="control-stack">
        <section className="control-block">
          <div className="control-block__head">
            <h3>Outstanding Balances</h3>
            <p>Customer accounts with unpaid invoices and their risk levels.</p>
          </div>
          
          <div className="history-table">
            {store.debtors.length === 0 ? (
              <p className="muted-copy">No debtor profiles found. Click "Update Profiles" to compute current balances.</p>
            ) : (
              store.debtors.map((debtor) => (
                <div key={debtor.client_id} className="history-row">
                  <div className="flex-1">
                    <strong>{debtor.client_id}</strong>
                    <span className="job-item__meta">
                      30d: {asMoney(debtor.bucket_30)} | 60d: {asMoney(debtor.bucket_60)}
                    </span>
                  </div>
                  <div className="button-row">
                    <strong>{asMoney(debtor.total_due)}</strong>
                    <span className={`status-chip status-chip--${debtor.risk_band === "high" ? "critical" : debtor.risk_band === "medium" ? "warning" : "active"}`}>
                      {debtor.risk_band.toUpperCase()} RISK
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="control-block">
          <div className="control-block__head">
            <h3>Collection Actions</h3>
            <p>Recommended next steps for high-risk accounts.</p>
          </div>
          <div className="fact-list">
            {store.debtors.filter(d => d.risk_band === "high").map(debtor => (
              <div key={`action-${debtor.client_id}`} className="highlight-box border-critical mt-2">
                <span className="highlight-box__label">Urgent Follow-up: {debtor.client_id}</span>
                <p>Balance of {asMoney(debtor.total_due)} is significantly overdue. Recommend placing account on hold and requesting immediate payment.</p>
              </div>
            ))}
            {store.debtors.filter(d => d.risk_band === "high").length === 0 && (
              <p className="muted-copy">No high-risk accounts requiring urgent collection actions.</p>
            )}
          </div>
        </section>
      </div>

      <style>{`
        .border-critical { border-left: 4px solid var(--color-critical); }
        .mt-2 { margin-top: 0.5rem; }
      `}</style>
    </article>
  );
}
