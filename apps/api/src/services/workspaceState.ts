import type { UpgradeWorkspaceState } from "@kharon/domain";
import type { WorkbookStore } from "../store/types.js";

export async function readUpgradeWorkspaceState(store: WorkbookStore): Promise<UpgradeWorkspaceState> {
  const [quotes, invoices, statements, debtors, escrow, skills] = await Promise.all([
    store.listFinanceQuotes(),
    store.listFinanceInvoices(),
    store.listFinanceStatements(),
    store.listFinanceDebtors(),
    store.listEscrowRows(),
    store.listSkillMatrix()
  ]);

  return { quotes, invoices, statements, debtors, escrow, skills };
}
