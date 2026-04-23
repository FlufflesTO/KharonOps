import React from "react";
import type { OpsIntelligencePayload, SchemaDriftPayload, AutomationJobEntry, PeopleDirectoryEntry } from "../../apiClient";
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
  upgradeState: { skills: any };
  onUpsertSkill: (payload: any) => void;
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
  if (effectiveRole !== "super_admin") return null;

  return (
    <>
      {activeWorkspaceTool === "sa_overview" ? <SuperAdminOverview opsIntelligence={opsIntelligence} onRefresh={onLoadOpsIntelligence} isLoading={actionPending} /> : null}
      {activeWorkspaceTool === "sa_users" ? (
        <PeopleDirectoryCard people={peopleDirectory as any} skillsState={upgradeState.skills} onUpsertSkill={onUpsertSkill} onSync={onPeopleSync as any} onFeedback={onFeedback} />
      ) : null}
      {activeWorkspaceTool === "sa_units" ? <SuperAdminBusinessUnits /> : null}
      {activeWorkspaceTool === "sa_checks" ? <SuperAdminDataChecks schemaDrift={schemaDrift} onRefresh={onLoadSchemaDrift} isLoading={actionPending} /> : null}
      {activeWorkspaceTool === "sa_automations" ? <SuperAdminAutomations automationJobs={adminAutomationJobs} onRefresh={onLoadAutomationJobs} onRetry={onRetryAutomation} isLoading={actionPending} /> : null}
      {activeWorkspaceTool === "sa_health" ? (
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
