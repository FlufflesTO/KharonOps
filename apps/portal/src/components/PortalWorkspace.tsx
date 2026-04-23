// @ts-nocheck
import React from "react";
import type { JobStatus, Role } from "@kharon/domain";
import type { JobEventRow, PortalSession, OpsIntelligencePayload, PeopleDirectoryEntry, SchemaDriftPayload, SkillMatrixRecord, UpgradeWorkspaceState } from "../apiClient";
import type { JobRecord } from "./JobListView";
import { JobListView } from "./JobListView";
import { JobDetailView } from "./JobDetailView";
import { SummaryBoard } from "./SummaryBoard";
import { ScheduleControlCard } from "./ScheduleControlCard";
import { CommunicationRailsCard } from "./CommunicationRailsCard";
import { AdminPanelCard } from "./AdminPanelCard";
import { DocumentHistoryCard } from "./DocumentHistoryCard";
import { DashboardView } from "./DashboardView";
import { PeopleDirectoryCard } from "./PeopleDirectoryCard";
import { FinanceOpsCard } from "./FinanceOpsCard";
import { FinanceOverviewCard } from "./FinanceOverviewCard";
import { FinanceQuotesCard } from "./FinanceQuotesCard";
import { FinanceInvoicesCard } from "./FinanceInvoicesCard";
import { FinancePaymentsCard } from "./FinancePaymentsCard";
import { FinanceDebtorsCard } from "./FinanceDebtorsCard";
import { FinanceStatementsCard } from "./FinanceStatementsCard";
import { SuperAdminOverview } from "./SuperAdminOverview";
import { SuperAdminDataChecks } from "./SuperAdminDataChecks";
import { SuperAdminAutomations } from "./SuperAdminAutomations";
import { SuperAdminSystemHealth } from "./SuperAdminSystemHealth";
import { SuperAdminActivityLog } from "./SuperAdminActivityLog";
import { SuperAdminBusinessUnits } from "./SuperAdminBusinessUnits";
import { AdminDashboard } from "./AdminDashboard";
import { AdminSettingsCard } from "./AdminSettingsCard";
import { DispatchDashboardCard } from "./DispatchDashboardCard";
import { DispatchUnassignedCard } from "./DispatchUnassignedCard";
import { DispatchDailyPlanCard } from "./DispatchDailyPlanCard";
import { TechMyDayCard } from "./TechMyDayCard";
import { TechCheckInOutCard } from "./TechCheckInOutCard";
import { TechHelpCard } from "./TechHelpCard";
import { ClientOverviewCard } from "./ClientOverviewCard";
import { ClientInvoicesCard } from "./ClientInvoicesCard";
import { ClientSupportCard } from "./ClientSupportCard";
import { COPY_GLOSSARY, WORKSPACE_TOOL_META } from "../appShell/helpers";

type GeoVerification = {
  status: "idle" | "verified" | "warning" | "error";
  capturedAt: string;
  distanceMeters: number | null;
  accuracyMeters: number | null;
  message: string;
  latitude: number | null;
  longitude: number | null;
};

interface PortalWorkspaceProps {
  state: any;
}

export function PortalWorkspace({ state }: PortalWorkspaceProps): React.JSX.Element {
  const {
    portalView,
    session,
    effectiveRole,
    emulatedRole,
    jobs,
    selectedJobid,
    onSelectJobid,
    searchTerm,
    onSearchTermChange,
    activeWorkspaceTool,
    onActiveWorkspaceToolChange,
    allowedWorkspaceTools,
    defaultWorkspaceTool,
    onboardingDismissed,
    onDismissOnboarding,
    openJobCount,
    selectedJob,
    selectedJobStatus,
    selectedJobDocumentCount,
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
    onBulkStatusUpdate,
    canGenerateDocuments,
    documentGenerateDisabledReason,
    documentAccessDenied,
    dispatchAccessDenied,
    geoVerification,
    onVerifyLocation,
    syncPulseText,
    jobEvents,
    notifications,
    onDismissNotification,
    onDismissAllNotifications,
    actionPending,
    feedback,
    generatedDocumentCount,
    queueCount,
    adminAuditCount,
    networkOnline,
    opsIntelligence,
    schemaDrift,
    adminHealth,
    adminAudits,
    adminAutomationJobs,
    adminAutomationJobEntries: _adminAutomationJobEntries,
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
    peopleDirectory,
    upgradeState,
    setFeedback,
    refreshUpgradeWorkspaceState,
    onUpsertSkill,
    onPeopleSync,
    selectedJobTitle,
    onLogout
  } = state;

  const showOperationalEngagements = activeWorkspaceTool === "jobs";
  const activeToolMeta = WORKSPACE_TOOL_META[activeWorkspaceTool] ?? {
    label: "Workspace",
    helper: "Use the sidebar to move between sections"
  };

  if (portalView === "dashboard") {
    return (
      <DashboardView
        session={session}
        openJobCount={openJobCount}
        overrideRole={effectiveRole as Role}
        onboardingDismissed={onboardingDismissed}
        onDismissOnboarding={onDismissOnboarding}
        onEnterWorkspace={(tool) => onActiveWorkspaceToolChange(tool)}
        onLogout={() => undefined}
      />
    );
  }

  return (
    <>
      {showOperationalEngagements ? (
        <aside className="portal-sidebar portal-sidebar--jobs">
          <JobListView
            jobs={jobs}
            selectedJobid={selectedJobid}
            onSelectJob={onSelectJobid}
            globalQuery={searchTerm}
            onGlobalQueryChange={onSearchTermChange}
            onBulkStatusUpdate={onBulkStatusUpdate}
            title="Jobs List"
          />
        </aside>
      ) : null}

      <main className="portal-main">
        <section className="workspace-header-card">
          <h1>{activeToolMeta.label}</h1>
          <p>{activeToolMeta.helper.replace("documents", COPY_GLOSSARY.documents.toLowerCase())}</p>
          <div className="workspace-header-card__actions">
            <input
              type="search"
              id="workspace-global-search"
              value={searchTerm}
              onChange={(event) => onSearchTermChange(event.target.value)}
              placeholder="Search jobs, clients, sites, IDs..."
              aria-label="Search across workspace data"
            />
          </div>
        </section>

        {notifications.length > 0 ? (
          <section className="notification-center" aria-live="polite">
            {notifications.map((item) => (
              <article key={item.id} className="notification-card">
                <span className={`status-chip status-chip--${item.tone}`}>{item.title}</span>
                <p>{item.detail}</p>
                <button className="button button--ghost" type="button" onClick={() => onDismissNotification(item.id)}>
                  Dismiss
                </button>
              </article>
            ))}
            <button className="button button--secondary" type="button" onClick={onDismissAllNotifications}>
              Dismiss all
            </button>
          </section>
        ) : null}

        {actionPending ? <p className="inline-note">Loading latest updates…</p> : null}
        {/failed|error|unavailable/i.test(feedback) ? <p className="inline-note">Action could not complete. Check connection and try again.</p> : null}

        <SummaryBoard
          role={effectiveRole || "client"}
          openJobCount={openJobCount}
          selectedJobStatus={selectedJobStatus}
          queueCount={queueCount}
          generatedDocumentCount={generatedDocumentCount}
          adminAuditCount={adminAuditCount}
          networkOnline={networkOnline}
          syncPulseText={syncPulseText}
        />

        <section className={`workspace-container ${activeWorkspaceTool === "jobs" && selectedJobid ? "workspace-container--split" : ""}`}>
          {activeWorkspaceTool === "tech_day" && effectiveRole === "technician" ? (
            <TechMyDayCard jobs={jobs} onSelectJob={onSelectJobid} onEnterTool={(tool) => onActiveWorkspaceToolChange(tool)} />
          ) : null}

          {activeWorkspaceTool === "tech_checkin" && effectiveRole === "technician" ? (
            <TechCheckInOutCard
              selectedJob={selectedJob}
              onUpdateStatus={() => onStatusUpdate()}
              onVerifyLocation={onVerifyLocation}
              geoStatus={geoVerification.status}
            />
          ) : null}

          {activeWorkspaceTool === "tech_help" && effectiveRole === "technician" ? <TechHelpCard /> : null}

          {activeWorkspaceTool === "admin_dashboard" && (effectiveRole === "admin" || effectiveRole === "super_admin") ? (
            <AdminDashboard opsIntelligence={opsIntelligence} onEnterTool={(tool) => onActiveWorkspaceToolChange(tool)} isLoading={actionPending} />
          ) : null}

          {activeWorkspaceTool === "dispatch_dashboard" && (effectiveRole === "dispatcher" || effectiveRole === "super_admin") ? (
            <DispatchDashboardCard opsIntelligence={opsIntelligence} onEnterTool={(tool) => onActiveWorkspaceToolChange(tool)} isLoading={actionPending} />
          ) : null}

          {activeWorkspaceTool === "dispatch_unassigned" && (effectiveRole === "dispatcher" || effectiveRole === "super_admin") ? (
            <DispatchUnassignedCard jobs={jobs} onSelectJob={onSelectJobid} onEnterTool={(tool) => onActiveWorkspaceToolChange(tool)} />
          ) : null}

          {activeWorkspaceTool === "dispatch_daily" && (effectiveRole === "dispatcher" || effectiveRole === "super_admin") ? (
            <DispatchDailyPlanCard jobs={jobs} opsIntelligence={opsIntelligence} />
          ) : null}

          {activeWorkspaceTool === "client_overview" && effectiveRole === "client" ? (
            <ClientOverviewCard jobs={jobs} store={upgradeState} onEnterTool={(tool) => onActiveWorkspaceToolChange(tool)} />
          ) : null}

          {activeWorkspaceTool === "client_invoices" && effectiveRole === "client" ? <ClientInvoicesCard store={upgradeState} /> : null}
          {activeWorkspaceTool === "client_support" && effectiveRole === "client" ? <ClientSupportCard /> : null}

          {activeWorkspaceTool === "jobs" ? (
            <JobDetailView
              selectedJob={selectedJob}
              role={effectiveRole ?? "client"}
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

          {activeWorkspaceTool === "schedule" && (effectiveRole === "dispatcher" || effectiveRole === "super_admin") && !dispatchAccessDenied ? (
            <ScheduleControlCard
              selectedJobid={selectedJob?.job_id ?? ""}
              preferredStart={preferredStart}
              setPreferredStart={setPreferredStart}
              preferredEnd={preferredEnd}
              setPreferredEnd={setPreferredEnd}
              requests={dispatchRequests as any}
              selectedRequestid={selectedRequestid}
              setSelectedRequestid={() => undefined}
              confirmStart={confirmStart}
              setConfirmStart={setConfirmStart}
              confirmEnd={confirmEnd}
              setConfirmEnd={setConfirmEnd}
              confirmTechid={confirmTechid}
              setConfirmTechid={setConfirmTechid}
              technicians={technicians as any}
              schedules={dispatchSchedules as any}
              selectedScheduleid={selectedScheduleid}
              setSelectedScheduleid={() => undefined}
              rescheduleStart={rescheduleStart}
              setRescheduleStart={setRescheduleStart}
              rescheduleEnd={rescheduleEnd}
              setRescheduleEnd={setRescheduleEnd}
              rescheduleRowVersion={rescheduleRowVersion}
              setRescheduleRowVersion={setRescheduleRowVersion}
              documents={dispatchDocuments as any}
              selectedDocumentid={selectedDocumentid}
              setSelectedDocumentid={() => undefined}
              onScheduleRequest={onScheduleRequest}
              onScheduleConfirm={onScheduleConfirm}
              onReschedule={onReschedule}
              onDocumentPublish={onDocumentPublish}
              onFeedback={setFeedback}
            />
          ) : null}

          {activeWorkspaceTool === "comms" && (effectiveRole === "dispatcher" || effectiveRole === "super_admin") ? (
            <CommunicationRailsCard selectedJobid={selectedJob?.job_id ?? ""} selectedJobTitle={selectedJob?.title ?? ""} onFeedback={setFeedback} />
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
                automationJobs={automationJobs as any}
                selectedAutomationJobid={selectedAutomationJobid}
                setSelectedAutomationJobid={onSelectAutomationJobid}
                onLoadHealth={onLoadHealth}
                onLoadAudits={onLoadAudits}
                onLoadAutomationJobs={onLoadAutomationJobs}
                onRetryAutomation={onRetryAutomation}
                onFeedback={setFeedback}
                emulatedRole={emulatedRole}
                onEmulateRole={onEmulateRole}
                schemaDrift={schemaDrift}
                opsIntelligence={opsIntelligence}
                onLoadSchemaDrift={onLoadSchemaDrift}
                onLoadOpsIntelligence={onLoadOpsIntelligence}
              />
            ) : null
          ) : null}

          {activeWorkspaceTool === "sa_overview" && effectiveRole === "super_admin" ? <SuperAdminOverview opsIntelligence={opsIntelligence} onRefresh={onLoadOpsIntelligence} isLoading={actionPending} /> : null}
          {activeWorkspaceTool === "sa_users" && effectiveRole === "super_admin" ? (
            <PeopleDirectoryCard
              people={peopleDirectory}
              skillsState={upgradeState.skills}
              onUpsertSkill={onUpsertSkill}
              onSync={onPeopleSync as any}
              onFeedback={setFeedback}
            />
          ) : null}
          {activeWorkspaceTool === "sa_units" && effectiveRole === "super_admin" ? <SuperAdminBusinessUnits /> : null}
          {activeWorkspaceTool === "sa_checks" && effectiveRole === "super_admin" ? <SuperAdminDataChecks schemaDrift={schemaDrift} onRefresh={onLoadSchemaDrift} isLoading={actionPending} /> : null}
          {activeWorkspaceTool === "sa_automations" && effectiveRole === "super_admin" ? <SuperAdminAutomations automationJobs={adminAutomationJobs} onRefresh={onLoadAutomationJobs} onRetry={onRetryAutomation} isLoading={actionPending} /> : null}
          {activeWorkspaceTool === "sa_health" && effectiveRole === "super_admin" ? <SuperAdminSystemHealth adminHealth={adminHealth} onRefresh={onLoadHealth} isLoading={actionPending} /> : null}
          {activeWorkspaceTool === "sa_activity" && effectiveRole === "super_admin" ? (
            <SuperAdminActivityLog adminAudits={adminAudits} adminAuditCount={adminAuditCount} onRefresh={onLoadAudits} isLoading={actionPending} />
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

          {activeWorkspaceTool === "finance_overview" && (effectiveRole === "finance" || effectiveRole === "super_admin") ? (
            <FinanceOverviewCard store={upgradeState} onEnterTool={(tool) => onActiveWorkspaceToolChange(tool)} isLoading={actionPending} />
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

          {activeWorkspaceTool === "people" && (effectiveRole === "dispatcher" || effectiveRole === "admin" || effectiveRole === "super_admin") ? (
            <PeopleDirectoryCard people={peopleDirectory} skillsState={upgradeState.skills} onUpsertSkill={onUpsertSkill} onSync={onPeopleSync as any} onFeedback={setFeedback} />
          ) : null}
        </section>
      </main>
    </>
  );
}
