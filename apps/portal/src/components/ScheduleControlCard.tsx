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
  documents,
  selectedDocumentid,
  setSelectedDocumentid,
  onScheduleRequest,
  onScheduleConfirm,
  onReschedule,
  onDocumentPublish,
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
    <article className="workspace-card glass-panel">
      <div className="panel-heading">
        <p className="panel-eyebrow">Schedule</p>
        <h2>Planning & Scheduling</h2>
      </div>

      {disableActions && <p className="muted-copy">Select a job to request, confirm, reschedule, or publish from live records.</p>}

      <div className="control-block">
        <div className="control-block__head">
          <h3>Planner Board</h3>
          <p>Drag requests onto technicians to balance workload, then confirm the booking.</p>
        </div>
        {requests.length === 0 ? (
          <p className="muted-copy">No incoming requests to plan yet.</p>
        ) : (
          <div className="planner-grid">
            <div className="history-table planner-requests">
              {requests.map((request) => {
                const sla = requestSla.find((item) => item.request_id === request.request_id);
                const assigned = draftAssignments[request.request_id];
                return (
                  <div
                    key={request.request_id}
                    className="history-row history-row--draggable"
                    draggable
                    onDragStart={(event) => event.dataTransfer.setData("text/plain", request.request_id)}
                  >
                    <div className="flex items-center gap-2">
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
                      <strong className="truncate">{request.request_id}</strong>
                    </div>
                    <span className="truncate">{request.status}</span>
                    <span className={`status-chip status-chip--${sla?.breached ? "critical" : "warning"} whitespace-nowrap`}>
                      {sla?.text ?? "SLA n/a"}
                    </span>
                    <span className="truncate">{assigned ? `Draft: ${assigned}` : "Unassigned"}</span>
                  </div>
                );
              })}
            </div>
            <div className="posture-grid planner-technicians">
              {technicians.map((technician) => {
                const techid = technician.technician_id;
                const load = capacityByTech.get(techid) ?? 0;
                const overloaded = load > 3;
                return (
                  <div
                    key={technician.user_id}
                    className="drop-zone"
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => {
                      const requestid = event.dataTransfer.getData("text/plain");
                      if (!requestid) return;
                      setDraftAssignments((prev) => ({ ...prev, [requestid]: techid }));
                    }}
                  >
                    <span className="truncate font-semibold text-white">{technician.display_name}</span>
                    <strong className="truncate text-xs opacity-50">{techid || "n/a"}</strong>
                    <div className="flex gap-2 mt-2">
                      <small className={`status-chip status-chip--${overloaded ? "critical" : "active"}`}>{load} assigned</small>
                      <small className="text-xs opacity-50 flex items-center">{overloaded ? "Overloaded" : "Available"}</small>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        <div className="button-row mt-3">
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

      {/* Request Time Slot */}
      <div className="control-block mt-8">
        <div className="control-block__head">
          <h3>Request Time Slot</h3>
          <p>These requests are linked to <span className="text-primary font-mono">{selectedJobid || "the selected job"}</span>.</p>
        </div>
        <div className="form-grid">
          <label className="field-stack">
            <span>Preferred start</span>
            <input type="datetime-local" value={preferredStart} onChange={(e) => setPreferredStart(e.target.value)} disabled={disableActions} />
          </label>
          <label className="field-stack">
            <span>Preferred end</span>
            <input type="datetime-local" value={preferredEnd} onChange={(e) => setPreferredEnd(e.target.value)} disabled={disableActions} />
          </label>
          <div className="field-stack field-stack--action">
            <span>&nbsp;</span>
            <button className="button button--primary" type="button" onClick={onScheduleRequest} disabled={disableActions}>
              Submit request
            </button>
          </div>
        </div>
      </div>

      {/* Confirm Booking */}
      <div className="control-block mt-8">
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
              <select value={selectedRequestid} onChange={(e) => setSelectedRequestid(e.target.value)} disabled={disableActions}>
                <option value="">Select a request...</option>
                {requests.map((request) => (
                  <option key={request.request_id} value={request.request_id}>{request.request_id} | {request.status}</option>
                ))}
              </select>
            </label>
            <label className="field-stack">
              <span>Technician</span>
              <select value={confirmTechid} onChange={(e) => setConfirmTechid(e.target.value)} disabled={disableActions || technicians.length === 0}>
                <option value="">Select a technician...</option>
                {technicians.map((technician) => (
                  <option key={technician.user_id} value={technician.technician_id}>{technician.display_name}</option>
                ))}
              </select>
            </label>
            <label className="field-stack">
              <span>Draft assignment</span>
              <input value={selectedRequestid ? draftAssignments[selectedRequestid] ?? "None" : "None"} readOnly disabled />
            </label>
            <label className="field-stack">
              <span>Start</span>
              <input type="datetime-local" value={confirmStart} onChange={(e) => setConfirmStart(e.target.value)} disabled={disableActions} />
            </label>
            <label className="field-stack">
              <span>End</span>
              <input type="datetime-local" value={confirmEnd} onChange={(e) => setConfirmEnd(e.target.value)} disabled={disableActions} />
            </label>
            <div className="field-stack field-stack--full">
              <span>Request details</span>
              <p className="inline-note p-3 bg-white/5 border border-white/10 rounded-md">{parseRequestedSlot(selectedRequest)}</p>
            </div>
            <div className="field-stack field-stack--full flex justify-end gap-3 mt-2">
                <button
                  className="button button--ghost"
                  type="button"
                  disabled={!selectedRequestid || !draftAssignments[selectedRequestid]}
                  onClick={() => {
                    const draft = draftAssignments[selectedRequestid];
                    if (draft) setConfirmTechid(draft);
                  }}
                >
                  Use draft
                </button>
                <button className="button button--primary" type="button" onClick={onScheduleConfirm} disabled={disableActions}>
                  Confirm booking
                </button>
            </div>
          </div>
        )}
      </div>

      {/* Move Booking */}
      <div className="control-block mt-8">
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
              <select value={selectedScheduleid} onChange={(e) => setSelectedScheduleid(e.target.value)} disabled={disableActions}>
                <option value="">Select schedule...</option>
                {schedules.map((schedule) => (
                  <option key={schedule.schedule_id} value={schedule.schedule_id}>{schedule.schedule_id} | {schedule.status}</option>
                ))}
              </select>
            </label>
            <label className="field-stack">
              <span>Current window</span>
              <input value={selectedSchedule ? `${selectedSchedule.start_at} -> ${selectedSchedule.end_at}` : ""} readOnly disabled />
            </label>
            <label className="field-stack">
              <span>New start</span>
              <input type="datetime-local" value={rescheduleStart} onChange={(e) => setRescheduleStart(e.target.value)} disabled={disableActions} />
            </label>
            <label className="field-stack">
              <span>New end</span>
              <input type="datetime-local" value={rescheduleEnd} onChange={(e) => setRescheduleEnd(e.target.value)} disabled={disableActions} />
            </label>
            <div className="field-stack field-stack--action field-stack--full flex justify-end mt-2">
              <button className="button button--secondary" type="button" onClick={onReschedule} disabled={disableActions}>
                Reschedule
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Publish File */}
      <div className="control-block mt-8">
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
              <select value={selectedDocumentid} onChange={(e) => setSelectedDocumentid(e.target.value)} disabled={disableActions}>
                <option value="">Select document...</option>
                {documents.map((document) => (
                  <option key={document.document_id} value={document.document_id}>{document.document_id} | {document.document_type} | {document.status}</option>
                ))}
              </select>
            </label>
            <label className="field-stack">
              <span>Document status</span>
              <input value={selectedDocument ? `${selectedDocument.document_type} | ${selectedDocument.status}` : ""} readOnly disabled />
            </label>
            <div className="field-stack field-stack--action field-stack--full flex justify-end mt-2">
              <button className="button button--secondary" type="button" onClick={onDocumentPublish} disabled={disableActions}>
                Publish
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .planner-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.5rem;
          align-items: start;
        }
        @media (min-width: 1024px) {
          .planner-grid { grid-template-columns: 1fr 2fr; }
        }
        .planner-requests {
          max-height: 420px;
          overflow-y: auto;
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 8px;
        }
        .history-row--draggable {
          cursor: grab;
          transition: background 0.2s, transform 0.2s;
        }
        .history-row--draggable:active { cursor: grabbing; transform: scale(0.99); }
        .drop-zone {
          min-height: 120px;
          border: 2px dashed rgba(255,255,255,0.1);
          border-radius: 12px;
          padding: 1.25rem;
          display: flex;
          flex-direction: column;
          background: rgba(255,255,255,0.02);
          transition: all 0.2s;
        }
        .drop-zone:hover {
          border-color: rgba(var(--color-primary-rgb), 0.5);
          background: rgba(var(--color-primary-rgb), 0.05);
        }
        
        /* Flexbox utilities mimicking Tailwind */
        .flex { display: flex; }
        .items-center { align-items: center; }
        .justify-end { justify-content: flex-end; }
        .gap-2 { gap: 0.5rem; }
        .gap-3 { gap: 0.75rem; }
        .mt-2 { margin-top: 0.5rem; }
        .mt-3 { margin-top: 0.75rem; }
        .mt-8 { margin-top: 2rem; }
        .truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .whitespace-nowrap { white-space: nowrap; }
        .font-semibold { font-weight: 600; }
        .text-white { color: var(--color-text); }
        .text-xs { font-size: 0.75rem; }
        .opacity-50 { opacity: 0.5; }
        .bg-white\\/5 { background-color: rgba(255, 255, 255, 0.05); }
        .border-white\\/10 { border-color: rgba(255, 255, 255, 0.1); }
        .rounded-md { border-radius: 0.375rem; }
        .p-3 { padding: 0.75rem; }
        .font-mono { font-family: monospace; }
        .text-primary { color: var(--color-primary); }
      `}</style>
    </article>
  );
}
