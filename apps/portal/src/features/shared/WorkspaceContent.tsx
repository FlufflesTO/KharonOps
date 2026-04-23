import React from "react";
import type { Role } from "@kharon/domain";
import { JobDetailView } from "../../components/JobDetailView";
import { DocumentHistoryCard } from "../../components/DocumentHistoryCard";
import { PeopleDirectoryCard } from "../../components/PeopleDirectoryCard";
import { ScheduleControlCard } from "../../components/ScheduleControlCard";
import { CommunicationRailsCard } from "../../components/CommunicationRailsCard";
import { AdminDashboard } from "../../components/AdminDashboard";
import { AdminSettingsCard } from "../../components/AdminSettingsCard";
import { AdminPanelCard } from "../../components/AdminPanelCard";
import { DispatchDashboardCard } from "../../components/DispatchDashboardCard";
import { DispatchUnassignedCard } from "../../components/DispatchUnassignedCard";
import { DispatchDailyPlanCard } from "../../components/DispatchDailyPlanCard";
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
import { TechMyDayCard } from "../../components/TechMyDayCard";
import { TechCheckInOutCard } from "../../components/TechCheckInOutCard";
import { TechHelpCard } from "../../components/TechHelpCard";
import { ClientOverviewCard } from "../../components/ClientOverviewCard";
import { ClientInvoicesCard } from "../../components/ClientInvoicesCard";
import { ClientSupportCard } from "../../components/ClientSupportCard";

interface WorkspaceContentProps {
  state: any;
}

export function WorkspaceContent({ state }: WorkspaceContentProps): React.JSX.Element {
  const {
    effectiveRole,
    emulatedRole,
    jobs,
    selectedJob,
    selectedJobDocumentCount,
    selectedJobTitle,
    selectedJobid,
    selectedRequestid,
    selectedScheduleid,
    selectedDocumentid,
    dispatchRequests,
    dispatchSchedules,
    dispatchDocuments,
    technicians,
    preferredStart,
    setPreferredStart,
    preferredEnd,
    setPreferredEnd,
    confirmStart,
    setConfirmStart,
    confirmEnd,
    setConfirmEnd,
    confirmTechid,
    setConfirmTechid,
    rescheduleStart,
    setRescheduleStart,
    rescheduleEnd,
    setRescheduleEnd,
    rescheduleRowVersion,
    setRescheduleRowVersion,
    documentType,
    setDocumentType,
    onStatusUpdate,
    onNote,
    noteValue,
    setNoteValue,
    statusTarget,
    setStatusTarget,
    selectableStatuses,
    onScheduleRequest,
    onScheduleConfirm,
    onReschedule,
    onDocumentGenerate,
    onDocumentPublish,
    canGenerateDocuments,
    documentGenerateDisabledReason,
    documentAccessDenied,
    dispatchAccessDenied,
    geoVerification,
    onVerifyLocation,
    syncPulseText,
    jobEvents,
    onActiveWorkspaceToolChange,
    activeWorkspaceTool,
    peopleDirectory,
    upgradeState,
    onUpsertSkill,
    onPeopleSync,
    opsIntelligence,
    schemaDrift,
    adminHealth,
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
    defaultWorkspaceTool,
    allowedWorkspaceTools,
    session,
    onboardingDismissed,
    onFeedback
  } = state;

  return (
    <section className={`workspace-container ${activeWorkspaceTool === "jobs" && selectedJobid ? "workspace-container--split" : ""}`}>
      {activeWorkspaceTool === "tech_day" && effectiveRole === "technician" ? (
        <TechMyDayCard jobs={jobs} onSelectJob={state.onSelectJobid} onEnterTool={(tool: string) => onActiveWorkspaceToolChange(tool)} />
      ) : null}
      {activeWorkspaceTool === "tech_checkin" && effectiveRole === "technician" ? (
        <TechCheckInOutCard selectedJob={selectedJob} onUpdateStatus={() => onStatusUpdate()} onVerifyLocation={onVerifyLocation} geoStatus={geoVerification.status} />
      ) : null}
      {activeWorkspaceTool === "tech_help" && effectiveRole === "technician" ? <TechHelpCard /> : null}
      {activeWorkspaceTool === "client_overview" && effectiveRole === "client" ? (
        <ClientOverviewCard jobs={jobs} store={upgradeState} onEnterTool={(tool: string) => onActiveWorkspaceToolChange(tool)} />
      ) : null}
      {activeWorkspaceTool === "client_invoices" && effectiveRole === "client" ? <ClientInvoicesCard store={upgradeState} /> : null}
      {activeWorkspaceTool === "client_support" && effectiveRole === "client" ? <ClientSupportCard /> : null}
      {activeWorkspaceTool === "dispatch_dashboard" && (effectiveRole === "dispatcher" || effectiveRole === "super_admin") ? (
        <DispatchDashboardCard opsIntelligence={opsIntelligence} onEnterTool={(tool: string) => onActiveWorkspaceToolChange(tool)} isLoading={actionPending} />
      ) : null}
      {activeWorkspaceTool === "dispatch_unassigned" && (effectiveRole === "dispatcher" || effectiveRole === "super_admin") ? (
        <DispatchUnassignedCard jobs={jobs} onSelectJob={state.onSelectJobid} onEnterTool={(tool: string) => onActiveWorkspaceToolChange(tool)} />
      ) : null}
      {activeWorkspaceTool === "dispatch_daily" && (effectiveRole === "dispatcher" || effectiveRole === "super_admin") ? (
        <DispatchDailyPlanCard jobs={jobs} opsIntelligence={opsIntelligence} />
      ) : null}
      {activeWorkspaceTool === "schedule" && (effectiveRole === "dispatcher" || effectiveRole === "super_admin") && !dispatchAccessDenied ? (
        <ScheduleControlCard
          selectedJobid={selectedJob?.job_id ?? ""}
          preferredStart={preferredStart}
          setPreferredStart={setPreferredStart}
          preferredEnd={preferredEnd}
          setPreferredEnd={setPreferredEnd}
          requests={dispatchRequests}
          selectedRequestid={selectedRequestid}
          setSelectedRequestid={() => undefined}
          confirmStart={confirmStart}
          setConfirmStart={setConfirmStart}
          confirmEnd={confirmEnd}
          setConfirmEnd={setConfirmEnd}
          confirmTechid={confirmTechid}
          setConfirmTechid={setConfirmTechid}
          technicians={technicians}
          schedules={dispatchSchedules}
          selectedScheduleid={selectedScheduleid}
          setSelectedScheduleid={() => undefined}
          rescheduleStart={rescheduleStart}
          setRescheduleStart={setRescheduleStart}
          rescheduleEnd={rescheduleEnd}
          setRescheduleEnd={setRescheduleEnd}
          rescheduleRowVersion={rescheduleRowVersion}
          setRescheduleRowVersion={setRescheduleRowVersion}
          documents={dispatchDocuments}
          selectedDocumentid={selectedDocumentid}
          setSelectedDocumentid={() => undefined}
          onScheduleRequest={onScheduleRequest}
          onScheduleConfirm={onScheduleConfirm}
          onReschedule={onReschedule}
          onDocumentPublish={onDocumentPublish}
          onFeedback={onFeedback}
        />
      ) : null}
      {activeWorkspaceTool === "comms" && (effectiveRole === "dispatcher" || effectiveRole === "super_admin") ? (
        <CommunicationRailsCard selectedJobid={selectedJob?.job_id ?? ""} selectedJobTitle={selectedJob?.title ?? ""} onFeedback={onFeedback} />
      ) : null}
      {activeWorkspaceTool === "jobs" ? (
        <JobDetailView
          selectedJob={selectedJob}
          role={(effectiveRole || "client") as Role}
          selectableStatuses={selectableStatuses}
          statusTarget={statusTarget}
          setStatusTarget={setStatusTarget}
          noteValue={noteValue}
          setNoteValue={setNoteValue}
          onStatusUpdate={onStatusUpdate}
          onNote={onNote}
          preferredStart={preferredStart}
          setPreferredStart={setPreferredStart}
          preferredEnd={preferredEnd}
          setPreferredEnd={setPreferredEnd}
          onScheduleRequest={onScheduleRequest}
          documentType={documentType}
          setDocumentType={setDocumentType}
          onDocumentGenerate={onDocumentGenerate}
          canGenerateDocuments={canGenerateDocuments && !documentAccessDenied}
          documentGenerateDisabledReason={documentGenerateDisabledReason}
          onChecklistChange={() => undefined}
          selectedJobTitle={selectedJobTitle}
          documentCountForJob={selectedJobDocumentCount}
          geoVerification={geoVerification}
          onVerifyLocation={onVerifyLocation}
          syncPulseText={syncPulseText}
          events={jobEvents}
        />
      ) : null}
      {activeWorkspaceTool === "documents" ? (
        <DocumentHistoryCard
          documents={[]}
          selectedJobid={selectedJob?.job_id ?? ""}
          role={effectiveRole ?? "client"}
          escrowByDocumentid={{}}
          onRefresh={() => undefined}
          onPublish={() => undefined}
        />
      ) : null}
      {activeWorkspaceTool === "people" && (effectiveRole === "dispatcher" || effectiveRole === "admin" || effectiveRole === "super_admin") ? (
        <PeopleDirectoryCard people={peopleDirectory} skillsState={upgradeState.skills} onUpsertSkill={onUpsertSkill} onSync={onPeopleSync} onFeedback={onFeedback} />
      ) : null}
      {activeWorkspaceTool === "admin_dashboard" && (effectiveRole === "admin" || effectiveRole === "super_admin") ? (
        <AdminDashboard opsIntelligence={opsIntelligence} onEnterTool={(tool: string) => onActiveWorkspaceToolChange(tool)} isLoading={actionPending} />
      ) : null}
      {activeWorkspaceTool === "admin" ? (
        effectiveRole === "admin" ? (
          <AdminSettingsCard
            session={session}
            defaultWorkspaceTool={defaultWorkspaceTool}
            pinnedTools={[]}
            onboardingDismissed={onboardingDismissed}
            allowedWorkspaceTools={allowedWorkspaceTools}
            onSavePreferences={() => undefined}
          />
        ) : effectiveRole === "super_admin" ? (
          <AdminPanelCard
            adminHealth={adminHealth}
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
      {activeWorkspaceTool === "finance_overview" && (effectiveRole === "finance" || effectiveRole === "super_admin") ? (
        <FinanceOverviewCard store={upgradeState} onEnterTool={(tool: string) => onActiveWorkspaceToolChange(tool)} isLoading={actionPending} />
      ) : null}
      {activeWorkspaceTool === "finance_quotes" && (effectiveRole === "finance" || effectiveRole === "super_admin") ? (
        <FinanceQuotesCard store={upgradeState} onCreateQuote={() => undefined} onUpdateQuoteStatus={() => undefined} />
      ) : null}
      {activeWorkspaceTool === "finance_invoices" && (effectiveRole === "finance" || effectiveRole === "super_admin") ? (
        <FinanceInvoicesCard store={upgradeState} onCreateInvoiceFromQuote={() => undefined} />
      ) : null}
      {activeWorkspaceTool === "finance_payments" && (effectiveRole === "finance" || effectiveRole === "super_admin") ? (
        <FinancePaymentsCard store={upgradeState} onReconcileInvoice={() => undefined} />
      ) : null}
      {activeWorkspaceTool === "finance_debtors" && (effectiveRole === "finance" || effectiveRole === "super_admin") ? (
        <FinanceDebtorsCard store={upgradeState} onRebuildAnalytics={() => undefined} />
      ) : null}
      {activeWorkspaceTool === "finance_statements" && (effectiveRole === "finance" || effectiveRole === "super_admin") ? <FinanceStatementsCard store={upgradeState} /> : null}
      {activeWorkspaceTool === "finance" && (effectiveRole === "finance" || effectiveRole === "super_admin") ? (
        <FinanceOpsCard
          jobs={jobs}
          documents={[]}
          store={upgradeState}
          onRefreshStore={() => undefined}
          onCreateQuote={() => undefined}
          onUpdateQuoteStatus={() => undefined}
          onCreateInvoiceFromQuote={() => undefined}
          onReconcileInvoice={() => undefined}
          onLockEscrow={() => undefined}
          onRebuildAnalytics={() => undefined}
        />
      ) : null}
      {activeWorkspaceTool === "sa_overview" && effectiveRole === "super_admin" ? <SuperAdminOverview opsIntelligence={opsIntelligence} onRefresh={onLoadOpsIntelligence} isLoading={actionPending} /> : null}
      {activeWorkspaceTool === "sa_users" && effectiveRole === "super_admin" ? (
        <PeopleDirectoryCard
          people={peopleDirectory}
          skillsState={upgradeState.skills}
          onUpsertSkill={onUpsertSkill}
          onSync={onPeopleSync}
          onFeedback={onFeedback}
        />
      ) : null}
      {activeWorkspaceTool === "sa_units" && effectiveRole === "super_admin" ? <SuperAdminBusinessUnits /> : null}
      {activeWorkspaceTool === "sa_checks" && effectiveRole === "super_admin" ? <SuperAdminDataChecks schemaDrift={schemaDrift} onRefresh={onLoadSchemaDrift} isLoading={actionPending} /> : null}
      {activeWorkspaceTool === "sa_automations" && effectiveRole === "super_admin" ? <SuperAdminAutomations automationJobs={adminAutomationJobs} onRefresh={onLoadAutomationJobs} onRetry={onRetryAutomation} isLoading={actionPending} /> : null}
      {activeWorkspaceTool === "sa_health" && effectiveRole === "super_admin" ? <SuperAdminSystemHealth adminHealth={adminHealth} onRefresh={onLoadHealth} isLoading={actionPending} /> : null}
      {activeWorkspaceTool === "sa_activity" && effectiveRole === "super_admin" ? (
        <SuperAdminActivityLog adminAudits={adminAudits} adminAuditCount={adminAuditCount} onRefresh={onLoadAudits} isLoading={actionPending} />
      ) : null}
    </section>
  );
}
