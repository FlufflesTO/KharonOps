import React, { startTransition, useEffect, useMemo, useRef, useState } from "react";
import type { OfflineQueueItem, JobStatus, Role } from "@kharon/domain";
import { listAllowedStatusTransitions } from "@kharon/domain";
import { apiClient, type PortalAuthConfig, type PortalSession } from "./apiClient";
import { enqueueMutation, listQueuedMutations } from "./offline/queue";
import { replayQueuedMutations } from "./offline/replay";

import { SummaryBoard } from "./components/SummaryBoard";
import { WorkspaceInfo } from "./components/WorkspaceInfo";
import { OfflineBanner } from "./components/OfflineBanner";
import { JobListView, statusTone, type JobRecord } from "./components/JobListView";
import { JobDetailView } from "./components/JobDetailView";
import { PortalAuth } from "./components/PortalAuth";
import { ScheduleControlCard } from "./components/ScheduleControlCard";
import { CommunicationRailsCard } from "./components/CommunicationRailsCard";
import { AdminPanelCard } from "./components/AdminPanelCard";
import { DocumentHistoryCard } from "./components/DocumentHistoryCard";
import { DashboardView } from "./components/DashboardView";



function asJob(record: Record<string, unknown>): JobRecord {
  const status = String(record.status ?? "draft") as JobStatus;

  return {
    job_uid: String(record.job_uid ?? ""),
    title: String(record.title ?? ""),
    status,
    row_version: Number(record.row_version ?? 0),
    client_uid: String(record.client_uid ?? ""),
    technician_uid: String(record.technician_uid ?? ""),
    last_note: String(record.last_note ?? "")
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

function errorMessage(error: unknown): string {
  const typed = error as { error?: { message?: string } };
  return typed.error?.message ?? String(error);
}

function errorCode(error: unknown): string {
  const typed = error as { error?: { code?: string } };
  return typed.error?.code ?? "";
}

function looksLikeJwt(token: string): boolean {
  const trimmed = token.trim();
  return trimmed.split(".").length === 3 && trimmed.length > 40;
}

export function PortalApp(): React.JSX.Element {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<PortalSession | null>(null);
  const [authConfig, setAuthConfig] = useState<PortalAuthConfig | null>(null);
  const [jobs, setJobs] = useState<JobRecord[]>([]);
  const [selectedJobUid, setSelectedJobUid] = useState("");
  const [portalView, setPortalView] = useState<"dashboard" | "workspace">("dashboard");
  const [statusTarget, setStatusTarget] = useState<JobStatus>("draft");
  const [noteValue, setNoteValue] = useState("");
  const [loginToken, setLoginToken] = useState("dev-client");
  const [preferredStart, setPreferredStart] = useState(nowPlusHours(4));
  const [preferredEnd, setPreferredEnd] = useState(nowPlusHours(5));
  const [confirmRequestUid, setConfirmRequestUid] = useState("");
  const [confirmStart, setConfirmStart] = useState(nowPlusHours(6));
  const [confirmEnd, setConfirmEnd] = useState(nowPlusHours(7));
  const [confirmTechUid, setConfirmTechUid] = useState("TECH-001");
  const [confirmRowVersion, setConfirmRowVersion] = useState(1);
  const [rescheduleUid, setRescheduleUid] = useState("");
  const [rescheduleStart, setRescheduleStart] = useState(nowPlusHours(8));
  const [rescheduleEnd, setRescheduleEnd] = useState(nowPlusHours(9));
  const [rescheduleRowVersion, setRescheduleRowVersion] = useState(1);
  const [documentType, setDocumentType] = useState<"jobcard" | "service_report">("jobcard");
  const [publishDocumentUid, setPublishDocumentUid] = useState("");
  const [publishRowVersion, setPublishRowVersion] = useState(1);
  const [offlineEnabled, setOfflineEnabled] = useState(false);
  const [networkOnline, setNetworkOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true);
  const [queueCount, setQueueCount] = useState(0);
  const [feedback, setFeedback] = useState("Ready.");
  const [documents, setDocuments] = useState<Array<Record<string, unknown>>>([]);
  const [adminHealth, setAdminHealth] = useState<Record<string, unknown> | null>(null);
  const [adminAuditCount, setAdminAuditCount] = useState(0);
  const [actionPending, setActionPending] = useState(false);
  const [checklistData, setChecklistData] = useState<Record<string, string>>({});

  const selectedJob = useMemo(() => jobs.find((job) => job.job_uid === selectedJobUid) ?? null, [jobs, selectedJobUid]);
  const selectableStatuses = useMemo<JobStatus[]>(
    () => (selectedJob ? listAllowedStatusTransitions(selectedJob.status) : ["draft"]),
    [selectedJob]
  );

  const openJobCount = jobs.filter((job) => job.status !== "certified" && job.status !== "cancelled").length;
  const generatedDocumentCount = documents.length;
  const selectedJobStatus = selectedJob?.status ?? "no selection";
  const productionAuth = authConfig?.mode === "production";

  const runAction = (action: () => Promise<void>): void => {
    if (actionPending) {
      setFeedback("Another action is still running. Wait a moment and retry.");
      return;
    }
    setActionPending(true);
    void action().catch((error) => {
      const code = errorCode(error);
      if (code === "google_transient_error") {
        setFeedback("Google API rate limit reached (429). Wait 30-60 seconds and retry one action at a time.");
        return;
      }
      setFeedback(errorMessage(error));
    }).finally(() => {
      setActionPending(false);
    });
  };

  async function refreshQueueCount(): Promise<void> {
    const queue = await listQueuedMutations();
    setQueueCount(queue.length);
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
        if (!selectedJobUid && mapped.length > 0) {
          const first = mapped[0];
          if (first) {
            setSelectedJobUid(first.job_uid);
          }
        }
      });
    } catch (error) {
      setFeedback(`Jobs load failed: ${errorMessage(error)}`);
    }
  }

  async function refreshDocuments(jobUid?: string): Promise<void> {
    try {
      const response = await apiClient.history(jobUid);
      startTransition(() => {
        setDocuments(response.data ?? []);
      });
    } catch (error) {
      setFeedback(`Document history load failed: ${errorMessage(error)}`);
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
      await refreshAuthConfig();
      await refreshSession();
      await refreshQueueCount();
      setLoading(false);
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
      return;
    }

    void (async () => {
      await refreshJobs();
      await refreshDocuments();
    })();
  }, [session]);

  useEffect(() => {
    if (!selectableStatuses.includes(statusTarget)) {
      const next = selectableStatuses[0];
      if (next) {
        setStatusTarget(next);
      }
    }
  }, [selectableStatuses, statusTarget]);

  async function handleLogin(token: string): Promise<void> {
    try {
      setLoading(true);
      await apiClient.login(token, productionAuth ? { gsiClientId: authConfig?.google_client_id ?? "" } : undefined);
      await refreshSession();
      await refreshJobs();
      setFeedback("Signed in.");
    } catch (error) {
      const envelope = error as { error?: { message?: string } };
      setFeedback(envelope.error?.message ?? "Login failed");
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
    if (createdRequestUid !== "") {
      setConfirmRequestUid(createdRequestUid);
    }
    if (typeof response.row_version === "number") {
      setConfirmRowVersion(response.row_version);
    }

    setFeedback(createdRequestUid ? `Preferred slot request submitted (${createdRequestUid}).` : "Preferred slot request submitted.");
  }

  async function handleScheduleConfirm(): Promise<void> {
    if (confirmRequestUid.trim() === "") {
      setFeedback("Enter a valid request UID before confirming.");
      return;
    }
    if (confirmTechUid.trim() === "") {
      setFeedback("Enter a technician UID before confirming.");
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
      confirmRequestUid.trim(),
      startIso,
      endIso,
      confirmTechUid.trim(),
      confirmRowVersion,
      selectedJob ? { job_uid: selectedJob.job_uid } : undefined
    );

    const createdScheduleUid = String(response.data?.schedule_uid ?? "");
    if (createdScheduleUid !== "") {
      setRescheduleUid(createdScheduleUid);
    }
    if (typeof response.row_version === "number") {
      setRescheduleRowVersion(response.row_version);
    }

    setFeedback(createdScheduleUid ? `Schedule confirmed (${createdScheduleUid}).` : "Schedule confirmed.");
  }

  async function handleReschedule(): Promise<void> {
    if (rescheduleUid.trim() === "") {
      setFeedback("Enter a schedule UID before rescheduling.");
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

    const response = await apiClient.reschedule(rescheduleUid.trim(), startIso, endIso, rescheduleRowVersion, {
      ...(selectedJob ? { job_uid: selectedJob.job_uid } : {}),
      ...(selectedJob?.technician_uid ? { technician_uid: selectedJob.technician_uid } : {}),
      ...(confirmRequestUid.trim() !== "" ? { request_uid: confirmRequestUid.trim() } : {})
    });
    if (typeof response.row_version === "number") {
      setRescheduleRowVersion(response.row_version);
    }
    setFeedback("Schedule rescheduled.");
  }

  async function handleDocumentGenerate(): Promise<void> {
    if (!selectedJob) {
      return;
    }

    const response = await apiClient.generateDocument(selectedJob.job_uid, documentType, checklistData);
    const generatedDocumentUid = String(response.data?.document_uid ?? "");
    if (generatedDocumentUid !== "") {
      setPublishDocumentUid(generatedDocumentUid);
    }
    if (typeof response.row_version === "number") {
      setPublishRowVersion(response.row_version);
    }

    await refreshDocuments(selectedJob.job_uid);
    setFeedback(generatedDocumentUid ? `${documentType} generated (${generatedDocumentUid}).` : `${documentType} generated.`);
  }

  async function handleDocumentPublish(): Promise<void> {
    if (publishDocumentUid.trim() === "") {
      setFeedback("Enter a document UID before publishing.");
      return;
    }

    const response = await apiClient.publishDocument(publishDocumentUid.trim(), publishRowVersion, {
      ...(selectedJob ? { job_uid: selectedJob.job_uid } : {}),
      document_type: documentType
    });
    if (typeof response.row_version === "number") {
      setPublishRowVersion(response.row_version);
    }

    await refreshDocuments(selectedJob?.job_uid);
    setFeedback("Document published.");
  }

  async function loadAdminHealth(): Promise<void> {
    const response = await apiClient.adminHealth();
    setAdminHealth(response.data ?? null);
    setFeedback("Admin health fetched.");
  }

  async function loadAdminAudits(): Promise<void> {
    const response = await apiClient.adminAudits();
    setAdminAuditCount((response.data ?? []).length);
    setFeedback("Audit log fetched.");
  }

  if (loading) {
    return (
      <div className="portal-shell portal-shell--loading">
        <div className="loading-card">Loading portal workspace...</div>
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

  const role = session.session.role;
  const isDispatchRole = role === "dispatcher" || role === "admin";
  const isAdmin = role === "admin";

  if (portalView === "dashboard") {
    return (
      <div className={`portal-shell portal-shell--${role}`}>
        <DashboardView
          session={session}
          openJobCount={openJobCount}
          onEnterWorkspace={() => setPortalView("workspace")}
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
    <div className={`portal-shell portal-shell--${role}`}>
      <header className="portal-topbar">
        <div className="portal-topbar__brand">
          <div className="portal-mark">
            <svg viewBox="0 0 100 100" width="32" height="32">
              <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8" />
              <circle cx="50" cy="50" r="12" fill="currentColor" />
            </svg>
          </div>
          <div>
            <div className="portal-title">KHARON COMMAND CENTRE</div>
            <div className="portal-subtitle">
              {session.session.display_name} | {role.toUpperCase()}
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
          <button className="button button--secondary" onClick={() => setPortalView("dashboard")}>
            Dashboard
          </button>
          <button className="button button--secondary" onClick={() => runAction(handleReplay)}>
            Execute Queue ({queueCount})
          </button>
          <button className="button button--ghost" onClick={() => runAction(handleLogout)}>
            Logout
          </button>
        </div>
      </header>

      <WorkspaceInfo
        role={role}
        selectedJob={selectedJob}
        queueCount={queueCount}
        generatedDocumentCount={generatedDocumentCount}
        networkOnline={networkOnline}
      />

      <div className="portal-layout">
        <aside className="portal-sidebar">
          <JobListView
            jobs={jobs}
            selectedJobUid={selectedJobUid}
            onSelectJob={setSelectedJobUid}
            title="Operational Engagements"
          />
        </aside>

        <main className="portal-main">

          <SummaryBoard
            role={role}
            openJobCount={openJobCount}
            selectedJobStatus={selectedJobStatus}
            queueCount={queueCount}
            generatedDocumentCount={generatedDocumentCount}
            adminAuditCount={adminAuditCount}
            networkOnline={networkOnline}
          />

          <section className="workspace-grid">
            <JobDetailView
              selectedJob={selectedJob}
              role={role}
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
              onChecklistChange={setChecklistData}
              selectedJobTitle="Job Detail"
            />

            {isDispatchRole && (
              <ScheduleControlCard
                selectedJobUid={selectedJob?.job_uid ?? ""}
                selectedJobRowVersion={selectedJob?.row_version ?? 1}
                preferredStart={preferredStart}
                setPreferredStart={setPreferredStart}
                preferredEnd={preferredEnd}
                setPreferredEnd={setPreferredEnd}
                confirmRequestUid={confirmRequestUid}
                setConfirmRequestUid={setConfirmRequestUid}
                confirmStart={confirmStart}
                setConfirmStart={setConfirmStart}
                confirmEnd={confirmEnd}
                setConfirmEnd={setConfirmEnd}
                confirmTechUid={confirmTechUid}
                setConfirmTechUid={setConfirmTechUid}
                confirmRowVersion={confirmRowVersion}
                setConfirmRowVersion={setConfirmRowVersion}
                rescheduleUid={rescheduleUid}
                setRescheduleUid={setRescheduleUid}
                rescheduleStart={rescheduleStart}
                setRescheduleStart={setRescheduleStart}
                rescheduleEnd={rescheduleEnd}
                setRescheduleEnd={setRescheduleEnd}
                rescheduleRowVersion={rescheduleRowVersion}
                setRescheduleRowVersion={setRescheduleRowVersion}
                publishDocumentUid={publishDocumentUid}
                setPublishDocumentUid={setPublishDocumentUid}
                publishRowVersion={publishRowVersion}
                setPublishRowVersion={setPublishRowVersion}
                documentType={documentType}
                onScheduleRequest={() => runAction(handleScheduleRequest)}
                onScheduleConfirm={() => runAction(handleScheduleConfirm)}
                onReschedule={() => runAction(handleReschedule)}
                onDocumentPublish={() => runAction(handleDocumentPublish)}
                onFeedback={setFeedback}
              />
            )}

            {isDispatchRole && (
              <CommunicationRailsCard
                selectedJobUid={selectedJob?.job_uid ?? ""}
                onFeedback={setFeedback}
              />
            )}

            {isAdmin && (
              <AdminPanelCard
                adminHealth={adminHealth}
                adminAuditCount={adminAuditCount}
                onLoadHealth={() => runAction(loadAdminHealth)}
                onLoadAudits={() => runAction(loadAdminAudits)}
                onFeedback={setFeedback}
              />
            )}

            <DocumentHistoryCard
              documents={documents}
              selectedJobUid={selectedJob?.job_uid ?? ""}
              onRefresh={() => runAction(() => refreshDocuments(selectedJob?.job_uid))}
            />
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
