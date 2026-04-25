/**
 * KharonOps - Financial Proposal Generator
 * Purpose: Level 4 Strategic Pipeline Management and Asset Generation
 * Dependencies: finance-hardened.css, @kharon/domain
 * Structural Role: Operational tool for generating client remedial proposals.
 */

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
    <article className="workspace-card workspace-card--hardened">
      <div className="panel-heading">
        <div className="flex justify-between items-end w-full">
          <div>
            <p className="panel-eyebrow">Strategic Pipeline</p>
            <h2 className="text-2xl font-bold tracking-tight">Proposal Generation Registry</h2>
          </div>
        </div>
      </div>

      <div className="control-stack mt-8">
        {/* Proposal Terminal */}
        <section className="conduct-hero">
          <div className="conduct-hero__glow"></div>
          <div className="control-block__head">
            <h3 className="text-lg font-bold">Proposal Terminal</h3>
            <p className="opacity-70">Initialize a new client obligation based on remedial field intelligence.</p>
          </div>
          
          <div className="form-grid mt-6">
            <label className="field-stack">
              <span className="text-xs font-bold opacity-60 uppercase tracking-widest">Job Reference</span>
              <input 
                className="bg-black/20 border-white/10 rounded-lg p-3 text-sm focus:border-finance-accent outline-none font-mono"
                value={jobId} 
                onChange={(e) => setJobId(e.target.value)} 
                placeholder="JOB-XXXX" 
              />
            </label>
            <label className="field-stack">
              <span className="text-xs font-bold opacity-60 uppercase tracking-widest">Client Identifier</span>
              <input 
                className="bg-black/20 border-white/10 rounded-lg p-3 text-sm focus:border-finance-accent outline-none font-mono"
                value={clientId} 
                onChange={(e) => setClientId(e.target.value)} 
                placeholder="CLI-XXXX" 
              />
            </label>
            <label className="field-stack field-stack--full mt-4">
              <span className="text-xs font-bold opacity-60 uppercase tracking-widest">Operational Scope</span>
              <input 
                className="bg-black/20 border-white/10 rounded-lg p-3 text-sm focus:border-finance-accent outline-none"
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
              />
            </label>
            <label className="field-stack field-stack--full mt-4">
              <span className="text-xs font-bold opacity-60 uppercase tracking-widest">Ledger Value (ZAR)</span>
              <div className="relative flex items-center">
                <span className="absolute left-4 font-bold text-finance">R</span>
                <input 
                  type="number" 
                  className="bg-black/20 border-white/10 rounded-lg p-3 pl-8 text-lg font-bold font-mono focus:border-finance-accent outline-none w-full"
                  value={amount} 
                  onChange={(e) => setAmount(e.target.value)} 
                />
              </div>
            </label>
          </div>
          
          <div className="flex justify-end mt-8">
            <button
              className={`button ${isIssuing ? "button--loading" : "button--primary shadow-glow"}`}
              onClick={() => {
                const val = Number(amount);
                if (!jobId.trim() || !clientId.trim() || !Number.isFinite(val) || val <= 0) return;
                setIsIssuing(true);
                setTimeout(() => {
                  onCreateQuote({ job_id: jobId.trim(), client_id: clientId.trim(), description: description.trim(), amount: val });
                  setAmount("0");
                  setIsIssuing(false);
                }, 800);
              }}
              disabled={isIssuing || !jobId.trim() || !clientId.trim() || Number(amount) <= 0}
            >
              {isIssuing ? "Authorizing Record..." : "Formalize Proposal"}
            </button>
          </div>
        </section>

        {/* Historical Pipeline */}
        <section className="control-block mt-8">
          <div className="control-block__head">
            <h3 className="text-lg font-bold">Proposal Lifecycle Feed</h3>
            <p className="muted-copy">State monitoring of all active and historical client proposals.</p>
          </div>
          
          <div className="tx-feed mt-6">
            {store.quotes.length === 0 ? (
              <p className="muted-copy text-center p-8">No proposals generated in the current cycle.</p>
            ) : (
              store.quotes.map((quote) => (
                <div key={quote.quote_id} className="ledger-row shadow-glow-hover">
                  <span className="ledger-row__id">{quote.quote_id}</span>
                  <div className="flex-1">
                    <strong className="text-sm tracking-tight">{quote.client_id}</strong>
                    <p className="text-[10px] opacity-40 mt-0.5">{quote.job_id} • {quote.description.slice(0, 30)}...</p>
                  </div>
                  <div className="text-right px-4">
                    <p className="font-mono text-sm font-bold text-finance">{asMoney(quote.amount)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`finance-chip finance-chip--${quote.status === "approved" ? "settled" : quote.status === "rejected" ? "overdue" : "issued"}`}>
                      {quote.status}
                    </span>
                    {quote.status === "sent" && (
                      <button 
                        className="button button--secondary-glass p-1 px-2 text-[10px]" 
                        onClick={() => onUpdateQuoteStatus(quote.quote_id, "approved")}
                      >
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
