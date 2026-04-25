import React from "react";
import type { JobStatus, JobEventRow } from "@kharon/domain";
import type { JobRecord } from "../../components/JobListView";
import { TechnicianDashboard } from "../../components/TechnicianDashboard";
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
  onSelectJobid,
  onActiveWorkspaceToolChange,
  geoVerification,
  onVerifyLocation,
  onStatusUpdate,
  syncPulseText
}: TechnicianWorkspacePanelProps): React.JSX.Element | null {
  if (effectiveRole !== "technician") return null;

  if (activeWorkspaceTool === "tech_help") {
    return <TechHelpCard />;
  }

  return (
    <TechnicianDashboard
      jobs={jobs}
      selectedJob={selectedJob}
      activeTool={activeWorkspaceTool}
      onEnterTool={onActiveWorkspaceToolChange}
      onSelectJob={onSelectJobid}
      onUpdateStatus={onStatusUpdate}
      onVerifyLocation={onVerifyLocation}
      geoStatus={geoVerification.status}
      syncPulseText={syncPulseText}
    />
  );
}
