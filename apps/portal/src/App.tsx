import React, { startTransition, useCallback, useEffect, useMemo, useState } from "react";
import type { JobDocumentRow, OfflineQueueItem, ScheduleRequestRow, ScheduleRow, UserRow, JobStatus, Role, JobEventRow } from "@kharon/domain";
import { listAllowedStatusTransitions } from "@kharon/domain";
import {
  apiClient,
  type AutomationJobEntry,
  type OpsIntelligencePayload,
  type PeopleDirectoryEntry,
  type PortalAuthConfig,
  type PortalDispatchContext,
  type PortalSession,
  type SchemaDriftPayload,
  type SkillMatrixRecord,
  type UpgradeWorkspaceState
} from "./apiClient";
import type { DocumentPayload } from "./pdfs/types";
import { enqueueMutation } from "./offline/queue";
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
import { FinanceOverviewCard } from "./components/FinanceOverviewCard";
import { FinanceQuotesCard } from "./components/FinanceQuotesCard";
import { FinanceInvoicesCard } from "./components/FinanceInvoicesCard";
import { FinancePaymentsCard } from "./components/FinancePaymentsCard";
import { FinanceDebtorsCard } from "./components/FinanceDebtorsCard";
import { FinanceStatementsCard } from "./components/FinanceStatementsCard";
import {
 SuperAdminOverview } from "./components/SuperAdminOverview";
import { SuperAdminDataChecks } from "./components/SuperAdminDataChecks";
import { SuperAdminAutomations } from "./components/SuperAdminAutomations";
import { SuperAdminSystemHealth } from "./components/SuperAdminSystemHealth";
import { SuperAdminActivityLog } from "./components/SuperAdminActivityLog";
import { SuperAdminBusinessUnits } from "./components/SuperAdminBusinessUnits";
import { AdminDashboard } from "./components/AdminDashboard";
import { AdminSettingsCard } from "./components/AdminSettingsCard";
import { DispatchDashboardCard } from "./components/DispatchDashboardCard";
import { DispatchUnassignedCard } from "./components/DispatchUnassignedCard";
import { DispatchDailyPlanCard } from "./components/DispatchDailyPlanCard";
import { TechMyDayCard } from "./components/TechMyDayCard";
import { TechCheckInOutCard } from "./components/TechCheckInOutCard";
import { TechHelpCard } from "./components/TechHelpCard";
import { ClientOverviewCard } from "./components/ClientOverviewCard";
import { ClientInvoicesCard } from "./components/ClientInvoicesCard";
import { ClientSupportCard } from "./components/ClientSupportCard";
import { PortalChrome } from "./components/PortalChrome";
import { PortalWorkspace } from "./components/PortalWorkspace";
import {
 renderComplianceDocument } from "./appShell/renderComplianceDocument";
import {
  COPY_GLOSSARY,
  distanceMeters,
  EMPTY_UPGRADE_STATE,
  errorMessage,
  firstRequestedSlot,
  formatApiFailure,
  isUnauthorizedError,
  looksLikeJwt,
  normalizeDocument,
  normalizeSchedule,
  normalizeScheduleRequest,
  normalizeUser,
  nowPlusHours,
  toIsoOrNull,
  toLocalInputValue,
  WORKSPACE_TOOL_META
} from "./appShell/helpers";
import { getWorkspaceToolGroups } from "./appShell/navigation";
import { getRoleLandingTool } from "./config/roleLanding";
import { useActionRunner } from "./appShell/useActionRunner";
import { useLiveSyncController } from "./appShell/useLiveSyncController";
import { useWorkspacePersistence } from "./appShell/useWorkspacePersistence";
import { usePortalDataControllers } from "./appShell/usePortalDataControllers";

export function PortalApp(): React.JSX.Element {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<PortalSession | null>(null);
  const [authConfig, setAuthConfig] = useState<PortalAuthConfig | null>(null);
  const [jobs, setJobs] = useState<JobRecord[]>([]);
  const [jobEvents, setJobEvents] = useState<JobEventRow[]>([]);
  const [selectedJobid, setSelectedJobid] = useState("");
  const [portalView, setPortalView] = useState<"dashboard" | "workspace">("dashboard");
  const [activeWorkspaceTool, setActiveWorkspaceTool] = useState("jobs");
  const [statusTarget, setStatusTarget] = useState<JobStatus>("draft");
  const [noteValue, setNoteValue] = useState("");
  const [loginToken, setLoginToken] = useState("dev-client");
  const [preferredStart, setPreferredStart] = useState(nowPlusHours(4));
  const [preferredEnd, setPreferredEnd] = useState(nowPlusHours(5));
  const [selectedRequestid, setSelectedRequestid] = useState("");
  const [confirmStart, setConfirmStart] = useState(nowPlusHours(6));
  const [confirmEnd, setConfirmEnd] = useState(nowPlusHours(7));
  const [confirmTechid, setConfirmTechid] = useState("");
  const [selectedScheduleid, setSelectedScheduleid] = useState("");
  const [rescheduleStart, setRescheduleStart] = useState(nowPlusHours(8));
  const [rescheduleEnd, setRescheduleEnd] = useState(nowPlusHours(9));
  const [documentType, setDocumentType] = useState<"jobcard" | "service_report" | "certificate">("jobcard");
  const [selectedDocumentid, setSelectedDocumentid] = useState("");
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
  const [selectedAutomationJobid, setSelectedAutomationJobid] = useState("");
  const [emulatedRole, setEmulatedRole] = useState<Role | "">("");
  const [checklistData, setChecklistData] = useState<Record<string, string>>({});
  const [confirmRequestid, setConfirmRequestid] = useState("");
  const [publishDocumentid, setPublishDocumentid] = useState("");
  const [confirmRowVersion, setConfirmRowVersion] = useState(0);
  const [publishRowVersion, setPublishRowVersion] = useState(0);
  const [rescheduleRowVersion, setRescheduleRowVersion] = useState(0);
  const [documentAccessDenied, setDocumentAccessDenied] = useState(false);
  const [dispatchAccessDenied, setDispatchAccessDenied] = useState(false);
  const [upgradeState, setUpgradeState] = useState<UpgradeWorkspaceState>(EMPTY_UPGRADE_STATE);
  const [focusMode, setFocusMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [defaultWorkspaceTool, setDefaultWorkspaceTool] = useState("jobs");
  const [pinnedTools, setPinnedTools] = useState<string[]>([]);
  const [onboardingDismissed, setOnboardingDismissed] = useState(false);
  const [dismissedNotifications, setDismissedNotifications] = useState<string[]>([]);
  const [schemaDrift, setSchemaDrift] = useState<SchemaDriftPayload | null>(null);
  const [opsIntelligence, setOpsIntelligence] = useState<OpsIntelligencePayload | null>(null);
  const [lastSyncPullAt, setLastSyncPullAt] = useState(new Date(0).toISOString());
  const [syncPulse, setSyncPulse] = useState<{ at: string; jobsChanged: number; queueChanged: number }>({
    at: "",
    jobsChanged: 0,
    queueChanged: 0
  });
  const [installPromptEvent, setInstallPromptEvent] = useState<Event | null>(null);
  const [geoVerification, setGeoVerification] = useState<{
    status: "idle" | "verified" | "warning" | "error";
    capturedAt: string;
    distanceMeters: number | null;
    accuracyMeters: number | null;
    message: string;
    latitude: number | null;
    longitude: number | null;
  }>({
    status: "idle",
    capturedAt: "",
    distanceMeters: null,
    accuracyMeters: null,
    message: "",
    latitude: null,
    longitude: null
  });


  const realRole = session?.session.role ?? null;
  const isRealSuperAdmin = realRole === "super_admin";
  const effectiveRole = emulatedRole || realRole;

  const isDispatchRole = effectiveRole === "dispatcher" || effectiveRole === "super_admin";
  const isFinanceRole = effectiveRole === "finance" || effectiveRole === "super_admin";
  const canAccessPeopleDirectory = effectiveRole === "dispatcher" || effectiveRole === "admin" || effectiveRole === "super_admin";
  const canGenerateDocuments = effectiveRole === "technician" || effectiveRole === "dispatcher" || effectiveRole === "admin" || effectiveRole === "super_admin";
  const isAdmin = effectiveRole === "admin" || effectiveRole === "super_admin";
  const isSuperAdmin = effectiveRole === "super_admin";

  const allowedWorkspaceTools = useMemo(() => {
    const tools = ["jobs", "documents"] as string[];
    if (isDispatchRole) tools.push("schedule", "comms");
    if (isFinanceRole) tools.push("finance");
    if (canAccessPeopleDirectory) tools.push("people");
    if (isAdmin) tools.push("admin");
    
    if (isSuperAdmin) {
      tools.push("sa_overview", "sa_users", "sa_units", "sa_checks", "sa_automations", "sa_health", "sa_activity");
    }
    
    return tools;
  }, [canAccessPeopleDirectory, isAdmin, isDispatchRole, isFinanceRole, isSuperAdmin]);
  const showOperationalEngagements = activeWorkspaceTool === "jobs";
  const { primaryTools } = useMemo(
    () => getWorkspaceToolGroups(effectiveRole ?? "client", allowedWorkspaceTools),
    [effectiveRole, allowedWorkspaceTools]
  );
  const landingWorkspaceTool = useMemo(() => getRoleLandingTool(effectiveRole ?? "client"), [effectiveRole]);

  const handleEmulateRole = useCallback(
    (role: Role | "") => {
      setEmulatedRole(role);
      const targetRole = role || realRole || "client";
      const targetTool = getRoleLandingTool(targetRole as Role);
      setActiveWorkspaceTool(targetTool);
      setPortalView("workspace");
    },
    [realRole]
  );

  const activeToolMeta = WORKSPACE_TOOL_META[activeWorkspaceTool] ?? {
    label: "Workspace",
    helper: "Use the sidebar to move between sections"
  };
  const filteredJobs = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) {
      return jobs;
    }
    return jobs.filter((job) =>
      [job.job_id, job.title, job.client_id, job.technician_id, job.client_name ?? "", job.technician_name ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [searchTerm, jobs]);

  const selectedJob = useMemo(() => filteredJobs.find((job) => job.job_id === selectedJobid) ?? null, [filteredJobs, selectedJobid]);
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
    () => dispatchRequests.find((request) => request.request_id === selectedRequestid) ?? null,
    [dispatchRequests, selectedRequestid]
  );
  const selectedSchedule = useMemo(
    () => dispatchSchedules.find((schedule) => schedule.schedule_id === selectedScheduleid) ?? null,
    [dispatchSchedules, selectedScheduleid]
  );
  const selectedDispatchDocument = useMemo(
    () => dispatchDocuments.find((document) => document.document_id === selectedDocumentid) ?? null,
    [dispatchDocuments, selectedDocumentid]
  );

  const openJobCount = filteredJobs.filter((job) => job.status !== "certified" && job.status !== "cancelled").length;
  const generatedDocumentCount = documents.length;
  const selectedJobDocumentCount = selectedJob ? documents.filter((document) => String(document.job_id) === selectedJob.job_id).length : 0;
  const selectedJobStatus = selectedJob?.status ?? "No selection";
  const syncPulseText = syncPulse.at
    ? `Last sync ${new Date(syncPulse.at).toLocaleTimeString()} (jobs ${syncPulse.jobsChanged}, queue ${syncPulse.queueChanged})`
    : "Sync pulse idle";
  const productionAuth = authConfig?.mode === "production";
  const notifications = useMemo(() => {
    const items: Array<{ id: string; tone: "warning" | "critical" | "active"; title: string; detail: string }> = [];
    if (!networkOnline || queueCount > 0) {
      items.push({
        id: "sync",
        tone: networkOnline ? "warning" : "critical",
        title: networkOnline ? "Changes waiting to sync" : "Offline mode enabled",
        detail: networkOnline ? `${queueCount} queued change(s)` : "Reconnect to sync queued updates"
      });
    }
    const highRisk = filteredJobs.filter((job) => /urgent|critical|fault|overdue/i.test(job.last_note ?? "")).length;
    if (highRisk > 0) {
      items.push({
        id: "risk",
        tone: "critical",
        title: "High-risk jobs detected",
        detail: `${highRisk} job(s) require immediate attention`
      });
    }
    const pendingEscrow = upgradeState.escrow.filter((item) => item.status === "locked").length;
    if (pendingEscrow > 0) {
      items.push({
        id: "escrow",
        tone: "warning",
        title: "Certificates on escrow hold",
        detail: `${pendingEscrow} file(s) waiting for payment reconciliation`
      });
    }
    return items.filter((item) => !dismissedNotifications.includes(item.id));
  }, [dismissedNotifications, filteredJobs, networkOnline, queueCount, upgradeState.escrow]);

  const { actionPending, runAction } = useActionRunner(setFeedback);

  useWorkspacePersistence({
    selectedJobid,
    statusTarget,
    activeWorkspaceTool,
    setSelectedJobid,
    setStatusTarget,
    setActiveWorkspaceTool
  });

  useEffect(() => {
    const saved = localStorage.getItem("kharon_geo_verification");
    if (!saved) {
      return;
    }
    try {
      const parsed = JSON.parse(saved) as typeof geoVerification;
      setGeoVerification(parsed);
    } catch {
      // ignore malformed cache
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("kharon_geo_verification", JSON.stringify(geoVerification));
  }, [geoVerification]);

  useEffect(() => {
    if (!effectiveRole) {
      return;
    }
    const prefKey = `kharon_workspace_pref_${effectiveRole}`;
    try {
      const raw = localStorage.getItem(prefKey);
      if (!raw) {
        return;
      }
      const parsed = JSON.parse(raw) as { defaultTool?: string; pinnedTools?: string[]; onboardingDismissed?: boolean };
      if (parsed.defaultTool && allowedWorkspaceTools.includes(parsed.defaultTool)) {
        setDefaultWorkspaceTool(parsed.defaultTool);
      }
      if (Array.isArray(parsed.pinnedTools)) {
        setPinnedTools(parsed.pinnedTools.filter((tool) => allowedWorkspaceTools.includes(tool)));
      }
      setOnboardingDismissed(Boolean(parsed.onboardingDismissed));
    } catch {
      // ignore malformed preference payload
    }
  }, [allowedWorkspaceTools, effectiveRole]);

  useEffect(() => {
    if (!allowedWorkspaceTools.includes(defaultWorkspaceTool)) {
      setDefaultWorkspaceTool(allowedWorkspaceTools[0] ?? "jobs");
    }
  }, [allowedWorkspaceTools, defaultWorkspaceTool]);

  useEffect(() => {
    if (!effectiveRole) {
      return;
    }
    const prefKey = `kharon_workspace_pref_${effectiveRole}`;
    localStorage.setItem(
      prefKey,
      JSON.stringify({
        defaultTool: defaultWorkspaceTool,
        pinnedTools,
        onboardingDismissed
      })
    );
  }, [defaultWorkspaceTool, effectiveRole, onboardingDismissed, pinnedTools]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName;
      if (activeTag === "INPUT" || activeTag === "TEXTAREA" || activeTag === "SELECT") {
        if (event.key === "Escape") {
          (document.activeElement as HTMLElement | null)?.blur();
        }
        return;
      }

      if (event.key === "/") {
        event.preventDefault();
        (document.getElementById("job-search-input") ?? document.getElementById("workspace-global-search"))?.focus();
      }

      if (event.key.toLowerCase() === "j") {
        setActiveWorkspaceTool("jobs");
      }
      if (event.key.toLowerCase() === "d") {
        setPortalView("dashboard");
      }
      if (event.key.toLowerCase() === "f") {
        setFocusMode((prev) => !prev);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (effectiveRole === "client") {
      document.documentElement.style.setProperty("--role-accent", "var(--color-primary)");
    } else {
      document.documentElement.style.removeProperty("--role-accent");
    }
  }, [effectiveRole]);

  useEffect(() => {
    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPromptEvent(event);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt as EventListener);
    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt as EventListener);
  }, []);

  useLiveSyncController({
    sessionActive: Boolean(session),
    networkOnline,
    lastSyncPullAt,
    setLastSyncPullAt,
    setSyncPulse,
    setJobs,
    setJobEvents
  });

  useEffect(() => {
    if (!selectedJob) {
      return;
    }
    const prefix = documentType === "certificate" ? "CERT" : documentType === "service_report" ? "RPT" : "JBC";
    const suggestedNumber = `${prefix}-${selectedJob.job_id}`.replace(/\s+/g, "-");
    const payload: Record<string, string> = {
      job_id: selectedJob.job_id,
      site_id: selectedJob.site_id ?? "",
      client_name: selectedJob.client_name ?? "",
      technician_name: selectedJob.technician_name ?? "",
      suggested_document_number: suggestedNumber,
      sync_pulse: syncPulse.at ? new Date(syncPulse.at).toISOString() : "",
      geo_verified_at: geoVerification.capturedAt
    };
    setChecklistData((prev) => ({ ...payload, ...prev }));
  }, [documentType, geoVerification.capturedAt, selectedJob, syncPulse.at]);

  const {
    refreshQueueCount,
    refreshJobs,
    refreshDocuments,
    refreshPeopleDirectory,
    refreshUpgradeWorkspaceState,
    refreshAutomationJobs,
    loadSchemaDrift,
    loadOpsIntelligence,
    refreshSession,
    refreshAuthConfig
  } = usePortalDataControllers({
    session,
    selectedJobid,
    canAccessPeopleDirectory,
    documentAccessDenied,
    setJobs,
    setSession,
    setSelectedJobid,
    setDocuments,
    setPeopleDirectory,
    setAutomationJobs,
    setUpgradeState,
    setDocumentAccessDenied,
    setSchemaDrift,
    setOpsIntelligence,
    setFeedback,
    setQueueCount
  });

  // Contextual dispatch: auto-populate ids from selected job metadata
  useEffect(() => {
    let isActive = true;
    if (selectedJob && isActive) {
      if (selectedJob.active_request_id) setConfirmRequestid(selectedJob.active_request_id);
      if (selectedJob.active_document_id) setPublishDocumentid(selectedJob.active_document_id);
      if (selectedJob.suggested_technician_id) setConfirmTechid(selectedJob.suggested_technician_id);

      setConfirmRowVersion(selectedJob.row_version);
      setPublishRowVersion(selectedJob.row_version);
      setRescheduleRowVersion(selectedJob.row_version);
    }
    return () => { isActive = false; };
  }, [selectedJobid, selectedJob?.row_version]);

  async function refreshDispatchContext(jobid: string): Promise<void> {
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
  }

  async function handleInstallPrompt(): Promise<void> {
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
  }

  async function handleVerifyLocation(): Promise<void> {
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
  }

  useEffect(() => {
    const online = () => setNetworkOnline(true);
    const offline = () => setNetworkOnline(false);
    window.addEventListener("online", online);
    window.addEventListener("offline", offline);

    void (async () => {
      try {
        const config = await refreshAuthConfig();
        if (config) {
          setAuthConfig(config);
        }
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
      setSelectedJobid("");
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
    if (!session || !selectedJobid) {
      setDocuments([]);
      setDispatchContext(null);
      return;
    }

    if (activeWorkspaceTool === "jobs" || activeWorkspaceTool === "documents" || activeWorkspaceTool === "finance") {
      void refreshDocuments(selectedJobid);
    }
    if (activeWorkspaceTool === "schedule" && isDispatchRole) {
      void refreshDispatchContext(selectedJobid);
    }
  }, [activeWorkspaceTool, isDispatchRole, selectedJobid, session]);

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
      void loadSchemaDrift();
      void loadOpsIntelligence();
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
      setSelectedRequestid("");
      return;
    }
    if (!dispatchRequests.some((request) => request.request_id === selectedRequestid)) {
      setSelectedRequestid(dispatchRequests[0]?.request_id ?? "");
    }
  }, [dispatchRequests, selectedRequestid]);

  useEffect(() => {
    if (dispatchSchedules.length === 0) {
      setSelectedScheduleid("");
      return;
    }
    if (!dispatchSchedules.some((schedule) => schedule.schedule_id === selectedScheduleid)) {
      setSelectedScheduleid(dispatchSchedules[0]?.schedule_id ?? "");
    }
  }, [dispatchSchedules, selectedScheduleid]);

  useEffect(() => {
    if (dispatchDocuments.length === 0) {
      setSelectedDocumentid("");
      return;
    }
    if (!dispatchDocuments.some((document) => document.document_id === selectedDocumentid)) {
      setSelectedDocumentid(dispatchDocuments[0]?.document_id ?? "");
    }
  }, [dispatchDocuments, selectedDocumentid]);

  useEffect(() => {
    if (automationJobs.length === 0) {
      setSelectedAutomationJobid("");
      return;
    }
    if (!automationJobs.some((job) => job.automation_job_id === selectedAutomationJobid)) {
      setSelectedAutomationJobid(automationJobs[0]?.automation_job_id ?? "");
    }
  }, [automationJobs, selectedAutomationJobid]);

  useEffect(() => {
    if (technicians.length === 0) {
      setConfirmTechid("");
      return;
    }
    if (!technicians.some((technician) => technician.technician_id === confirmTechid)) {
      setConfirmTechid(technicians[0]?.technician_id ?? "");
    }
  }, [confirmTechid, technicians]);

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
  }

  async function handleBulkStatusUpdate(jobIds: string[], status: JobStatus): Promise<void> {
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
        job_id: selectedJob.job_id,
        expected_row_version: selectedJob.row_version,
        payload: {
          note: noteValue
        }
      });
      setNoteValue("");
      setFeedback("Note mutation queued for replay.");
      return;
    }

    await apiClient.addNote(selectedJob.job_id, noteValue, selectedJob.row_version);
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
  }

  async function handleScheduleConfirm(): Promise<void> {
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
  }

  async function handleDocumentGenerate(): Promise<void> {
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
  }

  async function handleDocumentPublishInline(documentid: string, rowVersion: number, clientVisible: boolean): Promise<void> {
    await apiClient.publishDocument(documentid, rowVersion, {
      ...(selectedJob ? { job_id: selectedJob.job_id } : {}),
      client_visible: clientVisible
    });

    await refreshDocuments(selectedJob?.job_id);
    setFeedback(`Document ${documentid} published (Visibility: ${clientVisible ? 'Client' : 'Internal'}).`);
  }

  async function handleDocumentPublish(): Promise<void> {
    const document = selectedDispatchDocument as JobDocumentRow | null;
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


  async function handleRetryAutomation(id: string): Promise<void> {
    await apiClient.retryAutomation(id);
    await loadAdminAutomationJobs();
    setFeedback(`Retry queued for ${id}.`);
  }

  async function handlePeopleSync(payload: { name: string; email: string; phone: string; roleHint: string }): Promise<void> {
    await apiClient.syncPerson(payload.name, payload.email, payload.phone, payload.roleHint);
    await refreshPeopleDirectory();
    setFeedback("People sync executed.");
  }

  async function handleAutomationRetry(automationJobid: string): Promise<void> {
    await apiClient.retryAutomation(automationJobid);
    await refreshAutomationJobs();
    setFeedback(`Automation retry requested (${automationJobid}).`);
  }


  if (loading) {
    return (
      <div className="portal-shell portal-shell--loading">
        <div className="loading-card">Loading portal workspaceâ€¦</div>
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
          onboardingDismissed={onboardingDismissed}
          onDismissOnboarding={() => setOnboardingDismissed(true)}
          onEnterWorkspace={(tool) => {
            const targetTool = tool === "jobs" ? landingWorkspaceTool : tool;
            setActiveWorkspaceTool(allowedWorkspaceTools.includes(targetTool) ? targetTool : tool);
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
      <PortalChrome
        session={session}
        effectiveRole={effectiveRole ?? ""}
        emulatedRole={emulatedRole}
        offlineEnabled={offlineEnabled}
        onOfflineEnabledChange={setOfflineEnabled}
        networkOnline={networkOnline}
        syncPulseText={syncPulse.at ? `Sync ${new Date(syncPulse.at).toLocaleTimeString()}` : "Sync idle"}
        focusMode={focusMode}
        onFocusModeChange={setFocusMode}
        installPromptAvailable={Boolean(installPromptEvent)}
        onInstallApp={() => runAction(handleInstallPrompt)}
        queueCount={queueCount}
        onReplayQueue={() => runAction(handleReplay)}
        onLogout={() => runAction(handleLogout)}
        onGoHome={() => setPortalView("dashboard")}
        activeWorkspaceTool={activeWorkspaceTool}
        onActiveWorkspaceToolChange={setActiveWorkspaceTool}
        primaryTools={primaryTools}
      >
        <PortalWorkspace
          state={{
            portalView,
            session,
            effectiveRole: effectiveRole ?? "",
            emulatedRole,
            jobs,
            selectedJobid,
            onSelectJobid: setSelectedJobid,
            searchTerm,
            onSearchTermChange: setSearchTerm,
            activeWorkspaceTool,
            onActiveWorkspaceToolChange: setActiveWorkspaceTool,
            allowedWorkspaceTools,
            defaultWorkspaceTool,
            onboardingDismissed,
            onDismissOnboarding: () => setOnboardingDismissed(true),
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
            onStatusUpdate: () => runAction(handleStatusUpdate),
            onNote: () => runAction(handleNote),
            noteValue,
            setNoteValue,
            statusTarget,
            setStatusTarget,
            selectableStatuses,
            onScheduleRequest: () => runAction(handleScheduleRequest),
            onScheduleConfirm: () => runAction(handleScheduleConfirm),
            onReschedule: () => runAction(handleReschedule),
            onDocumentGenerate: () => runAction(handleDocumentGenerate),
            onDocumentPublish: () => runAction(handleDocumentPublish),
            onBulkStatusUpdate: (ids: string[], status: JobStatus) => runAction(() => handleBulkStatusUpdate(ids, status)),
            canGenerateDocuments,
            documentGenerateDisabledReason: canGenerateDocuments
              ? "Document APIs are currently unavailable for this account. Contact an administrator to restore access."
              : "This role can review job status and notes, but cannot generate documents.",
            documentAccessDenied,
            dispatchAccessDenied,
            geoVerification,
            onVerifyLocation: handleVerifyLocation,
            syncPulseText,
            jobEvents,
            notifications,
            onDismissNotification: (id: string) => setDismissedNotifications((prev) => [...prev, id]),
            onDismissAllNotifications: () => setDismissedNotifications(notifications.map((item) => item.id)),
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
            adminAutomationJobEntries: adminAutomationJobs,
            automationJobs,
            selectedAutomationJobid,
            onSelectAutomationJobid: setSelectedAutomationJobid,
            onLoadHealth: () => runAction(loadAdminHealth),
            onLoadAudits: () => runAction(loadAdminAudits),
            onLoadAutomationJobs: () => runAction(loadAdminAutomationJobs),
            onRetryAutomation: (id: string) => runAction(() => handleRetryAutomation(id)),
            onEmulateRole: handleEmulateRole,
            onLoadSchemaDrift: () => runAction(loadSchemaDrift),
            onLoadOpsIntelligence: () => runAction(loadOpsIntelligence),
            peopleDirectory,
            upgradeState,
            setFeedback,
            refreshUpgradeWorkspaceState,
            onUpsertSkill: (payload: SkillMatrixRecord) =>
              runAction(async () => {
                await apiClient.upsertSkillMatrix(payload);
                await refreshUpgradeWorkspaceState();
              }),
            onPeopleSync: (payload: { name: string; email: string; phone: string; roleHint: string }) => handlePeopleSync(payload),
            selectedJobTitle: selectedJob?.title ?? "",
            onLogout: () => runAction(handleLogout)
          }}
        />
      </PortalChrome>

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

