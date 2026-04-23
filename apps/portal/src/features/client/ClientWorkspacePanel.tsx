import React from "react";
import type { UpgradeWorkspaceState } from "../../apiClient";
import type { JobRecord } from "../../components/JobListView";
import { ClientOverviewCard } from "../../components/ClientOverviewCard";
import { ClientInvoicesCard } from "../../components/ClientInvoicesCard";
import { ClientSupportCard } from "../../components/ClientSupportCard";

interface ClientWorkspacePanelProps {
  activeWorkspaceTool: string;
  effectiveRole: string;
  jobs: JobRecord[];
  store: UpgradeWorkspaceState;
  onActiveWorkspaceToolChange: (tool: string) => void;
}

export function ClientWorkspacePanel({
  activeWorkspaceTool,
  effectiveRole,
  jobs,
  store,
  onActiveWorkspaceToolChange
}: ClientWorkspacePanelProps): React.JSX.Element | null {
  if (effectiveRole !== "client") return null;

  return (
    <>
      {activeWorkspaceTool === "client_overview" ? <ClientOverviewCard jobs={jobs} store={store} onEnterTool={onActiveWorkspaceToolChange} /> : null}
      {activeWorkspaceTool === "client_invoices" ? <ClientInvoicesCard store={store} /> : null}
      {activeWorkspaceTool === "client_support" ? <ClientSupportCard /> : null}
    </>
  );
}
