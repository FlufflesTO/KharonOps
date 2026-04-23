import React from "react";
import type { JobStatus, JobEventRow } from "@kharon/domain";
import type { JobRecord } from "../../components/JobListView";
import { TechMyDayCard } from "../../components/TechMyDayCard";
import { TechCheckInOutCard } from "../../components/TechCheckInOutCard";
import { TechHelpCard } from "../../components/TechHelpCard";

type GeoVerification = {
  status: "idle" | "verified" | "warning" | "error";
  capturedAt: string;
  distanceMeters: number | null;
  accuracyMeters: number | null;
  message: string;
  latitude: number | null;
  longitude: number | null;
};

interface TechnicianWorkspacePanelProps {
  activeWorkspaceTool: string;
  effectiveRole: string;
  jobs: JobRecord[];
  selectedJob: JobRecord | null;
  selectedJobTitle: string;
  selectedJobDocumentCount: number;
  onSelectJobid: (id: string) => void;
  onActiveWorkspaceToolChange: (tool: string) => void;
  geoVerification: GeoVerification;
  onVerifyLocation: () => void;
  selectedJobStatus: string;
  selectableStatuses: JobStatus[];
  statusTarget: JobStatus;
  setStatusTarget: (status: JobStatus) => void;
  noteValue: string;
  setNoteValue: (value: string) => void;
  onStatusUpdate: () => void;
  onNote: () => void;
  preferredStart: string;
  setPreferredStart: (value: string) => void;
  preferredEnd: string;
  setPreferredEnd: (value: string) => void;
  onScheduleRequest: () => void;
  documentType: "jobcard" | "service_report" | "certificate";
  setDocumentType: (value: "jobcard" | "service_report" | "certificate") => void;
  onDocumentGenerate: () => void;
  canGenerateDocuments: boolean;
  documentGenerateDisabledReason: string;
  syncPulseText: string;
  jobEvents: JobEventRow[];
}

export function TechnicianWorkspacePanel({
  activeWorkspaceTool,
  effectiveRole,
  jobs,
  selectedJob,
  selectedJobTitle,
  selectedJobDocumentCount,
  onSelectJobid,
  onActiveWorkspaceToolChange,
  geoVerification,
  onVerifyLocation,
  selectableStatuses,
  statusTarget,
  setStatusTarget,
  noteValue,
  setNoteValue,
  onStatusUpdate,
  onNote,
  preferredStart,
  setPreferredStart,
  preferredEnd,
  setPreferredEnd,
  onScheduleRequest,
  documentType,
  setDocumentType,
  onDocumentGenerate,
  canGenerateDocuments,
  documentGenerateDisabledReason,
  syncPulseText,
  jobEvents
}: TechnicianWorkspacePanelProps): React.JSX.Element | null {
  if (effectiveRole !== "technician") return null;

  return (
    <>
      {activeWorkspaceTool === "tech_day" ? (
        <TechMyDayCard jobs={jobs} onSelectJob={onSelectJobid} onEnterTool={(tool) => onActiveWorkspaceToolChange(tool)} />
      ) : null}

      {activeWorkspaceTool === "tech_checkin" ? (
        <TechCheckInOutCard selectedJob={selectedJob} onUpdateStatus={() => onStatusUpdate()} onVerifyLocation={onVerifyLocation} geoStatus={geoVerification.status} />
      ) : null}

      {activeWorkspaceTool === "tech_help" ? <TechHelpCard /> : null}
    </>
  );
}
