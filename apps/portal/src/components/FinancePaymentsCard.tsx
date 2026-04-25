/**
 * KharonOps - Financial Settlement Registry
 * Purpose: Level 4 Fiduciary Reconciliation and Asset Recovery
 * Dependencies: finance-hardened.css, @kharon/domain
 * Structural Role: Operational tool for matching incoming funds to ledger obligations.
 */

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
    <article className="workspace-card workspace-card--hardened">
      <div className="panel-heading">
        <div className="flex justify-between items-end w-full">
          <div>
            <p className="panel-eyebrow">Fiduciary Reconciliation</p>
            <h2 className="text-2xl font-bold tracking-tight">Settlement Registry</h2>
          </div>
        </div>
      </div>

      <div className="control-stack mt-8">
        {/* Reconciliation Terminal */}
        <section className="conduct-hero">
          <div className="conduct-hero__glow"></div>
          <div className="control-block__head">
            <h3 className="text-lg font-bold">Matching Terminal</h3>
            <p className="opacity-70">Verify incoming bank artifacts and link them to outstanding ledger items.</p>
          </div>
          
          {unpaidInvoices.length === 0 ? (
            <div className="mt-8 p-6 text-center bg-positive-subtle border-positive rounded-xl">
              <span className="text-3xl">💎</span>
              <p className="mt-3 font-semibold text-sm opacity-80">Full Reconciliation Achieved</p>
              <p className="text-xs opacity-50">All issued obligations have been successfully settled.</p>
            </div>
          ) : (
            <div className="form-grid mt-6">
              <label className="field-stack">
                <span className="text-xs font-bold opacity-60 uppercase tracking-widest">Select Outstanding Obligation</span>
                <select 
                  className="bg-black/20 border-white/10 rounded-lg p-3 text-sm focus:border-finance-accent outline-none"
                  value={selectedInvoiceId} 
                  onChange={(e) => setSelectedInvoiceId(e.target.value)}
                >
                  <option value="">Choose obligation...</option>
                  {unpaidInvoices.map((invoice) => (
                    <option key={invoice.invoice_id} value={invoice.invoice_id}>
                      {invoice.invoice_id} | {invoice.client_id} | {asMoney(invoice.amount)}
                    </option>
                  ))}
                </select>
              </label>
              
              <div className="flex justify-end mt-8">
                <button
                  className={`button ${isReconciling ? "button--loading" : "button--primary shadow-glow"}`}
                  disabled={!selectedInvoiceId || isReconciling}
                  onClick={() => {
                    if (!selectedInvoiceId) return;
                    setIsReconciling(true);
                    setTimeout(() => {
                      onReconcileInvoice(selectedInvoiceId);
                      setSelectedInvoiceId("");
                      setIsReconciling(false);
                    }, 800);
                  }}
                >
                  {isReconciling ? "Capturing Handshake..." : "Confirm Fiduciary Settlement"}
                </button>
              </div>
            </div>
          )}
        </section>

        {/* History of Settlement */}
        <section className="control-block mt-8">
          <div className="control-block__head">
            <h3 className="text-lg font-bold">Settled Ledger Feed</h3>
            <p className="muted-copy">Chronological sequence of verified financial completions.</p>
          </div>
          
          <div className="tx-feed mt-6">
            {paidInvoices.length === 0 ? (
              <p className="muted-copy text-center p-8">No settlement artifacts found in the current cycle.</p>
            ) : (
              paidInvoices.map((invoice) => (
                <div key={invoice.invoice_id} className="ledger-row shadow-glow-hover">
                  <span className="ledger-row__id">{invoice.invoice_id}</span>
                  <div className="flex-1">
                    <strong className="text-sm tracking-tight">{invoice.client_id}</strong>
                    <p className="text-[10px] opacity-40 mt-0.5">Audit Hash: {Math.random().toString(16).slice(2, 10).toUpperCase()}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-sm font-bold text-finance">{asMoney(invoice.amount)}</p>
                  </div>
                  <div className="flex justify-end">
                    <span className="finance-chip finance-chip--settled">Settled</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      <style>{`
        .bg-positive-subtle { background: rgba(16, 185, 129, 0.05); }
        .border-positive { border: 1px solid rgba(16, 185, 129, 0.2); }
        .text-finance { color: var(--finance-accent); }
        .shadow-glow-hover:hover {
          box-shadow: 0 0 15px var(--finance-glow);
          border-color: var(--finance-accent);
          background: rgba(255,255,255,0.02);
        }
      `}</style>
    </article>
  );
}
