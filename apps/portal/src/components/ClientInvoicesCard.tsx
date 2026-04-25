/**
 * KharonOps - Client Settlement Center
 * Purpose: Level 4 Fiduciary Transparency and Payment Integration
 * Dependencies: client-hardened.css, @kharon/domain
 * Structural Role: Tool for clients to review and settle facility obligations.
 */

import React from "react";
import type { UpgradeWorkspaceState } from "../apiClient";

interface ClientInvoicesCardProps {
  store: UpgradeWorkspaceState;
}

function asMoney(value: number): string {
  return new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR", maximumFractionDigits: 0 }).format(value);
}

export function ClientInvoicesCard({ store }: ClientInvoicesCardProps): React.JSX.Element {
  const outstandingInvoices = store.invoices.filter(i => i.status !== "paid");

  return (
    <article className="workspace-card workspace-card--hardened">
      <div className="panel-heading">
        <div className="flex justify-between items-end w-full">
          <div>
            <p className="panel-eyebrow">Fiduciary Transparency</p>
            <h2 className="text-2xl font-bold tracking-tight">Settlement Center</h2>
          </div>
        </div>
      </div>

      <div className="control-stack mt-8">
        {/* Outstanding Obligations */}
        <section className="control-block">
          <div className="control-block__head">
            <h3 className="text-lg font-bold">Outstanding Obligations</h3>
            <p className="muted-copy">Items requiring fiduciary reconciliation for your facility.</p>
          </div>
          
          <div className="client-activity-feed mt-6">
            {outstandingInvoices.length === 0 ? (
              <div className="conduct-hero bg-positive-subtle border-positive p-8 text-center">
                <span className="text-2xl">🛡️</span>
                <p className="opacity-80 mt-3 font-semibold">Account Synchronized</p>
                <p className="text-xs opacity-50">No outstanding fiduciary obligations detected.</p>
              </div>
            ) : (
              outstandingInvoices.map((invoice) => (
                <div key={invoice.invoice_id} className="activity-row shadow-glow-hover border-warning-subtle">
                  <div className="activity-row__icon" style={{ background: 'rgba(234, 179, 8, 0.1)', color: 'var(--color-warning)' }}>
                    <span className="text-xs font-bold">INV</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <strong className="text-sm">{invoice.invoice_id}</strong>
                      <span className="text-[10px] uppercase opacity-40 font-mono">Maturity: {invoice.due_date}</span>
                    </div>
                    <p className="text-xs opacity-60 mt-0.5">Formal Fiduciary Invoice • Remedial Works</p>
                  </div>
                  <div className="text-right flex items-center gap-6">
                    <strong className="text-lg font-mono text-warning">{asMoney(invoice.amount)}</strong>
                    <button className="button button--secondary-glass py-1 px-4 text-xs">
                      View PDF
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Settlement Protocols */}
        <section className="settlement-card mt-8">
          <div className="control-block__head">
            <h3 className="text-lg font-bold text-client">Settlement Protocols</h3>
            <p className="opacity-70">Verified payment channels for facility reconciliation.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
            <div className="p-4 bg-black/20 rounded-xl border border-white/5">
              <p className="text-[10px] uppercase tracking-widest opacity-40 font-bold mb-2">EFT Handshake</p>
              <div className="space-y-1">
                <p className="text-sm"><strong>Bank:</strong> First National Bank</p>
                <p className="text-sm"><strong>Account:</strong> 62000000000</p>
                <p className="text-sm"><strong>Branch:</strong> 250655</p>
              </div>
            </div>
            <div className="p-4 bg-black/20 rounded-xl border border-white/5">
              <p className="text-[10px] uppercase tracking-widest opacity-40 font-bold mb-2">Reference Protocol</p>
              <p className="text-sm opacity-80">Use the formal <strong>Invoice Number</strong> (e.g. INV-XXXX) as the primary reconciliation key.</p>
              <div className="mt-3 flex items-center gap-2 text-xs text-client font-bold">
                <div className="indicator-dot indicator-dot--live"></div>
                VERIFIED_CHANNEL
              </div>
            </div>
          </div>
        </section>
      </div>

      <style>{`
        .text-client { color: var(--client-accent); }
        .text-warning { color: var(--color-warning); }
        .border-warning-subtle { border-color: rgba(234, 179, 8, 0.2); }
        .bg-positive-subtle { background: rgba(16, 185, 129, 0.05); }
        .border-positive { border: 1px solid rgba(16, 185, 129, 0.2); }
      `}</style>
    </article>
  );
}
