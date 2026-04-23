import React, { useMemo, useState } from "react";
import type { JobDocumentRow, ScheduleRequestRow, ScheduleRow, UserRow } from "@kharon/domain";

interface ScheduleControlCardProps {
  selectedJobid: string;
  preferredStart: string;
  setPreferredStart: (value: string) => void;
  preferredEnd: string;
  setPreferredEnd: (value: string) => void;
  requests: ScheduleRequestRow[];
  selectedRequestid: string;
  setSelectedRequestid: (id: string) => void;
  confirmStart: string;
  setConfirmStart: (value: string) => void;
  confirmEnd: string;
  setConfirmEnd: (value: string) => void;
  confirmTechid: string;
  setConfirmTechid: (id: string) => void;
  technicians: UserRow[];
  schedules: ScheduleRow[];
  selectedScheduleid: string;
  setSelectedScheduleid: (id: string) => void;
  rescheduleStart: string;
  setRescheduleStart: (value: string) => void;
  rescheduleEnd: string;
  setRescheduleEnd: (value: string) => void;
  documents: JobDocumentRow[];
  selectedDocumentid: string;
  setSelectedDocumentid: (id: string) => void;
  rescheduleRowVersion: number;
  setRescheduleRowVersion: (v: number) => void;

  onScheduleRequest: () => void;
  onScheduleConfirm: () => void;
  onReschedule: () => void;
  onDocumentPublish: () => void;
  onFeedback: (msg: string) => void;
}

function parseRequestedSlot(request: ScheduleRequestRow | null): string {
  if (!request) {
    return "Select a request to inspect the preferred slot window.";
  }

  try {
    const parsed = JSON.parse(request.preferred_slots_json) as Array<{ start_at?: string; end_at?: string }>;
    const first = parsed[0];
    if (!first?.start_at || !first?.end_at) {
      return request.notes || "No preferred slot detail was captured for this request.";
    }
    return `${first.start_at} to ${first.end_at} (${request.timezone})`;
  } catch {
    return request.notes || "Unable to parse the preferred slot detail for this request.";
  }
}

export function ScheduleControlCard({
  selectedJobid,
  preferredStart,
  setPreferredStart,
  preferredEnd,
  setPreferredEnd,
  requests,
  selectedRequestid,
  setSelectedRequestid,
  confirmStart,
  setConfirmStart,
  confirmEnd,
  setConfirmEnd,
  confirmTechid,
  setConfirmTechid,
  technicians,
  schedules,
  selectedScheduleid,
  setSelectedScheduleid,
  rescheduleStart,
  setRescheduleStart,
  rescheduleEnd,
  setRescheduleEnd,
  rescheduleRowVersion,
  setRescheduleRowVersion,
  documents,
  selectedDocumentid,
  setSelectedDocumentid,
  onScheduleRequest,
  onScheduleConfirm,
  onReschedule,
  onDocumentPublish,
  onFeedback: _onFeedback,

}: ScheduleControlCardProps): React.JSX.Element {
  const [draftAssignments, setDraftAssignments] = useState<Record<string, string>>({});
  const [selectedRequestIds, setSelectedRequestIds] = useState<string[]>([]);
  const selectedRequest = requests.find((request) => request.request_id === selectedRequestid) ?? null;
  const selectedSchedule = schedules.find((schedule) => schedule.schedule_id === selectedScheduleid) ?? null;
  const selectedDocument = documents.find((document) => document.document_id === selectedDocumentid) ?? null;
  const disableActions = selectedJobid === "";

  const requestSla = useMemo(() => {
    return requests.map((request) => {
      const openedAt = Date.parse(request.updated_at || new Date().toISOString());
      const dueAt = openedAt + 24 * 60 * 60 * 1000;
      const remainingMs = dueAt - Date.now();
      const hours = Math.max(0, Math.floor(remainingMs / (60 * 60 * 1000)));
      const mins = Math.max(0, Math.floor((remainingMs % (60 * 60 * 1000)) / (60 * 1000)));
      const breached = remainingMs <= 0;
      return {
        request_id: request.request_id,
        text: breached ? "SLA breached" : `${hours}h ${mins}m left`,
        breached
      };
    });
  }, [requests]);

  const capacityByTech = useMemo(() => {
    const counts = new Map<string, number>();
    for (const req of requests) {
      const tech = draftAssignments[req.request_id];
      if (!tech) continue;
      counts.set(tech, (counts.get(tech) ?? 0) + 1);
    }
    return counts;
  }, [draftAssignments, requests]);

  return (
    <article className="workspace-card">
      <div className="panel-heading">
        <p className="panel-eyebrow">Schedule</p>
        <h2>Planning & Scheduling</h2>
      </div>

      {disableActions ? <p className="muted-copy">Select a job to request, confirm, reschedule, or publish from live records.</p> : null}

      <div className="control-block">
        <div className="control-block__head">
          <h3>Planner Board</h3>
          <p>Drag requests onto technicians to balance workload, then confirm the booking.</p>
        </div>
        {requests.length === 0 ? (
          <p className="muted-copy">No incoming requests to plan yet.</p>
        ) : (
          <div className="form-grid" style={{ gridTemplateColumns: "1fr 2fr", alignItems: "start" }}>
            <div className="history-table" style={{ maxHeight: "420px" }}>
              {requests.map((request) => {
                const sla = requestSla.find((item) => item.request_id === request.request_id);
                const assigned = draftAssignments[request.request_id];
                return (
                  <div
                    key={request.request_id}
                    className="history-row"
                    draggable
                    onDragStart={(event) => event.dataTransfer.setData("text/plain", request.request_id)}
                    style={{ cursor: "grab" }}
                  >
                    <strong>
                      <label style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem" }}>
                        <input
                          type="checkbox"
                          checked={selectedRequestIds.includes(request.request_id)}
                          onChange={() =>
                            setSelectedRequestIds((prev) =>
                              prev.includes(request.request_id)
                                ? prev.filter((value) => value !== request.request_id)
                                : [...prev, request.request_id]
                            )
                          }
                        />
                        <span>{request.request_id}</span>
                      </label>
                    </strong>
                    <span>{request.status}</span>
                    <span className={`status-chip status-chip--${sla?.breached ? "critical" : "warning"}`}>{sla?.text ?? "SLA n/a"}</span>
                    <span>{assigned ? `Draft: ${assigned}` : "Unassigned"}</span>
                  </div>
                );
              })}
            </div>
            <div className="posture-grid">
              {technicians.map((technician) => {
                const techid = technician.technician_id;
                const load = capacityByTech.get(techid) ?? 0;
                const overloaded = load > 3;
                return (
                  <div
                    key={technician.user_id}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => {
                      const requestid = event.dataTransfer.getData("text/plain");
                      if (!requestid) return;
                      setDraftAssignments((prev) => ({ ...prev, [requestid]: techid }));
                    }}
                    style={{ minHeight: "120px", border: "1px dashed rgba(255,255,255,0.2)" }}
                  >
                    <span>{technician.display_name}</span>
                    <strong>{techid || "n/a"}</strong>
                    <small className={`status-chip status-chip--${overloaded ? "critical" : "active"}`}>{load} assigned</small>
                    <small>{overloaded ? "Overloaded" : "Available"}</small>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        <div className="button-row" style={{ marginTop: "0.75rem" }}>
          <button
            className="button button--ghost"
            type="button"
            disabled={selectedRequestIds.length === 0 || !confirmTechid}
            onClick={() => {
              setDraftAssignments((prev) => {
                const next = { ...prev };
                for (const requestid of selectedRequestIds) {
                  next[requestid] = confirmTechid;
                }
                return next;
              });
            }}
          >
            Bulk assign selected requests
          </button>
        </div>
      </div>

      <div className="control-block">
        <div className="control-block__head">
          <h3>Request Time Slot</h3>
          <p>These requests are linked to {selectedJobid || "the selected job"}.</p>
        </div>
        <div className="form-grid form-grid--three">
          <label className="field-stack">
            <span>Preferred start</span>
            <input
              name="preferred_start"
              type="datetime-local"
              value={preferredStart}
              onChange={(event) => setPreferredStart(event.target.value)}
              disabled={disableActions}
            />
          </label>
          <label className="field-stack">
            <span>Preferred end</span>
            <input
              name="preferred_end"
              type="datetime-local"
              value={preferredEnd}
              onChange={(event) => setPreferredEnd(event.target.value)}
              disabled={disableActions}
            />
          </label>
          <div className="field-stack field-stack--action">
            <span>&nbsp;</span>
            <button className="button button--primary" type="button" onClick={onScheduleRequest} disabled={disableActions}>
              Submit request
            </button>
          </div>
        </div>
      </div>

      <div className="control-block">
        <div className="control-block__head">
          <h3>Confirm Booking</h3>
          <p>Choose a request, assign a technician, and confirm the final date and time.</p>
        </div>
        {requests.length === 0 ? (
          <p className="muted-copy">No schedule requests exist for this job yet.</p>
        ) : (
          <div className="form-grid">
            <label className="field-stack">
              <span>Request</span>
              <select
                name="confirm_request_id"
                value={selectedRequestid}
                onChange={(event) => setSelectedRequestid(event.target.value)}
                disabled={disableActions}
              >
                {requests.map((request) => (
                  <option key={request.request_id} value={request.request_id}>
                    {request.request_id} | {request.status}
                  </option>
                ))}
              </select>
            </label>
            <label className="field-stack">
              <span>Technician</span>
              <select
                name="confirm_technician_id"
                value={confirmTechid}
                onChange={(event) => setConfirmTechid(event.target.value)}
                disabled={disableActions || technicians.length === 0}
              >
                {technicians.map((technician) => (
                  <option key={technician.user_id} value={technician.technician_id}>
                    {technician.display_name} | {technician.technician_id}
                  </option>
                ))}
              </select>
            </label>
            <label className="field-stack">
              <span>Draft assignment</span>
              <input
                name="draft_assignment"
                value={selectedRequestid ? draftAssignments[selectedRequestid] ?? "None" : "None"}
                readOnly
              />
            </label>
            <label className="field-stack">
              <span>Start</span>
              <input
                name="confirm_start"
                type="datetime-local"
                value={confirmStart}
                onChange={(event) => setConfirmStart(event.target.value)}
                disabled={disableActions}
              />
            </label>
            <label className="field-stack">
              <span>End</span>
              <input
                name="confirm_end"
                type="datetime-local"
                value={confirmEnd}
                onChange={(event) => setConfirmEnd(event.target.value)}
                disabled={disableActions}
              />
            </label>
            <div className="field-stack field-stack--full">
                <span>Request details</span>
              <p className="inline-note">{parseRequestedSlot(selectedRequest)}</p>
            </div>
            <div className="field-stack field-stack--action field-stack--full">
              <span>&nbsp;</span>
              <div className="button-row">
                <button
                  className="button button--ghost"
                  type="button"
                  disabled={!selectedRequestid || !draftAssignments[selectedRequestid]}
                  onClick={() => {
                    const draft = draftAssignments[selectedRequestid];
                    if (!draft) return;
                    setConfirmTechid(draft);
                  }}
                >
                  Use draft
                </button>
                <button className="button button--primary" type="button" onClick={onScheduleConfirm} disabled={disableActions}>
                  Confirm booking
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="control-block">
        <div className="control-block__head">
          <h3>Move Booking</h3>
          <p>Update an existing booking using the stored event details.</p>
        </div>
        {schedules.length === 0 ? (
          <p className="muted-copy">No confirmed schedules exist for this job yet.</p>
        ) : (
          <div className="form-grid">
            <label className="field-stack">
              <span>Schedule</span>
              <select
                name="reschedule_id"
                value={selectedScheduleid}
                onChange={(event) => setSelectedScheduleid(event.target.value)}
                disabled={disableActions}
              >
                {schedules.map((schedule) => (
                  <option key={schedule.schedule_id} value={schedule.schedule_id}>
                    {schedule.schedule_id} | {schedule.status}
                  </option>
                ))}
              </select>
            </label>
            <label className="field-stack">
              <span>Current window</span>
              <input
                name="current_schedule_window"
                value={selectedSchedule ? `${selectedSchedule.start_at} -> ${selectedSchedule.end_at}` : ""}
                readOnly
              />
            </label>
            <label className="field-stack">
              <span>New start</span>
              <input
                name="reschedule_start"
                type="datetime-local"
                value={rescheduleStart}
                onChange={(event) => setRescheduleStart(event.target.value)}
                disabled={disableActions}
              />
            </label>
            <label className="field-stack">
              <span>New end</span>
              <input
                name="reschedule_end"
                type="datetime-local"
                value={rescheduleEnd}
                onChange={(event) => setRescheduleEnd(event.target.value)}
                disabled={disableActions}
              />
            </label>
            <div className="field-stack field-stack--action field-stack--full">
              <span>&nbsp;</span>
              <button className="button button--secondary" type="button" onClick={onReschedule} disabled={disableActions}>
                Reschedule
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="control-block">
        <div className="control-block__head">
          <h3>Publish File</h3>
          <p>Publish a generated file for this job while keeping the audit trail intact.</p>
        </div>
        {documents.length === 0 ? (
          <p className="muted-copy">Generate a document from the job detail view before publishing it here.</p>
        ) : (
          <div className="form-grid">
            <label className="field-stack">
              <span>Document</span>
              <select
                name="publish_document_id"
                value={selectedDocumentid}
                onChange={(event) => setSelectedDocumentid(event.target.value)}
                disabled={disableActions}
              >
                {documents.map((document) => (
                  <option key={document.document_id} value={document.document_id}>
                    {document.document_id} | {document.document_type} | {document.status}
                  </option>
                ))}
              </select>
            </label>
            <label className="field-stack">
              <span>Document status</span>
              <input
                name="publish_document_status"
                value={selectedDocument ? `${selectedDocument.document_type} | ${selectedDocument.status}` : ""}
                readOnly
              />
            </label>
            <div className="field-stack field-stack--action field-stack--full">
              <span>&nbsp;</span>
              <button className="button button--secondary" type="button" onClick={onDocumentPublish} disabled={disableActions}>
                Publish
              </button>
            </div>
          </div>
        )}
      </div>

    </article>
  );
}

