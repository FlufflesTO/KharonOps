import { startTransition, useCallback } from "react";
import type { JobDocumentRow, JobStatus, Role } from "@kharon/domain";
import type {
  AutomationJobEntry,
  OpsIntelligencePayload,
  PeopleDirectoryEntry,
  PortalAuthConfig,
  PortalDispatchContext,
  PortalSession,
  SchemaDriftPayload,
  SkillMatrixRecord,
  UpgradeWorkspaceState
} from "../apiClient";
import { apiClient } from "../apiClient";
import type { DocumentPayload } from "../pdfs/types";
import { enqueueMutation } from "../offline/queue";
import { replayQueuedMutations } from "../offline/replay";
import { renderComplianceDocument } from "./renderComplianceDocument";
import {
  distanceMeters,
  errorMessage,
  firstRequestedSlot,
  formatApiFailure,
  isUnauthorizedError,
  looksLikeJwt,
  normalizeDocument,
  normalizeSchedule,
  normalizeScheduleRequest,
  normalizeUser,
  toIsoOrNull,
  toLocalInputValue
} from "./helpers";

type GeoVerificationState = {
  status: "idle" | "verified" | "warning" | "error";
  capturedAt: string;
  distanceMeters: number | null;
  accuracyMeters: number | null;
  message: string;
  latitude: number | null;
  longitude: number | null;
};

type SelectedJob = {
  job_id: string;
  row_version: number;
  status: JobStatus;
  title?: string | null;
  client_id?: string | null;
  client_name?: string | null;
  technician_name?: string | null;
  site_id?: string | null;
  site_lat?: number | null;
  site_lng?: number | null;
  active_request_id?: string | null;
  active_document_id?: string | null;
  suggested_technician_id?: string | null;
};

type SelectedRequest = {
  request_id: string;
  row_version: number;
  preferred_slots_json: string;
  job_id: string;
};

type SelectedSchedule = {
  schedule_id: string;
  row_version: number;
  job_id: string;
  technician_id: string;
  request_id: string;
  calendar_event_id?: string | null;
  start_at: string;
  end_at: string;
};

type SelectedDispatchDocument = JobDocumentRow | null;

export function usePortalActionControllers(args: {
  session: PortalSession | null;
  authConfig: PortalAuthConfig | null;
  productionAuth: boolean;
  loginToken: string;
  installPromptEvent: Event | null;
  setInstallPromptEvent: React.Dispatch<React.SetStateAction<Event | null>>;
  selectedJob: SelectedJob | null;
  selectedJobid: string;
  selectedRequest: SelectedRequest | null;
  selectedSchedule: SelectedSchedule | null;
  selectedDispatchDocument: SelectedDispatchDocument;
  selectedAutomationJobid: string;
  selectedDocumentid: string;
  selectedScheduleid: string;
  selectedRequestid: string;
  selectedJobStatus: string;
  selectableStatuses: JobStatus[];
  statusTarget: JobStatus;
  noteValue: string;
  documentType: "jobcard" | "service_report" | "certificate";
  checklistData: Record<string, string>;
  preferredStart: string;
  preferredEnd: string;
  confirmStart: string;
  confirmEnd: string;
  confirmTechid: string;
  rescheduleStart: string;
  rescheduleEnd: string;
  offlineEnabled: boolean;
  networkOnline: boolean;
  dispatchAccessDenied: boolean;
  isDispatchRole: boolean;
  isAdmin: boolean;
  canGenerateDocuments: boolean;
  effectiveRole: Role | null;
  dispatchContext: PortalDispatchContext | null;
  jobs: Array<{ job_id: string; row_version: number }>;
  technicians: PeopleDirectoryEntry[];
  refreshJobs: () => Promise<void>;
  refreshDocuments: (jobid?: string) => Promise<void>;
  refreshPeopleDirectory: () => Promise<void>;
  refreshUpgradeWorkspaceState: () => Promise<void>;
  refreshAutomationJobs: () => Promise<void>;
  refreshSession: () => Promise<void>;
  refreshAuthConfig: () => Promise<PortalAuthConfig | null>;
  loadSchemaDrift: () => Promise<void>;
  loadOpsIntelligence: () => Promise<void>;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setSession: React.Dispatch<React.SetStateAction<PortalSession | null>>;
  setEmulatedRole: React.Dispatch<React.SetStateAction<Role | "">>;
  setPortalView: React.Dispatch<React.SetStateAction<"dashboard" | "workspace">>;
  setActiveWorkspaceTool: React.Dispatch<React.SetStateAction<string>>;
  setFeedback: (value: string) => void;
  setJobs: React.Dispatch<React.SetStateAction<Array<{ job_id: string; row_version: number }>>>;
  setDocuments: React.Dispatch<React.SetStateAction<Array<Record<string, unknown>>>>;
  setDispatchContext: React.Dispatch<React.SetStateAction<PortalDispatchContext | null>>;
  setDocumentAccessDenied: React.Dispatch<React.SetStateAction<boolean>>;
  setDispatchAccessDenied: React.Dispatch<React.SetStateAction<boolean>>;
  setSelectedRequestid: React.Dispatch<React.SetStateAction<string>>;
  setSelectedScheduleid: React.Dispatch<React.SetStateAction<string>>;
  setSelectedDocumentid: React.Dispatch<React.SetStateAction<string>>;
  setSelectedAutomationJobid: React.Dispatch<React.SetStateAction<string>>;
  setConfirmTechid: React.Dispatch<React.SetStateAction<string>>;
  setConfirmStart: React.Dispatch<React.SetStateAction<string>>;
  setConfirmEnd: React.Dispatch<React.SetStateAction<string>>;
  setRescheduleStart: React.Dispatch<React.SetStateAction<string>>;
  setRescheduleEnd: React.Dispatch<React.SetStateAction<string>>;
  setGeoVerification: React.Dispatch<React.SetStateAction<GeoVerificationState>>;
  setQueueCount: React.Dispatch<React.SetStateAction<number>>;
  setAdminHealth: React.Dispatch<React.SetStateAction<Record<string, unknown> | null>>;
  setAdminAudits: React.Dispatch<React.SetStateAction<Array<Record<string, unknown>>>>;
  setAdminAuditCount: React.Dispatch<React.SetStateAction<number>>;
  setAdminAutomationJobs: React.Dispatch<React.SetStateAction<Array<Record<string, unknown>>>>;
  setPeopleDirectory: React.Dispatch<React.SetStateAction<PeopleDirectoryEntry[]>>;
  setUpgradeState: React.Dispatch<React.SetStateAction<UpgradeWorkspaceState>>;
  setAutomationJobs: React.Dispatch<React.SetStateAction<AutomationJobEntry[]>>;
  setSchemaDrift: React.Dispatch<React.SetStateAction<SchemaDriftPayload | null>>;
  setOpsIntelligence: React.Dispatch<React.SetStateAction<OpsIntelligencePayload | null>>;
}): {
  refreshDispatchContext: (jobid: string) => Promise<void>;
  handleInstallPrompt: () => Promise<void>;
  handleVerifyLocation: () => Promise<void>;
  handleLogin: (token: string) => Promise<void>;
  handleSupportTokenSubmit: () => Promise<void>;
  handleLogout: () => Promise<void>;
  handleStatusUpdate: () => Promise<void>;
  handleBulkStatusUpdate: (jobIds: string[], status: JobStatus) => Promise<void>;
  handleNote: () => Promise<void>;
  handleReplay: () => Promise<void>;
  handleScheduleRequest: () => Promise<void>;
  handleScheduleConfirm: () => Promise<void>;
  handleReschedule: () => Promise<void>;
  handleDocumentGenerate: () => Promise<void>;
  handleDocumentPublishInline: (documentid: string, rowVersion: number, clientVisible: boolean) => Promise<void>;
  handleDocumentPublish: () => Promise<void>;
  loadAdminHealth: () => Promise<void>;
  loadAdminAudits: () => Promise<void>;
  loadAdminAutomationJobs: () => Promise<void>;
  handleRetryAutomation: (id: string) => Promise<void>;
  handlePeopleSync: (payload: { name: string; email: string; phone: string; roleHint: string }) => Promise<void>;
  handleAutomationRetry: (automationJobid: string) => Promise<void>;
} {
  const {
    session,
    authConfig,
    productionAuth,
    loginToken,
    installPromptEvent,
    setInstallPromptEvent,
    selectedJob,
    selectedJobid,
    selectedRequest,
    selectedSchedule,
    selectedDispatchDocument,
    selectedAutomationJobid,
    selectedDocumentid,
    selectedScheduleid,
    selectedRequestid,
    selectedJobStatus,
    selectableStatuses,
    statusTarget,
    noteValue,
    documentType,
    checklistData,
    preferredStart,
    preferredEnd,
    confirmStart,
    confirmEnd,
    confirmTechid,
    rescheduleStart,
    rescheduleEnd,
    offlineEnabled,
    networkOnline,
    dispatchAccessDenied,
    isDispatchRole,
    isAdmin,
    canGenerateDocuments,
    effectiveRole,
    dispatchContext,
    jobs,
    technicians,
    refreshJobs,
    refreshDocuments,
    refreshPeopleDirectory,
    refreshUpgradeWorkspaceState,
    refreshAutomationJobs,
    refreshSession,
    refreshAuthConfig,
    loadSchemaDrift,
    loadOpsIntelligence,
    setLoading,
    setSession,
    setEmulatedRole,
    setPortalView,
    setActiveWorkspaceTool,
    setFeedback,
    setJobs,
    setDocuments,
    setDispatchContext,
    setDocumentAccessDenied,
    setDispatchAccessDenied,
    setSelectedRequestid,
    setSelectedScheduleid,
    setSelectedDocumentid,
    setSelectedAutomationJobid: setSelectedAutomationJobidState,
    setConfirmTechid,
    setConfirmStart,
    setConfirmEnd,
    setRescheduleStart,
    setRescheduleEnd,
    setGeoVerification,
    setQueueCount,
    setAdminHealth,
    setAdminAudits,
    setAdminAuditCount,
    setAdminAutomationJobs,
    setPeopleDirectory,
    setUpgradeState: _setUpgradeState,
    setAutomationJobs,
    setSchemaDrift,
    setOpsIntelligence
  } = args;

  const refreshDispatchContext = useCallback(async (jobid: string): Promise<void> => {
    if (!isDispatchRole || dispatchAccessDenied) {
      return;
    }
    try {
      const data = await apiClient.dispatchContext(jobid);
      startTransition(() => {
        setDispatchContext({
          requests: (data.requests ?? []).map((row) => normalizeScheduleRequest(row as unknown as Record<string, unknown>)),
          schedules: (data.schedules ?? []).map((row) => normalizeSchedule(row as unknown as Record<string, unknown>)),
          documents: (data.documents ?? []).map((row) => normalizeDocument(row as unknown as Record<string, unknown>)),
          technicians: (data.technicians ?? []).map((row) => normalizeUser(row as unknown as Record<string, unknown>))
        });
      });
    } catch (error) {
      if (isUnauthorizedError(error)) {
        setDispatchAccessDenied(true);
        setDispatchContext(null);
        setFeedback("Dispatch controls are unavailable for this account.");
        return;
      }
      setFeedback(`Dispatch context load failed: ${errorMessage(error)}`);
    }
  }, [dispatchAccessDenied, isDispatchRole, setDispatchAccessDenied, setDispatchContext, setFeedback]);

  const handleInstallPrompt = useCallback(async (): Promise<void> => {
    if (!installPromptEvent) {
      setFeedback("Install prompt is not available on this device/browser.");
      return;
    }
    try {
      const installEvent = installPromptEvent as Event & { prompt?: () => Promise<void>; userChoice?: Promise<{ outcome: string }> };
      await installEvent.prompt?.();
      const result = await installEvent.userChoice;
      setFeedback(result?.outcome === "accepted" ? "PWA install accepted." : "PWA install dismissed.");
      setInstallPromptEvent(null);
    } catch (error) {
      setFeedback(`PWA install prompt failed: ${errorMessage(error)}`);
    }
  }, [installPromptEvent, setFeedback, setInstallPromptEvent]);

  const handleVerifyLocation = useCallback(async (): Promise<void> => {
    if (!navigator.geolocation) {
      setGeoVerification((prev) => ({
        ...prev,
        status: "error",
        message: "Geolocation is not supported in this browser."
      }));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        const accuracyMeters = position.coords.accuracy;
        const jobLat = selectedJob?.site_lat ?? null;
        const jobLng = selectedJob?.site_lng ?? null;
        const dist = jobLat != null && jobLng != null ? distanceMeters(latitude, longitude, jobLat, jobLng) : null;
        const status: "verified" | "warning" = dist == null || dist <= 500 ? "verified" : "warning";
        const message =
          dist == null
            ? "Location captured. No job site coordinates found in workbook for distance validation."
            : dist <= 500
              ? "Location verified within acceptable dispatch radius."
              : "Captured location is outside expected site radius.";
        setGeoVerification({
          status,
          capturedAt: new Date(position.timestamp).toISOString(),
          distanceMeters: dist,
          accuracyMeters,
          message,
          latitude,
          longitude
        });
      },
      (error) => {
        setGeoVerification((prev) => ({
          ...prev,
          status: "error",
          message: error.message || "Unable to capture location."
        }));
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 }
    );
  }, [selectedJob, setGeoVerification]);

  const handleLogin = useCallback(async (token: string): Promise<void> => {
    try {
      setLoading(true);
      await apiClient.login(token, productionAuth ? { gsiClientId: authConfig?.google_client_id ?? "" } : undefined);
      await refreshSession();
      await refreshJobs();
      setActiveWorkspaceTool("jobs");
      setPortalView("dashboard");
      setFeedback("Signed in.");
    } catch (error) {
      setFeedback(formatApiFailure(error));
    } finally {
      setLoading(false);
    }
  }, [authConfig?.google_client_id, productionAuth, refreshJobs, refreshSession, setActiveWorkspaceTool, setFeedback, setLoading, setPortalView]);

  const handleSupportTokenSubmit = useCallback(async (): Promise<void> => {
    if (productionAuth && !looksLikeJwt(loginToken)) {
      setFeedback("Use the Google sign-in button above. This field only accepts a raw Google ID token JWT for diagnostics.");
      return;
    }
    await handleLogin(loginToken);
  }, [handleLogin, loginToken, productionAuth, setFeedback]);

  const handleLogout = useCallback(async (): Promise<void> => {
    try {
      await apiClient.logout();
    } catch (error) {
      console.warn("Logout request failed, clearing session anyway", error);
    } finally {
      startTransition(() => {
        setSession(null);
        setEmulatedRole("");
        setActiveWorkspaceTool("jobs");
        setPortalView("dashboard");
        setFeedback("Session cleared.");
      });
    }
  }, [setActiveWorkspaceTool, setEmulatedRole, setFeedback, setPortalView, setSession]);

  const queueMutation = useCallback(async (mutation: Parameters<typeof enqueueMutation>[0]): Promise<void> => {
    await enqueueMutation({
      ...mutation,
      created_at: new Date().toISOString()
    });
    setQueueCount((count) => count + 1);
  }, [setQueueCount]);

  const handleStatusUpdate = useCallback(async (): Promise<void> => {
    if (!selectedJob) {
      return;
    }
    if (!selectableStatuses.includes(statusTarget)) {
      setFeedback(`Invalid transition from ${selectedJob.status} to ${statusTarget}.`);
      return;
    }

    const shouldQueue = offlineEnabled || !networkOnline;
    if (shouldQueue) {
      await queueMutation({
        mutation_id: `MUT-${crypto.randomUUID()}`,
        kind: "job_status",
        job_id: selectedJob.job_id,
        expected_row_version: selectedJob.row_version,
        payload: {
          status: statusTarget
        }
      });
      setFeedback("Status mutation queued for replay.");
      return;
    }

    await apiClient.updateStatus(selectedJob.job_id, statusTarget, selectedJob.row_version);
    await refreshJobs();
    setFeedback("Status updated.");
  }, [networkOnline, offlineEnabled, queueMutation, refreshJobs, selectedJob, selectableStatuses, setFeedback, statusTarget]);

  const handleBulkStatusUpdate = useCallback(async (jobIds: string[], status: JobStatus): Promise<void> => {
    if (jobIds.length === 0) {
      setFeedback("Select one or more jobs before running a bulk update.");
      return;
    }
    const candidates = jobs.filter((job) => jobIds.includes(job.job_id));
    if (candidates.length === 0) {
      setFeedback("No matching jobs were found for this bulk action.");
      return;
    }
    for (const job of candidates) {
      await apiClient.updateStatus(job.job_id, status, job.row_version);
    }
    await refreshJobs();
    setFeedback(`Bulk update complete: ${candidates.length} job(s) set to ${status}.`);
  }, [jobs, refreshJobs, setFeedback]);

  const handleNote = useCallback(async (): Promise<void> => {
    if (!selectedJob || noteValue.trim() === "") {
      return;
    }

    const shouldQueue = offlineEnabled || !networkOnline;
    if (shouldQueue) {
      await queueMutation({
        mutation_id: `MUT-${crypto.randomUUID()}`,
        kind: "job_note",
        job_id: selectedJob.job_id,
        expected_row_version: selectedJob.row_version,
        payload: {
          note: noteValue
        }
      });
      setFeedback("Note mutation queued for replay.");
      return;
    }

    await apiClient.addNote(selectedJob.job_id, noteValue, selectedJob.row_version);
    await refreshJobs();
    setFeedback("Job note written.");
  }, [networkOnline, noteValue, offlineEnabled, queueMutation, refreshJobs, selectedJob, setFeedback]);

  const handleReplay = useCallback(async (): Promise<void> => {
    const summary = await replayQueuedMutations();
    setQueueCount(summary.remaining);
    await refreshJobs();
    setFeedback(
      `Replay complete: attempted=${summary.attempted} removed=${summary.removed} remaining=${summary.remaining} conflicts=${summary.conflicts}`
    );
  }, [refreshJobs, setFeedback, setQueueCount]);

  const handleScheduleRequest = useCallback(async (): Promise<void> => {
    if (!selectedJob) {
      return;
    }

    const startIso = toIsoOrNull(preferredStart);
    const endIso = toIsoOrNull(preferredEnd);
    if (!startIso || !endIso) {
      setFeedback("Provide a valid preferred start and end time.");
      return;
    }
    if (Date.parse(startIso) >= Date.parse(endIso)) {
      setFeedback("Preferred end time must be after the preferred start time.");
      return;
    }

    const response = await apiClient.requestSchedule(
      selectedJob.job_id,
      {
        start_at: startIso,
        end_at: endIso
      },
      Intl.DateTimeFormat().resolvedOptions().timeZone,
      selectedJob.row_version
    );

    const createdRequestid = String(response.data?.request_id ?? "");
    await refreshDispatchContext(selectedJob.job_id);
    if (createdRequestid) {
      setSelectedRequestid(createdRequestid);
    }
    setFeedback(createdRequestid ? `Preferred slot request submitted (${createdRequestid}).` : "Preferred slot request submitted.");
  }, [preferredEnd, preferredStart, refreshDispatchContext, selectedJob, setFeedback, setSelectedRequestid]);

  const handleScheduleConfirm = useCallback(async (): Promise<void> => {
    if (!selectedRequest) {
      setFeedback("Select a stored request before confirming a schedule.");
      return;
    }
    if (confirmTechid.trim() === "") {
      setFeedback("Select a technician before confirming the schedule.");
      return;
    }

    const startIso = toIsoOrNull(confirmStart);
    const endIso = toIsoOrNull(confirmEnd);
    if (!startIso || !endIso) {
      setFeedback("Provide a valid confirm start and end time.");
      return;
    }
    if (Date.parse(startIso) >= Date.parse(endIso)) {
      setFeedback("Confirm end time must be after confirm start time.");
      return;
    }

    const response = await apiClient.confirmSchedule(
      selectedRequest.request_id,
      startIso,
      endIso,
      confirmTechid.trim(),
      selectedRequest.row_version,
      selectedJob ? { job_id: selectedJob.job_id } : undefined
    );

    const createdScheduleid = String(response.data?.schedule_id ?? "");
    if (selectedJob) {
      await refreshDispatchContext(selectedJob.job_id);
    }
    if (createdScheduleid) {
      setSelectedScheduleid(createdScheduleid);
    }

    setFeedback(createdScheduleid ? `Schedule confirmed (${createdScheduleid}).` : "Schedule confirmed.");
  }, [confirmEnd, confirmStart, confirmTechid, refreshDispatchContext, selectedJob, selectedRequest, setFeedback, setSelectedScheduleid]);

  const handleReschedule = useCallback(async (): Promise<void> => {
    if (!selectedSchedule) {
      setFeedback("Select a stored schedule before rescheduling it.");
      return;
    }

    const startIso = toIsoOrNull(rescheduleStart);
    const endIso = toIsoOrNull(rescheduleEnd);
    if (!startIso || !endIso) {
      setFeedback("Provide a valid reschedule start and end time.");
      return;
    }
    if (Date.parse(startIso) >= Date.parse(endIso)) {
      setFeedback("Reschedule end time must be after reschedule start time.");
      return;
    }

    await apiClient.reschedule(selectedSchedule.schedule_id, startIso, endIso, selectedSchedule.row_version, {
      job_id: selectedSchedule.job_id,
      technician_id: selectedSchedule.technician_id,
      request_id: selectedSchedule.request_id,
      calendar_event_id: selectedSchedule.calendar_event_id ?? ""
    });

    if (selectedJob) {
      await refreshDispatchContext(selectedJob.job_id);
    }
    setFeedback("Schedule rescheduled.");
  }, [refreshDispatchContext, rescheduleEnd, rescheduleStart, selectedJob, selectedSchedule, setFeedback]);

  const handleDocumentGenerate = useCallback(async (): Promise<void> => {
    if (!selectedJob) return;
    const jobid = selectedJob.job_id.trim();
    if (jobid === "") {
      setFeedback("Document generation requires a valid job selection.");
      return;
    }

    setFeedback(`Generating ${documentType.replace("_", " ")}...`);

    try {
      const isGas = selectedJob.title?.toLowerCase().includes("gas");
      const payload: DocumentPayload = {
        jobMeta: {
          jobId: selectedJob.job_id,
          correlationId: selectedJob.client_id || "KHARON-REF",
          date: new Date().toISOString().split("T")[0] || "",
          timeIn: "08:00",
          timeOut: "16:00",
          workType: selectedJob.status === "draft" ? "Installation" : "Maintenance"
        },
        client: {
          name: selectedJob.client_name || "N/A",
          address: selectedJob.site_id || "N/A",
          contactPerson: "Site Manager"
        },
        system: {
          type: isGas ? "Gas Suppression" : "Fire Detection",
          areaServed: "Common Areas",
          panelDetails: "Standard Kharon Panel"
        },
        technician: {
          name: selectedJob.technician_name || "Unassigned",
          saqccId: "12345",
          competenceLevel: "Technician",
          signatureUrl: ""
        },
        execution: {
          safetyCleared: true,
          isolations: "None",
          materialsUsed: "N/A",
          generalNotes: noteValue
        },
        fireData: {
          standard: "SANS 1475 / 10139",
          checklist: []
        },
        gasData: {
          standard: "SANS 14520",
          agent: "FM200",
          concentration: "7.9%",
          volume: "100m3",
          cylinders: "1",
          checklist: []
        },
        handover: {
          fireReinstated: true,
          gasActuatorsReconnected: true,
          logbooksUpdated: true,
          nextDueDate: new Date(Date.now() + 31536000000).toISOString().split("T")[0] || ""
        }
      };
      const blob = await renderComplianceDocument({ documentType, isGas, payload });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${documentType}_${jobid}.pdf`;
      link.click();
      URL.revokeObjectURL(url);

      setFeedback("Document generated successfully.");
      await apiClient.generateDocument(jobid, documentType, checklistData);
      await refreshDocuments(jobid);
    } catch (error) {
      console.error("PDF generation failed", error);
      setFeedback(`Generation failed: ${errorMessage(error)}`);
    }
  }, [checklistData, documentType, noteValue, refreshDocuments, selectedJob, setFeedback]);

  const handleDocumentPublishInline = useCallback(async (documentid: string, rowVersion: number, clientVisible: boolean): Promise<void> => {
    await apiClient.publishDocument(documentid, rowVersion, {
      ...(selectedJob ? { job_id: selectedJob.job_id } : {}),
      client_visible: clientVisible
    });

    await refreshDocuments(selectedJob?.job_id);
    setFeedback(`Document ${documentid} published (Visibility: ${clientVisible ? "Client" : "Internal"}).`);
  }, [refreshDocuments, selectedJob, setFeedback]);

  const handleDocumentPublish = useCallback(async (): Promise<void> => {
    const document = selectedDispatchDocument;
    if (!document) {
      setFeedback("Select a generated document before publishing it.");
      return;
    }

    await apiClient.publishDocument(document.document_id, document.row_version, {
      job_id: document.job_id,
      document_type: document.document_type
    });

    await refreshDocuments(selectedJob?.job_id);
    if (selectedJob && isDispatchRole) {
      await refreshDispatchContext(selectedJob.job_id);
    }
    setFeedback("Document published.");
  }, [isDispatchRole, refreshDispatchContext, refreshDocuments, selectedDispatchDocument, selectedJob, setFeedback]);

  const loadAdminAudits = useCallback(async (): Promise<void> => {
    const response = await apiClient.adminAudits();
    const data = response.data ?? [];
    setAdminAudits(data);
    setAdminAuditCount(data.length);
    setFeedback("Audit log fetched.");
  }, [setAdminAudits, setAdminAuditCount, setFeedback]);

  const loadAdminAutomationJobs = useCallback(async (): Promise<void> => {
    const response = await apiClient.adminAutomationJobs();
    const data = response.data ?? [];
    setAdminAutomationJobs(data);
    setFeedback(`Fetched ${data.length} automation entries.`);
  }, [setAdminAutomationJobs, setFeedback]);

  const handleRetryAutomation = useCallback(async (id: string): Promise<void> => {
    await apiClient.retryAutomation(id);
    await loadAdminAutomationJobs();
    setFeedback(`Retry queued for ${id}.`);
  }, [loadAdminAutomationJobs, setFeedback]);

  const handlePeopleSync = useCallback(async (payload: { name: string; email: string; phone: string; roleHint: string }): Promise<void> => {
    await apiClient.syncPerson(payload.name, payload.email, payload.phone, payload.roleHint);
    await refreshPeopleDirectory();
    setFeedback("People sync executed.");
  }, [refreshPeopleDirectory, setFeedback]);

  const handleAutomationRetry = useCallback(async (automationJobid: string): Promise<void> => {
    await apiClient.retryAutomation(automationJobid);
    await refreshAutomationJobs();
    setFeedback(`Automation retry requested (${automationJobid}).`);
  }, [refreshAutomationJobs, setFeedback]);

  return {
    refreshDispatchContext,
    handleInstallPrompt,
    handleVerifyLocation,
    handleLogin,
    handleSupportTokenSubmit,
    handleLogout,
    handleStatusUpdate,
    handleBulkStatusUpdate,
    handleNote,
    handleReplay,
    handleScheduleRequest,
    handleScheduleConfirm,
    handleReschedule,
    handleDocumentGenerate,
    handleDocumentPublishInline,
    handleDocumentPublish,
    loadAdminHealth,
    loadAdminAudits,
    loadAdminAutomationJobs,
    handleRetryAutomation,
    handlePeopleSync,
    handleAutomationRetry
  };
}
