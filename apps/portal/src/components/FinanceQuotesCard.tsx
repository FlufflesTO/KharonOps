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
  const [isIssuing, setIsIssuing] = useState(false);

  return (
    <article className="workspace-card glass-panel">
      <div className="panel-heading">
        <p className="panel-eyebrow">Finance</p>
        <h2>Quote Generator</h2>
      </div>

      <div className="control-block interaction-panel">
        <div className="control-block__head">
          <h3>Issue New Quote</h3>
          <p>Generate a new client proposal for remedial or additional work.</p>
        </div>
        
        <div className="form-grid mt-4">
          <label className="field-stack">
            <span>Job ID</span>
            <input 
              value={jobId} 
              onChange={(e) => setJobId(e.target.value)} 
              placeholder="e.g. JOB-1001" 
              className="enhanced-input"
            />
          </label>
          <label className="field-stack">
            <span>Client ID</span>
            <input 
              value={clientId} 
              onChange={(e) => setClientId(e.target.value)} 
              placeholder="e.g. CLI-001" 
              className="enhanced-input"
            />
          </label>
          <label className="field-stack field-stack--full">
            <span>Description</span>
            <input 
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
              className="enhanced-input"
            />
          </label>
          <label className="field-stack field-stack--full">
            <span>Amount (ZAR)</span>
            <div className="currency-input-wrapper">
              <span className="currency-symbol">R</span>
              <input 
                type="number" 
                value={amount} 
                onChange={(e) => setAmount(e.target.value)} 
                className="enhanced-input currency-input"
              />
            </div>
          </label>

          <div className="field-stack field-stack--full flex justify-end mt-4">
            <button
              className={`button button--large ${isIssuing ? "button--loading" : "button--primary"}`}
              onClick={() => {
                const val = Number(amount);
                if (!jobId.trim() || !clientId.trim() || !Number.isFinite(val) || val <= 0) return;
                setIsIssuing(true);
                setTimeout(() => {
                  onCreateQuote({ job_id: jobId.trim(), client_id: clientId.trim(), description: description.trim(), amount: val });
                  setAmount("0");
                  setIsIssuing(false);
                }, 600);
              }}
              disabled={isIssuing || !jobId.trim() || !clientId.trim() || Number(amount) <= 0}
            >
              {isIssuing ? "Generating..." : "Issue Quote"}
            </button>
          </div>
        </div>
      </div>

      <div className="control-block mt-8">
        <div className="control-block__head">
          <h3>Recent Quotes</h3>
          <p>Status of issued and draft client proposals.</p>
        </div>
        <div className="history-table bg-glass border-glass rounded-lg mt-4">
          {store.quotes.length === 0 ? (
            <div className="p-6 text-center text-muted">No quotes generated yet.</div>
          ) : (
            store.quotes.map((quote) => (
              <div key={quote.quote_id} className="history-row hover-scale">
                <div className="flex-1">
                  <strong className="text-white">{quote.quote_id}</strong>
                  <span className="job-item__meta block mt-1">{quote.job_id} • {quote.client_id}</span>
                </div>
                <div className="button-row items-center gap-4">
                  <strong className="text-white text-lg">{asMoney(quote.amount)}</strong>
                  <span className={`status-chip status-chip--${quote.status === "approved" ? "active" : quote.status === "rejected" ? "critical" : "warning"}`}>
                    {quote.status}
                  </span>
                  {quote.status === "sent" && (
                    <button className="button button--ghost" onClick={() => onUpdateQuoteStatus(quote.quote_id, "approved")}>
                      ✓ Approve
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <style>{`
        .interaction-panel { background: rgba(255,255,255,0.02); padding: var(--space-6); border-radius: var(--radius-lg); border: 1px solid rgba(255,255,255,0.05); }
        .enhanced-input { width: 100%; padding: 0.875rem 1rem; background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.15); border-radius: var(--radius-md); color: white; font-size: 0.95rem; transition: border-color 0.2s; }
        .enhanced-input:focus { outline: none; border-color: var(--color-primary); box-shadow: 0 0 0 3px rgba(99,102,241,0.2); }
        .currency-input-wrapper { position: relative; display: flex; align-items: center; }
        .currency-symbol { position: absolute; left: 1rem; color: var(--color-text-muted); font-weight: 600; }
        .currency-input { padding-left: 2.5rem; font-size: 1.1rem; font-weight: 600; font-family: var(--font-mono); }
        .button--large { padding: 1rem 2.5rem; font-size: 1.1rem; font-weight: 600; }
        .button--loading { opacity: 0.8; cursor: wait; }
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
