/**
 * KharonOps — Finance Routes
 * Purpose: Endpoints for quotes, invoices, statements, and debtors.
 * Dependencies: @kharon/domain, ../services/responses.js
 */

import { Hono } from "hono";
import {
  envelopeSuccess,
  envelopeError,
  bumpMutableMeta
} from "@kharon/domain";
import { requireRoles, requireSession, getSessionUser } from "../middleware/auth.js";
import { parseJsonBody } from "../services/parse.js";
import { createMutable, createStoreContext } from "../services/meta.js";
import { nowIso } from "../services/utils.js";
import {
  financeEscrowLockSchema,
  financeInvoiceFromQuoteSchema,
  financeQuoteCreateSchema,
  financeQuoteStatusSchema
} from "../schemas/requests.js";
import type { AppBindings } from "../context.js";
import type { FinanceDebtorRow, FinanceStatementRow, FinanceInvoiceRow } from "@kharon/domain";

const finance = new Hono<AppBindings>();

finance.use("*", requireSession());
finance.use("*", requireRoles("finance", "admin"));

finance.post("/quotes", async (c) => {
  const correlationId = c.get("correlationId");
  const user = getSessionUser(c);
  const store = c.get("store");
  const body = await parseJsonBody(c, financeQuoteCreateSchema);
  const quote = {
    quote_id: `QTE-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
    job_id: body.job_id,
    client_id: body.client_id,
    description: body.description,
    amount: body.amount,
    status: "draft" as const,
    created_at: nowIso(),
    ...createMutable(user.user_id, correlationId)
  };

  await store.createFinanceQuote(quote);
  await store.appendAudit({
    action: "workspace.upgrade.finance.quote.create",
    payload: quote,
    ctx: createStoreContext(user.user_id, correlationId)
  });

  return c.json(envelopeSuccess({ correlationId, rowVersion: quote.row_version, data: quote }));
});

finance.post("/quotes/:quote_id/status", async (c) => {
  const correlationId = c.get("correlationId");
  const user = getSessionUser(c);
  const store = c.get("store");
  const quote_id = c.req.param("quote_id");
  const body = await parseJsonBody(c, financeQuoteStatusSchema);
  const updated = await store.updateFinanceQuoteStatus({
    quote_id,
    status: body.status,
    ctx: createStoreContext(user.user_id, correlationId)
  });
  if (!updated) {
    return c.json(envelopeError({ correlationId, error: { code: "not_found", message: "Quote not found" } }), 404);
  }
  return c.json(envelopeSuccess({ correlationId, rowVersion: updated.row_version, data: updated }));
});

finance.post("/invoices/from-quote", async (c) => {
  const correlationId = c.get("correlationId");
  const user = getSessionUser(c);
  const store = c.get("store");
  const body = await parseJsonBody(c, financeInvoiceFromQuoteSchema);
  const quotes = await store.listFinanceQuotes();
  const quote = quotes.find((item) => item.quote_id === body.quote_id) ?? null;
  if (!quote) {
    return c.json(envelopeError({ correlationId, error: { code: "not_found", message: "Quote not found" } }), 404);
  }

  const invoice = {
    invoice_id: `INV-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
    job_id: quote.job_id,
    quote_id: quote.quote_id,
    client_id: quote.client_id,
    amount: quote.amount,
    due_date: body.due_date,
    status: "issued" as const,
    reconciled_at: "",
    ...createMutable(user.user_id, correlationId)
  };

  await store.createFinanceInvoice(invoice);
  await store.updateFinanceQuoteStatus({
    quote_id: quote.quote_id,
    status: "invoiced",
    ctx: createStoreContext(user.user_id, correlationId)
  });

  return c.json(envelopeSuccess({ correlationId, rowVersion: invoice.row_version, data: invoice }));
});

finance.post("/invoices/:invoice_id/reconcile", async (c) => {
  const correlationId = c.get("correlationId");
  const user = getSessionUser(c);
  const store = c.get("store");
  const invoice_id = c.req.param("invoice_id");
  const invoices = await store.listFinanceInvoices();
  const current = invoices.find((item) => item.invoice_id === invoice_id) ?? null;
  if (!current) {
    return c.json(envelopeError({ correlationId, error: { code: "not_found", message: "Invoice not found" } }), 404);
  }

  const updated = {
    ...current,
    status: "paid" as const,
    reconciled_at: nowIso(),
    ...bumpMutableMeta(current, user.user_id, correlationId)
  };
  await store.updateFinanceInvoice(updated);

  const escrowRows = await store.listEscrowRows();
  for (const escrow of escrowRows.filter((item) => item.invoice_id === invoice_id && item.status === "locked")) {
    await store.upsertEscrow({
      ...escrow,
      status: "released",
      released_at: nowIso(),
      ...bumpMutableMeta(escrow, user.user_id, correlationId)
    });
  }

  return c.json(envelopeSuccess({ correlationId, rowVersion: updated.row_version, data: updated }));
});

finance.post("/escrow/lock", async (c) => {
  const correlationId = c.get("correlationId");
  const user = getSessionUser(c);
  const store = c.get("store");
  const body = await parseJsonBody(c, financeEscrowLockSchema);
  const existing = await store.getEscrowByDocument(body.document_id);
  const row = {
    document_id: body.document_id,
    invoice_id: body.invoice_id,
    status: "locked" as const,
    locked_at: existing?.locked_at || nowIso(),
    released_at: "",
    ...(existing
      ? bumpMutableMeta(existing, user.user_id, correlationId)
      : createMutable(user.user_id, correlationId))
  };
  await store.upsertEscrow(row);
  return c.json(envelopeSuccess({ correlationId, rowVersion: row.row_version, data: row }));
});

finance.get("/escrow/:document_id", async (c) => {
  const correlationId = c.get("correlationId");
  const store = c.get("store");
  const document_id = c.req.param("document_id");
  const row = await store.getEscrowByDocument(document_id);
  return c.json(envelopeSuccess({ correlationId, data: row }));
});

finance.post("/analytics/rebuild", async (c) => {
  const correlationId = c.get("correlationId");
  const user = getSessionUser(c);
  const store = c.get("store");
  const invoices = await store.listFinanceInvoices();
  const byClient = new Map<string, FinanceInvoiceRow[]>();
  for (const invoice of invoices) {
    const list = byClient.get(invoice.client_id) ?? [];
    list.push(invoice);
    byClient.set(invoice.client_id, list);
  }

  const debtors: FinanceDebtorRow[] = [];
  const statements: FinanceStatementRow[] = [];
  const today = Date.now();
  const period = nowIso().slice(0, 7);

  for (const [client_id, rows] of byClient.entries()) {
    let total = 0, c0 = 0, c30 = 0, c60 = 0, c90 = 0, billed = 0, paid = 0;
    for (const invoice of rows) {
      billed += invoice.amount;
      if (invoice.status === "paid") {
        paid += invoice.amount;
        continue;
      }
      total += invoice.amount;
      const ageDays = Math.floor((today - Date.parse(invoice.due_date)) / 86400000);
      if (ageDays <= 0) c0 += invoice.amount;
      else if (ageDays <= 30) c30 += invoice.amount;
      else if (ageDays <= 60) c60 += invoice.amount;
      else c90 += invoice.amount;
    }
    const risk_band: FinanceDebtorRow["risk_band"] = c90 > 0 ? "high" : c60 > 0 ? "medium" : "low";
    debtors.push({ client_id, total_due: total, current_bucket: c0, bucket_30: c30, bucket_60: c60, bucket_90_plus: c90, risk_band, ...createMutable(user.user_id, correlationId) });
    const safeClient = client_id.replace(/[^A-Za-z0-9]/g, "").slice(0, 10).toUpperCase();
    statements.push({ statement_id: `STM-${period.replace("-", "")}-${safeClient || "CLIENT"}`, client_id, period_label: period, opening_balance: Math.max(0, total - billed + paid), billed, paid, closing_balance: total, generated_at: nowIso(), ...createMutable(user.user_id, correlationId) });
  }

  await store.replaceFinanceDebtors(debtors);
  await store.replaceFinanceStatements(statements);
  return c.json(envelopeSuccess({ correlationId, data: { debtors: debtors.length, statements: statements.length } }));
});

export default finance;
