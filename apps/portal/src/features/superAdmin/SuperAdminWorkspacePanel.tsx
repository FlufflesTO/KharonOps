import React from "react";
import type { Role } from "@kharon/domain";
import type { 
  OpsIntelligencePayload, 
  SchemaDriftPayload, 
  AutomationJobEntry, 
  PeopleDirectoryEntry,
  UpgradeWorkspaceState,
  SkillMatrixRecord
} from "../../apiClient";
import { SuperAdminOverview } from "../../components/SuperAdminOverview";
import { SuperAdminDataChecks } from "../../components/SuperAdminDataChecks";
import { SuperAdminAutomations } from "../../components/SuperAdminAutomations";
import { SuperAdminSystemHealth } from "../../components/SuperAdminSystemHealth";
import { SuperAdminActivityLog } from "../../components/SuperAdminActivityLog";
import { SuperAdminBusinessUnits } from "../../components/SuperAdminBusinessUnits";
import { PeopleDirectoryCard } from "../../components/PeopleDirectoryCard";

interface SuperAdminWorkspacePanelProps {
  activeWorkspaceTool: string;
  effectiveRole: string;
  opsIntelligence: OpsIntelligencePayload | null;
  schemaDrift: SchemaDriftPayload | null;
  adminHealth: Record<string, unknown> | null;
  adminHealthState: "idle" | "loading" | "ready" | "error" | "unauthorized";
  adminHealthMessage: string;
  adminAudits: Array<Record<string, unknown>>;
  adminAuditCount: number;
  adminAutomationJobs: Array<Record<string, unknown>>;
  automationJobs: AutomationJobEntry[];
  selectedAutomationJobid: string;
  onSelectAutomationJobid: (id: string) => void;
  onLoadHealth: () => void;
  onLoadAudits: () => void;
  onLoadAutomationJobs: () => void;
  onRetryAutomation: (id: string) => void;
  onLoadSchemaDrift: () => void;
  onLoadOpsIntelligence: () => void;
  peopleDirectory: PeopleDirectoryEntry[];
  upgradeState: UpgradeWorkspaceState;
  onUpsertSkill: (payload: SkillMatrixRecord) => void;
  onPeopleSync: (payload: { name: string; email: string; phone: string; roleHint: string }) => Promise<void>;
  onFeedback: (msg: string) => void;
  actionPending: boolean;
}

export function SuperAdminWorkspacePanel({
  activeWorkspaceTool,
  effectiveRole,
  opsIntelligence,
  schemaDrift,
  adminHealth,
  adminHealthState,
  adminHealthMessage,
  adminAudits,
  adminAuditCount,
  adminAutomationJobs,
  automationJobs,
  selectedAutomationJobid,
  onSelectAutomationJobid,
  onLoadHealth,
  onLoadAudits,
  onLoadAutomationJobs,
  onRetryAutomation,
  onLoadSchemaDrift,
  onLoadOpsIntelligence,
  peopleDirectory,
  upgradeState,
  onUpsertSkill,
  onPeopleSync,
  onFeedback,
  actionPending
}: SuperAdminWorkspacePanelProps): React.JSX.Element | null {
  const canViewRecovery = effectiveRole === "admin" || effectiveRole === "super_admin";
  if (effectiveRole !== "super_admin" && !canViewRecovery) return null;

  return (
    <>
      {activeWorkspaceTool === "sa_overview" ? <SuperAdminOverview opsIntelligence={opsIntelligence} onRefresh={onLoadOpsIntelligence} isLoading={actionPending} /> : null}
      {activeWorkspaceTool === "sa_users" ? (
        <PeopleDirectoryCard people={peopleDirectory} skillsState={upgradeState.skills} onUpsertSkill={onUpsertSkill} onSync={onPeopleSync} onFeedback={onFeedback} />
      ) : null}
      {activeWorkspaceTool === "sa_units" ? <SuperAdminBusinessUnits /> : null}
      {activeWorkspaceTool === "sa_checks" ? <SuperAdminDataChecks schemaDrift={schemaDrift} onRefresh={onLoadSchemaDrift} isLoading={actionPending} /> : null}
      {activeWorkspaceTool === "sa_automations" ? <SuperAdminAutomations automationJobs={adminAutomationJobs} onRefresh={onLoadAutomationJobs} onRetry={onRetryAutomation} isLoading={actionPending} /> : null}
      {activeWorkspaceTool === "sa_health" && canViewRecovery ? (
        <SuperAdminSystemHealth
          adminHealth={adminHealth}
          adminHealthState={adminHealthState}
          adminHealthMessage={adminHealthMessage}
          onRefresh={onLoadHealth}
          isLoading={actionPending}
        />
      ) : null}
      {activeWorkspaceTool === "sa_activity" ? <SuperAdminActivityLog adminAudits={adminAudits} adminAuditCount={adminAuditCount} onRefresh={onLoadAudits} isLoading={actionPending} /> : null}
    </>
  );
}
