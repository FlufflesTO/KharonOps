import React, { useState } from "react";
import type { ScheduleRequestRow, UserRow } from "@kharon/domain";

interface DispatchBookingCardProps {
  selectedJobid: string;
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
  onScheduleConfirm: () => void;
}

function parseRequestedSlot(request: ScheduleRequestRow | null): string {
  if (!request) return "Select a request to view details.";
  try {
    const parsed = JSON.parse(request.preferred_slots_json) as Array<{ start_at?: string; end_at?: string }>;
    const first = parsed[0];
    if (!first?.start_at || !first?.end_at) return request.notes || "No preferred slot detail captured.";
    return `${first.start_at} to ${first.end_at} (${request.timezone})`;
  } catch {
    return request.notes || "Unable to parse slot details.";
  }
}

export function DispatchBookingCard({
  selectedJobid,
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
  onScheduleConfirm
}: DispatchBookingCardProps): React.JSX.Element {
  const [isConfirming, setIsConfirming] = useState(false);
  const disableActions = selectedJobid === "";
  const selectedRequest = requests.find((r) => r.request_id === selectedRequestid) ?? null;

  return (
    <article className="workspace-card glass-panel">
      <div className="panel-heading">
        <p className="panel-eyebrow">Booking Desk</p>
        <h2>Confirm Appointments</h2>
      </div>

      <div className="control-block interaction-panel">
        <div className="control-block__head">
          <h3>Finalize Booking</h3>
          <p>Review the details and dispatch the technician.</p>
        </div>

        {disableActions ? (
          <div className="highlight-box">
            <p>Please select a job from the list to manage its bookings.</p>
          </div>
        ) : requests.length === 0 ? (
          <p className="muted-copy">No schedule requests exist for this job.</p>
        ) : (
          <div className="form-grid mt-4">
            <label className="field-stack">
              <span>Request</span>
              <div className="combo-input">
                <select value={selectedRequestid} onChange={(e) => setSelectedRequestid(e.target.value)} className="enhanced-select">
                  <option value="">Select a request...</option>
                  {requests.map((request) => (
                    <option key={request.request_id} value={request.request_id}>{request.request_id}</option>
                  ))}
                </select>
              </div>
            </label>

            <label className="field-stack">
              <span>Technician</span>
              <div className="combo-input">
                <select value={confirmTechid} onChange={(e) => setConfirmTechid(e.target.value)} className="enhanced-select">
                  <option value="">Select a technician...</option>
                  {technicians.map((technician) => (
                    <option key={technician.user_id} value={technician.technician_id}>{technician.display_name}</option>
                  ))}
                </select>
              </div>
            </label>

            <label className="field-stack">
              <span>Start Time</span>
              <input type="datetime-local" value={confirmStart} onChange={(e) => setConfirmStart(e.target.value)} className="enhanced-input" />
            </label>

            <label className="field-stack">
              <span>End Time</span>
              <input type="datetime-local" value={confirmEnd} onChange={(e) => setConfirmEnd(e.target.value)} className="enhanced-input" />
            </label>

            <div className="field-stack field-stack--full">
              <span>Client Preference</span>
              <div className="info-readout">{parseRequestedSlot(selectedRequest)}</div>
            </div>

            <div className="field-stack field-stack--full flex justify-end mt-4">
                <button 
                  className={`button button--large ${isConfirming ? "button--loading" : "button--primary"}`} 
                  type="button" 
                  onClick={() => {
                    setIsConfirming(true);
                    setTimeout(() => {
                      onScheduleConfirm();
                      setIsConfirming(false);
                    }, 600);
                  }} 
                  disabled={!selectedRequestid || !confirmTechid || !confirmStart || !confirmEnd}
                >
                  {isConfirming ? "Dispatching..." : "Confirm & Dispatch"}
                </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .interaction-panel { background: rgba(255,255,255,0.02); padding: var(--space-6); border-radius: var(--radius-lg); border: 1px solid rgba(255,255,255,0.05); }
        .enhanced-select, .enhanced-input { width: 100%; padding: 0.875rem 1rem; background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.15); border-radius: var(--radius-md); color: white; font-size: 0.95rem; transition: border-color 0.2s; }
        .enhanced-select:focus, .enhanced-input:focus { outline: none; border-color: var(--color-primary); box-shadow: 0 0 0 3px rgba(99,102,241,0.2); }
        .info-readout { padding: 1rem; background: rgba(99,102,241,0.05); border-left: 3px solid var(--color-primary); border-radius: 0 var(--radius-md) var(--radius-md) 0; color: #cbd5e1; font-size: 0.9rem; }
        .button--large { padding: 1rem 2.5rem; font-size: 1.1rem; font-weight: 600; }
        .button--loading { opacity: 0.8; cursor: wait; }
        .mt-4 { margin-top: 1rem; }
        .flex { display: flex; }
        .justify-end { justify-content: flex-end; }
      `}</style>
    </article>
  );
}