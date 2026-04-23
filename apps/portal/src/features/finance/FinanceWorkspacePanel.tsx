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
  store: UpgradeWorkspaceState;
  onActiveWorkspaceToolChange: (tool: string) => void;
}

export function FinanceWorkspacePanel({
  activeWorkspaceTool,
  effectiveRole,
  jobs,
  store,
  onActiveWorkspaceToolChange
}: FinanceWorkspacePanelProps): React.JSX.Element | null {
  if (effectiveRole !== "finance" && effectiveRole !== "super_admin") return null;

  return (
    <>
      {activeWorkspaceTool === "finance_overview" ? <FinanceOverviewCard store={store} onEnterTool={onActiveWorkspaceToolChange} isLoading={false} /> : null}
      {activeWorkspaceTool === "finance_quotes" ? <FinanceQuotesCard store={store} onCreateQuote={() => undefined} onUpdateQuoteStatus={() => undefined} /> : null}
      {activeWorkspaceTool === "finance_invoices" ? <FinanceInvoicesCard store={store} onCreateInvoiceFromQuote={() => undefined} /> : null}
      {activeWorkspaceTool === "finance_payments" ? <FinancePaymentsCard store={store} onReconcileInvoice={() => undefined} /> : null}
      {activeWorkspaceTool === "finance_debtors" ? <FinanceDebtorsCard store={store} onRebuildAnalytics={() => undefined} /> : null}
      {activeWorkspaceTool === "finance_statements" ? <FinanceStatementsCard store={store} /> : null}
      {activeWorkspaceTool === "finance" ? (
        <FinanceOpsCard
          jobs={jobs}
          documents={[]}
          store={store}
          onRefreshStore={() => undefined}
          onCreateQuote={() => undefined}
          onUpdateQuoteStatus={() => undefined}
          onCreateInvoiceFromQuote={() => undefined}
          onReconcileInvoice={() => undefined}
          onLockEscrow={() => undefined}
          onRebuildAnalytics={() => undefined}
        />
      ) : null}
    </>
  );
}
