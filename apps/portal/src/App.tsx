import React, { useEffect, useMemo, useState } from "react";
import type { OfflineQueueItem } from "@kharon/domain";
import { apiClient, type PortalSession } from "./apiClient";
import { enqueueMutation, listQueuedMutations } from "./offline/queue";
import { replayQueuedMutations } from "./offline/replay";

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
      setJobs(mapped);
      if (!selectedJobUid && mapped.length > 0) {
        const first = mapped[0];
        if (first) {
          setSelectedJobUid(first.job_uid);
        }
      }
    } catch (error) {
      setFeedback(`Jobs load failed: ${errorMessage(error)}`);
    }
  }

  async function refreshDocuments(jobUid?: string): Promise<void> {
    try {
      const response = await apiClient.history(jobUid);
      setDocuments(response.data ?? []);
    } catch (error) {
      setFeedback(`Document history load failed: ${errorMessage(error)}`);
    }
  }

  async function refreshSession(): Promise<void> {
    try {
      const activeSession = await apiClient.session();
      setSession(activeSession);
    } catch {
      setSession(null);
    }
  }

  useEffect(() => {
    const online = () => setNetworkOnline(true);
    const offline = () => setNetworkOnline(false);
    window.addEventListener("online", online);
    window.addEventListener("offline", offline);

    (async () => {
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
    return <div className="portal-shell">Loading portal...</div>;
  }

  if (!session) {
    return (
      <div className="portal-shell">
        <div className="auth-panel">
          <h1>Kharon Operations Portal</h1>
          <p>Google OIDC login is active. Local mode accepts deterministic development tokens.</p>
          <div className="auth-grid">
            <input value={loginToken} onChange={(event) => setLoginToken(event.target.value)} placeholder="Google ID token" />
            <button onClick={() => handleLogin(loginToken)}>Login</button>
            <button onClick={() => handleLogin("dev-client")}>dev-client</button>
            <button onClick={() => handleLogin("dev-technician")}>dev-technician</button>
            <button onClick={() => handleLogin("dev-dispatcher")}>dev-dispatcher</button>
            <button onClick={() => handleLogin("dev-admin")}>dev-admin</button>
          </div>
          <pre>{feedback}</pre>
        </div>
      </div>
    );
  }

  return (
    <div className="portal-shell">
      <header className="portal-header">
        <div>
          <div className="brand-title">Kharon Unified Rebuild v1</div>
          <div className="session-meta">
            {session.session.display_name} | role={session.session.role} | mode={session.mode}/{session.rails_mode}
          </div>
        </div>
        <div className="header-actions">
          <label>
            <input
              type="checkbox"
              checked={offlineEnabled}
              onChange={(event) => setOfflineEnabled(event.target.checked)}
            />
            Force offline queue
          </label>
          <span className={networkOnline ? "status-online" : "status-offline"}>{networkOnline ? "ONLINE" : "OFFLINE"}</span>
          <button onClick={handleReplay}>Replay Queue ({queueCount})</button>
          <button onClick={handleLogout}>Logout</button>
        </div>
      </header>

      <main className="portal-grid">
        <section className="panel">
          <h2>Jobs</h2>
          <div className="job-list">
            {jobs.map((job) => (
              <button key={job.job_uid} className={job.job_uid === selectedJobUid ? "job-item active" : "job-item"} onClick={() => setSelectedJobUid(job.job_uid)}>
                <strong>{job.job_uid}</strong>
                <span>{job.title}</span>
                <span className="job-state">{job.status}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="panel">
          <h2>Job Control</h2>
          {selectedJob ? (
            <>
              <div className="kv">
                <span>Job</span>
                <strong>{selectedJob.job_uid}</strong>
                <span>Row Version</span>
                <strong>{selectedJob.row_version}</strong>
                <span>Status</span>
                <strong>{selectedJob.status}</strong>
              </div>

              {(session.session.role === "technician" || session.session.role === "dispatcher" || session.session.role === "admin") && (
                <>
                  <h3>Status Transition</h3>
                  <div className="inline-form">
                    <select value={statusTarget} onChange={(event) => setStatusTarget(event.target.value)}>
                      <option value="assigned">assigned</option>
                      <option value="en_route">en_route</option>
                      <option value="on_site">on_site</option>
                      <option value="paused">paused</option>
                      <option value="completed">completed</option>
                      <option value="cancelled">cancelled</option>
                    </select>
                    <button onClick={handleStatusUpdate}>Apply</button>
                  </div>

                  <h3>Job Note</h3>
                  <div className="inline-form">
                    <input value={noteValue} onChange={(event) => setNoteValue(event.target.value)} placeholder="Operator note" />
                    <button onClick={handleNote}>Save Note</button>
                  </div>
                </>
              )}

              {session.session.role === "client" && (
                <>
                  <h3>Request Preferred Slot</h3>
                  <div className="inline-form three">
                    <input type="datetime-local" value={preferredStart} onChange={(event) => setPreferredStart(event.target.value)} />
                    <input type="datetime-local" value={preferredEnd} onChange={(event) => setPreferredEnd(event.target.value)} />
                    <button onClick={handleScheduleRequest}>Submit</button>
                  </div>
                </>
              )}

              {(session.session.role === "technician" || session.session.role === "dispatcher" || session.session.role === "admin") && (
                <>
                  <h3>Controlled Documents</h3>
                  <div className="inline-form">
                    <select value={documentType} onChange={(event) => setDocumentType(event.target.value as "jobcard" | "service_report")}>
                      <option value="jobcard">Jobcard</option>
                      <option value="service_report">Service Report</option>
                    </select>
                    <button onClick={handleDocumentGenerate}>Generate</button>
                  </div>
                </>
              )}
            </>
          ) : (
            <p>No jobs assigned for this role.</p>
          )}
        </section>

        {(session.session.role === "dispatcher" || session.session.role === "admin") && (
          <section className="panel">
            <h2>Dispatch Controls</h2>
            <h3>Confirm Request</h3>
            <div className="inline-form grid-two">
              <input value={confirmRequestUid} onChange={(event) => setConfirmRequestUid(event.target.value)} placeholder="request_uid" />
              <input value={confirmTechUid} onChange={(event) => setConfirmTechUid(event.target.value)} placeholder="technician_uid" />
              <input type="datetime-local" value={confirmStart} onChange={(event) => setConfirmStart(event.target.value)} />
              <input type="datetime-local" value={confirmEnd} onChange={(event) => setConfirmEnd(event.target.value)} />
              <input
                type="number"
                value={confirmRowVersion}
                onChange={(event) => setConfirmRowVersion(Number(event.target.value))}
                placeholder="row_version"
              />
              <button
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

            <h3>Reschedule</h3>
            <div className="inline-form grid-two">
              <input value={rescheduleUid} onChange={(event) => setRescheduleUid(event.target.value)} placeholder="schedule_uid" />
              <input
                type="number"
                value={rescheduleRowVersion}
                onChange={(event) => setRescheduleRowVersion(Number(event.target.value))}
                placeholder="row_version"
              />
              <input type="datetime-local" value={rescheduleStart} onChange={(event) => setRescheduleStart(event.target.value)} />
              <input type="datetime-local" value={rescheduleEnd} onChange={(event) => setRescheduleEnd(event.target.value)} />
              <button
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

            <h3>Publish Document</h3>
            <div className="inline-form">
              <input value={publishDocumentUid} onChange={(event) => setPublishDocumentUid(event.target.value)} placeholder="document_uid" />
              <input
                type="number"
                value={publishRowVersion}
                onChange={(event) => setPublishRowVersion(Number(event.target.value))}
                placeholder="row_version"
              />
              <button onClick={handleDocumentPublish}>Publish</button>
            </div>
          </section>
        )}

        {(session.session.role === "dispatcher" || session.session.role === "admin") && (
          <section className="panel">
            <h2>Workspace Rails</h2>
            <h3>Gmail Notify</h3>
            <div className="inline-form grid-two">
              <input value={gmailTo} onChange={(event) => setGmailTo(event.target.value)} placeholder="to" />
              <input value={gmailSubject} onChange={(event) => setGmailSubject(event.target.value)} placeholder="subject" />
              <input value={gmailBody} onChange={(event) => setGmailBody(event.target.value)} placeholder="body" />
              <button
                onClick={async () => {
                  if (!selectedJob) return;
                  await apiClient.sendGmailNotification(gmailTo, gmailSubject, gmailBody, selectedJob.job_uid);
                  setFeedback("Gmail notification sent.");
                }}
              >
                Send
              </button>
            </div>

            <h3>Chat Alert</h3>
            <div className="inline-form">
              <select value={chatSeverity} onChange={(event) => setChatSeverity(event.target.value as "info" | "warning" | "critical")}>
                <option value="info">info</option>
                <option value="warning">warning</option>
                <option value="critical">critical</option>
              </select>
              <input value={chatMessage} onChange={(event) => setChatMessage(event.target.value)} placeholder="message" />
              <button
                onClick={async () => {
                  if (!selectedJob) return;
                  await apiClient.sendChatAlert(chatMessage, chatSeverity, selectedJob.job_uid);
                  setFeedback("Chat alert sent.");
                }}
              >
                Alert
              </button>
            </div>

            <h3>People Sync</h3>
            <div className="inline-form grid-two">
              <input value={personName} onChange={(event) => setPersonName(event.target.value)} placeholder="name" />
              <input value={personEmail} onChange={(event) => setPersonEmail(event.target.value)} placeholder="email" />
              <input value={personPhone} onChange={(event) => setPersonPhone(event.target.value)} placeholder="phone" />
              <button
                onClick={async () => {
                  await apiClient.syncPerson(personName, personEmail, personPhone, "client");
                  setFeedback("People sync executed.");
                }}
              >
                Sync
              </button>
            </div>
          </section>
        )}

        {session.session.role === "admin" && (
          <section className="panel">
            <h2>Admin Surface</h2>
            <div className="inline-form">
              <button onClick={loadAdminHealth}>Load Health</button>
              <button onClick={loadAdminAudits}>Load Audits</button>
              <button
                onClick={async () => {
                  await apiClient.retryAutomation("AUTO-001");
                  setFeedback("Automation retry requested.");
                }}
              >
                Retry AUTO-001
              </button>
            </div>
            <pre>{JSON.stringify({ health: adminHealth, audit_count: adminAuditCount }, null, 2)}</pre>
          </section>
        )}

        <section className="panel">
          <h2>Document History</h2>
          <button
            onClick={async () => {
              await refreshDocuments(selectedJob?.job_uid);
            }}
          >
            Refresh
          </button>
          <div className="history-table">
            {(documents ?? []).map((document) => (
              <div key={String(document.document_uid)} className="history-row">
                <span>{String(document.document_uid)}</span>
                <span>{String(document.document_type)}</span>
                <span>{String(document.status)}</span>
                <span>{String(document.published_url)}</span>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="portal-footer">
        <pre>{feedback}</pre>
      </footer>
    </div>
  );
}
