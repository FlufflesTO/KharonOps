import React, { startTransition, useEffect, useMemo, useState } from "react";
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


function pickString(record: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    const value = record[key];
    const text = String(value ?? "").trim();
    if (text !== "") {
      return text;
    }
  }
  return "";
}

function pickNumber(record: Record<string, unknown>, ...keys: string[]): number {
  for (const key of keys) {
    const value = Number(record[key] ?? NaN);
    if (Number.isFinite(value)) {
      return value;
    }
  }
  return 0;
}

function asJob(record: Record<string, unknown>): JobRecord {
  const status = String(record.status ?? "draft") as JobStatus;

  return {
    job_id: pickString(record, "job_id"),
    title: String(record.title ?? ""),
    status,
    row_version: pickNumber(record, "row_version"),
    client_id: pickString(record, "client_id"),
    technician_id: pickString(record, "technician_id", "primary_technician_id"),
    client_name: String(record.client_name ?? ""),
    technician_name: String(record.technician_name ?? ""),
    updated_at: String(record.updated_at ?? ""),
    site_id: pickString(record, "site_id"),
    site_lat: Number.isFinite(Number(record.site_lat ?? record.latitude ?? NaN)) ? Number(record.site_lat ?? record.latitude) : null,
    site_lng: Number.isFinite(Number(record.site_lng ?? record.longitude ?? NaN)) ? Number(record.site_lng ?? record.longitude) : null,
    last_note: String(record.last_note ?? ""),
    // Metadata preservation for contextual dispatch
    active_request_id: pickString(record, "active_request_id"),
    active_document_id: pickString(record, "active_document_id"),
    suggested_technician_id: pickString(record, "suggested_technician_id")
  };
}

function normalizeScheduleRequest(record: Record<string, unknown>): ScheduleRequestRow {
  return {
    request_id: pickString(record, "request_id"),
    job_id: pickString(record, "job_id"),
    client_id: pickString(record, "client_id"),
    preferred_slots_json: String(record.preferred_slots_json ?? "[]"),
    timezone: String(record.timezone ?? ""),
    notes: String(record.notes ?? ""),
    status: (String(record.status ?? "requested") as ScheduleRequestRow["status"]),
    row_version: pickNumber(record, "row_version"),
    updated_at: String(record.updated_at ?? ""),
    updated_by: String(record.updated_by ?? ""),
    correlation_id: String(record.correlation_id ?? "")
  };
}

function normalizeSchedule(record: Record<string, unknown>): ScheduleRow {
  return {
    schedule_id: pickString(record, "schedule_id"),
    request_id: pickString(record, "request_id"),
    job_id: pickString(record, "job_id"),
    calendar_event_id: String(record.calendar_event_id ?? ""),
    start_at: String(record.start_at ?? ""),
    end_at: String(record.end_at ?? ""),
    technician_id: pickString(record, "technician_id"),
    status: (String(record.status ?? "confirmed") as ScheduleRow["status"]),
    row_version: pickNumber(record, "row_version"),
    updated_at: String(record.updated_at ?? ""),
    updated_by: String(record.updated_by ?? ""),
    correlation_id: String(record.correlation_id ?? "")
  };
}

function normalizeDocument(record: Record<string, unknown>): JobDocumentRow {
  return {
    document_id: pickString(record, "document_id"),
    job_id: pickString(record, "job_id"),
    document_type: (String(record.document_type ?? "service_report") as JobDocumentRow["document_type"]),
    status: (String(record.status ?? "generated") as JobDocumentRow["status"]),
    drive_file_id: String(record.drive_file_id ?? ""),
    pdf_file_id: String(record.pdf_file_id ?? ""),
    published_url: String(record.published_url ?? ""),
    client_visible: Boolean(record.client_visible ?? false),
    row_version: pickNumber(record, "row_version"),
    updated_at: String(record.updated_at ?? ""),
    updated_by: String(record.updated_by ?? ""),
    correlation_id: String(record.correlation_id ?? "")
  };
}

function normalizeJobEvent(record: Record<string, unknown>): JobEventRow {
  return {
    event_id: pickString(record, "event_id"),
    job_id: pickString(record, "job_id"),
    event_type: String(record.event_type ?? ""),
    payload_json: String(record.payload_json ?? "{}"),
    created_at: String(record.created_at ?? ""),
    created_by: String(record.created_by ?? ""),
    correlation_id: String(record.correlation_id ?? "")
  };
}

function normalizeUser(record: Record<string, unknown>): UserRow {
  return {
    user_id: pickString(record, "user_id"),
    email: String(record.email ?? ""),
    display_name: String(record.display_name ?? ""),
    role: String(record.role ?? "client") as UserRow["role"],
    client_id: pickString(record, "client_id"),
    technician_id: pickString(record, "technician_id"),
    active: String(record.active ?? "true") === "false" ? "false" : "true",
    row_version: pickNumber(record, "row_version"),
    updated_at: String(record.updated_at ?? ""),
    updated_by: String(record.updated_by ?? ""),
    correlation_id: String(record.correlation_id ?? "")
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

function distanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const r = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return r * c;
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

const ROLE_LABELS: Record<string, string> = {
  client: "Client",
  technician: "Technician",
  dispatcher: "Dispatch",
  finance: "Finance",
  admin: "Admin",
  super_admin: "Super Admin"
};

const WORKSPACE_TOOL_META: Record<string, { label: string; helper: string }> = {
  jobs: { label: "Jobs", helper: "View and update active jobs" },
  schedule: { label: "Schedule", helper: "Plan, assign, and confirm visits" },
  documents: { label: "Files", helper: "Review and publish job files" },
  comms: { label: "Messages", helper: "Share updates with clients and teams" },
  finance: { label: "Finance", helper: "Quotes, invoices, and escrow controls" },
  people: { label: "Team", helper: "People directory and skills matrix" },
  admin: { label: "Settings", helper: "Platform controls and audit tools" }
};

const ROLE_PRIMARY_TOOLS: Record<string, string[]> = {
  client: ["jobs", "documents"],
  technician: ["jobs", "documents"],
  dispatcher: ["jobs", "schedule", "comms"],
  finance: ["finance", "jobs", "documents"],
  admin: ["jobs", "people", "admin"],
  super_admin: ["jobs", "schedule", "finance", "admin"]
};

const COPY_GLOSSARY = {
  documents: "Files",
  engagements: "Jobs",
  mutations: "Queued changes",
  governance: "Settings"
} as const;

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
  const [actionPending, setActionPending] = useState(false);
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
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [showMoreNav, setShowMoreNav] = useState(false);
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
  const showOperationalEngagements = activeWorkspaceTool === "jobs";
  const primaryRoleTools = ROLE_PRIMARY_TOOLS[effectiveRole ?? "client"] ?? ["jobs", "documents"];
  const primaryNavTools = allowedWorkspaceTools.filter((tool) => primaryRoleTools.includes(tool));
  const orderedPrimaryNavTools = [...primaryNavTools].sort((a, b) => {
    const aPinned = pinnedTools.includes(a) ? 0 : 1;
    const bPinned = pinnedTools.includes(b) ? 0 : 1;
    return aPinned - bPinned;
  });
  const moreNavTools = allowedWorkspaceTools.filter((tool) => !primaryRoleTools.includes(tool));
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

  useEffect(() => {
    const saved = localStorage.getItem("kharon_workspace_state");
    if (!saved) {
      return;
    }
    try {
      const state = JSON.parse(saved) as {
        selectedJobid?: string;
        statusTarget?: JobStatus;
        activeWorkspaceTool?: string;
      };
      if (state.selectedJobid) setSelectedJobid(state.selectedJobid);
      if (state.statusTarget) setStatusTarget(state.statusTarget);
      if (state.activeWorkspaceTool) setActiveWorkspaceTool(state.activeWorkspaceTool);
    } catch (error) {
      console.warn("Restore failed", error);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "kharon_workspace_state",
      JSON.stringify({
        selectedJobid,
        statusTarget,
        activeWorkspaceTool
      })
    );
  }, [selectedJobid, statusTarget, activeWorkspaceTool]);

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

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandPaletteOpen(true);
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
      if (event.key === "Escape") {
        setCommandPaletteOpen(false);
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

  useEffect(() => {
    if (!session || !networkOnline) {
      return;
    }
    const poll = async () => {
      try {
        const since = lastSyncPullAt || new Date(0).toISOString();
        const response = await apiClient.syncPull(since);
        const jobsChanged = response.jobs?.length ?? 0;
        const queueChanged = response.queue?.length ?? 0;
        const eventsChanged = response.events?.length ?? 0;

        if (jobsChanged > 0 || eventsChanged > 0) {
          startTransition(() => {
            if (jobsChanged > 0) {
              const incoming = (response.jobs ?? []).map(asJob);
              setJobs((prev) => {
                const next = [...prev];
                for (const job of incoming) {
                  const idx = next.findIndex((j) => j.job_id === job.job_id);
                  if (idx >= 0) {
                    if (Date.parse(job.updated_at) >= Date.parse(next[idx].updated_at)) {
                      next[idx] = job;
                    }
                  } else {
                    next.push(job);
                  }
                }
                return next;
              });
            }

            if (eventsChanged > 0) {
              const incomingEvents = (response.events ?? []).map(normalizeJobEvent);
              setJobEvents((prev) => {
                const next = [...prev];
                for (const ev of incomingEvents) {
                  if (!next.some((existing) => existing.event_id === ev.event_id)) {
                    next.push(ev);
                  }
                }
                return next;
              });
            }
          });
        }

        const at = new Date().toISOString();
        setLastSyncPullAt(at);
        setSyncPulse({ at, jobsChanged, queueChanged });
      } catch (error) {
        // Keep pulse passive when pull fails
        console.error("Sync pull failed", error);
      }
    };
    void poll();
    const intervalId = window.setInterval(() => {
      void poll();
    }, 15000);
    return () => window.clearInterval(intervalId);
  }, [lastSyncPullAt, networkOnline, session]);

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
      const mapped = data.map(asJob).filter((job) => job.job_id !== "");
      startTransition(() => {
        setJobs(mapped);
        if (!mapped.some((job) => job.job_id === selectedJobid)) {
          setSelectedJobid(mapped[0]?.job_id ?? "");
        }
      });
    } catch (error) {
      setFeedback(`Jobs load failed: ${errorMessage(error)}`);
    }
  }

  // Contextual dispatch: auto-populate ids from selected job metadata
  useEffect(() => {
    let isActive = true;
    if (selectedJob && isActive) {
      // Prioritize preserving the row_version logic for the target job
      if (selectedJob.active_request_id) setConfirmRequestid(selectedJob.active_request_id);
      if (selectedJob.active_document_id) setPublishDocumentid(selectedJob.active_document_id);
      if (selectedJob.suggested_technician_id) setConfirmTechid(selectedJob.suggested_technician_id);

      // Safety: always ensure row versions are synced to the selection

      setConfirmRowVersion(selectedJob.row_version);
      setPublishRowVersion(selectedJob.row_version);
      setRescheduleRowVersion(selectedJob.row_version);
    }
    return () => { isActive = false; };
  }, [selectedJobid, selectedJob?.row_version]);

  async function refreshDocuments(jobid?: string): Promise<void> {
    if (documentAccessDenied) {
      return;
    }
    try {
      const response = await apiClient.history(jobid);
      startTransition(() => {
        const normalized = (response.data ?? []).map((row) => normalizeDocument(row));
        setDocuments(normalized as unknown as Array<Record<string, unknown>>);
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

  async function refreshPeopleDirectory(): Promise<void> {
    try {
      const people = await apiClient.listPeople();
      startTransition(() => {
        setPeopleDirectory(people.map((row) => normalizeUser(row as unknown as Record<string, unknown>)));
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

  async function loadSchemaDrift(): Promise<void> {
    try {
      const payload = await apiClient.schemaDrift();
      setSchemaDrift(payload);
      setFeedback(payload.healthy ? "Schema drift scan passed." : `Schema drift detected: ${payload.issue_count} issue(s).`);
    } catch (error) {
      setFeedback(`Schema drift scan failed: ${errorMessage(error)}`);
    }
  }

  async function loadOpsIntelligence(): Promise<void> {
    try {
      const payload = await apiClient.opsIntelligence();
      setOpsIntelligence(payload);
      setFeedback("Operational intelligence refreshed.");
    } catch (error) {
      setFeedback(`Operational intelligence failed: ${errorMessage(error)}`);
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
    if (!selectedJob) {
      return;
    }
    const jobid = selectedJob.job_id.trim();
    if (jobid === "") {
      setFeedback("Document generation requires a valid job selection.");
      return;
    }
    if (!canGenerateDocuments || documentAccessDenied) {
      setFeedback("Document generation is disabled for this role/account.");
      return;
    }

    let response: Awaited<ReturnType<typeof apiClient.generateDocument>>;
    try {
      response = await apiClient.generateDocument(jobid, documentType, checklistData);
    } catch (error) {
      if (errorCode(error) === "not_found") {
        await refreshJobs();
        setFeedback("Selected job was not found on the server. Job list refreshed; select a valid job and retry.");
        return;
      }
      throw error;
    }
    const generatedDocumentid = String(response.data?.document_id ?? "");

    await refreshDocuments(jobid);
    if (isDispatchRole) {
      await refreshDispatchContext(jobid);
    }
    if (generatedDocumentid) {
      setSelectedDocumentid(generatedDocumentid);
    }

    setFeedback(generatedDocumentid ? `${documentType} generated (${generatedDocumentid}).` : `${documentType} generated.`);
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
          onboardingDismissed={onboardingDismissed}
          onDismissOnboarding={() => setOnboardingDismissed(true)}
          onEnterWorkspace={(tool) => {
            const targetTool = tool === "jobs" ? defaultWorkspaceTool : tool;
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
      <header className="portal-topbar">
        <div className="portal-topbar__brand">
          <div className="portal-mark">
            <svg viewBox="0 0 100 100" width="32" height="32" aria-hidden="true">
              <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8" />
              <circle cx="50" cy="50" r="12" fill="currentColor" />
            </svg>
          </div>
          <div className="user-avatar" title={session.session.display_name}>
            {session.session.display_name.split(' ').map(n => n[0]).join('').toUpperCase()}
          </div>
          <div>
            <div className="portal-title">KHARON OPS</div>
            <div className="portal-subtitle">
              {ROLE_LABELS[effectiveRole ?? ""] ?? String(effectiveRole ?? "").toUpperCase()}
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
            Offline queue mode
          </label>
          <span className={`status-chip status-chip--${networkOnline ? "active" : "critical"}`}>{networkOnline ? "Online" : "Offline"}</span>
          <span className="status-chip status-chip--neutral" title="Real-time sync pulse">
            {syncPulse.at ? `Sync ${new Date(syncPulse.at).toLocaleTimeString()}` : "Sync idle"}
          </span>
          <button
            className={`button ${focusMode ? "button--primary" : "button--ghost"}`}
            type="button"
            onClick={() => setFocusMode((prev) => !prev)}
            title="Toggle Focus Mode (F)"
          >
            {focusMode ? "Exit Focus" : "Focus"}
          </button>
          {installPromptEvent ? (
            <button className="button button--secondary" type="button" onClick={() => runAction(handleInstallPrompt)}>
              Install App
            </button>
          ) : null}
          <button className="button button--secondary" type="button" onClick={() => runAction(handleReplay)}>
            Sync queued changes ({queueCount})
          </button>
          <button className="button button--secondary" type="button" onClick={() => setCommandPaletteOpen(true)} aria-label="Open command palette">
            Command
          </button>
          <button className="button button--secondary" type="button" onClick={() => setPortalView("dashboard")}>
            Dashboard
          </button>
          <button className="button button--ghost" type="button" onClick={() => runAction(handleLogout)}>
            Logout
          </button>
        </div>
      </header>

      <div className={`portal-layout ${showOperationalEngagements ? "portal-layout--with-joblist" : "portal-layout--no-joblist"} ${focusMode ? "portal-layout--focus" : ""}`}>
        <aside className="portal-nav">
          <div className="portal-nav__header">
            <p className="portal-nav__label">Workspace</p>
            <h3>{activeToolMeta.label}</h3>
          </div>
          <label className="field-stack">
            <span>Default landing section</span>
            <select
              aria-label="Default landing section"
              value={defaultWorkspaceTool}
              onChange={(event) => setDefaultWorkspaceTool(event.target.value)}
            >
              {allowedWorkspaceTools.map((tool) => (
                <option key={tool} value={tool}>
                  {tool === "jobs" && effectiveRole === "client"
                    ? "Approvals"
                    : (WORKSPACE_TOOL_META[tool] ?? { label: tool }).label}
                </option>
              ))}
            </select>
          </label>
          <nav className="portal-nav__list" aria-label="Portal sections">
            <button
              type="button"
              className="portal-nav__item"
              onClick={() => setPortalView("dashboard")}
            >
              Overview
            </button>
            {orderedPrimaryNavTools.map((tool) => {
              const item = WORKSPACE_TOOL_META[tool] ?? { label: tool, helper: "" };
              const displayLabel = tool === "jobs" && effectiveRole === "client" ? "Approvals" : item.label;
              const active = tool === activeWorkspaceTool;
              return (
                <button
                  key={tool}
                  type="button"
                  className={`portal-nav__item ${active ? "portal-nav__item--active" : ""}`}
                  onClick={() => setActiveWorkspaceTool(tool)}
                >
                  <span>{displayLabel}</span>
                  <small>{item.helper}</small>
                </button>
              );
            })}
            {moreNavTools.length > 0 ? (
              <>
                <button type="button" className="portal-nav__item" onClick={() => setShowMoreNav((value) => !value)}>
                  <span>{showMoreNav ? "Hide More" : "More Tools"}</span>
                  <small>{moreNavTools.length} additional section(s)</small>
                </button>
                {showMoreNav
                  ? moreNavTools.map((tool) => {
                    const item = WORKSPACE_TOOL_META[tool] ?? { label: tool, helper: "" };
                    const displayLabel = tool === "jobs" && effectiveRole === "client" ? "Approvals" : item.label;
                    const active = tool === activeWorkspaceTool;
                    return (
                      <button
                        key={tool}
                        type="button"
                        className={`portal-nav__item ${active ? "portal-nav__item--active" : ""}`}
                        onClick={() => setActiveWorkspaceTool(tool)}
                      >
                        <span>{displayLabel}</span>
                        <small>{item.helper}</small>
                      </button>
                    );
                  })
                  : null}
              </>
            ) : null}
          </nav>
          <div className="portal-nav__pinboard">
            <p className="portal-nav__label">Pinned tools</p>
            <div className="button-row">
              {allowedWorkspaceTools.map((tool) => {
                const pinned = pinnedTools.includes(tool);
                return (
                  <button
                    key={tool}
                    type="button"
                    className={`button ${pinned ? "button--primary" : "button--ghost"}`}
                    onClick={() =>
                      setPinnedTools((prev) => (prev.includes(tool) ? prev.filter((id) => id !== tool) : [...prev, tool]))
                    }
                  >
                    {tool === "jobs" && effectiveRole === "client"
                      ? "Approvals"
                      : (WORKSPACE_TOOL_META[tool] ?? { label: tool }).label}
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        {showOperationalEngagements ? (
          <aside className="portal-sidebar portal-sidebar--jobs">
            <JobListView
              jobs={filteredJobs}
              selectedJobid={selectedJobid}
              onSelectJob={setSelectedJobid}
              viewKey={effectiveRole ?? "client"}
              globalQuery={searchTerm}
              onGlobalQueryChange={setSearchTerm}
              onBulkStatusUpdate={(ids, status) => runAction(() => handleBulkStatusUpdate(ids, status))}
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
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search jobs, clients, sites, IDs..."
                aria-label="Search across workspace data"
              />
              <button className="button button--secondary" type="button" onClick={() => setCommandPaletteOpen(true)}>
                Quick actions
              </button>
            </div>
          </section>

          {notifications.length > 0 ? (
            <section className="notification-center" aria-live="polite">
              {notifications.map((item) => (
                <article key={item.id} className="notification-card">
                  <span className={`status-chip status-chip--${item.tone}`}>{item.title}</span>
                  <p>{item.detail}</p>
                  <button className="button button--ghost" type="button" onClick={() => setDismissedNotifications((prev) => [...prev, item.id])}>
                    Dismiss
                  </button>
                </article>
              ))}
              <button className="button button--secondary" type="button" onClick={() => setDismissedNotifications(notifications.map((item) => item.id))}>
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
                documentCountForJob={selectedJobDocumentCount}
                geoVerification={geoVerification}
                onVerifyLocation={handleVerifyLocation}
                syncPulseText={syncPulseText}
                events={jobEvents}
              />
            ) : null}

            {activeWorkspaceTool === "schedule" && isDispatchRole && !dispatchAccessDenied ? (
              <ScheduleControlCard
                selectedJobid={selectedJob?.job_id ?? ""}
                preferredStart={preferredStart}
                setPreferredStart={setPreferredStart}
                preferredEnd={preferredEnd}
                setPreferredEnd={setPreferredEnd}
                requests={dispatchRequests}
                selectedRequestid={selectedRequestid}
                setSelectedRequestid={setSelectedRequestid}
                confirmStart={confirmStart}
                setConfirmStart={setConfirmStart}
                confirmEnd={confirmEnd}
                setConfirmEnd={setConfirmEnd}
                confirmTechid={confirmTechid}
                setConfirmTechid={setConfirmTechid}
                technicians={technicians}
                schedules={dispatchSchedules}
                selectedScheduleid={selectedScheduleid}
                setSelectedScheduleid={setSelectedScheduleid}
                rescheduleStart={rescheduleStart}
                setRescheduleStart={setRescheduleStart}
                rescheduleEnd={rescheduleEnd}
                setRescheduleEnd={setRescheduleEnd}
                rescheduleRowVersion={rescheduleRowVersion}
                setRescheduleRowVersion={setRescheduleRowVersion}
                documents={dispatchDocuments}
                selectedDocumentid={selectedDocumentid}
                setSelectedDocumentid={setSelectedDocumentid}
                onScheduleRequest={() => runAction(handleScheduleRequest)}
                onScheduleConfirm={() => runAction(handleScheduleConfirm)}
                onReschedule={() => runAction(handleReschedule)}
                onDocumentPublish={() => runAction(handleDocumentPublish)}
                onFeedback={setFeedback}

              />
            ) : null}

            {activeWorkspaceTool === "comms" && isDispatchRole ? (
              <CommunicationRailsCard
                selectedJobid={selectedJob?.job_id ?? ""}
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
                selectedAutomationJobid={selectedAutomationJobid}
                setSelectedAutomationJobid={setSelectedAutomationJobid}
                onLoadHealth={() => runAction(loadAdminHealth)}
                onLoadAudits={() => runAction(loadAdminAudits)}
                onLoadAutomationJobs={() => runAction(loadAdminAutomationJobs)}
                onRetryAutomation={(id) => runAction(() => handleRetryAutomation(id))}
                onFeedback={setFeedback}
                emulatedRole={emulatedRole}
                onEmulateRole={(role) => {
                  setEmulatedRole(role);
                  setActiveWorkspaceTool("jobs");
                  setPortalView("dashboard");
                }}
                schemaDrift={schemaDrift}
                opsIntelligence={opsIntelligence}
                onLoadSchemaDrift={() => runAction(loadSchemaDrift)}
                onLoadOpsIntelligence={() => runAction(loadOpsIntelligence)}

              />
            ) : null}

            {activeWorkspaceTool === "documents" ? (
              <DocumentHistoryCard
                documents={documents}
                selectedJobid={selectedJob?.job_id ?? ""}
                role={effectiveRole ?? "client"}
                escrowByDocumentid={Object.fromEntries(upgradeState.escrow.map((row) => [row.document_id, row]))}

                onRefresh={() => runAction(() => refreshDocuments(selectedJob?.job_id))}
                onPublish={(id, ver, vis) => runAction(() => handleDocumentPublishInline(id, ver, vis))}
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
                onUpdateQuoteStatus={(quoteid, status) =>
                  runAction(async () => {
                    await apiClient.updateFinanceQuoteStatus(quoteid, status);
                    await refreshUpgradeWorkspaceState();
                  })
                }
                onCreateInvoiceFromQuote={(quoteid, dueDate) =>
                  runAction(async () => {
                    await apiClient.createInvoiceFromQuote(quoteid, dueDate);
                    await refreshUpgradeWorkspaceState();
                  })
                }
                onReconcileInvoice={(invoiceid) =>
                  runAction(async () => {
                    await apiClient.reconcileInvoice(invoiceid);
                    await apiClient.rebuildUpgradeAnalytics();
                    await refreshUpgradeWorkspaceState();
                  })
                }
                onLockEscrow={(documentid, invoiceid) =>
                  runAction(async () => {
                    await apiClient.lockEscrow(documentid, invoiceid);
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

      {commandPaletteOpen ? (
        <div className="command-palette-backdrop" onClick={() => setCommandPaletteOpen(false)}>
          <section className="command-palette" onClick={(event) => event.stopPropagation()}>
            <div className="panel-heading panel-heading--inline">
              <div>
                <p className="panel-eyebrow">Quick Actions</p>
                <h2>Command Palette</h2>
              </div>
              <button className="button button--ghost" type="button" onClick={() => setCommandPaletteOpen(false)}>
                Close
              </button>
            </div>
            <div className="command-palette__list">
              {allowedWorkspaceTools.map((tool) => (
                <button
                  key={tool}
                  className="portal-nav__item"
                  type="button"
                  onClick={() => {
                    setActiveWorkspaceTool(tool);
                    setCommandPaletteOpen(false);
                  }}
                >
                  <span>{tool === "jobs" && effectiveRole === "client" ? "Approvals" : (WORKSPACE_TOOL_META[tool] ?? { label: tool }).label}</span>
                  <small>{(WORKSPACE_TOOL_META[tool] ?? { helper: "" }).helper}</small>
                </button>
              ))}
              <button className="portal-nav__item" type="button" onClick={() => runAction(handleReplay)}>
                <span>Sync queued changes</span>
                <small>Run offline replay now</small>
              </button>
            </div>
          </section>
        </div>
      ) : null}

      <nav className="mobile-action-bar" aria-label="Mobile quick actions">
        <button className="button button--ghost" type="button" onClick={() => setPortalView("dashboard")}>
          Home
        </button>
        <button className="button button--ghost" type="button" onClick={() => setActiveWorkspaceTool(defaultWorkspaceTool)}>
          Main
        </button>
        <button className="button button--ghost" type="button" onClick={() => setCommandPaletteOpen(true)}>
          Actions
        </button>
      </nav>

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

