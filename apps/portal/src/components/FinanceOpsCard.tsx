import React, { useMemo, useState } from "react";
import type { UpgradeWorkspaceState } from "../apiClient";
import type { JobRecord } from "./JobListView";

const MODULES = [
  "Financial Pulse",
  "Quoting Hub",
  "Invoicing Engine",
  "Expense Panel",
  "Debtors Monitor",
  "Statement Ledger"
] as const;

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
  const [quoteJobid, setQuoteJobid] = useState("");
  const [quoteClientid, setQuoteClientid] = useState("");
  const [quoteDescription, setQuoteDescription] = useState("Remedial works proposal");
  const [quoteAmount, setQuoteAmount] = useState("0");
  const [invoiceDueDate, setInvoiceDueDate] = useState(new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10));
  const [selectedQuoteid, setSelectedQuoteid] = useState("");
  const [selectedInvoiceid, setSelectedInvoiceid] = useState("");
  const [selectedEscrowDocumentid, setSelectedEscrowDocumentid] = useState("");
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<string[]>([]);

  const financials = useMemo(() => {
    const activeJobs = jobs.filter((job) => job.status !== "cancelled");
    const pipelineValue = activeJobs.reduce((acc, job) => acc + deriveJobValue(job), 0);
    const invoiceReady = jobs.filter((job) => job.status === "approved" || job.status === "certified");
    const certified = jobs.filter((job) => job.status === "certified");
    const generatedDocs = documents.filter((doc) => String(doc.status) === "generated").length;
    const publishedDocs = documents.filter((doc) => String(doc.status) === "published").length;

    return {
      pipelineValue,
      invoiceReadyCount: invoiceReady.length,
      certifiedCount: certified.length,
      generatedDocs,
      publishedDocs,
      overdueCount: Math.max(0, invoiceReady.length - certified.length),
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

  return (
    <article className="workspace-card workspace-card--primary">
      <div className="panel-heading panel-heading--inline">
        <div>
          <p className="panel-eyebrow">Finance Portal</p>
          <h2>Finance and Integrity Workspace</h2>
        </div>
        <div className="button-row">
          <span className="status-chip status-chip--active">Live</span>
          <button className="button button--ghost" type="button" onClick={onRefreshStore}>
            Refresh
          </button>
        </div>
      </div>

      <div className="button-row">
        {MODULES.map((label, index) => (
          <button
            key={label}
            type="button"
            className={`button ${moduleIndex === index ? "button--primary" : "button--ghost"}`}
            onClick={() => setModuleIndex(index)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="control-block">
        {moduleIndex === 0 ? (
          <div className="posture-grid">
            <div>
              <span>Projected Pipeline</span>
              <strong>{asMoney(financials.pipelineValue)}</strong>
            </div>
            <div>
              <span>Invoice Ready Jobs</span>
              <strong>{financials.invoiceReadyCount}</strong>
            </div>
            <div>
              <span>Certified Closeouts</span>
              <strong>{financials.certifiedCount}</strong>
            </div>
            <div>
              <span>Outstanding Debt</span>
              <strong>{asMoney(financials.totalDebt)}</strong>
            </div>
            <div>
              <span>Open Invoices</span>
              <strong>{financials.issuedInvoices}</strong>
            </div>
            <div>
              <span>Paid Invoices</span>
              <strong>{financials.paidInvoices}</strong>
            </div>
          </div>
        ) : null}

        {moduleIndex === 1 ? (
          <div className="control-stack">
            <div className="form-grid">
              <label className="field-stack">
                <span>Job id</span>
                <input value={quoteJobid} onChange={(event) => setQuoteJobid(event.target.value)} placeholder="JOB-1001" />
              </label>
              <label className="field-stack">
                <span>Client id</span>
                <input value={quoteClientid} onChange={(event) => setQuoteClientid(event.target.value)} placeholder="CLI-001" />
              </label>
              <label className="field-stack">
                <span>Description</span>
                <input value={quoteDescription} onChange={(event) => setQuoteDescription(event.target.value)} />
              </label>
              <label className="field-stack">
                <span>Amount</span>
                <input type="number" value={quoteAmount} onChange={(event) => setQuoteAmount(event.target.value)} />
              </label>
            </div>
            <div className="button-row">
              <button
                className="button button--primary"
                type="button"
                onClick={() => {
                  const amount = Number(quoteAmount);
                  if (!quoteJobid.trim() || !quoteClientid.trim() || !Number.isFinite(amount) || amount <= 0) return;
                  onCreateQuote({
                    job_id: quoteJobid.trim(),
                    client_id: quoteClientid.trim(),
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
            <div className="history-table">
              {store.quotes.map((quote) => (
                <div key={quote.quote_id} className="history-row">
                  <strong>{quote.quote_id}</strong>
                  <span>{quote.job_id}</span>
                  <span>{asMoney(quote.amount)}</span>
                  <div className="button-row">
                    <button className="button button--ghost" type="button" onClick={() => setSelectedQuoteid(quote.quote_id)}>
                      Select
                    </button>
                    <button className="button button--secondary" type="button" onClick={() => onUpdateQuoteStatus(quote.quote_id, "approved")}>
                      Approve
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {moduleIndex === 2 ? (
          <div className="control-stack">
            <div className="form-grid">
              <label className="field-stack">
                <span>Selected quote</span>
                <select value={selectedQuoteid} onChange={(event) => setSelectedQuoteid(event.target.value)}>
                  <option value="">Choose approved quote</option>
                  {store.quotes
                    .filter((quote) => quote.status === "approved")
                    .map((quote) => (
                      <option key={quote.quote_id} value={quote.quote_id}>
                        {quote.quote_id} | {quote.job_id} | {asMoney(quote.amount)}
                      </option>
                    ))}
                </select>
              </label>
              <label className="field-stack">
                <span>Due date</span>
                <input type="date" value={invoiceDueDate} onChange={(event) => setInvoiceDueDate(event.target.value)} />
              </label>
            </div>
            <div className="button-row">
              <button
                className="button button--primary"
                type="button"
                onClick={() => {
                  if (!selectedQuote) return;
                  onCreateInvoiceFromQuote(selectedQuote.quote_id, invoiceDueDate);
                }}
              >
                Generate invoice
              </button>
            </div>
            <div className="history-table">
              {store.invoices.map((invoice) => (
                <div key={invoice.invoice_id} className="history-row">
                  <strong>
                    <label style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem" }}>
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
                      <span>{invoice.invoice_id}</span>
                    </label>
                  </strong>
                  <span>{invoice.client_id}</span>
                  <span>{asMoney(invoice.amount)}</span>
                  <span className={`status-chip status-chip--${invoice.status === "paid" ? "active" : "warning"}`}>{invoice.status}</span>
                </div>
              ))}
            </div>
            <div className="button-row">
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
                Bulk reconcile selected invoices
              </button>
            </div>
          </div>
        ) : null}

        {moduleIndex === 3 ? (
          <div className="control-stack">
            <p className="inline-note">Expense panel is available for operational logging. Current release prioritizes invoice and debt workflows.</p>
            <div className="posture-grid">
              <div>
                <span>Generated docs</span>
                <strong>{financials.generatedDocs}</strong>
              </div>
              <div>
                <span>Published docs</span>
                <strong>{financials.publishedDocs}</strong>
              </div>
            </div>
          </div>
        ) : null}

        {moduleIndex === 4 ? (
          <div className="control-stack">
            <div className="button-row">
              <button className="button button--secondary" type="button" onClick={onRebuildAnalytics}>
                Rebuild debtors profile
              </button>
            </div>
            <div className="history-table">
              {store.debtors.length === 0 ? (
                <p className="muted-copy">No debtors profile computed yet.</p>
              ) : (
                store.debtors.map((debtor) => (
                  <div key={debtor.client_id} className="history-row">
                    <strong>{debtor.client_id}</strong>
                    <span>{asMoney(debtor.total_due)}</span>
                    <span>
                      30d {asMoney(debtor.bucket_30)} | 60d {asMoney(debtor.bucket_60)}
                    </span>
                    <span
                      className={`status-chip status-chip--${debtor.risk_band === "high" ? "critical" : debtor.risk_band === "medium" ? "warning" : "active"
                        }`}
                    >
                      {debtor.risk_band}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : null}

        {moduleIndex === 5 ? (
          <div className="control-stack">
            <div className="form-grid">
              <label className="field-stack">
                <span>Invoice for reconciliation</span>
                <select value={selectedInvoiceid} onChange={(event) => setSelectedInvoiceid(event.target.value)}>
                  <option value="">Select invoice</option>
                  {store.invoices.map((invoice) => (
                    <option key={invoice.invoice_id} value={invoice.invoice_id}>
                      {invoice.invoice_id} | {invoice.client_id} | {invoice.status}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field-stack">
                <span>Published document for escrow lock</span>
                <select value={selectedEscrowDocumentid} onChange={(event) => setSelectedEscrowDocumentid(event.target.value)}>
                  <option value="">Select published document</option>
                  {escrowEligibleDocuments.map((doc) => (
                    <option key={String(doc.document_id)} value={String(doc.document_id)}>
                      {String(doc.document_id)} | {String(doc.document_type)}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="button-row">
              <button
                className="button button--secondary"
                type="button"
                onClick={() => {
                  if (!selectedEscrowDocumentid || !selectedInvoiceid) return;
                  onLockEscrow(selectedEscrowDocumentid, selectedInvoiceid);
                }}
              >
                Lock certificate escrow
              </button>
              <button
                className="button button--primary"
                type="button"
                onClick={() => {
                  if (!selectedInvoiceid) return;
                  onReconcileInvoice(selectedInvoiceid);
                }}
              >
                Reconcile and release
              </button>
            </div>
            <div className="history-table">
              {store.escrow.length === 0 ? (
                <p className="muted-copy">No escrow records yet.</p>
              ) : (
                store.escrow.map((item) => (
                  <div key={item.document_id} className="history-row">
                    <strong>{item.document_id}</strong>
                    <span>{item.invoice_id}</span>
                    <span>{item.status === "released" ? item.released_at : item.locked_at}</span>
                    <span className={`status-chip status-chip--${item.status === "released" ? "active" : "warning"}`}>{item.status}</span>
                  </div>
                ))
              )}
            </div>
            <div className="history-table">
              {store.statements.length === 0 ? (
                <p className="muted-copy">No statements generated. Rebuild debtors profile first.</p>
              ) : (
                store.statements.map((statement) => (
                  <div key={statement.statement_id} className="history-row">
                    <strong>{statement.statement_id}</strong>
                    <span>{statement.client_id}</span>
                    <span>{statement.period_label}</span>
                    <span>{asMoney(statement.closing_balance)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : null}
      </div>
    </article>
  );
}
