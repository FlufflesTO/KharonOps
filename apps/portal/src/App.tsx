import React, { startTransition, useEffect, useMemo, useState } from "react";
import type { OfflineQueueItem } from "@kharon/domain";
import { apiClient, type PortalSession } from "./apiClient";
import { enqueueMutation, listQueuedMutations } from "./offline/queue";
import { replayQueuedMutations } from "./offline/replay";

type SessionRole = PortalSession["session"]["role"];

type JobRecord = {
  job_uid: string;
  title: string;
  status: string;
  row_version: number;
  client_uid: string;
  technician_uid: string;
  last_note: string;
};

function asJob(record: Record<string, unknown>): JobRecord {
  return {
    job_uid: String(record.job_uid ?? ""),
    title: String(record.title ?? ""),
    status: String(record.status ?? ""),
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

function errorMessage(error: unknown): string {
  const typed = error as { error?: { message?: string } };
  return typed.error?.message ?? String(error);
}

function roleLabel(role: SessionRole): string {
  switch (role) {
    case "client":
      return "Client workspace";
    case "technician":
      return "Technician workspace";
    case "dispatcher":
      return "Dispatcher workspace";
    case "admin":
      return "Administrator workspace";
    default:
      return role;
  }
}

function roleDescription(role: SessionRole): string {
  switch (role) {
    case "client":
      return "Track planned maintenance and callouts, request preferred slots, and review published service reports and site evidence.";
    case "technician":
      return "Update field status, record readings and notes, and generate jobcards or service reports directly from site.";
    case "dispatcher":
      return "Coordinate planned maintenance cadence, callouts, technician allocation, and outbound client communications.";
    case "admin":
      return "Oversee platform health, audit posture, controlled documents, and privileged recovery actions.";
    default:
      return "";
  }
}

function statusTone(status: string): "active" | "warning" | "critical" | "neutral" {
  switch (status) {
    case "on_site":
    case "en_route":
    case "assigned":
    case "completed":
    case "published":
      return "active";
    case "paused":
    case "warning":
      return "warning";
    case "cancelled":
    case "critical":
      return "critical";
    default:
      return "neutral";
  }
}

type WorkspaceBrief = {
  title: string;
  body: string;
  supportTitle: string;
  supportIntro: string;
  supportItems: string[];
  selectedJobTitle: string;
  documentsTitle: string;
  jobsTitle: string;
};

type WorkspaceRailItem = {
  label: string;
  detail: string;
};

function roleBrief(role: SessionRole): WorkspaceBrief {
  switch (role) {
    case "client":
      return {
        title: "Client service visibility",
        body: "A cleaner client workspace focused on live service visibility, scheduling preference capture, and published reports with supporting evidence.",
        supportTitle: "Client guidance",
        supportIntro: "This surface should feel calm and readable. It is for visibility, approvals, and records rather than internal operational detail.",
        supportItems: [
          "Track planned maintenance or callout status and the latest service note without calling dispatch.",
          "Submit preferred windows directly from the active site service record.",
          "Review published jobcards, service reports, and compliance-facing evidence once closeout is complete."
        ],
        selectedJobTitle: "Service record",
        documentsTitle: "Reports and evidence",
        jobsTitle: "Visible site activity"
      };
    case "technician":
      return {
        title: "Field execution workspace",
        body: "A technician view should emphasise job state, note capture, readings, and controlled closeout generation from site with minimal distraction.",
        supportTitle: "Field checklist",
        supportIntro: "The technician surface is for execution. Keep status, notes, readings, and closeout controls close to the active work order.",
        supportItems: [
          "Advance status as work moves from assigned to on-site, paused, or complete.",
          "Capture site notes and service readings against the active work order as events happen.",
          "Generate the current jobcard or service report before the visit closes."
        ],
        selectedJobTitle: "Active work order",
        documentsTitle: "Document history",
        jobsTitle: "Assigned and available work"
      };
    case "dispatcher":
      return {
        title: "Dispatch coordination deck",
        body: "A dispatcher workspace should foreground maintenance cadence, callouts, scheduling control, communication rails, and the current operational posture.",
        supportTitle: "Dispatch posture",
        supportIntro: "This view is for orchestration rather than field detail. Confirm timing, move resources, and keep client updates aligned with the job record.",
        supportItems: [
          "Confirm maintenance and callout requests with technician assignment and exact windows.",
          "Reschedule work with row-version discipline instead of side-channel changes.",
          "Send controlled Gmail and chat updates linked to the selected service record."
        ],
        selectedJobTitle: "Operational job context",
        documentsTitle: "Document history",
        jobsTitle: "Assigned and available work"
      };
    case "admin":
      return {
        title: "Administrative control surface",
        body: "An admin workspace should read like an executive operations console: platform posture, audit access, controlled documents, and privileged recovery actions.",
        supportTitle: "Governance posture",
        supportIntro: "Administrative users need oversight, not noise. Surface audit readiness, platform state, document control, and privileged actions clearly.",
        supportItems: [
          "Inspect health and audit surfaces from the same operational context as service delivery.",
          "Review dispatch rails and controlled outputs while retaining administrative oversight.",
          "Keep privileged retries and platform recovery separate from day-to-day execution."
        ],
        selectedJobTitle: "Operational job context",
        documentsTitle: "Document history",
        jobsTitle: "Assigned and available work"
      };
    default:
      return {
        title: "Operations workspace",
        body: "",
        supportTitle: "Workspace guidance",
        supportIntro: "",
        supportItems: [],
        selectedJobTitle: "Selected job",
        documentsTitle: "Document history",
        jobsTitle: "Jobs"
      };
  }
}

type SummaryCardProps = {
  label: string;
  value: string | number;
  detail: string;
};

function buildRolePriorities(
  role: SessionRole,
  selectedJob: JobRecord | null,
  queueCount: number,
  generatedDocumentCount: number,
  networkOnline: boolean
): WorkspaceRailItem[] {
  switch (role) {
    case "client":
      return [
        {
          label: "Current visibility",
          detail: selectedJob ? `${selectedJob.job_uid} is ${selectedJob.status}` : "Select a service record to view live status."
        },
        {
          label: "Scheduling path",
          detail: networkOnline ? "Preferred service windows can be submitted now." : "Offline now; scheduling actions resume when connectivity returns."
        },
        {
          label: "Published outputs",
          detail: generatedDocumentCount > 0 ? `${generatedDocumentCount} report or evidence rows loaded in scope.` : "Published outputs will appear once service closeout is complete."
        }
      ];
    case "technician":
      return [
        {
          label: "Field state",
          detail: selectedJob ? `Use ${selectedJob.job_uid} as the active work order.` : "Select a work order before posting field updates."
        },
        {
          label: "Queue posture",
          detail: queueCount > 0 ? `${queueCount} offline-safe mutations are waiting for replay.` : "No queued field mutations are waiting for replay."
        },
        {
          label: "Closeout readiness",
          detail: generatedDocumentCount > 0 ? `${generatedDocumentCount} controlled outputs are visible in history.` : "Generate the current jobcard or service report when the visit is ready to close."
        }
      ];
    case "dispatcher":
      return [
        {
          label: "Control window",
          detail: selectedJob ? `Dispatch is centred on ${selectedJob.job_uid}.` : "Select a job to expose schedule and outbound controls."
        },
        {
          label: "Queue posture",
          detail: queueCount > 0 ? `${queueCount} operational mutations remain queued.` : "No queued mutations are waiting for replay."
        },
        {
          label: "Outbound readiness",
          detail: networkOnline ? "Gmail and chat rails are available from this session." : "Connectivity is offline; outbound service communications should be treated as delayed."
        }
      ];
    case "admin":
      return [
        {
          label: "Control window",
          detail: selectedJob ? `Administrative context is anchored on ${selectedJob.job_uid}.` : "Select a job to align governance and operational review."
        },
        {
          label: "Audit surface",
          detail: generatedDocumentCount > 0 ? `${generatedDocumentCount} document records are currently loaded.` : "Load document history to verify closeout posture."
        },
        {
          label: "Platform posture",
          detail: networkOnline ? "Session is online and privileged actions are available." : "Connectivity is offline; avoid assuming privileged actions have landed."
        }
      ];
    default:
      return [];
  }
}

function buildSummaryCards(
  role: SessionRole,
  openJobCount: number,
  selectedJobStatus: string,
  queueCount: number,
  generatedDocumentCount: number,
  adminAuditCount: number,
  networkOnline: boolean
): SummaryCardProps[] {
  switch (role) {
    case "client":
      return [
        { label: "Visible jobs", value: openJobCount, detail: "Service records available to this client context" },
        { label: "Current status", value: selectedJobStatus, detail: "Live posture of the selected record" },
        { label: "Reports", value: generatedDocumentCount, detail: "Published or generated rows currently in scope" },
        { label: "Connection", value: networkOnline ? "Online" : "Offline", detail: "Scheduling and visibility posture for this session" }
      ];
    case "admin":
      return [
        { label: "Open jobs", value: openJobCount, detail: "Statuses excluding completed and cancelled" },
        { label: "Queued mutations", value: queueCount, detail: "Offline-safe changes waiting for replay" },
        { label: "Documents in scope", value: generatedDocumentCount, detail: "History rows loaded for current context" },
        { label: "Loaded audits", value: adminAuditCount, detail: "Audit entries fetched into this session" }
      ];
    default:
      return [
        { label: "Open jobs", value: openJobCount, detail: "Statuses excluding completed and cancelled" },
        { label: "Selected status", value: selectedJobStatus, detail: "Current state of the active job context" },
        { label: "Queued mutations", value: queueCount, detail: "Offline-safe changes waiting for replay" },
        { label: "Documents in scope", value: generatedDocumentCount, detail: "History rows loaded for current context" }
      ];
  }
}

function SummaryCard({ label, value, detail }: SummaryCardProps): React.JSX.Element {
  return (
    <article className="summary-card">
      <span className="summary-card__label">{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </article>
  );
}

type QuickLoginButtonProps = {
  label: string;
  token: string;
  onClick: (token: string) => void;
};

function QuickLoginButton({ label, token, onClick }: QuickLoginButtonProps): React.JSX.Element {
  return (
    <button className="button button--ghost" onClick={() => onClick(token)}>
      {label}
    </button>
  );
}

export function PortalApp(): React.JSX.Element {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<PortalSession | null>(null);
  const [jobs, setJobs] = useState<JobRecord[]>([]);
  const [selectedJobUid, setSelectedJobUid] = useState("");
  const [statusTarget, setStatusTarget] = useState("on_site");
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
  const [gmailTo, setGmailTo] = useState("client@example.com");
  const [gmailSubject, setGmailSubject] = useState("Kharon service update");
  const [gmailBody, setGmailBody] = useState("Service team update attached.");
  const [chatMessage, setChatMessage] = useState("Dispatcher alert test");
  const [chatSeverity, setChatSeverity] = useState<"info" | "warning" | "critical">("info");
  const [personName, setPersonName] = useState("New Contact");
  const [personEmail, setPersonEmail] = useState("new.contact@example.com");
  const [personPhone, setPersonPhone] = useState("+27110000000");
  const [offlineEnabled, setOfflineEnabled] = useState(false);
  const [networkOnline, setNetworkOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true);
  const [queueCount, setQueueCount] = useState(0);
  const [feedback, setFeedback] = useState("Ready.");
  const [documents, setDocuments] = useState<Array<Record<string, unknown>>>([]);
  const [adminHealth, setAdminHealth] = useState<Record<string, unknown> | null>(null);
  const [adminAuditCount, setAdminAuditCount] = useState(0);

  const selectedJob = useMemo(() => jobs.find((job) => job.job_uid === selectedJobUid) ?? null, [jobs, selectedJobUid]);

  const openJobCount = jobs.filter((job) => job.status !== "completed" && job.status !== "cancelled").length;
  const generatedDocumentCount = documents.length;
  const selectedJobStatus = selectedJob?.status ?? "no selection";

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

  useEffect(() => {
    const online = () => setNetworkOnline(true);
    const offline = () => setNetworkOnline(false);
    window.addEventListener("online", online);
    window.addEventListener("offline", offline);

    void (async () => {
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

  async function handleLogin(token: string): Promise<void> {
    try {
      setLoading(true);
      await apiClient.login(token);
      await refreshSession();
      await refreshJobs();
      setFeedback(`Logged in with token ${token}`);
    } catch (error) {
      const envelope = error as { error?: { message?: string } };
      setFeedback(envelope.error?.message ?? "Login failed");
    } finally {
      setLoading(false);
    }
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

    await apiClient.requestSchedule(
      selectedJob.job_uid,
      {
        start_at: new Date(preferredStart).toISOString(),
        end_at: new Date(preferredEnd).toISOString()
      },
      Intl.DateTimeFormat().resolvedOptions().timeZone,
      selectedJob.row_version
    );

    setFeedback("Preferred slot request submitted.");
  }

  async function handleDocumentGenerate(): Promise<void> {
    if (!selectedJob) {
      return;
    }
    await apiClient.generateDocument(selectedJob.job_uid, documentType);
    await refreshDocuments(selectedJob.job_uid);
    setFeedback(`${documentType} generated.`);
  }

  async function handleDocumentPublish(): Promise<void> {
    await apiClient.publishDocument(publishDocumentUid, publishRowVersion);
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
      <div className="portal-auth-shell">
        <div className="portal-auth-stage">
          <section className="portal-auth-copy">
            <p className="portal-auth-kicker">Kharon operations portal</p>
            <h1>Client, technician, dispatcher, and admin access in one controlled workspace.</h1>
            <p>
              The public website should carry the brand. This surface should stay calm, readable, and operational. Production access
              uses Google OIDC; deterministic development tokens remain available during pilot.
            </p>
            <div className="portal-auth-points">
              <div>
                <strong>Server-side session validation</strong>
                <span>Identity and role checks are enforced beyond the browser.</span>
              </div>
              <div>
                <strong>Controlled records and outputs</strong>
                <span>Jobs, notes, schedules, and documents stay inside one governed operational flow.</span>
              </div>
              <div>
                <strong>Role-specific workspaces</strong>
                <span>Clients see visibility, technicians see execution, dispatch sees control, and admin sees oversight.</span>
              </div>
            </div>
          </section>

          <section className="portal-auth-card">
            <div className="panel-heading">
              <p className="panel-eyebrow">Sign in</p>
              <h2>Portal access</h2>
            </div>

            <label className="field-stack">
              <span>Google ID token or local development token</span>
              <input value={loginToken} onChange={(event) => setLoginToken(event.target.value)} placeholder="Paste token or use a quick token below" />
            </label>

            <div className="button-row">
              <button className="button button--primary" onClick={() => handleLogin(loginToken)}>
                Sign in
              </button>
            </div>

            <div className="quick-login-grid">
              <QuickLoginButton label="dev-client" token="dev-client" onClick={handleLogin} />
              <QuickLoginButton label="dev-technician" token="dev-technician" onClick={handleLogin} />
              <QuickLoginButton label="dev-dispatcher" token="dev-dispatcher" onClick={handleLogin} />
              <QuickLoginButton label="dev-admin" token="dev-admin" onClick={handleLogin} />
            </div>

            <div className="feedback-panel">
              <pre>{feedback}</pre>
            </div>
          </section>
        </div>
      </div>
    );
  }

  const role = session.session.role;
  const brief = roleBrief(role);
  const priorities = buildRolePriorities(role, selectedJob, queueCount, generatedDocumentCount, networkOnline);
  const summaryCards = buildSummaryCards(
    role,
    openJobCount,
    selectedJobStatus,
    queueCount,
    generatedDocumentCount,
    adminAuditCount,
    networkOnline
  );
  const isFieldRole = role === "technician" || role === "dispatcher" || role === "admin";
  const isDispatchRole = role === "dispatcher" || role === "admin";
  const isAdmin = role === "admin";
  const postureItems: WorkspaceRailItem[] = [
    {
      label: "Service posture",
      detail: selectedJob ? selectedJob.status : "Awaiting job selection"
    },
    {
      label: "Lead technician",
      detail: selectedJob?.technician_uid || "Pending assignment"
    },
    {
      label: "Document posture",
      detail: generatedDocumentCount > 0 ? `${generatedDocumentCount} history rows in scope` : "Awaiting controlled output"
    }
  ];

  return (
    <div className={`portal-shell portal-shell--${role}`}>
      <header className="portal-topbar">
        <div className="portal-topbar__brand">
          <div className="portal-mark">K</div>
          <div>
            <div className="portal-title">Kharon Operations Portal</div>
            <div className="portal-subtitle">
              {session.session.display_name} | {roleLabel(role)} | mode {session.mode}/{session.rails_mode}
            </div>
          </div>
        </div>

        <div className="portal-topbar__actions">
          <label className="toggle-inline">
            <input type="checkbox" checked={offlineEnabled} onChange={(event) => setOfflineEnabled(event.target.checked)} />
            Force queue mode
          </label>
          <span className={`status-chip status-chip--${networkOnline ? "active" : "critical"}`}>{networkOnline ? "Online" : "Offline"}</span>
          <button className="button button--secondary" onClick={handleReplay}>
            Replay queue ({queueCount})
          </button>
          <button className="button button--ghost" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      <section className="workspace-brief">
        <div className="workspace-brief__copy">
          <p className="panel-eyebrow">Workspace focus</p>
          <h1>{brief.title}</h1>
          <p>{brief.body}</p>
        </div>
        <div className="workspace-brief__rail">
          {priorities.map((item) => (
            <article key={item.label} className="brief-pill">
              <span>{item.label}</span>
              <strong>{item.detail}</strong>
            </article>
          ))}
        </div>
      </section>

      <div className="portal-layout">
        <aside className="portal-sidebar">
          <section className="workspace-card">
            <div className="panel-heading">
              <p className="panel-eyebrow">Workspace</p>
              <h2>{roleLabel(role)}</h2>
            </div>
            <p className="muted-copy">{roleDescription(role)}</p>
            <dl className="fact-list">
              <div>
                <dt>User</dt>
                <dd>{session.session.display_name}</dd>
              </div>
              <div>
                <dt>Role</dt>
                <dd>{session.session.role}</dd>
              </div>
              <div>
                <dt>Session mode</dt>
                <dd>{session.mode}</dd>
              </div>
              <div>
                <dt>Rails mode</dt>
                <dd>{session.rails_mode}</dd>
              </div>
            </dl>
          </section>

          <section className="workspace-card workspace-card--support">
            <div className="panel-heading">
              <p className="panel-eyebrow">Guide</p>
              <h2>{brief.supportTitle}</h2>
            </div>
            <p className="muted-copy">{brief.supportIntro}</p>
            <ul className="support-list">
              {brief.supportItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <section className="workspace-card">
            <div className="panel-heading panel-heading--inline">
              <div>
                <p className="panel-eyebrow">Jobs</p>
                <h2>{brief.jobsTitle}</h2>
              </div>
              <span className="count-pill">{jobs.length}</span>
            </div>

            <div className="job-list">
              {jobs.length === 0 ? (
                <p className="muted-copy">No jobs currently available for this role.</p>
              ) : (
                jobs.map((job) => (
                  <button
                    key={job.job_uid}
                    className={job.job_uid === selectedJobUid ? "job-item job-item--active" : "job-item"}
                    onClick={() => setSelectedJobUid(job.job_uid)}
                  >
                    <div className="job-item__top">
                      <strong>{job.job_uid}</strong>
                      <span className={`status-chip status-chip--${statusTone(job.status)}`}>{job.status}</span>
                    </div>
                    <span className="job-item__title">{job.title}</span>
                    <span className="job-item__meta">client {job.client_uid || "unassigned"} | tech {job.technician_uid || "pending"}</span>
                  </button>
                ))
              )}
            </div>
          </section>
        </aside>

        <main className="portal-main">
          <section className="summary-grid">
            {summaryCards.map((card) => (
              <SummaryCard key={card.label} label={card.label} value={card.value} detail={card.detail} />
            ))}
          </section>

          <section className="workspace-grid">
            <article className="workspace-card workspace-card--primary">
              <div className="panel-heading panel-heading--inline">
                <div>
                  <p className="panel-eyebrow">Selected job</p>
                  <h2>{selectedJob ? selectedJob.title : brief.selectedJobTitle}</h2>
                </div>
                {selectedJob ? <span className={`status-chip status-chip--${statusTone(selectedJob.status)}`}>{selectedJob.status}</span> : null}
              </div>

              {selectedJob ? (
                <>
                  <dl className="detail-grid">
                    <div>
                      <dt>Job UID</dt>
                      <dd>{selectedJob.job_uid}</dd>
                    </div>
                    <div>
                      <dt>Row version</dt>
                      <dd>{selectedJob.row_version}</dd>
                    </div>
                    <div>
                      <dt>Client UID</dt>
                      <dd>{selectedJob.client_uid || "n/a"}</dd>
                    </div>
                    <div>
                      <dt>Technician UID</dt>
                      <dd>{selectedJob.technician_uid || "n/a"}</dd>
                    </div>
                  </dl>

                  <div className="posture-grid">
                    {postureItems.map((item) => (
                      <div key={item.label}>
                        <span>{item.label}</span>
                        <strong>{item.detail}</strong>
                      </div>
                    ))}
                  </div>

                  {selectedJob.last_note ? (
                    <div className="highlight-box">
                      <span className="highlight-box__label">Latest note</span>
                      <p>{selectedJob.last_note}</p>
                    </div>
                  ) : null}

                  {isFieldRole && (
                    <div className="control-block">
                      <div className="control-block__head">
                        <h3>Field controls</h3>
                        <p>Update execution state and add a job note from the active workspace.</p>
                      </div>

                      <div className="control-stack">
                        <label className="field-stack">
                          <span>Status transition</span>
                          <div className="button-row">
                            <select value={statusTarget} onChange={(event) => setStatusTarget(event.target.value)}>
                              <option value="assigned">assigned</option>
                              <option value="en_route">en_route</option>
                              <option value="on_site">on_site</option>
                              <option value="paused">paused</option>
                              <option value="completed">completed</option>
                              <option value="cancelled">cancelled</option>
                            </select>
                            <button className="button button--primary" onClick={handleStatusUpdate}>
                              Apply
                            </button>
                          </div>
                        </label>

                        <label className="field-stack">
                          <span>Operator note</span>
                          <div className="button-row">
                            <input value={noteValue} onChange={(event) => setNoteValue(event.target.value)} placeholder="Add note to selected job" />
                            <button className="button button--secondary" onClick={handleNote}>
                              Save note
                            </button>
                          </div>
                        </label>
                      </div>
                    </div>
                  )}

                  {role === "client" && (
                    <div className="control-block">
                      <div className="control-block__head">
                        <h3>Preferred slot request</h3>
                        <p>Submit a scheduling preference without leaving the selected job context.</p>
                      </div>
                      <div className="form-grid form-grid--three">
                        <label className="field-stack">
                          <span>Preferred start</span>
                          <input type="datetime-local" value={preferredStart} onChange={(event) => setPreferredStart(event.target.value)} />
                        </label>
                        <label className="field-stack">
                          <span>Preferred end</span>
                          <input type="datetime-local" value={preferredEnd} onChange={(event) => setPreferredEnd(event.target.value)} />
                        </label>
                        <div className="field-stack field-stack--action">
                          <span>&nbsp;</span>
                          <button className="button button--primary" onClick={handleScheduleRequest}>
                            Submit request
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {isFieldRole && (
                    <div className="control-block">
                      <div className="control-block__head">
                        <h3>Controlled documents</h3>
                        <p>Generate the latest jobcard or service report from the active job.</p>
                      </div>
                      <div className="button-row">
                        <select value={documentType} onChange={(event) => setDocumentType(event.target.value as "jobcard" | "service_report")}>
                          <option value="jobcard">Jobcard</option>
                          <option value="service_report">Service report</option>
                        </select>
                        <button className="button button--secondary" onClick={handleDocumentGenerate}>
                          Generate
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <p className="muted-copy">Select a job from the sidebar to expose role-specific controls.</p>
              )}
            </article>

            {isDispatchRole && (
              <article className="workspace-card">
                <div className="panel-heading">
                  <p className="panel-eyebrow">Dispatch</p>
                  <h2>Schedule control</h2>
                </div>

                <div className="control-block">
                  <div className="control-block__head">
                    <h3>Confirm request</h3>
                    <p>Assign a technician and commit a slot.</p>
                  </div>
                  <div className="form-grid">
                    <label className="field-stack">
                      <span>Request UID</span>
                      <input value={confirmRequestUid} onChange={(event) => setConfirmRequestUid(event.target.value)} placeholder="request_uid" />
                    </label>
                    <label className="field-stack">
                      <span>Technician UID</span>
                      <input value={confirmTechUid} onChange={(event) => setConfirmTechUid(event.target.value)} placeholder="technician_uid" />
                    </label>
                    <label className="field-stack">
                      <span>Start</span>
                      <input type="datetime-local" value={confirmStart} onChange={(event) => setConfirmStart(event.target.value)} />
                    </label>
                    <label className="field-stack">
                      <span>End</span>
                      <input type="datetime-local" value={confirmEnd} onChange={(event) => setConfirmEnd(event.target.value)} />
                    </label>
                    <label className="field-stack">
                      <span>Row version</span>
                      <input
                        type="number"
                        value={confirmRowVersion}
                        onChange={(event) => setConfirmRowVersion(Number(event.target.value))}
                        placeholder="row_version"
                      />
                    </label>
                    <div className="field-stack field-stack--action">
                      <span>&nbsp;</span>
                      <button
                        className="button button--primary"
                        onClick={async () => {
                          await apiClient.confirmSchedule(
                            confirmRequestUid,
                            new Date(confirmStart).toISOString(),
                            new Date(confirmEnd).toISOString(),
                            confirmTechUid,
                            confirmRowVersion
                          );
                          setFeedback("Schedule confirmed.");
                        }}
                      >
                        Confirm
                      </button>
                    </div>
                  </div>
                </div>

                <div className="control-block">
                  <div className="control-block__head">
                    <h3>Reschedule</h3>
                    <p>Move an existing schedule while preserving row-version control.</p>
                  </div>
                  <div className="form-grid">
                    <label className="field-stack">
                      <span>Schedule UID</span>
                      <input value={rescheduleUid} onChange={(event) => setRescheduleUid(event.target.value)} placeholder="schedule_uid" />
                    </label>
                    <label className="field-stack">
                      <span>Row version</span>
                      <input
                        type="number"
                        value={rescheduleRowVersion}
                        onChange={(event) => setRescheduleRowVersion(Number(event.target.value))}
                        placeholder="row_version"
                      />
                    </label>
                    <label className="field-stack">
                      <span>New start</span>
                      <input type="datetime-local" value={rescheduleStart} onChange={(event) => setRescheduleStart(event.target.value)} />
                    </label>
                    <label className="field-stack">
                      <span>New end</span>
                      <input type="datetime-local" value={rescheduleEnd} onChange={(event) => setRescheduleEnd(event.target.value)} />
                    </label>
                    <div className="field-stack field-stack--action">
                      <span>&nbsp;</span>
                      <button
                        className="button button--secondary"
                        onClick={async () => {
                          await apiClient.reschedule(
                            rescheduleUid,
                            new Date(rescheduleStart).toISOString(),
                            new Date(rescheduleEnd).toISOString(),
                            rescheduleRowVersion
                          );
                          setFeedback("Schedule rescheduled.");
                        }}
                      >
                        Reschedule
                      </button>
                    </div>
                  </div>
                </div>

                <div className="control-block">
                  <div className="control-block__head">
                    <h3>Publish document</h3>
                    <p>Move a generated record into the published state.</p>
                  </div>
                  <div className="button-row">
                    <input value={publishDocumentUid} onChange={(event) => setPublishDocumentUid(event.target.value)} placeholder="document_uid" />
                    <input
                      type="number"
                      value={publishRowVersion}
                      onChange={(event) => setPublishRowVersion(Number(event.target.value))}
                      placeholder="row_version"
                    />
                    <button className="button button--secondary" onClick={handleDocumentPublish}>
                      Publish
                    </button>
                  </div>
                </div>
              </article>
            )}

            {isDispatchRole && (
              <article className="workspace-card">
                <div className="panel-heading">
                  <p className="panel-eyebrow">Communication rails</p>
                  <h2>Outbound actions</h2>
                </div>

                <div className="control-block">
                  <div className="control-block__head">
                    <h3>Gmail notify</h3>
                    <p>Send an update linked to the selected job.</p>
                  </div>
                  <div className="form-grid">
                    <label className="field-stack">
                      <span>To</span>
                      <input value={gmailTo} onChange={(event) => setGmailTo(event.target.value)} placeholder="to" />
                    </label>
                    <label className="field-stack">
                      <span>Subject</span>
                      <input value={gmailSubject} onChange={(event) => setGmailSubject(event.target.value)} placeholder="subject" />
                    </label>
                    <label className="field-stack field-stack--full">
                      <span>Body</span>
                      <input value={gmailBody} onChange={(event) => setGmailBody(event.target.value)} placeholder="body" />
                    </label>
                    <div className="field-stack field-stack--action">
                      <span>&nbsp;</span>
                      <button
                        className="button button--secondary"
                        onClick={async () => {
                          if (!selectedJob) return;
                          await apiClient.sendGmailNotification(gmailTo, gmailSubject, gmailBody, selectedJob.job_uid);
                          setFeedback("Gmail notification sent.");
                        }}
                      >
                        Send
                      </button>
                    </div>
                  </div>
                </div>

                <div className="control-block">
                  <div className="control-block__head">
                    <h3>Chat alert</h3>
                    <p>Escalate a dispatch message for the selected job.</p>
                  </div>
                  <div className="button-row">
                    <select value={chatSeverity} onChange={(event) => setChatSeverity(event.target.value as "info" | "warning" | "critical")}>
                      <option value="info">info</option>
                      <option value="warning">warning</option>
                      <option value="critical">critical</option>
                    </select>
                    <input value={chatMessage} onChange={(event) => setChatMessage(event.target.value)} placeholder="message" />
                    <button
                      className="button button--secondary"
                      onClick={async () => {
                        if (!selectedJob) return;
                        await apiClient.sendChatAlert(chatMessage, chatSeverity, selectedJob.job_uid);
                        setFeedback("Chat alert sent.");
                      }}
                    >
                      Alert
                    </button>
                  </div>
                </div>

                <div className="control-block">
                  <div className="control-block__head">
                    <h3>People sync</h3>
                    <p>Push a contact update into the shared people surface.</p>
                  </div>
                  <div className="form-grid">
                    <label className="field-stack">
                      <span>Name</span>
                      <input value={personName} onChange={(event) => setPersonName(event.target.value)} placeholder="name" />
                    </label>
                    <label className="field-stack">
                      <span>Email</span>
                      <input value={personEmail} onChange={(event) => setPersonEmail(event.target.value)} placeholder="email" />
                    </label>
                    <label className="field-stack">
                      <span>Phone</span>
                      <input value={personPhone} onChange={(event) => setPersonPhone(event.target.value)} placeholder="phone" />
                    </label>
                    <div className="field-stack field-stack--action">
                      <span>&nbsp;</span>
                      <button
                        className="button button--secondary"
                        onClick={async () => {
                          await apiClient.syncPerson(personName, personEmail, personPhone, "client");
                          setFeedback("People sync executed.");
                        }}
                      >
                        Sync
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            )}

            {isAdmin && (
              <article className="workspace-card">
                <div className="panel-heading">
                  <p className="panel-eyebrow">Admin</p>
                  <h2>Health and audit surface</h2>
                </div>
                <div className="button-row">
                  <button className="button button--secondary" onClick={loadAdminHealth}>
                    Load health
                  </button>
                  <button className="button button--secondary" onClick={loadAdminAudits}>
                    Load audits
                  </button>
                  <button
                    className="button button--ghost"
                    onClick={async () => {
                      await apiClient.retryAutomation("AUTO-001");
                      setFeedback("Automation retry requested.");
                    }}
                  >
                    Retry AUTO-001
                  </button>
                </div>
                <div className="feedback-panel">
                  <pre>{JSON.stringify({ health: adminHealth, audit_count: adminAuditCount }, null, 2)}</pre>
                </div>
              </article>
            )}

            <article className="workspace-card">
              <div className="panel-heading panel-heading--inline">
                <div>
                  <p className="panel-eyebrow">Documents</p>
                  <h2>{brief.documentsTitle}</h2>
                </div>
                <button
                  className="button button--ghost"
                  onClick={async () => {
                    await refreshDocuments(selectedJob?.job_uid);
                  }}
                >
                  Refresh
                </button>
              </div>
              <div className="history-table">
                {(documents ?? []).length === 0 ? (
                  <p className="muted-copy">No document history loaded for the current context.</p>
                ) : (
                  (documents ?? []).map((document) => (
                    <div key={String(document.document_uid)} className="history-row">
                      <strong>{String(document.document_uid)}</strong>
                      <span>{String(document.document_type)}</span>
                      <span className={`status-chip status-chip--${statusTone(String(document.status))}`}>{String(document.status)}</span>
                      <span className="history-row__url">{String(document.published_url || "not published")}</span>
                    </div>
                  ))
                )}
              </div>
            </article>
          </section>
        </main>
      </div>

      <footer className="portal-statusbar">
        <span>Feedback</span>
        <pre>{feedback}</pre>
      </footer>
    </div>
  );
}
