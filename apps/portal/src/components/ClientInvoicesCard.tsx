import React from "react";
import type { UpgradeWorkspaceState } from "../apiClient";

interface ClientInvoicesCardProps {
  store: UpgradeWorkspaceState;
}

function asMoney(value: number): string {
  return new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR", maximumFractionDigits: 0 }).format(value);
}

export function ClientInvoicesCard({ store }: ClientInvoicesCardProps): React.JSX.Element {
  return (
    <article className="workspace-card">
      <div className="panel-heading">
        <p className="panel-eyebrow">Billing</p>
        <h2>Your Invoices</h2>
      </div>

      <div className="control-stack">
        <section className="control-block">
          <div className="control-block__head">
            <h3>Outstanding Payments</h3>
            <p>Invoices that require your attention.</p>
          </div>
          <div className="history-table">
            {store.invoices.filter(i => i.status !== "paid").length === 0 ? (
              <p className="muted-copy p-4">Your account is fully up to date. No outstanding invoices.</p>
            ) : (
              store.invoices.filter(i => i.status !== "paid").map((invoice) => (
                <div key={invoice.invoice_id} className="history-row">
                  <div className="flex-1">
                    <strong>{invoice.invoice_id}</strong>
                    <span className="job-item__meta">Due: {invoice.due_date}</span>
                  </div>
                  <div className="button-row">
                    <strong>{asMoney(invoice.amount)}</strong>
                    <span className="status-chip status-chip--warning">Unpaid</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="control-block">
          <div className="control-block__head">
            <h3>Payment Instructions</h3>
            <p>How to settle your outstanding balance.</p>
          </div>
          <div className="highlight-box">
            <p>Please use your <strong>Invoice Number</strong> as the payment reference.</p>
            <p className="mt-2"><strong>Bank:</strong> FNB | <strong>Acc:</strong> 6200000000 | <strong>Branch:</strong> 250655</p>
          </div>
        </section>
      </div>

      <style>{`
        .p-4 { padding: 1rem; }
        .mt-2 { margin-top: 0.5rem; }
      `}</style>
    </article>
  );
}
