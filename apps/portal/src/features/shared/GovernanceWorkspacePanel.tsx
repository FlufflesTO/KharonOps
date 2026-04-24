import React from "react";
import { AdminDashboard } from "../../components/AdminDashboard";
import { AdminSettingsCard } from "../../components/AdminSettingsCard";
import { AdminPanelCard } from "../../components/AdminPanelCard";
import { FinanceOpsCard } from "../../components/FinanceOpsCard";
import { FinanceOverviewCard } from "../../components/FinanceOverviewCard";
import { FinanceQuotesCard } from "../../components/FinanceQuotesCard";
import { FinanceInvoicesCard } from "../../components/FinanceInvoicesCard";
import { FinancePaymentsCard } from "../../components/FinancePaymentsCard";
import { FinanceDebtorsCard } from "../../components/FinanceDebtorsCard";
import { FinanceStatementsCard } from "../../components/FinanceStatementsCard";
import { SuperAdminOverview } from "../../components/SuperAdminOverview";
import { SuperAdminDataChecks } from "../../components/SuperAdminDataChecks";
import { SuperAdminAutomations } from "../../components/SuperAdminAutomations";
import { SuperAdminSystemHealth } from "../../components/SuperAdminSystemHealth";
import { SuperAdminActivityLog } from "../../components/SuperAdminActivityLog";
import { SuperAdminBusinessUnits } from "../../components/SuperAdminBusinessUnits";
import { PeopleDirectoryCard } from "../../components/PeopleDirectoryCard";
import type { PortalWorkspaceState } from "../../components/PortalWorkspace";

interface GovernanceWorkspacePanelProps {
  state: PortalWorkspaceState;
}

export function GovernanceWorkspacePanel({ state }: GovernanceWorkspacePanelProps): React.JSX.Element {
  const {
    effectiveRole,
    emulatedRole,
    session,
    defaultWorkspaceTool,
    pinnedTools,
    onboardingDismissed,
    allowedWorkspaceTools,
    upgradeState,
    documents,
    opsIntelligence,
    schemaDrift,
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
    onLoadSchemaDrift,
    onLoadOpsIntelligence,
    actionPending,
    onFeedback,
    jobs,
    onActiveWorkspaceToolChange,
    onSaveWorkspacePreferences,
    onRefreshUpgradeState,
    onCreateQuote,
    onUpdateQuoteStatus,
    onCreateInvoiceFromQuote,
    onReconcileInvoice,
    onLockEscrow,
    onRebuildAnalytics,
    peopleDirectory,
    onUpsertSkill,
    onPeopleSync
  } = state;

  return (
    <>
      {state.activeWorkspaceTool === "admin_dashboard" && (effectiveRole === "admin" || effectiveRole === "super_admin") ? (
        <AdminDashboard
          opsIntelligence={opsIntelligence}
          onEnterTool={(tool: string) => onActiveWorkspaceToolChange(tool)}
          canSwitchRoles={Boolean(state.isRealSuperAdmin)}
          emulatedRole={emulatedRole}
          onEmulateRole={onEmulateRole}
          isLoading={actionPending}
        />
      ) : null}
      {state.activeWorkspaceTool === "admin" ? (
        effectiveRole === "admin" ? (
          <AdminSettingsCard
            session={session}
            defaultWorkspaceTool={defaultWorkspaceTool}
            pinnedTools={pinnedTools}
            onboardingDismissed={onboardingDismissed}
            allowedWorkspaceTools={allowedWorkspaceTools}
            onSavePreferences={onSaveWorkspacePreferences}
          />
        ) : effectiveRole === "super_admin" ? (
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
        ) : null
      ) : null}
      {state.activeWorkspaceTool === "finance_overview" && (effectiveRole === "finance" || effectiveRole === "super_admin") ? <FinanceOverviewCard store={upgradeState} onEnterTool={(tool: string) => onActiveWorkspaceToolChange(tool)} isLoading={actionPending} /> : null}
      {state.activeWorkspaceTool === "finance_quotes" && (effectiveRole === "finance" || effectiveRole === "super_admin") ? <FinanceQuotesCard store={upgradeState} onCreateQuote={onCreateQuote} onUpdateQuoteStatus={onUpdateQuoteStatus} /> : null}
      {state.activeWorkspaceTool === "finance_invoices" && (effectiveRole === "finance" || effectiveRole === "super_admin") ? <FinanceInvoicesCard store={upgradeState} onCreateInvoiceFromQuote={onCreateInvoiceFromQuote} /> : null}
      {state.activeWorkspaceTool === "finance_payments" && (effectiveRole === "finance" || effectiveRole === "super_admin") ? <FinancePaymentsCard store={upgradeState} onReconcileInvoice={onReconcileInvoice} /> : null}
      {state.activeWorkspaceTool === "finance_debtors" && (effectiveRole === "finance" || effectiveRole === "super_admin") ? <FinanceDebtorsCard store={upgradeState} onRebuildAnalytics={onRebuildAnalytics} /> : null}
      {state.activeWorkspaceTool === "finance_statements" && (effectiveRole === "finance" || effectiveRole === "super_admin") ? <FinanceStatementsCard store={upgradeState} /> : null}
      {state.activeWorkspaceTool === "finance" && (effectiveRole === "finance" || effectiveRole === "super_admin") ? <FinanceOpsCard jobs={jobs} documents={documents} store={upgradeState} onRefreshStore={onRefreshUpgradeState} onCreateQuote={onCreateQuote} onUpdateQuoteStatus={onUpdateQuoteStatus} onCreateInvoiceFromQuote={onCreateInvoiceFromQuote} onReconcileInvoice={onReconcileInvoice} onLockEscrow={onLockEscrow} onRebuildAnalytics={onRebuildAnalytics} /> : null}
      {state.activeWorkspaceTool === "sa_overview" && effectiveRole === "super_admin" ? <SuperAdminOverview opsIntelligence={opsIntelligence} onRefresh={onLoadOpsIntelligence} isLoading={actionPending} /> : null}
      {state.activeWorkspaceTool === "sa_users" && effectiveRole === "super_admin" ? <PeopleDirectoryCard people={peopleDirectory} skillsState={upgradeState.skills} onUpsertSkill={onUpsertSkill} onSync={onPeopleSync} onFeedback={onFeedback} /> : null}
      {state.activeWorkspaceTool === "sa_units" && effectiveRole === "super_admin" ? <SuperAdminBusinessUnits /> : null}
      {state.activeWorkspaceTool === "sa_checks" && effectiveRole === "super_admin" ? <SuperAdminDataChecks schemaDrift={schemaDrift} onRefresh={onLoadSchemaDrift} isLoading={actionPending} /> : null}
      {state.activeWorkspaceTool === "sa_automations" && effectiveRole === "super_admin" ? <SuperAdminAutomations automationJobs={adminAutomationJobs} onRefresh={onLoadAutomationJobs} onRetry={onRetryAutomation} isLoading={actionPending} /> : null}
      {state.activeWorkspaceTool === "sa_health" && effectiveRole === "super_admin" ? (
        <SuperAdminSystemHealth
          adminHealth={adminHealth}
          adminHealthState={adminHealthState}
          adminHealthMessage={adminHealthMessage}
          onRefresh={onLoadHealth}
          isLoading={actionPending}
        />
      ) : null}
      {state.activeWorkspaceTool === "sa_activity" && effectiveRole === "super_admin" ? <SuperAdminActivityLog adminAudits={adminAudits} adminAuditCount={adminAuditCount} onRefresh={onLoadAudits} isLoading={actionPending} /> : null}
    </>
  );
}
