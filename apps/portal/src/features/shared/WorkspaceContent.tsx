import React from "react";
import { OperationalWorkspacePanel } from "./OperationalWorkspacePanel";
import { GovernanceWorkspacePanel } from "./GovernanceWorkspacePanel";
import type { PortalWorkspaceState } from "../../components/PortalWorkspace";

interface WorkspaceContentProps {
  state: PortalWorkspaceState;
}

export function WorkspaceContent({ state }: WorkspaceContentProps): React.JSX.Element {
  return (
    <section className={`workspace-container ${state.activeWorkspaceTool === "jobs" && state.selectedJobid ? "workspace-container--split" : ""}`}>
      <OperationalWorkspacePanel state={state} />
      <GovernanceWorkspacePanel state={state} />
    </section>
  );
}
