import React, { useState } from "react";
import type { UpgradeWorkspaceState } from "../apiClient";

interface FinancePaymentsCardProps {
  store: UpgradeWorkspaceState;
  onReconcileInvoice: (invoiceid: string) => void;
}

function asMoney(value: number): string {
  return new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR", maximumFractionDigits: 0 }).format(value);
}

export function FinancePaymentsCard({ store, onReconcileInvoice }: FinancePaymentsCardProps): React.JSX.Element {
  const [selectedInvoiceId, setSelectedInvoiceId] = useState("");

  const unpaidInvoices = store.invoices.filter(i => i.status !== "paid");

  return (
    <article className="workspace-card">
      <div className="panel-heading panel-heading--inline">
        <div>
          <p className="panel-eyebrow">Receivables</p>
          <h2>Record Payments</h2>
        </div>
      </div>

      <div className="control-stack">
        <section className="control-block">
          <div className="control-block__head">
            <h3>Match Incoming Payment</h3>
            <p>Select an invoice to mark as paid once funds are verified in the bank.</p>
          </div>
          <div className="form-grid">
            <label className="field-stack">
              <span>Select Outstanding Invoice</span>
              <select value={selectedInvoiceId} onChange={(e) => setSelectedInvoiceId(e.target.value)}>
                <option value="">Choose invoice...</option>
                {unpaidInvoices.map((invoice) => (
                  <option key={invoice.invoice_id} value={invoice.invoice_id}>
                    {invoice.invoice_id} | {invoice.client_id} | {asMoney(invoice.amount)}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="flex-end mt-4">
            <button
              className="button button--primary"
              disabled={!selectedInvoiceId}
              onClick={() => {
                if (!selectedInvoiceId) return;
                onReconcileInvoice(selectedInvoiceId);
                setSelectedInvoiceId("");
              }}
            >
              Confirm Payment
            </button>
          </div>
        </section>

        <section className="control-block">
          <div className="control-block__head">
            <h3>Payment History</h3>
            <p>Recently reconciled customer payments.</p>
          </div>
          <div className="history-table">
            {store.invoices.filter(i => i.status === "paid").length === 0 ? (
              <p className="muted-copy">No recent payments recorded.</p>
            ) : (
              store.invoices.filter(i => i.status === "paid").map((invoice) => (
                <div key={invoice.invoice_id} className="history-row">
                  <div className="flex-1">
                    <strong>{invoice.invoice_id}</strong>
                    <span className="job-item__meta">{invoice.client_id} • Paid</span>
                  </div>
                  <div className="button-row">
                    <strong>{asMoney(invoice.amount)}</strong>
                    <span className="status-chip status-chip--active">Reconciled</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      <style>{`
        .flex-end { display: flex; justify-content: flex-end; }
        .mt-4 { margin-top: 1rem; }
      `}</style>
    </article>
  );
}
