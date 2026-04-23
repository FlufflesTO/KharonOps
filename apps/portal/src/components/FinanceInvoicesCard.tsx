import React, { useState } from "react";
import type { UpgradeWorkspaceState } from "../apiClient";

interface FinanceInvoicesCardProps {
  store: UpgradeWorkspaceState;
  onCreateInvoiceFromQuote: (quoteid: string, dueDate: string) => void;
}

function asMoney(value: number): string {
  return new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR", maximumFractionDigits: 0 }).format(value);
}

export function FinanceInvoicesCard({ store, onCreateInvoiceFromQuote }: FinanceInvoicesCardProps): React.JSX.Element {
  const [selectedQuoteId, setSelectedQuoteId] = useState("");
  const [dueDate, setDueDate] = useState(new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10));

  const approvedQuotes = store.quotes.filter(q => q.status === "approved");

  return (
    <article className="workspace-card">
      <div className="panel-heading panel-heading--inline">
        <div>
          <p className="panel-eyebrow">Invoicing</p>
          <h2>Customer Invoices</h2>
        </div>
      </div>

      <div className="control-stack">
        <section className="control-block">
          <div className="control-block__head">
            <h3>Issue New Invoice</h3>
            <p>Convert an approved quote into a formal customer invoice.</p>
          </div>
          <div className="form-grid">
            <label className="field-stack">
              <span>Select Approved Quote</span>
              <select value={selectedQuoteId} onChange={(e) => setSelectedQuoteId(e.target.value)}>
                <option value="">Choose approved quote...</option>
                {approvedQuotes.map((quote) => (
                  <option key={quote.quote_id} value={quote.quote_id}>
                    {quote.quote_id} | {quote.client_id} | {asMoney(quote.amount)}
                  </option>
                ))}
              </select>
            </label>
            <label className="field-stack">
              <span>Due Date</span>
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </label>
          </div>
          <div className="flex-end mt-4">
            <button
              className="button button--primary"
              disabled={!selectedQuoteId}
              onClick={() => {
                if (!selectedQuoteId) return;
                onCreateInvoiceFromQuote(selectedQuoteId, dueDate);
                setSelectedQuoteId("");
              }}
            >
              Generate Invoice
            </button>
          </div>
        </section>

        <section className="control-block">
          <div className="control-block__head">
            <h3>Invoicing Ledger</h3>
            <p>Track the status of all issued and pending invoices.</p>
          </div>
          <div className="history-table">
            {store.invoices.length === 0 ? (
              <p className="muted-copy">No invoices found.</p>
            ) : (
              store.invoices.map((invoice) => (
                <div key={invoice.invoice_id} className="history-row">
                  <div className="flex-1">
                    <strong>{invoice.invoice_id}</strong>
                    <span className="job-item__meta">{invoice.client_id} • Due {invoice.due_date}</span>
                  </div>
                  <div className="button-row">
                    <strong>{asMoney(invoice.amount)}</strong>
                    <span className={`status-chip status-chip--${invoice.status === "paid" ? "active" : "warning"}`}>
                      {invoice.status}
                    </span>
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
