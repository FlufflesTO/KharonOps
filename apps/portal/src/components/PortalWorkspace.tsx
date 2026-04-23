import React from "react";
import type { JobStatus, Role, JobEventRow, ScheduleRequestRow, ScheduleRow, JobDocumentRow } from "@kharon/domain";
import type { 
  PortalSession, 
  OpsIntelligencePayload, 
  PeopleDirectoryEntry, 
  SchemaDriftPayload, 
  SkillMatrixRecord, 
  UpgradeWorkspaceState,
  AutomationJobEntry
} from "../apiClient";
import type { JobRecord } from "./JobListView";
import { JobListView } from "./JobListView";
import { JobDetailView } from "./JobDetailView";
import { SummaryBoard } from "./SummaryBoard";
import { DocumentHistoryCard } from "./DocumentHistoryCard";
import { DashboardView } from "./DashboardView";
import { PeopleDirectoryCard } from "./PeopleDirectoryCard";
import { COPY_GLOSSARY, WORKSPACE_TOOL_META } from "../appShell/helpers";
import { TechnicianWorkspacePanel } from "../features/technician/TechnicianWorkspacePanel";
import { ClientWorkspacePanel } from "../features/client/ClientWorkspacePanel";
import { DispatchWorkspacePanel } from "../features/dispatch/DispatchWorkspacePanel";
import { FinanceWorkspacePanel } from "../features/finance/FinanceWorkspacePanel";
import { AdminWorkspacePanel } from "../features/admin/AdminWorkspacePanel";
import { SuperAdminWorkspacePanel } from "../features/superAdmin/SuperAdminWorkspacePanel";

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
  state: {
    portalView: "dashboard" | "workspace";
    session: PortalSession | null;
    effectiveRole: Role | "";
    emulatedRole: Role | "";
    jobs: JobRecord[];
    selectedJobid: string;
    onSelectJobid: (id: string) => void;
    searchTerm: string;
    onSearchTermChange: (q: string) => void;
    activeWorkspaceTool: string;
    onActiveWorkspaceToolChange: (tool: string) => void;
    allowedWorkspaceTools: string[];
    defaultWorkspaceTool: string;
    onboardingDismissed: boolean;
    onDismissOnboarding: () => void;
    openJobCount: number;
    selectedJob: JobRecord | null;
    selectedJobStatus: string;
    selectedJobDocumentCount: number;
    selectedRequestid: string;
    selectedScheduleid: string;
    selectedDocumentid: string;
    dispatchRequests: ScheduleRequestRow[];
    dispatchSchedules: ScheduleRow[];
    dispatchDocuments: JobDocumentRow[];
    technicians: PeopleDirectoryEntry[];
    preferredStart: string;
    setPreferredStart: (v: string) => void;
    preferredEnd: string;
    setPreferredEnd: (v: string) => void;
    confirmStart: string;
    setConfirmStart: (v: string) => void;
    confirmEnd: string;
    setConfirmEnd: (v: string) => void;
    confirmTechid: string;
    setConfirmTechid: (v: string) => void;
    rescheduleStart: string;
    setRescheduleStart: (v: string) => void;
    rescheduleEnd: string;
    setRescheduleEnd: (v: string) => void;
    rescheduleRowVersion: number;
    setRescheduleRowVersion: (v: number) => void;
    documentType: "jobcard" | "service_report" | "certificate";
    setDocumentType: (v: "jobcard" | "service_report" | "certificate") => void;
    onStatusUpdate: () => void;
    onNote: () => void;
    noteValue: string;
    setNoteValue: (v: string) => void;
    statusTarget: JobStatus;
    setStatusTarget: (s: JobStatus) => void;
    selectableStatuses: JobStatus[];
    onScheduleRequest: () => void;
    onScheduleConfirm: () => void;
    onReschedule: () => void;
    onDocumentGenerate: () => void;
    onDocumentPublish: () => void;
    onBulkStatusUpdate: (ids: string[], status: JobStatus) => void;
    canGenerateDocuments: boolean;
    documentGenerateDisabledReason: string;
    documentAccessDenied: boolean;
    dispatchAccessDenied: boolean;
    geoVerification: GeoVerification;
    onVerifyLocation: () => void;
    syncPulseText: string;
    jobEvents: JobEventRow[];
    notifications: Array<{ id: string; tone: "warning" | "critical" | "active"; title: string; detail: string }>;
    onDismissNotification: (id: string) => void;
    onDismissAllNotifications: () => void;
    actionPending: boolean;
    feedback: string;
    generatedDocumentCount: number;
    queueCount: number;
    adminAuditCount: number;
    networkOnline: boolean;
    opsIntelligence: OpsIntelligencePayload | null;
    schemaDrift: SchemaDriftPayload | null;
    adminHealth: Record<string, unknown> | null;
    adminAudits: Array<Record<string, unknown>>;
    adminAutomationJobs: Array<Record<string, unknown>>;
    automationJobs: AutomationJobEntry[];
    selectedAutomationJobid: string;
    onSelectAutomationJobid: (id: string) => void;
    onLoadHealth: () => void;
    onLoadAudits: () => void;
    onLoadAutomationJobs: () => void;
    onRetryAutomation: (id: string) => void;
    onEmulateRole: (role: Role | "") => void;
    onLoadSchemaDrift: () => void;
    onLoadOpsIntelligence: () => void;
    peopleDirectory: PeopleDirectoryEntry[];
    upgradeState: UpgradeWorkspaceState;
    setFeedback: (f: string) => void;
    onUpsertSkill: (payload: SkillMatrixRecord) => void;
    onPeopleSync: (payload: { name: string; email: string; phone: string; roleHint: string }) => Promise<void>;
    selectedJobTitle: string;
    onLogout: () => void;
  };
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

  if (portalView === "dashboard" && session) {
    return (
      <DashboardView
        session={session}
        openJobCount={openJobCount}
        overrideRole={effectiveRole as Role}
        onboardingDismissed={onboardingDismissed}
        onDismissOnboarding={onDismissOnboarding}
        onEnterWorkspace={(tool: string) => onActiveWorkspaceToolChange(tool)}
        onLogout={onLogout}
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
          <TechnicianWorkspacePanel
            activeWorkspaceTool={activeWorkspaceTool}
            effectiveRole={effectiveRole}
            jobs={jobs}
            selectedJob={selectedJob}
            selectedJobTitle={selectedJobTitle}
            selectedJobDocumentCount={selectedJobDocumentCount}
            onSelectJobid={onSelectJobid}
            onActiveWorkspaceToolChange={onActiveWorkspaceToolChange}
            geoVerification={geoVerification}
            onVerifyLocation={onVerifyLocation}
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
            syncPulseText={syncPulseText}
            jobEvents={jobEvents as any}
          />

          <ClientWorkspacePanel
            activeWorkspaceTool={activeWorkspaceTool}
            effectiveRole={effectiveRole}
            jobs={jobs}
            store={upgradeState}
            onActiveWorkspaceToolChange={onActiveWorkspaceToolChange}
          />

          <DispatchWorkspacePanel
            activeWorkspaceTool={activeWorkspaceTool}
            effectiveRole={effectiveRole}
            jobs={jobs}
            dispatchContext={{
              requests: dispatchRequests,
              schedules: dispatchSchedules,
              documents: dispatchDocuments,
              technicians
            }}
            selectedJob={selectedJob}
            selectedRequestid={selectedRequestid}
            selectedScheduleid={selectedScheduleid}
            selectedDocumentid={selectedDocumentid}
            onSelectJobid={onSelectJobid}
            preferredStart={preferredStart}
            setPreferredStart={setPreferredStart}
            preferredEnd={preferredEnd}
            setPreferredEnd={setPreferredEnd}
            confirmStart={confirmStart}
            setConfirmStart={setConfirmStart}
            confirmEnd={confirmEnd}
            setConfirmEnd={setConfirmEnd}
            confirmTechid={confirmTechid}
            setConfirmTechid={setConfirmTechid}
            rescheduleStart={rescheduleStart}
            setRescheduleStart={setRescheduleStart}
            rescheduleEnd={rescheduleEnd}
            setRescheduleEnd={setRescheduleEnd}
            rescheduleRowVersion={rescheduleRowVersion}
            setRescheduleRowVersion={setRescheduleRowVersion}
            onScheduleRequest={onScheduleRequest}
            onScheduleConfirm={onScheduleConfirm}
            onReschedule={onReschedule}
            onDocumentPublish={onDocumentPublish}
            onFeedback={setFeedback}
            opsIntelligence={opsIntelligence}
            onActiveWorkspaceToolChange={onActiveWorkspaceToolChange}
          />

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

          <FinanceWorkspacePanel
            activeWorkspaceTool={activeWorkspaceTool}
            effectiveRole={effectiveRole}
            jobs={jobs}
            store={upgradeState}
            onActiveWorkspaceToolChange={onActiveWorkspaceToolChange}
          />

          <AdminWorkspacePanel
            activeWorkspaceTool={activeWorkspaceTool}
            effectiveRole={effectiveRole}
            session={session}
            defaultWorkspaceTool={defaultWorkspaceTool}
            onboardingDismissed={onboardingDismissed}
            allowedWorkspaceTools={allowedWorkspaceTools}
            pinnedTools={[]}
            onActiveWorkspaceToolChange={onActiveWorkspaceToolChange}
            opsIntelligence={opsIntelligence}
            adminHealth={adminHealth}
            adminAudits={adminAudits}
            adminAutomationJobs={adminAutomationJobs}
            adminAuditCount={adminAuditCount}
            automationJobs={automationJobs}
            selectedAutomationJobid={selectedAutomationJobid}
            onSelectAutomationJobid={onSelectAutomationJobid}
            onLoadHealth={onLoadHealth}
            onLoadAudits={onLoadAudits}
            onLoadAutomationJobs={onLoadAutomationJobs}
            onRetryAutomation={onRetryAutomation}
            onEmulateRole={onEmulateRole}
            schemaDrift={schemaDrift}
            onLoadSchemaDrift={onLoadSchemaDrift}
            onLoadOpsIntelligence={onLoadOpsIntelligence}
            actionPending={actionPending}
            onFeedback={setFeedback}
          />

          <SuperAdminWorkspacePanel
            activeWorkspaceTool={activeWorkspaceTool}
            effectiveRole={effectiveRole}
            opsIntelligence={opsIntelligence}
            schemaDrift={schemaDrift}
            adminHealth={adminHealth}
            adminAudits={adminAudits}
            adminAuditCount={adminAuditCount}
            adminAutomationJobs={adminAutomationJobs}
            automationJobs={automationJobs}
            selectedAutomationJobid={selectedAutomationJobid}
            onSelectAutomationJobid={onSelectAutomationJobid}
            onLoadHealth={onLoadHealth}
            onLoadAudits={onLoadAudits}
            onLoadAutomationJobs={onLoadAutomationJobs}
            onRetryAutomation={onRetryAutomation}
            onLoadSchemaDrift={onLoadSchemaDrift}
            onLoadOpsIntelligence={onLoadOpsIntelligence}
            peopleDirectory={peopleDirectory}
            upgradeState={{ skills: upgradeState.skills }}
            onUpsertSkill={onUpsertSkill}
            onPeopleSync={onPeopleSync}
            onFeedback={setFeedback}
            actionPending={actionPending}
          />

          {activeWorkspaceTool === "documents" ? (
            <DocumentHistoryCard
              documents={[]}
              selectedJobid={selectedJob?.job_id ?? ""}
              role={(effectiveRole || "client") as Role}
              escrowByDocumentid={{}}
              onRefresh={() => undefined}
              onPublish={() => undefined}
            />
          ) : null}

          {activeWorkspaceTool === "people" && (effectiveRole === "dispatcher" || effectiveRole === "admin" || effectiveRole === "super_admin") ? (
            <PeopleDirectoryCard people={peopleDirectory} skillsState={upgradeState.skills} onUpsertSkill={onUpsertSkill} onSync={onPeopleSync} onFeedback={setFeedback} />
          ) : null}
        </section>
      </main>
    </>
  );
}
