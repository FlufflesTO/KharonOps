import React from "react";
import type { UpgradeWorkspaceState } from "../../apiClient";
import { FinanceOpsCard } from "../../components/FinanceOpsCard";
import { FinanceOverviewCard } from "../../components/FinanceOverviewCard";
import { FinanceQuotesCard } from "../../components/FinanceQuotesCard";
import { FinanceInvoicesCard } from "../../components/FinanceInvoicesCard";
import { FinancePaymentsCard } from "../../components/FinancePaymentsCard";
import { FinanceDebtorsCard } from "../../components/FinanceDebtorsCard";
import { FinanceStatementsCard } from "../../components/FinanceStatementsCard";
import type { JobRecord } from "../../components/JobListView";

interface FinanceWorkspacePanelProps {
  activeWorkspaceTool: string;
  effectiveRole: string;
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
  onActiveWorkspaceToolChange: (tool: string) => void;
}

export function FinanceWorkspacePanel({
  activeWorkspaceTool,
  effectiveRole,
  jobs,
  documents,
  store,
  onRefreshStore,
  onCreateQuote,
  onUpdateQuoteStatus,
  onCreateInvoiceFromQuote,
  onReconcileInvoice,
  onLockEscrow,
  onRebuildAnalytics,
  onActiveWorkspaceToolChange
}: FinanceWorkspacePanelProps): React.JSX.Element | null {
  if (effectiveRole !== "finance" && effectiveRole !== "super_admin") return null;

  return (
    <>
      {activeWorkspaceTool === "finance_overview" ? <FinanceOverviewCard store={store} onEnterTool={onActiveWorkspaceToolChange} isLoading={false} /> : null}
      {activeWorkspaceTool === "finance_quotes" ? <FinanceQuotesCard store={store} onCreateQuote={onCreateQuote} onUpdateQuoteStatus={onUpdateQuoteStatus} /> : null}
      {activeWorkspaceTool === "finance_invoices" ? <FinanceInvoicesCard store={store} onCreateInvoiceFromQuote={onCreateInvoiceFromQuote} /> : null}
      {activeWorkspaceTool === "finance_payments" ? <FinancePaymentsCard store={store} onReconcileInvoice={onReconcileInvoice} /> : null}
      {activeWorkspaceTool === "finance_debtors" ? <FinanceDebtorsCard store={store} onRebuildAnalytics={onRebuildAnalytics} /> : null}
      {activeWorkspaceTool === "finance_statements" ? <FinanceStatementsCard store={store} /> : null}
      {activeWorkspaceTool === "finance" ? (
        <FinanceOpsCard
          jobs={jobs}
          documents={documents}
          store={store}
          onRefreshStore={onRefreshStore}
          onCreateQuote={onCreateQuote}
          onUpdateQuoteStatus={onUpdateQuoteStatus}
          onCreateInvoiceFromQuote={onCreateInvoiceFromQuote}
          onReconcileInvoice={onReconcileInvoice}
          onLockEscrow={onLockEscrow}
          onRebuildAnalytics={onRebuildAnalytics}
        />
      ) : null}
    </>
  );
}
