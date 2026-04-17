import React from "react";
import { apiClient } from "../apiClient";

interface ScheduleControlCardProps {
  selectedJobUid: string;
  selectedJobRowVersion: number;
  preferredStart: string;
  setPreferredStart: (value: string) => void;
  preferredEnd: string;
  setPreferredEnd: (value: string) => void;
  confirmRequestUid: string;
  setConfirmRequestUid: (uid: string) => void;
  confirmStart: string;
  setConfirmStart: (value: string) => void;
  confirmEnd: string;
  setConfirmEnd: (value: string) => void;
  confirmTechUid: string;
  setConfirmTechUid: (uid: string) => void;
  confirmRowVersion: number;
  setConfirmRowVersion: (v: number) => void;
  rescheduleUid: string;
  setRescheduleUid: (uid: string) => void;
  rescheduleStart: string;
  setRescheduleStart: (value: string) => void;
  rescheduleEnd: string;
  setRescheduleEnd: (value: string) => void;
  rescheduleRowVersion: number;
  setRescheduleRowVersion: (v: number) => void;
  publishDocumentUid: string;
  setPublishDocumentUid: (uid: string) => void;
  publishRowVersion: number;
  setPublishRowVersion: (v: number) => void;
  documentType: "jobcard" | "service_report" | "certificate";
  onScheduleRequest: () => void;
  onScheduleConfirm: () => void;
  onReschedule: () => void;
  onDocumentPublish: () => void;
  onFeedback: (msg: string) => void;
}



export function ScheduleControlCard({
  selectedJobUid: _selectedJobUid,
  selectedJobRowVersion: _selectedJobRowVersion,
  preferredStart,
  setPreferredStart,
  preferredEnd,
  setPreferredEnd,
  confirmRequestUid,
  setConfirmRequestUid,
  confirmStart,
  setConfirmStart,
  confirmEnd,
  setConfirmEnd,
  confirmTechUid,
  setConfirmTechUid,
  confirmRowVersion,
  setConfirmRowVersion,
  rescheduleUid,
  setRescheduleUid,
  rescheduleStart,
  setRescheduleStart,
  rescheduleEnd,
  setRescheduleEnd,
  rescheduleRowVersion,
  setRescheduleRowVersion,
  onScheduleRequest,
  onScheduleConfirm,
  onReschedule,
  onFeedback: _onFeedback,
}: ScheduleControlCardProps): React.JSX.Element {
  return (
    <article className="workspace-card">
      <div className="panel-heading">
        <p className="panel-eyebrow">Dispatch</p>
        <h2>Schedule control</h2>
      </div>

      {/* Request Slot */}
      <div className="control-block">
        <div className="control-block__head">
          <h3>Preferred slot request</h3>
        </div>
        <div className="form-grid form-grid--three">
          <label className="field-stack">
            <span>Preferred start</span>
            <input
              name="preferred_start"
              type="datetime-local"
              value={preferredStart}
              onChange={(event) => setPreferredStart(event.target.value)}
            />
          </label>
          <label className="field-stack">
            <span>Preferred end</span>
            <input
              name="preferred_end"
              type="datetime-local"
              value={preferredEnd}
              onChange={(event) => setPreferredEnd(event.target.value)}
            />
          </label>
          <div className="field-stack field-stack--action">
            <span>&nbsp;</span>
            <button className="button button--primary" onClick={onScheduleRequest}>
              Submit request
            </button>
          </div>
        </div>
      </div>

      {/* Confirm Request */}
      <div className="control-block">
        <div className="control-block__head">
          <h3>Confirm request</h3>
        </div>
        <div className="form-grid">
          <label className="field-stack">
            <span>Request UID</span>
            <input
              name="confirm_request_uid"
              value={confirmRequestUid}
              onChange={(event) => setConfirmRequestUid(event.target.value)}
              placeholder="request_uid"
            />
          </label>
          <label className="field-stack">
            <span>Technician UID</span>
            <input
              name="confirm_technician_uid"
              value={confirmTechUid}
              onChange={(event) => setConfirmTechUid(event.target.value)}
              placeholder="technician_uid"
            />
          </label>
          <label className="field-stack">
            <span>Start</span>
            <input
              name="confirm_start"
              type="datetime-local"
              value={confirmStart}
              onChange={(event) => setConfirmStart(event.target.value)}
            />
          </label>
          <label className="field-stack">
            <span>End</span>
            <input
              name="confirm_end"
              type="datetime-local"
              value={confirmEnd}
              onChange={(event) => setConfirmEnd(event.target.value)}
            />
          </label>
          <label className="field-stack">
            <span>Row version</span>
            <input
              name="confirm_row_version"
              type="number"
              value={confirmRowVersion}
              onChange={(event) => setConfirmRowVersion(Number(event.target.value))}
              placeholder="row_version"
            />
          </label>
          <div className="field-stack field-stack--action">
            <span>&nbsp;</span>
            <button className="button button--primary" onClick={onScheduleConfirm}>
              Confirm
            </button>
          </div>
        </div>
      </div>

      {/* Reschedule */}
      <div className="control-block">
        <div className="control-block__head">
          <h3>Reschedule</h3>
        </div>
        <div className="form-grid">
          <label className="field-stack">
            <span>Schedule UID</span>
            <input
              name="reschedule_uid"
              value={rescheduleUid}
              onChange={(event) => setRescheduleUid(event.target.value)}
              placeholder="schedule_uid"
            />
          </label>
          <label className="field-stack">
            <span>Row version</span>
            <input
              name="reschedule_row_version"
              type="number"
              value={rescheduleRowVersion}
              onChange={(event) => setRescheduleRowVersion(Number(event.target.value))}
              placeholder="row_version"
            />
          </label>
          <label className="field-stack">
            <span>New start</span>
            <input
              name="reschedule_start"
              type="datetime-local"
              value={rescheduleStart}
              onChange={(event) => setRescheduleStart(event.target.value)}
            />
          </label>
          <label className="field-stack">
            <span>New end</span>
            <input
              name="reschedule_end"
              type="datetime-local"
              value={rescheduleEnd}
              onChange={(event) => setRescheduleEnd(event.target.value)}
            />
          </label>
          <div className="field-stack field-stack--action">
            <span>&nbsp;</span>
            <button className="button button--secondary" onClick={onReschedule}>
              Reschedule
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
