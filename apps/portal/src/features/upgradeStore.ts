export interface QuoteRecord {
  quote_uid: string;
  job_uid: string;
  client_uid: string;
  description: string;
  amount: number;
  status: "draft" | "sent" | "approved" | "rejected" | "invoiced";
  created_at: string;
}

export interface InvoiceRecord {
  invoice_uid: string;
  job_uid: string;
  quote_uid: string;
  client_uid: string;
  amount: number;
  due_date: string;
  status: "issued" | "part_paid" | "paid" | "overdue";
  reconciled_at: string;
}

export interface StatementRecord {
  statement_uid: string;
  client_uid: string;
  period_label: string;
  opening_balance: number;
  billed: number;
  paid: number;
  closing_balance: number;
  generated_at: string;
}

export interface DebtorRecord {
  client_uid: string;
  total_due: number;
  current_bucket: number;
  bucket_30: number;
  bucket_60: number;
  bucket_90_plus: number;
  risk_band: "low" | "medium" | "high";
  updated_at: string;
}

export interface EscrowRecord {
  document_uid: string;
  invoice_uid: string;
  status: "locked" | "released";
  locked_at: string;
  released_at: string;
}

export interface SkillMatrixRecord {
  user_uid: string;
  saqcc_type: string;
  saqcc_expiry: string;
  medical_expiry: string;
  rest_hours_last_24h: number;
  updated_at: string;
}

export interface UpgradeStore {
  quotes: QuoteRecord[];
  invoices: InvoiceRecord[];
  statements: StatementRecord[];
  debtors: DebtorRecord[];
  escrow: EscrowRecord[];
  skills: SkillMatrixRecord[];
}

const STORAGE_KEY = "kharon_upgrade_store_v1";

function nowIso(): string {
  return new Date().toISOString();
}

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function defaultState(): UpgradeStore {
  return {
    quotes: [],
    invoices: [],
    statements: [],
    debtors: [],
    escrow: [],
    skills: []
  };
}

export function loadUpgradeStore(): UpgradeStore {
  if (typeof window === "undefined") {
    return defaultState();
  }
  return safeParse<UpgradeStore>(window.localStorage.getItem(STORAGE_KEY), defaultState());
}

export function saveUpgradeStore(next: UpgradeStore): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export function upsertSkill(record: SkillMatrixRecord): UpgradeStore {
  const state = loadUpgradeStore();
  const skills = state.skills.filter((item) => item.user_uid !== record.user_uid);
  skills.push({ ...record, updated_at: nowIso() });
  const next = { ...state, skills };
  saveUpgradeStore(next);
  return next;
}

export function createQuote(payload: Omit<QuoteRecord, "quote_uid" | "created_at" | "status">): QuoteRecord {
  const state = loadUpgradeStore();
  const quote: QuoteRecord = {
    quote_uid: `QTE-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
    created_at: nowIso(),
    status: "draft",
    ...payload
  };
  const next = { ...state, quotes: [quote, ...state.quotes] };
  saveUpgradeStore(next);
  return quote;
}

export function updateQuoteStatus(quote_uid: string, status: QuoteRecord["status"]): UpgradeStore {
  const state = loadUpgradeStore();
  const quotes: QuoteRecord[] = state.quotes.map((quote) =>
    quote.quote_uid === quote_uid ? { ...quote, status } : quote
  );
  const next = { ...state, quotes };
  saveUpgradeStore(next);
  return next;
}

export function createInvoiceFromQuote(quote_uid: string, due_date: string): InvoiceRecord | null {
  const state = loadUpgradeStore();
  const quote = state.quotes.find((item) => item.quote_uid === quote_uid);
  if (!quote) return null;
  const invoice: InvoiceRecord = {
    invoice_uid: `INV-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
    job_uid: quote.job_uid,
    quote_uid: quote.quote_uid,
    client_uid: quote.client_uid,
    amount: quote.amount,
    due_date,
    status: "issued",
    reconciled_at: ""
  };
  const quotes: QuoteRecord[] = state.quotes.map((item) =>
    item.quote_uid === quote_uid ? { ...item, status: "invoiced" } : item
  );
  const next = { ...state, quotes, invoices: [invoice, ...state.invoices] };
  saveUpgradeStore(next);
  return invoice;
}

export function reconcileInvoice(invoice_uid: string): UpgradeStore {
  const state = loadUpgradeStore();
  const invoices: InvoiceRecord[] = state.invoices.map((invoice) =>
    invoice.invoice_uid === invoice_uid ? { ...invoice, status: "paid", reconciled_at: nowIso() } : invoice
  );
  const escrow: EscrowRecord[] = state.escrow.map((item) =>
    item.invoice_uid === invoice_uid ? { ...item, status: "released", released_at: nowIso() } : item
  );
  const next = { ...state, invoices, escrow };
  saveUpgradeStore(next);
  return next;
}

export function lockEscrow(document_uid: string, invoice_uid: string): UpgradeStore {
  const state = loadUpgradeStore();
  const escrow = state.escrow.filter((item) => item.document_uid !== document_uid);
  escrow.push({
    document_uid,
    invoice_uid,
    status: "locked",
    locked_at: nowIso(),
    released_at: ""
  });
  const next = { ...state, escrow };
  saveUpgradeStore(next);
  return next;
}

export function getEscrowStatus(document_uid: string): EscrowRecord | null {
  const state = loadUpgradeStore();
  return state.escrow.find((item) => item.document_uid === document_uid) ?? null;
}

export function rebuildDebtorsAndStatements(): UpgradeStore {
  const state = loadUpgradeStore();
  const byClient = new Map<string, InvoiceRecord[]>();
  for (const invoice of state.invoices) {
    const list = byClient.get(invoice.client_uid) ?? [];
    list.push(invoice);
    byClient.set(invoice.client_uid, list);
  }

  const debtors: DebtorRecord[] = [];
  const statements: StatementRecord[] = [];
  const today = Date.now();

  for (const [client_uid, invoices] of byClient.entries()) {
    let total = 0;
    let c0 = 0;
    let c30 = 0;
    let c60 = 0;
    let c90 = 0;
    let billed = 0;
    let paid = 0;

    for (const invoice of invoices) {
      billed += invoice.amount;
      if (invoice.status === "paid") {
        paid += invoice.amount;
        continue;
      }
      total += invoice.amount;
      const ageDays = Math.floor((today - Date.parse(invoice.due_date)) / (1000 * 60 * 60 * 24));
      if (ageDays <= 0) c0 += invoice.amount;
      else if (ageDays <= 30) c30 += invoice.amount;
      else if (ageDays <= 60) c60 += invoice.amount;
      else c90 += invoice.amount;
    }

    const risk_band: DebtorRecord["risk_band"] = c90 > 0 ? "high" : c60 > 0 ? "medium" : "low";
    debtors.push({
      client_uid,
      total_due: total,
      current_bucket: c0,
      bucket_30: c30,
      bucket_60: c60,
      bucket_90_plus: c90,
      risk_band,
      updated_at: nowIso()
    });

    statements.push({
      statement_uid: `STM-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
      client_uid,
      period_label: new Date().toISOString().slice(0, 7),
      opening_balance: Math.max(0, total - billed + paid),
      billed,
      paid,
      closing_balance: total,
      generated_at: nowIso()
    });
  }

  const next = { ...state, debtors, statements };
  saveUpgradeStore(next);
  return next;
}
