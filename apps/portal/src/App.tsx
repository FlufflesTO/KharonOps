import React, { startTransition, useEffect, useMemo, useState } from "react";
import type { JobDocumentRow, OfflineQueueItem, ScheduleRequestRow, ScheduleRow, UserRow, JobStatus, Role } from "@kharon/domain";
import { listAllowedStatusTransitions } from "@kharon/domain";
import {
  apiClient,
  type AutomationJobEntry,
  type PeopleDirectoryEntry,
  type PortalAuthConfig,
  type PortalDispatchContext,
  type PortalSession,
  type SkillMatrixRecord,
  type UpgradeWorkspaceState
} from "./apiClient";
import { enqueueMutation, listQueuedMutations } from "./offline/queue";
import { replayQueuedMutations } from "./offline/replay";

import { SummaryBoard } from "./components/SummaryBoard";
import { OfflineBanner } from "./components/OfflineBanner";
import { JobListView, type JobRecord } from "./components/JobListView";
import { JobDetailView } from "./components/JobDetailView";
import { PortalAuth } from "./components/PortalAuth";
import { ScheduleControlCard } from "./components/ScheduleControlCard";
import { CommunicationRailsCard } from "./components/CommunicationRailsCard";
import { AdminPanelCard } from "./components/AdminPanelCard";
import { DocumentHistoryCard } from "./components/DocumentHistoryCard";
import { DashboardView } from "./components/DashboardView";
import { RegistryCard } from "./components/RegistryCard";
import { PeopleDirectoryCard } from "./components/PeopleDirectoryCard";
import { FinanceOpsCard } from "./components/FinanceOpsCard";


function asJob(record: Record<string, unknown>): JobRecord {
  const status = String(record.status ?? "draft") as JobStatus;

  return {
    job_uid: String(record.job_uid ?? ""),
    title: String(record.title ?? ""),
    status,
    row_version: Number(record.row_version ?? 0),
    client_uid: String(record.client_uid ?? ""),
    technician_uid: String(record.technician_uid ?? ""),
    client_name: String(record.client_name ?? ""),
    technician_name: String(record.technician_name ?? ""),
    last_note: String(record.last_note ?? ""),
    // Metadata preservation for contextual dispatch
    active_request_uid: String(record.active_request_uid ?? ""),
    active_document_uid: String(record.active_document_uid ?? ""),
    suggested_technician_uid: String(record.suggested_technician_uid ?? "")
  };
}

function nowPlusHours(hours: number): string {
  const value = new Date(Date.now() + hours * 60 * 60 * 1000);
  return value.toISOString().slice(0, 16);
}

function toIsoOrNull(value: string): string | null {
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) {
    return null;
  }
  return new Date(parsed).toISOString();
}

function toLocalInputValue(value: string): string {
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) {
    return nowPlusHours(1);
  }
  return new Date(parsed).toISOString().slice(0, 16);
}

function errorMessage(error: unknown): string {
  const typed = error as { error?: { message?: string } };
  return typed.error?.message ?? String(error);
}

function errorCode(error: unknown): string {
  const typed = error as { error?: { code?: string } };
  return typed.error?.code ?? "";
}

function formatApiFailure(error: unknown): string {
  const typed = error as {
    error?: { code?: string; message?: string; details?: unknown };
    correlation_id?: string;
  };
  const message = typed.error?.message ?? "Request failed";
  const code = typed.error?.code ? ` [${typed.error.code}]` : "";
  const correlation = typed.correlation_id ? ` (corr: ${typed.correlation_id})` : "";
  const details = typed.error?.details ? ` details=${JSON.stringify(typed.error.details)}` : "";
  return `${message}${code}${correlation}${details}`;
}

function isUnauthorizedError(error: unknown): boolean {
  const code = errorCode(error);
  if (code === "unauthorized" || code === "forbidden") {
    return true;
  }
  return /401|unauthori[sz]ed|forbidden/i.test(errorMessage(error));
}

function looksLikeJwt(token: string): boolean {
  const trimmed = token.trim();
  return trimmed.split(".").length === 3 && trimmed.length > 40;
}

function firstRequestedSlot(request: ScheduleRequestRow | null): { start_at: string; end_at: string } | null {
  if (!request) {
    return null;
  }

  try {
    const parsed = JSON.parse(request.preferred_slots_json) as Array<{ start_at?: string; end_at?: string }>;
    const first = parsed[0];
    if (!first?.start_at || !first?.end_at) {
      return null;
    }
    return {
      start_at: first.start_at,
      end_at: first.end_at
    };
  } catch {
    return null;
  }
}

const EMPTY_UPGRADE_STATE: UpgradeWorkspaceState = {
  quotes: [],
  invoices: [],
  statements: [],
  debtors: [],
  escrow: [],
  skills: []
};

export function PortalApp(): React.JSX.Element {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<PortalSession | null>(null);
  const [authConfig, setAuthConfig] = useState<PortalAuthConfig | null>(null);
  const [jobs, setJobs] = useState<JobRecord[]>([]);
  const [selectedJobUid, setSelectedJobUid] = useState("");
  const [portalView, setPortalView] = useState<"dashboard" | "workspace">("dashboard");
  const [activeWorkspaceTool, setActiveWorkspaceTool] = useState("jobs");
  const [statusTarget, setStatusTarget] = useState<JobStatus>("draft");
  const [noteValue, setNoteValue] = useState("");
  const [loginToken, setLoginToken] = useState("dev-client");
  const [preferredStart, setPreferredStart] = useState(nowPlusHours(4));
  const [preferredEnd, setPreferredEnd] = useState(nowPlusHours(5));
  const [selectedRequestUid, setSelectedRequestUid] = useState("");
  const [confirmStart, setConfirmStart] = useState(nowPlusHours(6));
  const [confirmEnd, setConfirmEnd] = useState(nowPlusHours(7));
  const [confirmTechUid, setConfirmTechUid] = useState("");
  const [selectedScheduleUid, setSelectedScheduleUid] = useState("");
  const [rescheduleStart, setRescheduleStart] = useState(nowPlusHours(8));
  const [rescheduleEnd, setRescheduleEnd] = useState(nowPlusHours(9));
  const [documentType, setDocumentType] = useState<"jobcard" | "service_report" | "certificate">("jobcard");
  const [selectedDocumentUid, setSelectedDocumentUid] = useState("");
  const [offlineEnabled, setOfflineEnabled] = useState(false);
  const [networkOnline, setNetworkOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true);
  const [queueCount, setQueueCount] = useState(0);
  const [feedback, setFeedback] = useState("Ready.");
  const [documents, setDocuments] = useState<Array<Record<string, unknown>>>([]);
  const [dispatchContext, setDispatchContext] = useState<PortalDispatchContext | null>(null);
  const [peopleDirectory, setPeopleDirectory] = useState<PeopleDirectoryEntry[]>([]);
  const [adminHealth, setAdminHealth] = useState<Record<string, unknown> | null>(null);
  const [adminAudits, setAdminAudits] = useState<Array<Record<string, unknown>>>([]);
  const [adminAutomationJobs, setAdminAutomationJobs] = useState<Array<Record<string, unknown>>>([]);
  const [adminAuditCount, setAdminAuditCount] = useState(0);
  const [automationJobs, setAutomationJobs] = useState<AutomationJobEntry[]>([]);
  const [selectedAutomationJobUid, setSelectedAutomationJobUid] = useState("");
  const [actionPending, setActionPending] = useState(false);
  const [emulatedRole, setEmulatedRole] = useState<Role | "">("");
  const [checklistData, setChecklistData] = useState<Record<string, string>>({});
  const [confirmRequestUid, setConfirmRequestUid] = useState("");
  const [publishDocumentUid, setPublishDocumentUid] = useState("");
  const [confirmRowVersion, setConfirmRowVersion] = useState(0);
  const [publishRowVersion, setPublishRowVersion] = useState(0);
  const [rescheduleRowVersion, setRescheduleRowVersion] = useState(0);
  const [documentAccessDenied, setDocumentAccessDenied] = useState(false);
  const [dispatchAccessDenied, setDispatchAccessDenied] = useState(false);
  const [upgradeState, setUpgradeState] = useState<UpgradeWorkspaceState>(EMPTY_UPGRADE_STATE);


  const realRole = session?.session.role ?? null;
  const isRealSuperAdmin = realRole === "super_admin";
  const effectiveRole = emulatedRole || realRole;

  const isDispatchRole = effectiveRole === "dispatcher" || effectiveRole === "super_admin";
  const isFinanceRole = effectiveRole === "finance" || effectiveRole === "super_admin";
  const canAccessPeopleDirectory = effectiveRole === "dispatcher" || effectiveRole === "admin" || effectiveRole === "super_admin";
  const canGenerateDocuments = effectiveRole === "technician" || effectiveRole === "dispatcher" || effectiveRole === "super_admin";
  const isAdmin = effectiveRole === "admin" || effectiveRole === "super_admin";
  const isSuperAdmin = effectiveRole === "super_admin";
  const allowedWorkspaceTools = useMemo(() => {
    const tools = ["jobs", "documents"] as string[];
    if (isDispatchRole) tools.push("schedule", "comms");
    if (isFinanceRole) tools.push("finance");
    if (canAccessPeopleDirectory) tools.push("people");
    if (isAdmin) tools.push("admin");
    return tools;
  }, [canAccessPeopleDirectory, isAdmin, isDispatchRole, isFinanceRole]);
  const showOperationalEngagements =
    activeWorkspaceTool === "jobs" ||
    activeWorkspaceTool === "schedule" ||
    activeWorkspaceTool === "documents" ||
    activeWorkspaceTool === "comms" ||
    activeWorkspaceTool === "finance";

  const selectedJob = useMemo(() => jobs.find((job) => job.job_uid === selectedJobUid) ?? null, [jobs, selectedJobUid]);
  const selectableStatuses = useMemo<JobStatus[]>(
    () => {
      if (!selectedJob) return ["draft"];
      const allowed = listAllowedStatusTransitions(selectedJob.status);
      if (effectiveRole === "technician") {
        return allowed.filter(s => s === "performed" || s === "cancelled");
      }
      return allowed;
    },
    [selectedJob, effectiveRole]
  );

  const dispatchRequests = dispatchContext?.requests ?? [];
  const dispatchSchedules = dispatchContext?.schedules ?? [];
  const dispatchDocuments = dispatchContext?.documents ?? [];
  const technicians = dispatchContext?.technicians ?? [];

  const selectedRequest = useMemo(
    () => dispatchRequests.find((request) => request.request_uid === selectedRequestUid) ?? null,
    [dispatchRequests, selectedRequestUid]
  );
  const selectedSchedule = useMemo(
    () => dispatchSchedules.find((schedule) => schedule.schedule_uid === selectedScheduleUid) ?? null,
    [dispatchSchedules, selectedScheduleUid]
  );
  const selectedDispatchDocument = useMemo(
    () => dispatchDocuments.find((document) => document.document_uid === selectedDocumentUid) ?? null,
    [dispatchDocuments, selectedDocumentUid]
  );

  const openJobCount = jobs.filter((job) => job.status !== "certified" && job.status !== "cancelled").length;
  const generatedDocumentCount = documents.length;
  const selectedJobStatus = selectedJob?.status ?? "No selection";
  const productionAuth = authConfig?.mode === "production";

  const runAction = (action: () => Promise<void>): void => {
    if (actionPending) {
      setFeedback("Another action is still running. Wait a moment and retry.");
      return;
    }
    setActionPending(true);
    void action()
      .catch((error) => {
        const code = errorCode(error);
        if (code === "google_transient_error") {
          setFeedback("Google API rate limit reached (429). Wait 30-60 seconds and retry one action at a time.");
          return;
        }
        setFeedback(errorMessage(error));
      })
      .finally(() => {
        setActionPending(false);
      });
  };

  async function refreshQueueCount(): Promise<void> {
    try {
      const queue = await listQueuedMutations();
      setQueueCount(queue.length);
    } catch (error) {
      setQueueCount(0);
      setFeedback(`Offline queue unavailable: ${errorMessage(error)}`);
    }
  }

  async function refreshJobs(): Promise<void> {
    if (!session) {
      return;
    }
    try {
      const data = await apiClient.listJobs();
      const mapped = data.map(asJob);
      startTransition(() => {
        setJobs(mapped);
        if (!mapped.some((job) => job.job_uid === selectedJobUid)) {
          setSelectedJobUid(mapped[0]?.job_uid ?? "");
        }
      });
    } catch (error) {
      setFeedback(`Jobs load failed: ${errorMessage(error)}`);
    }
  }

  // Contextual dispatch: auto-populate UIDs from selected job metadata
  useEffect(() => {
    let isActive = true;
    if (selectedJob && isActive) {
      // Prioritize preserving the row_version logic for the target job
      if (selectedJob.active_request_uid) setConfirmRequestUid(selectedJob.active_request_uid);
      if (selectedJob.active_document_uid) setPublishDocumentUid(selectedJob.active_document_uid);
      if (selectedJob.suggested_technician_uid) setConfirmTechUid(selectedJob.suggested_technician_uid);
      
      // Safety: always ensure row versions are synced to the selection

      setConfirmRowVersion(selectedJob.row_version);
      setPublishRowVersion(selectedJob.row_version);
      setRescheduleRowVersion(selectedJob.row_version);
    }
    return () => { isActive = false; };
  }, [selectedJobUid, selectedJob?.row_version]);

  async function refreshDocuments(jobUid?: string): Promise<void> {
    if (documentAccessDenied) {
      return;
    }
    try {
      const response = await apiClient.history(jobUid);
      startTransition(() => {
        setDocuments(response.data ?? []);
      });
    } catch (error) {
      if (isUnauthorizedError(error)) {
        setDocumentAccessDenied(true);
        setDocuments([]);
        setFeedback("Document access is unavailable for this account.");
        return;
      }
      setFeedback(`Document history load failed: ${errorMessage(error)}`);
    }
  }

  async function refreshDispatchContext(jobUid: string): Promise<void> {
    if (!isDispatchRole || dispatchAccessDenied) {
      return;
    }
    try {
      const data = await apiClient.dispatchContext(jobUid);
      startTransition(() => {
        setDispatchContext(data);
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
  }

  async function refreshPeopleDirectory(): Promise<void> {
    try {
      const people = await apiClient.listPeople();
      startTransition(() => {
        setPeopleDirectory(people);
      });
    } catch (error) {
      setFeedback(`People directory load failed: ${errorMessage(error)}`);
    }
  }

  async function refreshUpgradeWorkspaceState(): Promise<void> {
    try {
      const data = await apiClient.getUpgradeWorkspaceState();
      startTransition(() => {
        setUpgradeState(data);
      });
    } catch (error) {
      setFeedback(`Upgrade workspace load failed: ${errorMessage(error)}`);
    }
  }

  async function refreshAutomationJobs(): Promise<void> {
    try {
      const jobs = await apiClient.listAutomationJobs();
      startTransition(() => {
        setAutomationJobs(jobs);
      });
    } catch (error) {
      setFeedback(`Automation queue load failed: ${errorMessage(error)}`);
    }
  }

  async function refreshSession(): Promise<void> {
    try {
      const activeSession = await apiClient.session();
      startTransition(() => {
        setSession(activeSession);
      });
    } catch {
      startTransition(() => {
        setSession(null);
      });
    }
  }

  async function refreshAuthConfig(): Promise<void> {
    try {
      const config = await apiClient.authConfig();
      setAuthConfig(config);
    } catch (error) {
      setFeedback(`Auth config failed: ${errorMessage(error)}`);
    }
  }

  useEffect(() => {
    const online = () => setNetworkOnline(true);
    const offline = () => setNetworkOnline(false);
    window.addEventListener("online", online);
    window.addEventListener("offline", offline);

    void (async () => {
      try {
        await refreshAuthConfig();
        await refreshSession();
        await refreshQueueCount();
      } finally {
        setLoading(false);
      }
    })();

    return () => {
      window.removeEventListener("online", online);
      window.removeEventListener("offline", offline);
    };
  }, []);

  useEffect(() => {
    if (!session) {
      setJobs([]);
      setSelectedJobUid("");
      setDocuments([]);
      setDispatchContext(null);
      setPeopleDirectory([]);
      setAdminAudits([]);
      setAutomationJobs([]);
      setUpgradeState(EMPTY_UPGRADE_STATE);
      return;
    }

    setDocumentAccessDenied(false);
    setDispatchAccessDenied(false);
    void refreshJobs();
    if (effectiveRole === "dispatcher" || effectiveRole === "admin" || effectiveRole === "finance" || effectiveRole === "super_admin") {
      void refreshUpgradeWorkspaceState();
    }
  }, [session, effectiveRole]);

  useEffect(() => {
    if (!session || !selectedJobUid) {
      setDocuments([]);
      setDispatchContext(null);
      return;
    }

    if (activeWorkspaceTool === "jobs" || activeWorkspaceTool === "documents" || activeWorkspaceTool === "finance") {
      void refreshDocuments(selectedJobUid);
    }
    if (activeWorkspaceTool === "schedule" && isDispatchRole) {
      void refreshDispatchContext(selectedJobUid);
    }
  }, [activeWorkspaceTool, isDispatchRole, selectedJobUid, session]);

  useEffect(() => {
    if (activeWorkspaceTool === "people" && canAccessPeopleDirectory) {
      void refreshPeopleDirectory();
      void refreshUpgradeWorkspaceState();
    }
  }, [activeWorkspaceTool, canAccessPeopleDirectory]);

  useEffect(() => {
    if (activeWorkspaceTool === "documents" || activeWorkspaceTool === "finance") {
      if (effectiveRole === "dispatcher" || effectiveRole === "admin" || effectiveRole === "finance" || effectiveRole === "super_admin") {
        void refreshUpgradeWorkspaceState();
      }
    }
  }, [activeWorkspaceTool, effectiveRole]);

  useEffect(() => {
    if (activeWorkspaceTool === "admin" && isAdmin) {
      void refreshAutomationJobs();
    }
  }, [activeWorkspaceTool, isAdmin]);

  useEffect(() => {
    if (!allowedWorkspaceTools.includes(activeWorkspaceTool)) {
      setActiveWorkspaceTool("jobs");
      if (portalView === "workspace") {
        setPortalView("dashboard");
      }
    }
  }, [activeWorkspaceTool, allowedWorkspaceTools, portalView]);

  useEffect(() => {
    if (!selectableStatuses.includes(statusTarget)) {
      const next = selectableStatuses[0];
      if (next) {
        setStatusTarget(next);
      }
    }
  }, [selectableStatuses, statusTarget]);

  useEffect(() => {
    if (dispatchRequests.length === 0) {
      setSelectedRequestUid("");
      return;
    }
    if (!dispatchRequests.some((request) => request.request_uid === selectedRequestUid)) {
      setSelectedRequestUid(dispatchRequests[0]?.request_uid ?? "");
    }
  }, [dispatchRequests, selectedRequestUid]);

  useEffect(() => {
    if (dispatchSchedules.length === 0) {
      setSelectedScheduleUid("");
      return;
    }
    if (!dispatchSchedules.some((schedule) => schedule.schedule_uid === selectedScheduleUid)) {
      setSelectedScheduleUid(dispatchSchedules[0]?.schedule_uid ?? "");
    }
  }, [dispatchSchedules, selectedScheduleUid]);

  useEffect(() => {
    if (dispatchDocuments.length === 0) {
      setSelectedDocumentUid("");
      return;
    }
    if (!dispatchDocuments.some((document) => document.document_uid === selectedDocumentUid)) {
      setSelectedDocumentUid(dispatchDocuments[0]?.document_uid ?? "");
    }
  }, [dispatchDocuments, selectedDocumentUid]);

  useEffect(() => {
    if (automationJobs.length === 0) {
      setSelectedAutomationJobUid("");
      return;
    }
    if (!automationJobs.some((job) => job.automation_job_uid === selectedAutomationJobUid)) {
      setSelectedAutomationJobUid(automationJobs[0]?.automation_job_uid ?? "");
    }
  }, [automationJobs, selectedAutomationJobUid]);

  useEffect(() => {
    if (technicians.length === 0) {
      setConfirmTechUid("");
      return;
    }
    if (!technicians.some((technician) => technician.technician_uid === confirmTechUid)) {
      setConfirmTechUid(technicians[0]?.technician_uid ?? "");
    }
  }, [confirmTechUid, technicians]);

  useEffect(() => {
    const preferredSlot = firstRequestedSlot(selectedRequest);
    if (!preferredSlot) {
      return;
    }
    setConfirmStart(toLocalInputValue(preferredSlot.start_at));
    setConfirmEnd(toLocalInputValue(preferredSlot.end_at));
  }, [selectedRequest]);

  useEffect(() => {
    if (!selectedSchedule) {
      return;
    }
    setRescheduleStart(toLocalInputValue(selectedSchedule.start_at));
    setRescheduleEnd(toLocalInputValue(selectedSchedule.end_at));
  }, [selectedSchedule]);

  async function handleLogin(token: string): Promise<void> {
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
  }

  async function handleSupportTokenSubmit(): Promise<void> {
    if (productionAuth && !looksLikeJwt(loginToken)) {
      setFeedback("Use the Google sign-in button above. This field only accepts a raw Google ID token JWT for diagnostics.");
      return;
    }

    await handleLogin(loginToken);
  }

  async function handleLogout(): Promise<void> {
    await apiClient.logout();
    setSession(null);
    setEmulatedRole("");
    setActiveWorkspaceTool("jobs");
    setPortalView("dashboard");
    setFeedback("Session cleared.");
  }

  async function queueMutation(mutation: Omit<OfflineQueueItem, "created_at">): Promise<void> {
    await enqueueMutation({
      ...mutation,
      created_at: new Date().toISOString()
    });
    await refreshQueueCount();
  }

  async function handleStatusUpdate(): Promise<void> {
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
        job_uid: selectedJob.job_uid,
        expected_row_version: selectedJob.row_version,
        payload: {
          status: statusTarget
        }
      });
      setFeedback("Status mutation queued for replay.");
      return;
    }

    await apiClient.updateStatus(selectedJob.job_uid, statusTarget, selectedJob.row_version);
    await refreshJobs();
    setFeedback("Status updated.");
  }

  async function handleNote(): Promise<void> {
    if (!selectedJob || noteValue.trim() === "") {
      return;
    }

    const shouldQueue = offlineEnabled || !networkOnline;
    if (shouldQueue) {
      await queueMutation({
        mutation_id: `MUT-${crypto.randomUUID()}`,
        kind: "job_note",
        job_uid: selectedJob.job_uid,
        expected_row_version: selectedJob.row_version,
        payload: {
          note: noteValue
        }
      });
      setNoteValue("");
      setFeedback("Note mutation queued for replay.");
      return;
    }

    await apiClient.addNote(selectedJob.job_uid, noteValue, selectedJob.row_version);
    setNoteValue("");
    await refreshJobs();
    setFeedback("Job note written.");
  }

  async function handleReplay(): Promise<void> {
    const summary = await replayQueuedMutations();
    await refreshQueueCount();
    await refreshJobs();
    setFeedback(
      `Replay complete: attempted=${summary.attempted} removed=${summary.removed} remaining=${summary.remaining} conflicts=${summary.conflicts}`
    );
  }

  async function handleScheduleRequest(): Promise<void> {
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
      selectedJob.job_uid,
      {
        start_at: startIso,
        end_at: endIso
      },
      Intl.DateTimeFormat().resolvedOptions().timeZone,
      selectedJob.row_version
    );

    const createdRequestUid = String(response.data?.request_uid ?? "");
    await refreshDispatchContext(selectedJob.job_uid);
    if (createdRequestUid) {
      setSelectedRequestUid(createdRequestUid);
    }
    setFeedback(createdRequestUid ? `Preferred slot request submitted (${createdRequestUid}).` : "Preferred slot request submitted.");
  }

  async function handleScheduleConfirm(): Promise<void> {
    if (!selectedRequest) {
      setFeedback("Select a stored request before confirming a schedule.");
      return;
    }
    if (confirmTechUid.trim() === "") {
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
      selectedRequest.request_uid,
      startIso,
      endIso,
      confirmTechUid.trim(),
      selectedRequest.row_version,
      selectedJob ? { job_uid: selectedJob.job_uid } : undefined
    );

    const createdScheduleUid = String(response.data?.schedule_uid ?? "");
    if (selectedJob) {
      await refreshDispatchContext(selectedJob.job_uid);
    }
    if (createdScheduleUid) {
      setSelectedScheduleUid(createdScheduleUid);
    }

    setFeedback(createdScheduleUid ? `Schedule confirmed (${createdScheduleUid}).` : "Schedule confirmed.");
  }

  async function handleReschedule(): Promise<void> {
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

    await apiClient.reschedule(selectedSchedule.schedule_uid, startIso, endIso, selectedSchedule.row_version, {
      job_uid: selectedSchedule.job_uid,
      technician_uid: selectedSchedule.technician_uid,
      request_uid: selectedSchedule.request_uid,
      calendar_event_id: selectedSchedule.calendar_event_id ?? ""
    });


    if (selectedJob) {
      await refreshDispatchContext(selectedJob.job_uid);
    }
    setFeedback("Schedule rescheduled.");
  }

  async function handleDocumentGenerate(): Promise<void> {
    if (!selectedJob) {
      return;
    }
    const jobUid = selectedJob.job_uid.trim();
    if (jobUid === "") {
      setFeedback("Document generation requires a valid job selection.");
      return;
    }
    if (!canGenerateDocuments || documentAccessDenied) {
      setFeedback("Document generation is disabled for this role/account.");
      return;
    }

    let response: Awaited<ReturnType<typeof apiClient.generateDocument>>;
    try {
      response = await apiClient.generateDocument(jobUid, documentType, checklistData);
    } catch (error) {
      if (errorCode(error) === "not_found") {
        await refreshJobs();
        setFeedback("Selected job was not found on the server. Job list refreshed; select a valid job and retry.");
        return;
      }
      throw error;
    }
    const generatedDocumentUid = String(response.data?.document_uid ?? "");

    await refreshDocuments(jobUid);
    if (isDispatchRole) {
      await refreshDispatchContext(jobUid);
    }
    if (generatedDocumentUid) {
      setSelectedDocumentUid(generatedDocumentUid);
    }

    setFeedback(generatedDocumentUid ? `${documentType} generated (${generatedDocumentUid}).` : `${documentType} generated.`);
  }

  async function handleDocumentPublishInline(documentUid: string, rowVersion: number, clientVisible: boolean): Promise<void> {
    await apiClient.publishDocument(documentUid, rowVersion, {
      ...(selectedJob ? { job_uid: selectedJob.job_uid } : {}),
      client_visible: clientVisible
    });

    await refreshDocuments(selectedJob?.job_uid);
    setFeedback(`Document ${documentUid} published (Visibility: ${clientVisible ? 'Client' : 'Internal'}).`);
  }

  async function handleDocumentPublish(): Promise<void> {
    const document = selectedDispatchDocument as JobDocumentRow | null;
    if (!document) {
      setFeedback("Select a generated document before publishing it.");
      return;
    }

    await apiClient.publishDocument(document.document_uid, document.row_version, {
      job_uid: document.job_uid,
      document_type: document.document_type
    });

    await refreshDocuments(selectedJob?.job_uid);
    if (selectedJob && isDispatchRole) {
      await refreshDispatchContext(selectedJob.job_uid);
    }
    setFeedback("Document published.");
  }

  async function loadAdminHealth(): Promise<void> {
    const response = await apiClient.adminHealth();
    setAdminHealth(response.data ?? null);
    setFeedback("Admin health fetched.");
  }

  async function loadAdminAudits(): Promise<void> {
    const response = await apiClient.adminAudits();
    const data = response.data ?? [];
    setAdminAudits(data);
    setAdminAuditCount(data.length);
    setFeedback("Audit log fetched.");
  }

  async function loadAdminAutomationJobs(): Promise<void> {
    const response = await apiClient.adminAutomationJobs();
    const data = response.data ?? [];
    setAdminAutomationJobs(data);
    setFeedback(`Fetched ${data.length} automation entries.`);
  }


  async function handleRetryAutomation(uid: string): Promise<void> {
    await apiClient.retryAutomation(uid);
    await loadAdminAutomationJobs();
    setFeedback(`Retry queued for ${uid}.`);
  }

  async function handlePeopleSync(payload: { name: string; email: string; phone: string; roleHint: string }): Promise<void> {
    await apiClient.syncPerson(payload.name, payload.email, payload.phone, payload.roleHint);
    await refreshPeopleDirectory();
    setFeedback("People sync executed.");
  }

  async function handleAutomationRetry(automationJobUid: string): Promise<void> {
    await apiClient.retryAutomation(automationJobUid);
    await refreshAutomationJobs();
    setFeedback(`Automation retry requested (${automationJobUid}).`);
  }


  if (loading) {
    return (
      <div className="portal-shell portal-shell--loading">
        <div className="loading-card">Loading portal workspace…</div>
      </div>
    );
  }

  if (!session) {
    return (
      <PortalAuth
        authConfig={authConfig}
        productionAuth={productionAuth}
        loginToken={loginToken}
        setLoginToken={setLoginToken}
        onLogin={(token) => runAction(() => handleLogin(token))}
        onSupportTokenSubmit={() => runAction(handleSupportTokenSubmit)}
        feedback={feedback}
      />
    );
  }


  if (portalView === "dashboard") {
    return (
      <div className={`portal-shell portal-shell--${effectiveRole}`}>
        <DashboardView
          session={session}
          openJobCount={openJobCount}
          overrideRole={effectiveRole as Role}
          onEnterWorkspace={(tool) => {
            setActiveWorkspaceTool(tool);
            setPortalView("workspace");
          }}
          onLogout={() => runAction(handleLogout)}
        />
        <footer className="portal-statusbar">
          <div className="feedback-line">
            <span>Feedback</span>
            <pre>{feedback}</pre>
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div className={`portal-shell portal-shell--${effectiveRole}`}>
      <header className="portal-topbar">
        <div className="portal-topbar__brand">
          <div className="portal-mark">
            <svg viewBox="0 0 100 100" width="32" height="32" aria-hidden="true">
              <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8" />
              <circle cx="50" cy="50" r="12" fill="currentColor" />
            </svg>
          </div>
          <div>
            <div className="portal-title">KHARON COMMAND CENTRE</div>
            <div className="portal-subtitle">
              {session.session.display_name} | {effectiveRole?.toUpperCase()}
              {emulatedRole && <span className="emulation-tag"> [EMULATING: {emulatedRole.toUpperCase()}]</span>}
            </div>
          </div>
        </div>

        <div className="portal-topbar__actions">
          <label className="toggle-inline">
            <input
              id="portal-offline-queue-toggle"
              name="portal_offline_queue_toggle"
              type="checkbox"
              checked={offlineEnabled}
              onChange={(event) => setOfflineEnabled(event.target.checked)}
            />
            Force queue mode
          </label>
          <span className={`status-chip status-chip--${networkOnline ? "active" : "critical"}`}>{networkOnline ? "Online" : "Offline"}</span>
          <button className="button button--secondary" type="button" onClick={() => setPortalView("dashboard")}>
            Dashboard
          </button>
          <button className="button button--secondary" type="button" onClick={() => runAction(handleReplay)}>
            Execute Queue ({queueCount})
          </button>
          <button className="button button--ghost" type="button" onClick={() => runAction(handleLogout)}>
            Logout
          </button>
        </div>
      </header>

      <div className={`portal-layout ${showOperationalEngagements ? "" : "portal-layout--no-sidebar"}`}>
        {showOperationalEngagements ? (
          <aside className="portal-sidebar">
            <JobListView
              jobs={jobs}
              selectedJobUid={selectedJobUid}
              onSelectJob={setSelectedJobUid}
              title="Jobs List"
            />
          </aside>
        ) : null}

        <main className="portal-main">
            <SummaryBoard
              role={effectiveRole || "client"}
              openJobCount={openJobCount}
              selectedJobStatus={selectedJobStatus}
              queueCount={queueCount}
              generatedDocumentCount={generatedDocumentCount}
              adminAuditCount={adminAuditCount}
              networkOnline={networkOnline}
            />


          <section className="workspace-grid">
            {activeWorkspaceTool === "jobs" ? (
              <JobDetailView
                selectedJob={selectedJob}
                role={effectiveRole ?? "client"}
                selectableStatuses={selectableStatuses}
                statusTarget={statusTarget}
                setStatusTarget={setStatusTarget}
                noteValue={noteValue}
                setNoteValue={setNoteValue}
                onStatusUpdate={() => runAction(handleStatusUpdate)}
                onNote={() => runAction(handleNote)}
                preferredStart={preferredStart}
                setPreferredStart={setPreferredStart}
                preferredEnd={preferredEnd}
                setPreferredEnd={setPreferredEnd}
                onScheduleRequest={() => runAction(handleScheduleRequest)}
                documentType={documentType}
                setDocumentType={setDocumentType}
                onDocumentGenerate={() => runAction(handleDocumentGenerate)}
                canGenerateDocuments={canGenerateDocuments && !documentAccessDenied}
                documentGenerateDisabledReason={
                  canGenerateDocuments
                    ? "Document APIs are currently unavailable for this account. Contact an administrator to restore access."
                    : "This role can review job status and notes, but cannot generate documents."
                }
                onChecklistChange={setChecklistData}
                selectedJobTitle="Job Detail"
              />
            ) : null}

            {activeWorkspaceTool === "schedule" && isDispatchRole && !dispatchAccessDenied ? (
              <ScheduleControlCard
                selectedJobUid={selectedJob?.job_uid ?? ""}
                preferredStart={preferredStart}
                setPreferredStart={setPreferredStart}
                preferredEnd={preferredEnd}
                setPreferredEnd={setPreferredEnd}
                requests={dispatchRequests}
                selectedRequestUid={selectedRequestUid}
                setSelectedRequestUid={setSelectedRequestUid}
                confirmStart={confirmStart}
                setConfirmStart={setConfirmStart}
                confirmEnd={confirmEnd}
                setConfirmEnd={setConfirmEnd}
                confirmTechUid={confirmTechUid}
                setConfirmTechUid={setConfirmTechUid}
                technicians={technicians}
                schedules={dispatchSchedules}
                selectedScheduleUid={selectedScheduleUid}
                setSelectedScheduleUid={setSelectedScheduleUid}
                rescheduleStart={rescheduleStart}
                setRescheduleStart={setRescheduleStart}
                rescheduleEnd={rescheduleEnd}
                setRescheduleEnd={setRescheduleEnd}
                rescheduleRowVersion={rescheduleRowVersion}
                setRescheduleRowVersion={setRescheduleRowVersion}
                documents={dispatchDocuments}
                selectedDocumentUid={selectedDocumentUid}
                setSelectedDocumentUid={setSelectedDocumentUid}
                onScheduleRequest={() => runAction(handleScheduleRequest)}
                onScheduleConfirm={() => runAction(handleScheduleConfirm)}
                onReschedule={() => runAction(handleReschedule)}
                onDocumentPublish={() => runAction(handleDocumentPublish)}
                onFeedback={setFeedback}

              />
            ) : null}

            {activeWorkspaceTool === "comms" && isDispatchRole ? (
              <CommunicationRailsCard
                selectedJobUid={selectedJob?.job_uid ?? ""}
                selectedJobTitle={selectedJob?.title ?? ""}
                onFeedback={setFeedback}
              />
            ) : null}

            {activeWorkspaceTool === "admin" && isAdmin ? (
              <AdminPanelCard
                adminHealth={adminHealth}
                adminAudits={adminAudits}
                adminAutomationJobs={adminAutomationJobs}
                adminAuditCount={adminAuditCount}
                automationJobs={automationJobs}
                selectedAutomationJobUid={selectedAutomationJobUid}
                setSelectedAutomationJobUid={setSelectedAutomationJobUid}
                onLoadHealth={() => runAction(loadAdminHealth)}
                onLoadAudits={() => runAction(loadAdminAudits)}
                onLoadAutomationJobs={() => runAction(loadAdminAutomationJobs)}
                onRetryAutomation={(uid) => runAction(() => handleRetryAutomation(uid))}
                onFeedback={setFeedback}
                emulatedRole={emulatedRole}
                onEmulateRole={(role) => {
                  setEmulatedRole(role);
                  setActiveWorkspaceTool("jobs");
                  setPortalView("dashboard");
                }}

              />
            ) : null}

            {activeWorkspaceTool === "documents" ? (
              <DocumentHistoryCard
                documents={documents}
                selectedJobUid={selectedJob?.job_uid ?? ""}
                role={effectiveRole ?? "client"}
                escrowByDocumentUid={Object.fromEntries(upgradeState.escrow.map((row) => [row.document_uid, row]))}

                onRefresh={() => runAction(() => refreshDocuments(selectedJob?.job_uid))}
                onPublish={(uid, ver, vis) => runAction(() => handleDocumentPublishInline(uid, ver, vis))}
              />
            ) : null}

            {activeWorkspaceTool === "finance" && isFinanceRole ? (
              <FinanceOpsCard
                jobs={jobs}
                documents={documents}
                store={upgradeState}
                onRefreshStore={() => runAction(refreshUpgradeWorkspaceState)}
                onCreateQuote={(payload) =>
                  runAction(async () => {
                    await apiClient.createFinanceQuote(payload);
                    await refreshUpgradeWorkspaceState();
                  })
                }
                onUpdateQuoteStatus={(quoteUid, status) =>
                  runAction(async () => {
                    await apiClient.updateFinanceQuoteStatus(quoteUid, status);
                    await refreshUpgradeWorkspaceState();
                  })
                }
                onCreateInvoiceFromQuote={(quoteUid, dueDate) =>
                  runAction(async () => {
                    await apiClient.createInvoiceFromQuote(quoteUid, dueDate);
                    await refreshUpgradeWorkspaceState();
                  })
                }
                onReconcileInvoice={(invoiceUid) =>
                  runAction(async () => {
                    await apiClient.reconcileInvoice(invoiceUid);
                    await apiClient.rebuildUpgradeAnalytics();
                    await refreshUpgradeWorkspaceState();
                  })
                }
                onLockEscrow={(documentUid, invoiceUid) =>
                  runAction(async () => {
                    await apiClient.lockEscrow(documentUid, invoiceUid);
                    await refreshUpgradeWorkspaceState();
                  })
                }
                onRebuildAnalytics={() =>
                  runAction(async () => {
                    await apiClient.rebuildUpgradeAnalytics();
                    await refreshUpgradeWorkspaceState();
                  })
                }
              />
            ) : null}

            {activeWorkspaceTool === "people" && canAccessPeopleDirectory ? (
              <PeopleDirectoryCard
                people={peopleDirectory}
                skillsState={upgradeState.skills}
                onUpsertSkill={(payload: SkillMatrixRecord) =>
                  runAction(async () => {
                    await apiClient.upsertSkillMatrix(payload);
                    await refreshUpgradeWorkspaceState();
                  })
                }
                onSync={(payload) => handlePeopleSync(payload)}
                onFeedback={setFeedback}
              />
            ) : null}

          </section>
        </main>
      </div>

      <footer className="portal-statusbar">
        <OfflineBanner
          networkOnline={networkOnline}
          queueCount={queueCount}
          onReplay={() => runAction(handleReplay)}
          actionPending={actionPending}
        />
        <div className="feedback-line">
          <span>Feedback</span>
          <pre>{feedback}</pre>
        </div>
      </footer>
    </div>
  );
}

