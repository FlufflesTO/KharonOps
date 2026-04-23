import React from "react";
import type { Role } from "@kharon/domain";
import type { OpsIntelligencePayload, SchemaDriftPayload, AutomationJobEntry } from "../../apiClient";
import { AdminDashboard } from "../../components/AdminDashboard";
import { AdminSettingsCard } from "../../components/AdminSettingsCard";
import { AdminPanelCard } from "../../components/AdminPanelCard";

interface AdminWorkspacePanelProps {
  activeWorkspaceTool: string;
  effectiveRole: string;
  isRealSuperAdmin: boolean;
  emulatedRole: Role | "";
  session: any;
  defaultWorkspaceTool: string;
  onboardingDismissed: boolean;
  allowedWorkspaceTools: string[];
  pinnedTools: string[];
  onActiveWorkspaceToolChange: (tool: string) => void;
  opsIntelligence: OpsIntelligencePayload | null;
  adminHealth: Record<string, unknown> | null;
  adminHealthState: "idle" | "loading" | "ready" | "error" | "unauthorized";
  adminHealthMessage: string;
  adminAudits: Array<Record<string, unknown>>;
  adminAutomationJobs: Array<Record<string, unknown>>;
  adminAuditCount: number;
  automationJobs: AutomationJobEntry[];
  selectedAutomationJobid: string;
  onSelectAutomationJobid: (id: string) => void;
  onLoadHealth: () => void;
  onLoadAudits: () => void;
  onLoadAutomationJobs: () => void;
  onRetryAutomation: (id: string) => void;
  onEmulateRole: (role: Role | "") => void;
  schemaDrift: SchemaDriftPayload | null;
  onLoadSchemaDrift: () => void;
  onLoadOpsIntelligence: () => void;
  actionPending: boolean;
  onFeedback: (msg: string) => void;
}

export function AdminWorkspacePanel({
  activeWorkspaceTool,
  effectiveRole,
  isRealSuperAdmin,
  emulatedRole,
  session,
  defaultWorkspaceTool,
  onboardingDismissed,
  allowedWorkspaceTools,
  pinnedTools,
  onActiveWorkspaceToolChange,
  opsIntelligence,
  adminHealth,
  adminHealthState,
  adminHealthMessage,
  adminAudits,
  adminAutomationJobs,
  adminAuditCount,
  automationJobs,
  selectedAutomationJobid,
  onSelectAutomationJobid,
  onLoadHealth,
  onLoadAudits,
  onLoadAutomationJobs,
  onRetryAutomation,
  onEmulateRole,
  schemaDrift,
  onLoadSchemaDrift,
  onLoadOpsIntelligence,
  actionPending,
  onFeedback
}: AdminWorkspacePanelProps): React.JSX.Element | null {
  if (effectiveRole !== "admin" && effectiveRole !== "super_admin") return null;

  return (
    <>
      {activeWorkspaceTool === "admin_dashboard" ? (
        <AdminDashboard
          opsIntelligence={opsIntelligence}
          onEnterTool={onActiveWorkspaceToolChange}
          canSwitchRoles={isRealSuperAdmin}
          emulatedRole={emulatedRole}
          onEmulateRole={onEmulateRole}
          isLoading={actionPending}
        />
      ) : null}
      {activeWorkspaceTool === "admin" && effectiveRole === "admin" ? (
        <AdminSettingsCard
          session={session}
          defaultWorkspaceTool={defaultWorkspaceTool}
          pinnedTools={pinnedTools}
          onboardingDismissed={onboardingDismissed}
          allowedWorkspaceTools={allowedWorkspaceTools}
          onSavePreferences={() => undefined}
        />
      ) : null}
      {activeWorkspaceTool === "admin" && effectiveRole === "super_admin" ? (
        <AdminPanelCard
          adminHealth={adminHealth}
          adminHealthState={adminHealthState}
          adminHealthMessage={adminHealthMessage}
          adminAudits={adminAudits}
          adminAutomationJobs={adminAutomationJobs}
          adminAuditCount={adminAuditCount}
          automationJobs={automationJobs}
          selectedAutomationJobid={selectedAutomationJobid}
          setSelectedAutomationJobid={onSelectAutomationJobid}
          onLoadHealth={onLoadHealth}
          onLoadAudits={onLoadAudits}
          onLoadAutomationJobs={onLoadAutomationJobs}
          onRetryAutomation={onRetryAutomation}
          onFeedback={onFeedback}
          emulatedRole={emulatedRole}
          onEmulateRole={onEmulateRole}
          schemaDrift={schemaDrift}
          opsIntelligence={opsIntelligence}
          onLoadSchemaDrift={onLoadSchemaDrift}
          onLoadOpsIntelligence={onLoadOpsIntelligence}
        />
      ) : null}
    </>
  );
}
