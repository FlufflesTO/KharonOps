/**
 * KharonOps - Finance Posture Registry
 * Purpose: Level 4 Fiduciary Integrity and Asset Visibility
 * Dependencies: finance-hardened.css, @kharon/domain
 * Structural Role: Strategic financial oversight for the Kharon platform.
 */

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
    <article className="workspace-card workspace-card--hardened">
      <div className="panel-heading">
        <div className="flex justify-between items-end w-full">
          <div>
            <p className="panel-eyebrow">Fiduciary Governance</p>
            <h2 className="text-2xl font-bold tracking-tight">Financial Posture Registry</h2>
          </div>
          <div className="text-right hidden md:block">
            <span className="status-chip status-chip--active">Ledger Synchronized</span>
          </div>
        </div>
      </div>

      <div className="control-stack mt-8">
        {/* Asset Value / Posture Grid */}
        <section className="summary-grid">
          <div className="summary-card shadow-glow" onClick={() => onEnterTool("finance_quotes")} style={{ cursor: 'pointer' }}>
            <span className="summary-card__label">Strategic Pipeline</span>
            <strong className="text-finance">{pendingQuotes}</strong>
            <div className="utilization-bar">
              <div className="utilization-bar__fill bg-finance" style={{ width: `${Math.min(100, (pendingQuotes / 10) * 100)}%` }}></div>
            </div>
            <small className="opacity-60">Draft quotes awaiting issuance</small>
          </div>
          
          <div className="summary-card" onClick={() => onEnterTool("finance_invoices")} style={{ cursor: 'pointer' }}>
            <span className="summary-card__label">Receivables: Issued</span>
            <strong>{pendingInvoices}</strong>
            <div className="utilization-bar">
              <div className="utilization-bar__fill" style={{ width: `${Math.min(100, (pendingInvoices / 15) * 100)}%` }}></div>
            </div>
            <small className="opacity-60">Invoices pending settlement</small>
          </div>
          
          <div className="summary-card border-critical" onClick={() => onEnterTool("finance_debtors")} style={{ cursor: 'pointer' }}>
            <span className="summary-card__label">Fiduciary Risk</span>
            <strong className={overdueInvoices > 0 ? "text-critical" : "opacity-40"}>{overdueInvoices}</strong>
            <div className="utilization-bar">
              <div className="utilization-bar__fill bg-critical" style={{ width: `${Math.min(100, (overdueInvoices / 5) * 100)}%` }}></div>
            </div>
            <small className="opacity-60">Overdue account reconciliations</small>
          </div>
        </section>

        {/* Priority Interventions */}
        <section className="control-block mt-8">
          <div className="control-block__head">
            <h3 className="text-lg font-bold">Priority Interventions</h3>
            <p className="muted-copy">Items requiring immediate fiduciary reconciliation.</p>
          </div>
          
          <div className="priority-feed mt-6">
            {overdueInvoices > 0 && (
              <div className="priority-item priority-item--critical">
                <div className="indicator-dot bg-critical"></div>
                <div className="flex-1">
                  <p className="font-bold text-sm">Asset Recovery Required</p>
                  <p className="text-xs opacity-70 mt-1">
                    {overdueInvoices} accounts have exceeded the standard payment window. Intervention mandated.
                  </p>
                </div>
                <button className="button button--secondary-glass" onClick={() => onEnterTool("finance_debtors")}>
                  Reconcile
                </button>
              </div>
            )}

            {pendingInvoices > 0 && (
              <div className="priority-item">
                <div className="indicator-dot indicator-dot--live"></div>
                <div className="flex-1">
                  <p className="font-bold text-sm">Transactional Throughput</p>
                  <p className="text-xs opacity-70 mt-1">
                    {pendingInvoices} invoices are ready for final audit before client delivery.
                  </p>
                </div>
                <button className="button button--secondary-glass" onClick={() => onEnterTool("finance_invoices")}>
                  Review
                </button>
              </div>
            )}

            {pendingQuotes > 0 && (
              <div className="priority-item priority-item--warning">
                <div className="indicator-dot bg-warning"></div>
                <div className="flex-1">
                  <p className="font-bold text-sm">Quote Maturity Alert</p>
                  <p className="text-xs opacity-70 mt-1">
                    {pendingQuotes} quotes are nearing the 48h staleness threshold. Expedite approval.
                  </p>
                </div>
                <button className="button button--secondary-glass" onClick={() => onEnterTool("finance_quotes")}>
                  Expedite
                </button>
              </div>
            )}
          </div>
        </section>
      </div>

      <style>{`
        .text-finance { color: var(--finance-accent); }
        .bg-finance { background: var(--finance-accent) !important; box-shadow: 0 0 8px var(--finance-accent) !important; }
        .text-critical { color: var(--color-critical); }
        .bg-critical { background: var(--color-critical) !important; }
        .bg-warning { background: var(--color-warning) !important; }
      `}</style>
    </article>
  );
}
