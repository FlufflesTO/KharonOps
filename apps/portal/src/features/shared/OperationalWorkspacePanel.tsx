import React from "react";
import type { Role } from "@kharon/domain";
import { JobDetailView } from "../../components/JobDetailView";
import { DocumentHistoryCard } from "../../components/DocumentHistoryCard";
import { PeopleDirectoryCard } from "../../components/PeopleDirectoryCard";
import { ScheduleControlCard } from "../../components/ScheduleControlCard";
import { CommunicationRailsCard } from "../../components/CommunicationRailsCard";
import { TechMyDayCard } from "../../components/TechMyDayCard";
import { TechCheckInOutCard } from "../../components/TechCheckInOutCard";
import { TechHelpCard } from "../../components/TechHelpCard";
import { ClientOverviewCard } from "../../components/ClientOverviewCard";
import { ClientInvoicesCard } from "../../components/ClientInvoicesCard";
import { ClientSupportCard } from "../../components/ClientSupportCard";
import { DispatchDashboardCard } from "../../components/DispatchDashboardCard";
import { DispatchUnassignedCard } from "../../components/DispatchUnassignedCard";
import { DispatchDailyPlanCard } from "../../components/DispatchDailyPlanCard";
import type { PortalWorkspaceState } from "../../components/PortalWorkspace";

interface OperationalWorkspacePanelProps {
  state: PortalWorkspaceState;
}

export function OperationalWorkspacePanel({ state }: OperationalWorkspacePanelProps): React.JSX.Element {
  const {
    effectiveRole,
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
    actionPending,
    onFeedback
  } = state;

  return (
    <>
      {activeWorkspaceTool === "tech_day" && effectiveRole === "technician" ? <TechMyDayCard jobs={jobs} onSelectJob={state.onSelectJobid} onEnterTool={(tool: string) => onActiveWorkspaceToolChange(tool)} /> : null}
      {activeWorkspaceTool === "tech_checkin" && effectiveRole === "technician" ? <TechCheckInOutCard selectedJob={selectedJob} onUpdateStatus={() => onStatusUpdate()} onVerifyLocation={onVerifyLocation} geoStatus={geoVerification.status} /> : null}
      {activeWorkspaceTool === "tech_help" && effectiveRole === "technician" ? <TechHelpCard /> : null}
      {activeWorkspaceTool === "client_overview" && effectiveRole === "client" ? <ClientOverviewCard jobs={jobs} store={upgradeState} onEnterTool={(tool: string) => onActiveWorkspaceToolChange(tool)} /> : null}
      {activeWorkspaceTool === "client_invoices" && effectiveRole === "client" ? <ClientInvoicesCard store={upgradeState} /> : null}
      {activeWorkspaceTool === "client_support" && effectiveRole === "client" ? <ClientSupportCard /> : null}
      {activeWorkspaceTool === "dispatch_dashboard" && (effectiveRole === "dispatcher" || effectiveRole === "super_admin") ? <DispatchDashboardCard opsIntelligence={opsIntelligence} onEnterTool={(tool: string) => onActiveWorkspaceToolChange(tool)} isLoading={actionPending} /> : null}
      {activeWorkspaceTool === "dispatch_unassigned" && (effectiveRole === "dispatcher" || effectiveRole === "super_admin") ? <DispatchUnassignedCard jobs={jobs} onSelectJob={state.onSelectJobid} onEnterTool={(tool: string) => onActiveWorkspaceToolChange(tool)} /> : null}
      {activeWorkspaceTool === "dispatch_daily" && (effectiveRole === "dispatcher" || effectiveRole === "super_admin") ? <DispatchDailyPlanCard jobs={jobs} opsIntelligence={opsIntelligence} /> : null}
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
      {activeWorkspaceTool === "comms" && (effectiveRole === "dispatcher" || effectiveRole === "super_admin") ? <CommunicationRailsCard selectedJobid={selectedJob?.job_id ?? ""} selectedJobTitle={selectedJob?.title ?? ""} onFeedback={onFeedback} /> : null}
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
      {activeWorkspaceTool === "documents" ? <DocumentHistoryCard documents={[]} selectedJobid={selectedJob?.job_id ?? ""} role={effectiveRole ?? "client"} escrowByDocumentid={{}} onRefresh={() => undefined} onPublish={() => undefined} /> : null}
      {activeWorkspaceTool === "people" && (effectiveRole === "dispatcher" || effectiveRole === "admin" || effectiveRole === "super_admin") ? <PeopleDirectoryCard people={peopleDirectory} skillsState={upgradeState.skills} onUpsertSkill={onUpsertSkill} onSync={onPeopleSync} onFeedback={onFeedback} /> : null}
    </>
  );
}
