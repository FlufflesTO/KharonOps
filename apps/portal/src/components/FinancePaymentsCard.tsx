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
  const [isReconciling, setIsReconciling] = useState(false);

  const unpaidInvoices = store.invoices.filter(i => i.status !== "paid");
  const paidInvoices = store.invoices.filter(i => i.status === "paid");

  return (
    <article className="workspace-card glass-panel">
      <div className="panel-heading">
        <p className="panel-eyebrow">Receivables</p>
        <h2>Payment Tracker</h2>
      </div>

      <div className="control-block interaction-panel">
        <div className="control-block__head">
          <h3>Match Incoming Payment</h3>
          <p>Select an invoice to mark as paid once funds are verified in the bank.</p>
        </div>
        
        {unpaidInvoices.length === 0 ? (
          <div className="highlight-box empty-state-enhanced mt-4">
            <span className="empty-state__icon">💰</span>
            <h3>All Caught Up</h3>
            <p className="muted-copy mt-2">There are no outstanding invoices to reconcile.</p>
          </div>
        ) : (
          <div className="form-grid mt-4">
            <label className="field-stack">
              <span>Select Outstanding Invoice</span>
              <div className="combo-input">
                <select 
                  value={selectedInvoiceId} 
                  onChange={(e) => setSelectedInvoiceId(e.target.value)}
                  className="enhanced-select"
                >
                  <option value="">Choose invoice...</option>
                  {unpaidInvoices.map((invoice) => (
                    <option key={invoice.invoice_id} value={invoice.invoice_id}>
                      {invoice.invoice_id} | {invoice.client_id} | {asMoney(invoice.amount)}
                    </option>
                  ))}
                </select>
              </div>
            </label>

            <div className="field-stack field-stack--full flex justify-end mt-4">
              <button
                className={`button button--large ${isReconciling ? "button--loading" : "button--positive"}`}
                disabled={!selectedInvoiceId || isReconciling}
                onClick={() => {
                  if (!selectedInvoiceId) return;
                  setIsReconciling(true);
                  setTimeout(() => {
                    onReconcileInvoice(selectedInvoiceId);
                    setSelectedInvoiceId("");
                    setIsReconciling(false);
                  }, 600);
                }}
              >
                {isReconciling ? "Reconciling..." : "✓ Confirm Payment"}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="control-block mt-8">
        <div className="control-block__head">
          <h3>Payment History</h3>
          <p>Recently reconciled customer payments.</p>
        </div>
        <div className="history-table bg-glass border-glass rounded-lg mt-4">
          {paidInvoices.length === 0 ? (
            <div className="p-6 text-center text-muted">No recent payments recorded.</div>
          ) : (
            paidInvoices.map((invoice) => (
              <div key={invoice.invoice_id} className="history-row hover-scale">
                <div className="flex-1">
                  <strong className="text-white">{invoice.invoice_id}</strong>
                  <span className="job-item__meta block mt-1">{invoice.client_id} • Paid</span>
                </div>
                <div className="button-row items-center gap-4">
                  <strong className="text-white text-lg">{asMoney(invoice.amount)}</strong>
                  <span className="status-chip status-chip--active">Reconciled</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <style>{`
        .interaction-panel { background: rgba(255,255,255,0.02); padding: var(--space-6); border-radius: var(--radius-lg); border: 1px solid rgba(255,255,255,0.05); }
        .enhanced-select { width: 100%; padding: 0.875rem 1rem; background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.15); border-radius: var(--radius-md); color: white; font-size: 0.95rem; transition: border-color 0.2s; }
        .enhanced-select:focus { outline: none; border-color: var(--color-primary); box-shadow: 0 0 0 3px rgba(99,102,241,0.2); }
        .button--large { padding: 1rem 2.5rem; font-size: 1.1rem; font-weight: 600; transition: all var(--transition-fast); }
        .button--loading { opacity: 0.8; cursor: wait; }
        .button--positive { background-color: var(--color-positive); color: white; border-color: var(--color-positive); }
        .button--positive:hover { filter: brightness(1.1); }
        .bg-glass { background: rgba(255,255,255,0.02); }
        .border-glass { border: 1px solid rgba(255,255,255,0.05); }
        .rounded-lg { border-radius: var(--radius-lg); }
        .hover-scale { transition: transform 0.2s; }
        .hover-scale:hover { transform: translateX(4px); background: rgba(255,255,255,0.05); }
        .text-white { color: white; }
        .text-lg { font-size: 1.125rem; }
        .text-center { text-align: center; }
        .p-6 { padding: 1.5rem; }
        .mt-1 { margin-top: 0.25rem; }
        .mt-2 { margin-top: 0.5rem; }
        .mt-4 { margin-top: 1rem; }
        .mt-8 { margin-top: 2rem; }
        .block { display: block; }
        .flex { display: flex; }
        .flex-1 { flex: 1; }
        .items-center { align-items: center; }
        .justify-end { justify-content: flex-end; }
        .gap-4 { gap: 1rem; }
      `}</style>
    </article>
  );
}
