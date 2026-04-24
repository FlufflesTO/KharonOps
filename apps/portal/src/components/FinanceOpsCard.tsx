import React, { useMemo, useState } from "react";
import type { UpgradeWorkspaceState } from "../apiClient";
import type { JobRecord } from "./JobListView";

const MODULES = ["Overview", "Quotes", "Invoices", "Money Owed", "Statements"] as const;

interface FinanceOpsCardProps {
  jobs: JobRecord[];
  documents: Array<Record<string, unknown>>;
  store: UpgradeWorkspaceState;
  onRefreshStore: () => void;
  onCreateQuote: (payload: { job_id: string; client_id: string; description: string; amount: number }) => void;
  onUpdateQuoteStatus: (quoteid: string, status: "draft" | "sent" | "approved" | "rejected" | "invoiced") => void;
  onCreateInvoiceFromQuote: (quoteid: string, dueDate: string) => void;
  onReconcileInvoice: (invoiceid: string) => void;
  onLockEscrow: (documentid: string, invoiceid: string) => void;
  onRebuildAnalytics: () => void;
}

function asMoney(value: number): string {
  return new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR", maximumFractionDigits: 0 }).format(value);
}

function deriveJobValue(job: JobRecord): number {
  const base = 3200;
  const idSeed = Number((job.job_id.match(/\d+/)?.[0] ?? "0")) % 7;
  const statusFactor: Record<JobRecord["status"], number> = {
    draft: 1.0,
    performed: 1.35,
    rejected: 1.1,
    approved: 1.45,
    certified: 1.6,
    cancelled: 0
  };
  return Math.round((base + idSeed * 850) * statusFactor[job.status]);
}

export function FinanceOpsCard({
  jobs,
  documents,
  store,
  onRefreshStore,
  onCreateQuote,
  onUpdateQuoteStatus,
  onCreateInvoiceFromQuote,
  onReconcileInvoice,
  onLockEscrow,
  onRebuildAnalytics
}: FinanceOpsCardProps): React.JSX.Element {
  const [moduleIndex, setModuleIndex] = useState(0);
  const [quoteJobid, setQuoteJobid] = useState(jobs[0]?.job_id ?? "");
  const [quoteDescription, setQuoteDescription] = useState("Remedial works proposal");
  const [quoteAmount, setQuoteAmount] = useState("0");
  const [invoiceDueDate, setInvoiceDueDate] = useState(new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10));
  const [selectedQuoteid, setSelectedQuoteid] = useState("");
  const [selectedInvoiceid, setSelectedInvoiceid] = useState("");
  const [selectedEscrowDocumentid, setSelectedEscrowDocumentid] = useState("");
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<string[]>([]);

  const jobLookup = useMemo(() => new Map(jobs.map((job) => [job.job_id, job])), [jobs]);

  const financials = useMemo(() => {
    const activeJobs = jobs.filter((job) => job.status !== "cancelled");
    const openWorkValue = activeJobs.reduce((acc, job) => acc + deriveJobValue(job), 0);
    const invoiceReady = jobs.filter((job) => job.status === "approved" || job.status === "certified");
    const certified = jobs.filter((job) => job.status === "certified");
    const generatedDocs = documents.filter((doc) => String(doc.status) === "generated").length;
    const publishedDocs = documents.filter((doc) => String(doc.status) === "published").length;

    return {
      openWorkValue,
      invoiceReadyCount: invoiceReady.length,
      certifiedCount: certified.length,
      generatedDocs,
      publishedDocs,
      issuedInvoices: store.invoices.filter((item) => item.status !== "paid").length,
      paidInvoices: store.invoices.filter((item) => item.status === "paid").length,
      totalDebt: store.debtors.reduce((acc, item) => acc + item.total_due, 0)
    };
  }, [jobs, documents, store]);

  const escrowEligibleDocuments = useMemo(
    () => documents.filter((doc) => String(doc.status) === "generated" || String(doc.status) === "published"),
    [documents]
  );

  const selectedQuote = store.quotes.find((item) => item.quote_id === selectedQuoteid) ?? null;
  const selectedJobForQuote = jobLookup.get(quoteJobid) ?? null;

  return (
    <article className="workspace-card workspace-card--primary glass-panel">
      <div className="panel-heading panel-heading--inline flex-wrap gap-4">
        <div>
          <p className="panel-eyebrow">Finance</p>
          <h2>Finance</h2>
        </div>
        <div className="button-row">
          <span className="status-chip status-chip--active">Live</span>
          <button className="button button--ghost" type="button" onClick={onRefreshStore}>
            Refresh
          </button>
        </div>
      </div>

      <div className="module-tabs">
        {MODULES.map((label, index) => (
          <button
            key={label}
            type="button"
            className={`module-tab ${moduleIndex === index ? "module-tab--active" : ""}`}
            onClick={() => setModuleIndex(index)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="control-block mt-6">
        {moduleIndex === 0 && (
          <div className="posture-grid">
            <div className="kpi-card">
              <span>Overview</span>
              <strong className="truncate">{asMoney(financials.openWorkValue)}</strong>
            </div>
            <div className="kpi-card">
              <span>Ready to invoice</span>
              <strong>{financials.invoiceReadyCount}</strong>
            </div>
            <div className="kpi-card">
              <span>Paid invoices</span>
              <strong>{financials.paidInvoices}</strong>
            </div>
            <div className="kpi-card">
              <span>Money owed</span>
              <strong className="truncate">{asMoney(financials.totalDebt)}</strong>
            </div>
            <div className="kpi-card">
              <span>Open invoices</span>
              <strong>{financials.issuedInvoices}</strong>
            </div>
            <div className="kpi-card">
              <span>Published files</span>
              <strong>{financials.publishedDocs}</strong>
            </div>
          </div>
        )}

        {moduleIndex === 1 && (
          <div className="control-stack">
            <div className="form-grid form-grid--two">
              <label className="field-stack">
                <span>Work reference</span>
                <select value={quoteJobid} onChange={(e) => setQuoteJobid(e.target.value)}>
                  <option value="">Choose work item</option>
                  {jobs.map((job) => (
                    <option key={job.job_id} value={job.job_id}>
                      {job.title || "Job"} | {job.client_name || job.client_id || "Client"} | {job.job_id}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field-stack">
                <span>Description</span>
                <input value={quoteDescription} onChange={(e) => setQuoteDescription(e.target.value)} />
              </label>
              <label className="field-stack">
                <span>Amount</span>
                <input type="number" value={quoteAmount} onChange={(e) => setQuoteAmount(e.target.value)} />
              </label>
            </div>
            <div className="flex justify-end mt-4">
              <button
                className="button button--primary"
                type="button"
                disabled={!selectedJobForQuote}
                onClick={() => {
                  const amount = Number(quoteAmount);
                  if (!selectedJobForQuote || !Number.isFinite(amount) || amount <= 0) return;
                  onCreateQuote({
                    job_id: selectedJobForQuote.job_id,
                    client_id: selectedJobForQuote.client_id || selectedJobForQuote.client_name || "client",
                    description: quoteDescription.trim(),
                    amount
                  });
                  setQuoteAmount("0");
                  setQuoteDescription("Remedial works proposal");
                }}
              >
                Create quote
              </button>
            </div>
            <div className="history-table mt-8">
              {store.quotes.map((quote) => {
                const quoteDescription = String(quote.description ?? "Quote");
                const job = jobLookup.get(String(quote.job_id));
                return (
                  <div key={quote.quote_id} className="history-row">
                    <div className="flex flex-col truncate">
                      <strong className="truncate">{quoteDescription}</strong>
                      <small className="truncate opacity-75">
                        {job?.title ?? "Work item"} | {job?.client_name ?? String(quote.client_id)}
                      </small>
                    </div>
                    <span className="truncate">{asMoney(quote.amount)}</span>
                    <div className="flex justify-end gap-2 shrink-0">
                      <button className="button button--ghost" type="button" onClick={() => setSelectedQuoteid(quote.quote_id)}>
                        Select
                      </button>
                      <button className="button button--secondary" type="button" onClick={() => onUpdateQuoteStatus(quote.quote_id, "approved")}>
                        Approve
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {moduleIndex === 2 && (
          <div className="control-stack">
            <div className="form-grid form-grid--two">
              <label className="field-stack">
                <span>Approved quote</span>
                <select value={selectedQuoteid} onChange={(e) => setSelectedQuoteid(e.target.value)}>
                  <option value="">Choose approved quote</option>
                  {store.quotes
                    .filter((quote) => quote.status === "approved")
                    .map((quote) => {
                      const description = String(quote.description ?? quote.quote_id);
                      const job = jobLookup.get(String(quote.job_id));
                      return (
                        <option key={quote.quote_id} value={quote.quote_id}>
                          {description} | {job?.title ?? quote.job_id} | {asMoney(quote.amount)}
                        </option>
                      );
                    })}
                </select>
              </label>
              <label className="field-stack">
                <span>Due date</span>
                <input type="date" value={invoiceDueDate} onChange={(e) => setInvoiceDueDate(e.target.value)} />
              </label>
            </div>
            <div className="flex justify-end mt-4">
              <button
                className="button button--primary"
                type="button"
                disabled={!selectedQuote}
                onClick={() => {
                  if (!selectedQuote) return;
                  onCreateInvoiceFromQuote(selectedQuote.quote_id, invoiceDueDate);
                }}
              >
                Generate invoice
              </button>
            </div>
            <div className="history-table mt-8">
              {store.invoices.map((invoice) => {
                const invoiceClient = String(invoice.client_id);
                const invoiceJob = String(invoice.job_id ?? "");
                const job = invoiceJob ? jobLookup.get(invoiceJob) ?? null : null;
                return (
                  <div key={invoice.invoice_id} className="history-row">
                    <div className="flex items-center gap-2 truncate">
                      <input
                        type="checkbox"
                        checked={selectedInvoiceIds.includes(invoice.invoice_id)}
                        onChange={() =>
                          setSelectedInvoiceIds((prev) =>
                            prev.includes(invoice.invoice_id)
                              ? prev.filter((id) => id !== invoice.invoice_id)
                              : [...prev, invoice.invoice_id]
                          )
                        }
                      />
                      <div className="flex flex-col truncate">
                        <strong className="truncate">{job?.title ?? invoiceClient}</strong>
                        <small className="truncate opacity-75">{invoice.invoice_id}</small>
                      </div>
                    </div>
                    <span className="truncate">{asMoney(invoice.amount)}</span>
                    <span className={`status-chip status-chip--${invoice.status === "paid" ? "active" : "warning"} shrink-0`}>
                      {invoice.status}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-end mt-4">
              <button
                className="button button--ghost"
                type="button"
                disabled={selectedInvoiceIds.length === 0}
                onClick={() => {
                  for (const invoiceid of selectedInvoiceIds) {
                    onReconcileInvoice(invoiceid);
                  }
                }}
              >
                Reconcile selected invoices
              </button>
            </div>
          </div>
        )}

        {moduleIndex === 3 && (
          <div className="control-stack">
            <div className="flex justify-start mb-4">
              <button className="button button--secondary" type="button" onClick={onRebuildAnalytics}>
                Rebuild money owed summary
              </button>
            </div>
            <div className="history-table">
              {store.debtors.length === 0 ? (
                <p className="muted-copy p-4">No money owed summary computed yet.</p>
              ) : (
                store.debtors.map((debtor) => (
                  <div key={debtor.client_id} className="history-row">
                    <div className="flex flex-col truncate">
                      <strong className="truncate">Client account</strong>
                      <small className="truncate opacity-75">{debtor.client_id}</small>
                    </div>
                    <span className="truncate">{asMoney(debtor.total_due)}</span>
                    <span className="truncate text-xs opacity-75">
                      30d {asMoney(debtor.bucket_30)} | 60d {asMoney(debtor.bucket_60)}
                    </span>
                    <span className={`status-chip status-chip--${debtor.risk_band === "high" ? "critical" : debtor.risk_band === "medium" ? "warning" : "active"} shrink-0`}>
                      {debtor.risk_band}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {moduleIndex === 4 && (
          <div className="control-stack">
            <div className="form-grid form-grid--two">
              <label className="field-stack">
                <span>Invoice to settle</span>
                <select value={selectedInvoiceid} onChange={(e) => setSelectedInvoiceid(e.target.value)}>
                  <option value="">Select invoice</option>
                  {store.invoices.map((invoice) => {
                    const invoiceClient = String(invoice.client_id);
                    return (
                      <option key={invoice.invoice_id} value={invoice.invoice_id}>
                        {invoiceClient} | {invoice.invoice_id} | {invoice.status}
                      </option>
                    );
                  })}
                </select>
              </label>
              <label className="field-stack">
                <span>Published document for escrow lock</span>
                <select value={selectedEscrowDocumentid} onChange={(e) => setSelectedEscrowDocumentid(e.target.value)}>
                  <option value="">Select published document</option>
                  {escrowEligibleDocuments.map((doc) => (
                    <option key={String(doc.document_id)} value={String(doc.document_id)}>
                      {String(doc.document_type)} | {String(doc.document_id)}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="flex justify-end gap-3 mt-4 mb-8">
              <button
                className="button button--secondary"
                type="button"
                disabled={!selectedEscrowDocumentid || !selectedInvoiceid}
                onClick={() => onLockEscrow(selectedEscrowDocumentid, selectedInvoiceid)}
              >
                Lock certificate escrow
              </button>
              <button
                className="button button--primary"
                type="button"
                disabled={!selectedInvoiceid}
                onClick={() => onReconcileInvoice(selectedInvoiceid)}
              >
                Reconcile and release
              </button>
            </div>
            <div className="history-table mb-8">
              <h3 className="text-sm font-bold opacity-50 mb-2 px-1">Escrow records</h3>
              {store.escrow.length === 0 ? (
                <p className="muted-copy">No escrow records yet.</p>
              ) : (
                store.escrow.map((item) => (
                  <div key={item.document_id} className="history-row">
                    <div className="flex flex-col truncate">
                      <strong className="truncate">{String(item.status === "released" ? "Released file" : "Held file")}</strong>
                      <small className="truncate opacity-75">{item.document_id}</small>
                    </div>
                    <span className="truncate">{item.invoice_id}</span>
                    <span className="truncate">{item.status === "released" ? item.released_at : item.locked_at}</span>
                    <span className={`status-chip status-chip--${item.status === "released" ? "active" : "warning"} shrink-0`}>
                      {item.status}
                    </span>
                  </div>
                ))
              )}
            </div>
            <div className="history-table">
              <h3 className="text-sm font-bold opacity-50 mb-2 px-1">Statements</h3>
              {store.statements.length === 0 ? (
                <p className="muted-copy">No statements generated. Rebuild money owed summary first.</p>
              ) : (
                store.statements.map((statement) => (
                  <div key={statement.statement_id} className="history-row">
                    <div className="flex flex-col truncate">
                      <strong className="truncate">Statement</strong>
                      <small className="truncate opacity-75">{statement.statement_id}</small>
                    </div>
                    <span className="truncate">{statement.client_id}</span>
                    <span className="truncate">{statement.period_label}</span>
                    <span className="truncate">{asMoney(statement.closing_balance)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      <style>{`
        .flex { display: flex; }
        .flex-wrap { flex-wrap: wrap; }
        .items-center { align-items: center; }
        .justify-end { justify-content: flex-end; }
        .justify-start { justify-content: flex-start; }
        .gap-2 { gap: 0.5rem; }
        .gap-3 { gap: 0.75rem; }
        .gap-4 { gap: 1rem; }
        .mt-4 { margin-top: 1rem; }
        .mt-6 { margin-top: 1.5rem; }
        .mt-8 { margin-top: 2rem; }
        .mb-2 { margin-bottom: 0.5rem; }
        .mb-4 { margin-bottom: 1rem; }
        .mb-8 { margin-bottom: 2rem; }
        .px-1 { padding-left: 0.25rem; padding-right: 0.25rem; }
        .p-4 { padding: 1rem; }
        .truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .shrink-0 { flex-shrink: 0; }
        .text-xs { font-size: 0.75rem; }
        .text-sm { font-size: 0.875rem; }
        .font-bold { font-weight: 700; }
        .opacity-50 { opacity: 0.5; }
        .opacity-75 { opacity: 0.75; }
        .bg-white/5 { background-color: rgba(255, 255, 255, 0.05); }
        .border-white/10 { border-color: rgba(255, 255, 255, 0.1); }
        .rounded-lg { border-radius: 0.5rem; }
        .module-tabs {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-top: 1rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid rgba(255,255,255,0.1);
        }
        .module-tab {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: rgba(255, 255, 255, 0.6);
          padding: 0.5rem 1rem;
          border-radius: 20px;
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
        }
        .module-tab:hover {
          background: rgba(255, 255, 255, 0.1);
          color: var(--color-text);
        }
        .module-tab--active {
          background: var(--color-primary);
          color: var(--color-text);
          border-color: var(--color-primary);
          box-shadow: 0 2px 10px rgba(var(--color-primary-rgb), 0.3);
        }
        .kpi-card {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          padding: 1.5rem;
          border-radius: 12px;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .kpi-card span {
          font-size: 0.75rem;
          color: rgba(255,255,255,0.5);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          font-weight: 700;
        }
        .kpi-card strong {
          font-size: 1.5rem;
          color: var(--color-text);
          font-weight: 800;
        }
        .form-grid--two { grid-template-columns: 1fr; }
        @media (min-width: 768px) {
          .form-grid--two { grid-template-columns: repeat(2, 1fr); }
        }
      `}</style>
    </article>
  );
}
