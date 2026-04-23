import React, { useState } from "react";
import type { UpgradeWorkspaceState } from "../apiClient";

interface FinanceQuotesCardProps {
  store: UpgradeWorkspaceState;
  onCreateQuote: (payload: { job_id: string; client_id: string; description: string; amount: number }) => void;
  onUpdateQuoteStatus: (quoteid: string, status: "draft" | "sent" | "approved" | "rejected" | "invoiced") => void;
}

function asMoney(value: number): string {
  return new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR", maximumFractionDigits: 0 }).format(value);
}

export function FinanceQuotesCard({ store, onCreateQuote, onUpdateQuoteStatus }: FinanceQuotesCardProps): React.JSX.Element {
  const [jobId, setJobId] = useState("");
  const [clientId, setClientId] = useState("");
  const [description, setDescription] = useState("Remedial works proposal");
  const [amount, setAmount] = useState("0");

  return (
    <article className="workspace-card">
      <div className="panel-heading panel-heading--inline">
        <div>
          <p className="panel-eyebrow">Quoting</p>
          <h2>Manage Quotes</h2>
        </div>
      </div>

      <div className="control-stack">
        <section className="control-block">
          <div className="control-block__head">
            <h3>Create New Quote</h3>
            <p>Enter the job details and estimated amount for the client proposal.</p>
          </div>
          <div className="form-grid">
            <label className="field-stack">
              <span>Job ID</span>
              <input value={jobId} onChange={(e) => setJobId(e.target.value)} placeholder="e.g. JOB-1001" />
            </label>
            <label className="field-stack">
              <span>Client ID</span>
              <input value={clientId} onChange={(e) => setClientId(e.target.value)} placeholder="e.g. CLI-001" />
            </label>
            <label className="field-stack field-stack--full">
              <span>Description</span>
              <input value={description} onChange={(e) => setDescription(e.target.value)} />
            </label>
            <label className="field-stack">
              <span>Amount (R)</span>
              <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </label>
          </div>
          <div className="flex-end mt-4">
            <button
              className="button button--primary"
              onClick={() => {
                const val = Number(amount);
                if (!jobId.trim() || !clientId.trim() || !Number.isFinite(val) || val <= 0) return;
                onCreateQuote({ job_id: jobId.trim(), client_id: clientId.trim(), description: description.trim(), amount: val });
                setAmount("0");
              }}
            >
              Issue Quote
            </button>
          </div>
        </section>

        <section className="control-block">
          <div className="control-block__head">
            <h3>Recent Quotes</h3>
            <p>Status of issued and draft client proposals.</p>
          </div>
          <div className="history-table">
            {store.quotes.length === 0 ? (
              <p className="muted-copy">No quotes generated yet.</p>
            ) : (
              store.quotes.map((quote) => (
                <div key={quote.quote_id} className="history-row">
                  <div className="flex-1">
                    <strong>{quote.quote_id}</strong>
                    <span className="job-item__meta">{quote.job_id} • {quote.client_id}</span>
                  </div>
                  <div className="button-row">
                    <strong>{asMoney(quote.amount)}</strong>
                    <span className={`status-chip status-chip--${quote.status === "approved" ? "active" : quote.status === "rejected" ? "critical" : "warning"}`}>
                      {quote.status}
                    </span>
                    {quote.status === "sent" && (
                      <button className="button button--ghost" onClick={() => onUpdateQuoteStatus(quote.quote_id, "approved")}>
                        Approve
                      </button>
                    )}
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
