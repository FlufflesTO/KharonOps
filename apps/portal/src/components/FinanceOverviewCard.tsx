import React from "react";
import type { UpgradeWorkspaceState } from "../apiClient";

interface FinanceOverviewCardProps {
  store: UpgradeWorkspaceState;
  onEnterTool: (tool: string) => void;
  isLoading: boolean;
}

export function FinanceOverviewCard({ store, onEnterTool, isLoading }: FinanceOverviewCardProps): React.JSX.Element {
  const pendingQuotes = store.quotes.filter(q => q.status === "draft").length;
  const pendingInvoices = store.invoices.filter(i => i.status === "issued").length;
  const overdueInvoices = store.invoices.filter(i => i.status === "issued" && new Date(i.due_date) < new Date()).length;

  return (
    <article className="workspace-card">
      <div className="panel-heading">
        <p className="panel-eyebrow">Finance Overview</p>
        <h2>Financial posture and actions</h2>
      </div>

      <div className="admin-grid">
        <section className="summary-grid">
          <div className="summary-card" onClick={() => onEnterTool("finance_quotes")} style={{ cursor: 'pointer' }}>
            <span className="summary-card__label">Draft Quotes</span>
            <strong>{pendingQuotes}</strong>
            <small>Ready to be sent to clients</small>
          </div>
          <div className="summary-card" onClick={() => onEnterTool("finance_invoices")} style={{ cursor: 'pointer' }}>
            <span className="summary-card__label">Unsent Invoices</span>
            <strong>{pendingInvoices}</strong>
            <small>Awaiting your confirmation</small>
          </div>
          <div className="summary-card" onClick={() => onEnterTool("finance_debtors")} style={{ cursor: 'pointer' }}>
            <span className="summary-card__label">Overdue</span>
            <strong className={overdueInvoices > 0 ? "text-critical" : ""}>{overdueInvoices}</strong>
            <small>Accounts requiring follow-up</small>
          </div>
        </section>

        <section className="control-block">
          <div className="control-block__head">
            <h3>Urgent Finance Actions</h3>
            <p>Top priorities for today's financial coordination.</p>
          </div>
          <div className="fact-list">
            {overdueInvoices > 0 && (
              <div className="highlight-box border-critical">
                <span className="highlight-box__label">Overdue Payments</span>
                <p>There are {overdueInvoices} invoices past their due date. Review the Debtors list for follow-up actions.</p>
                <button className="button button--secondary mt-2" onClick={() => onEnterTool("finance_debtors")}>
                  Manage Debtors
                </button>
              </div>
            )}
            {pendingInvoices > 0 && (
              <div className="highlight-box border-active mt-4">
                <span className="highlight-box__label">Invoices Ready</span>
                <p>{pendingInvoices} invoices are in draft status and ready to be issued to customers.</p>
                <button className="button button--secondary mt-2" onClick={() => onEnterTool("finance_invoices")}>
                  Review Invoices
                </button>
              </div>
            )}
            {overdueInvoices === 0 && pendingInvoices === 0 && (
              <p className="muted-copy">No urgent finance actions detected. All accounts are currently up to date.</p>
            )}
          </div>
        </section>
      </div>

      <style>{`
        .admin-grid { display: grid; gap: 2rem; margin-top: 1.5rem; }
        .text-critical { color: var(--color-critical); }
        .border-active { border-left: 4px solid var(--color-positive); }
        .border-critical { border-left: 4px solid var(--color-critical); }
        .mt-2 { margin-top: 0.5rem; }
        .mt-4 { margin-top: 1rem; }
      `}</style>
    </article>
  );
}
