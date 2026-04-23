import React from "react";
import type { OpsIntelligencePayload, PortalDispatchContext } from "../../apiClient";
import type { JobRecord } from "../../components/JobListView";
import { DispatchDashboardCard } from "../../components/DispatchDashboardCard";
import { DispatchUnassignedCard } from "../../components/DispatchUnassignedCard";
import { DispatchDailyPlanCard } from "../../components/DispatchDailyPlanCard";
import { ScheduleControlCard } from "../../components/ScheduleControlCard";
import { CommunicationRailsCard } from "../../components/CommunicationRailsCard";

interface DispatchWorkspacePanelProps {
  activeWorkspaceTool: string;
  effectiveRole: string;
  jobs: JobRecord[];
  dispatchContext: PortalDispatchContext | null;
  selectedJob: JobRecord | null;
  selectedRequestid: string;
  selectedScheduleid: string;
  selectedDocumentid: string;
  onSelectJobid: (id: string) => void;
  preferredStart: string;
  setPreferredStart: (value: string) => void;
  preferredEnd: string;
  setPreferredEnd: (value: string) => void;
  confirmStart: string;
  setConfirmStart: (value: string) => void;
  confirmEnd: string;
  setConfirmEnd: (value: string) => void;
  confirmTechid: string;
  setConfirmTechid: (value: string) => void;
  rescheduleStart: string;
  setRescheduleStart: (value: string) => void;
  rescheduleEnd: string;
  setRescheduleEnd: (value: string) => void;
  rescheduleRowVersion: number;
  setRescheduleRowVersion: (value: number) => void;
  onScheduleRequest: () => void;
  onScheduleConfirm: () => void;
  onReschedule: () => void;
  onDocumentPublish: () => void;
  onFeedback: (msg: string) => void;
  opsIntelligence: OpsIntelligencePayload | null;
  onActiveWorkspaceToolChange: (tool: string) => void;
}

export function DispatchWorkspacePanel({
  activeWorkspaceTool,
  effectiveRole,
  jobs,
  dispatchContext,
  selectedJob,
  selectedRequestid,
  selectedScheduleid,
  selectedDocumentid,
  onSelectJobid,
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
  onScheduleRequest,
  onScheduleConfirm,
  onReschedule,
  onDocumentPublish,
  onFeedback,
  opsIntelligence,
  onActiveWorkspaceToolChange
}: DispatchWorkspacePanelProps): React.JSX.Element | null {
  if (effectiveRole !== "dispatcher" && effectiveRole !== "super_admin") return null;

  const dispatchRequests = dispatchContext?.requests ?? [];
  const dispatchSchedules = dispatchContext?.schedules ?? [];
  const dispatchDocuments = dispatchContext?.documents ?? [];
  const technicians = dispatchContext?.technicians ?? [];

  return (
    <>
      {activeWorkspaceTool === "dispatch_dashboard" ? <DispatchDashboardCard opsIntelligence={opsIntelligence} onEnterTool={onActiveWorkspaceToolChange} isLoading={false} /> : null}
      {activeWorkspaceTool === "dispatch_unassigned" ? <DispatchUnassignedCard jobs={jobs} onSelectJob={onSelectJobid} onEnterTool={onActiveWorkspaceToolChange} /> : null}
      {activeWorkspaceTool === "dispatch_daily" ? <DispatchDailyPlanCard jobs={jobs} opsIntelligence={opsIntelligence} /> : null}
      {activeWorkspaceTool === "schedule" ? (
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
      {activeWorkspaceTool === "comms" ? <CommunicationRailsCard selectedJobid={selectedJob?.job_id ?? ""} selectedJobTitle={selectedJob?.title ?? ""} onFeedback={onFeedback} /> : null}
    </>
  );
}
