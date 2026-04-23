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
import { usePortalActionControllers } from "./appShell/usePortalActionControllers";

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
      if (!isRealSuperAdmin) {
        setFeedback("Role switching is only available on Super Admin accounts.");
        return;
      }
      setEmulatedRole(role);
      const targetRole = role || realRole || "client";
      const targetTool = getRoleLandingTool(targetRole as Role);
      setActiveWorkspaceTool(targetTool);
      setPortalView("workspace");
    },
    [isRealSuperAdmin, realRole, setFeedback]
  );

  const portalActions = usePortalActionControllers({
    session,
    authConfig,
    productionAuth: authConfig?.mode === "production",
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
    selectedJobStatus: selectedJob?.status ?? "No selection",
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
    setSelectedAutomationJobid,
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
    setUpgradeState,
    setAutomationJobs,
    setSchemaDrift,
    setOpsIntelligence
  });

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
        onLogin={(token) => runAction(() => portalActions.handleLogin(token))}
        onSupportTokenSubmit={() => runAction(portalActions.handleSupportTokenSubmit)}
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
          onLogout={() => runAction(portalActions.handleLogout)}
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
        onInstallApp={() => runAction(portalActions.handleInstallPrompt)}
        queueCount={queueCount}
        onReplayQueue={() => runAction(portalActions.handleReplay)}
        onLogout={() => runAction(portalActions.handleLogout)}
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
            onStatusUpdate: () => runAction(portalActions.handleStatusUpdate),
            onNote: () => runAction(portalActions.handleNote),
            noteValue,
            setNoteValue,
            statusTarget,
            setStatusTarget,
            selectableStatuses,
            onScheduleRequest: () => runAction(portalActions.handleScheduleRequest),
            onScheduleConfirm: () => runAction(portalActions.handleScheduleConfirm),
            onReschedule: () => runAction(portalActions.handleReschedule),
            onDocumentGenerate: () => runAction(portalActions.handleDocumentGenerate),
            onDocumentPublish: () => runAction(portalActions.handleDocumentPublish),
            onBulkStatusUpdate: (ids: string[], status: JobStatus) => runAction(() => portalActions.handleBulkStatusUpdate(ids, status)),
            canGenerateDocuments,
            documentGenerateDisabledReason: canGenerateDocuments
              ? "Document APIs are currently unavailable for this account. Contact an administrator to restore access."
              : "This role can review job status and notes, but cannot generate documents.",
            documentAccessDenied,
            dispatchAccessDenied,
            geoVerification,
            onVerifyLocation: portalActions.handleVerifyLocation,
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
            onLoadHealth: () => runAction(portalActions.loadAdminHealth),
            onLoadAudits: () => runAction(portalActions.loadAdminAudits),
            onLoadAutomationJobs: () => runAction(portalActions.loadAdminAutomationJobs),
            onRetryAutomation: (id: string) => runAction(() => portalActions.handleRetryAutomation(id)),
            isRealSuperAdmin,
            onEmulateRole: handleEmulateRole,
            onLoadSchemaDrift: () => runAction(portalActions.loadSchemaDrift),
            onLoadOpsIntelligence: () => runAction(portalActions.loadOpsIntelligence),
            peopleDirectory,
            upgradeState,
            setFeedback,
            refreshUpgradeWorkspaceState,
            onUpsertSkill: (payload: SkillMatrixRecord) =>
              runAction(async () => {
                await apiClient.upsertSkillMatrix(payload);
                await refreshUpgradeWorkspaceState();
              }),
            onPeopleSync: (payload: { name: string; email: string; phone: string; roleHint: string }) => portalActions.handlePeopleSync(payload),
            selectedJobTitle: selectedJob?.title ?? "",
            onLogout: () => runAction(portalActions.handleLogout)
          }}
        />
      </PortalChrome>

      <footer className="portal-statusbar">
        <OfflineBanner
          networkOnline={networkOnline}
          queueCount={queueCount}
          onReplay={() => runAction(portalActions.handleReplay)}
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


