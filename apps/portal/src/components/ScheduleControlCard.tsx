import React from "react";
import type { JobDocumentRow, ScheduleRequestRow, ScheduleRow, UserRow } from "@kharon/domain";

interface ScheduleControlCardProps {
  selectedJobUid: string;
  preferredStart: string;
  setPreferredStart: (value: string) => void;
  preferredEnd: string;
  setPreferredEnd: (value: string) => void;
  requests: ScheduleRequestRow[];
  selectedRequestUid: string;
  setSelectedRequestUid: (uid: string) => void;
  confirmStart: string;
  setConfirmStart: (value: string) => void;
  confirmEnd: string;
  setConfirmEnd: (value: string) => void;
  confirmTechUid: string;
  setConfirmTechUid: (uid: string) => void;
  technicians: UserRow[];
  schedules: ScheduleRow[];
  selectedScheduleUid: string;
  setSelectedScheduleUid: (uid: string) => void;
  rescheduleStart: string;
  setRescheduleStart: (value: string) => void;
  rescheduleEnd: string;
  setRescheduleEnd: (value: string) => void;
  documents: JobDocumentRow[];
  selectedDocumentUid: string;
  setSelectedDocumentUid: (uid: string) => void;
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
  selectedJobUid,
  preferredStart,
  setPreferredStart,
  preferredEnd,
  setPreferredEnd,
  requests,
  selectedRequestUid,
  setSelectedRequestUid,
  confirmStart,
  setConfirmStart,
  confirmEnd,
  setConfirmEnd,
  confirmTechUid,
  setConfirmTechUid,
  technicians,
  schedules,
  selectedScheduleUid,
  setSelectedScheduleUid,
  rescheduleStart,
  setRescheduleStart,
  rescheduleEnd,
  setRescheduleEnd,
  rescheduleRowVersion,
  setRescheduleRowVersion,
  documents,
  selectedDocumentUid,
  setSelectedDocumentUid,
  onScheduleRequest,
  onScheduleConfirm,
  onReschedule,
  onDocumentPublish,
  onFeedback: _onFeedback,

}: ScheduleControlCardProps): React.JSX.Element {
  const selectedRequest = requests.find((request) => request.request_uid === selectedRequestUid) ?? null;
  const selectedSchedule = schedules.find((schedule) => schedule.schedule_uid === selectedScheduleUid) ?? null;
  const selectedDocument = documents.find((document) => document.document_uid === selectedDocumentUid) ?? null;
  const disableActions = selectedJobUid === "";

  return (
    <article className="workspace-card">
      <div className="panel-heading">
        <p className="panel-eyebrow">Dispatch</p>
        <h2>Schedule control</h2>
      </div>

      {disableActions ? <p className="muted-copy">Select a job to request, confirm, reschedule, or publish from live records.</p> : null}

      <div className="control-block">
        <div className="control-block__head">
          <h3>Preferred slot request</h3>
          <p>Dispatch requests are tied directly to {selectedJobUid || "the selected job"}.</p>
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
          <h3>Confirm request</h3>
          <p>Choose the stored request and assign the technician from the active people directory.</p>
        </div>
        {requests.length === 0 ? (
          <p className="muted-copy">No schedule requests exist for this job yet.</p>
        ) : (
          <div className="form-grid">
            <label className="field-stack">
              <span>Request</span>
              <select
                name="confirm_request_uid"
                value={selectedRequestUid}
                onChange={(event) => setSelectedRequestUid(event.target.value)}
                disabled={disableActions}
              >
                {requests.map((request) => (
                  <option key={request.request_uid} value={request.request_uid}>
                    {request.request_uid} | {request.status}
                  </option>
                ))}
              </select>
            </label>
            <label className="field-stack">
              <span>Technician</span>
              <select
                name="confirm_technician_uid"
                value={confirmTechUid}
                onChange={(event) => setConfirmTechUid(event.target.value)}
                disabled={disableActions || technicians.length === 0}
              >
                {technicians.map((technician) => (
                  <option key={technician.user_uid} value={technician.technician_uid}>
                    {technician.display_name} | {technician.technician_uid}
                  </option>
                ))}
              </select>
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
              <span>Request detail</span>
              <p className="inline-note">{parseRequestedSlot(selectedRequest)}</p>
            </div>
            <div className="field-stack field-stack--action field-stack--full">
              <span>&nbsp;</span>
              <button className="button button--primary" type="button" onClick={onScheduleConfirm} disabled={disableActions}>
                Confirm request
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="control-block">
        <div className="control-block__head">
          <h3>Reschedule</h3>
          <p>Reschedule from the stored event record instead of entering internal schedule IDs manually.</p>
        </div>
        {schedules.length === 0 ? (
          <p className="muted-copy">No confirmed schedules exist for this job yet.</p>
        ) : (
          <div className="form-grid">
            <label className="field-stack">
              <span>Schedule</span>
              <select
                name="reschedule_uid"
                value={selectedScheduleUid}
                onChange={(event) => setSelectedScheduleUid(event.target.value)}
                disabled={disableActions}
              >
                {schedules.map((schedule) => (
                  <option key={schedule.schedule_uid} value={schedule.schedule_uid}>
                    {schedule.schedule_uid} | {schedule.status}
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
          <h3>Publish document</h3>
          <p>Release the generated record that belongs to this job and keep the operational trail intact.</p>
        </div>
        {documents.length === 0 ? (
          <p className="muted-copy">Generate a document from the job detail view before publishing it here.</p>
        ) : (
          <div className="form-grid">
            <label className="field-stack">
              <span>Document</span>
              <select
                name="publish_document_uid"
                value={selectedDocumentUid}
                onChange={(event) => setSelectedDocumentUid(event.target.value)}
                disabled={disableActions}
              >
                {documents.map((document) => (
                  <option key={document.document_uid} value={document.document_uid}>
                    {document.document_uid} | {document.document_type} | {document.status}
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

