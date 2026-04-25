/**
 * KharonOps - Financial Invoice Ledger
 * Purpose: Level 4 Transactional Provenance and Settlement Tracking
 * Dependencies: finance-hardened.css, @kharon/domain
 * Structural Role: Operational tool for invoice generation and status monitoring.
 */

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
    <article className="workspace-card workspace-card--hardened">
      <div className="panel-heading">
        <div className="flex justify-between items-end w-full">
          <div>
            <p className="panel-eyebrow">Transactional Provenance</p>
            <h2 className="text-2xl font-bold tracking-tight">Invoice Generation Ledger</h2>
          </div>
        </div>
      </div>

      <div className="control-stack mt-8">
        {/* Issuance Terminal */}
        <section className="conduct-hero">
          <div className="conduct-hero__glow"></div>
          <div className="control-block__head">
            <h3 className="text-lg font-bold">Issuance Terminal</h3>
            <p className="opacity-70">Transform approved quotes into immutable fiduciary obligations.</p>
          </div>
          
          <div className="form-grid mt-6">
            <label className="field-stack">
              <span className="text-xs font-bold opacity-60 uppercase tracking-widest">Target Approved Quote</span>
              <select 
                className="bg-black/20 border-white/10 rounded-lg p-3 text-sm focus:border-finance-accent outline-none"
                value={selectedQuoteId} 
                onChange={(e) => setSelectedQuoteId(e.target.value)}
              >
                <option value="">Awaiting selection...</option>
                {approvedQuotes.map((quote) => (
                  <option key={quote.quote_id} value={quote.quote_id}>
                    {quote.quote_id} | {quote.client_id} | {asMoney(quote.amount)}
                  </option>
                ))}
              </select>
            </label>
            <label className="field-stack">
              <span className="text-xs font-bold opacity-60 uppercase tracking-widest">Settlement Deadline</span>
              <input 
                type="date" 
                className="bg-black/20 border-white/10 rounded-lg p-3 text-sm focus:border-finance-accent outline-none"
                value={dueDate} 
                onChange={(e) => setDueDate(e.target.value)} 
              />
            </label>
          </div>
          
          <div className="flex justify-end mt-8">
            <button
              className="button button--primary shadow-glow"
              disabled={!selectedQuoteId}
              onClick={() => {
                if (!selectedQuoteId) return;
                onCreateInvoiceFromQuote(selectedQuoteId, dueDate);
                setSelectedQuoteId("");
              }}
            >
              Generate Fiduciary Invoice
            </button>
          </div>
        </section>

        {/* Audit Registry */}
        <section className="control-block mt-8">
          <div className="control-block__head">
            <h3 className="text-lg font-bold">Transactional Audit Feed</h3>
            <p className="muted-copy">Chronological sequence of all issued fiduciary records.</p>
          </div>
          
          <div className="tx-feed mt-6">
            {store.invoices.length === 0 ? (
              <p className="muted-copy text-center p-8">No historical invoices recorded in this cycle.</p>
            ) : (
              store.invoices.map((invoice) => (
                <div key={invoice.invoice_id} className="ledger-row shadow-glow-hover">
                  <span className="ledger-row__id">{invoice.invoice_id}</span>
                  <div className="flex-1">
                    <strong className="text-sm tracking-tight">{invoice.client_id}</strong>
                    <p className="text-[10px] opacity-40 mt-0.5">Maturity: {invoice.due_date}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-sm font-bold text-finance">{asMoney(invoice.amount)}</p>
                  </div>
                  <div className="flex justify-end">
                    <span className={`finance-chip finance-chip--${invoice.status === "paid" ? "settled" : "issued"}`}>
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
        .shadow-glow-hover:hover {
          box-shadow: 0 0 15px var(--finance-glow);
          border-color: var(--finance-accent);
          background: rgba(255,255,255,0.02);
        }
        .text-finance { color: var(--finance-accent); }
      `}</style>
    </article>
  );
}
