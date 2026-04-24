import React, { useMemo } from "react";
import type { ScheduleRequestRow, UserRow } from "@kharon/domain";

interface DispatchPlannerCardProps {
  requests: ScheduleRequestRow[];
  technicians: UserRow[];
  setSelectedRequestid: (id: string) => void;
  setConfirmTechid: (id: string) => void;
  onEnterTool: (tool: string) => void;
}

export function DispatchPlannerCard({
  requests,
  technicians,
  setSelectedRequestid,
  setConfirmTechid,
  onEnterTool
}: DispatchPlannerCardProps): React.JSX.Element {

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

  return (
    <article className="workspace-card glass-panel">
      <div className="panel-heading">
        <p className="panel-eyebrow">Planner</p>
        <h2>Workload Assignments</h2>
      </div>

      <div className="control-block">
        <div className="control-block__head">
          <h3>Drag to Assign</h3>
          <p>Drag an incoming request onto a technician to start the booking process.</p>
        </div>
        
        {requests.length === 0 ? (
          <div className="highlight-box empty-state-enhanced mt-4">
            <span className="empty-state__icon">✅</span>
            <h3>Inbox Zero</h3>
            <p className="muted-copy mt-2">There are no pending schedule requests to plan.</p>
          </div>
        ) : (
          <div className="planner-grid mt-4">
            <div className="planner-column">
              <h4 className="column-title">Pending Requests</h4>
              <div className="requests-list">
                {requests.map((request) => {
                  const sla = requestSla.find((item) => item.request_id === request.request_id);
                  return (
                    <div
                      key={request.request_id}
                      className="request-card"
                      draggable
                      onDragStart={(event) => {
                        event.dataTransfer.setData("text/plain", request.request_id);
                        event.currentTarget.classList.add('request-card--dragging');
                      }}
                      onDragEnd={(event) => {
                        event.currentTarget.classList.remove('request-card--dragging');
                      }}
                    >
                      <div className="flex-1">
                        <strong>{request.request_id}</strong>
                        <div className="text-xs text-muted truncate mt-1">Job: {request.job_id}</div>
                      </div>
                      <span className={`status-chip status-chip--${sla?.breached ? "critical" : "warning"}`}>
                        {sla?.text ?? "SLA n/a"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
            
            <div className="planner-column">
              <h4 className="column-title">Field Team</h4>
              <div className="technicians-grid">
                {technicians.map((technician) => (
                  <div
                    key={technician.user_id}
                    className="tech-drop-zone"
                    onDragOver={(event) => {
                      event.preventDefault();
                      event.currentTarget.classList.add('tech-drop-zone--hover');
                    }}
                    onDragLeave={(event) => {
                      event.currentTarget.classList.remove('tech-drop-zone--hover');
                    }}
                    onDrop={(event) => {
                      event.preventDefault();
                      event.currentTarget.classList.remove('tech-drop-zone--hover');
                      const requestid = event.dataTransfer.getData("text/plain");
                      if (requestid) {
                        setSelectedRequestid(requestid);
                        setConfirmTechid(technician.technician_id);
                        onEnterTool("dispatch_booking");
                      }
                    }}
                    onClick={() => {
                       // Fallback for touch
                       setConfirmTechid(technician.technician_id);
                    }}
                  >
                    <div className="tech-avatar">
                      {technician.display_name.charAt(0)}
                    </div>
                    <div className="tech-info">
                      <span className="tech-name truncate">{technician.display_name}</span>
                      <span className="tech-id truncate">{technician.technician_id || "No ID"}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .planner-grid { display: grid; grid-template-columns: 1fr; gap: 2rem; }
        @media (min-width: 1024px) { .planner-grid { grid-template-columns: 1fr 1.5fr; } }
        .column-title { margin: 0 0 1rem 0; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--color-text-muted); }
        .requests-list { display: flex; flex-direction: column; gap: 0.75rem; max-height: 500px; overflow-y: auto; padding-right: 0.5rem; }
        .request-card { display: flex; align-items: center; justify-content: space-between; padding: 1rem; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: var(--radius-md); cursor: grab; transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1); }
        .request-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); border-color: rgba(99, 102, 241, 0.3); background: rgba(99, 102, 241, 0.05); }
        .request-card:active { cursor: grabbing; }
        .request-card--dragging { opacity: 0.4; }
        .technicians-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 1rem; }
        .tech-drop-zone { display: flex; align-items: center; gap: 1rem; padding: 1rem; background: rgba(0,0,0,0.2); border: 2px dashed rgba(255,255,255,0.1); border-radius: var(--radius-lg); transition: all 0.2s ease; cursor: pointer; }
        .tech-drop-zone--hover { border-color: var(--color-primary); background: rgba(99, 102, 241, 0.15); transform: scale(1.02); }
        .tech-avatar { width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg, var(--color-primary), var(--color-secondary)); display: flex; align-items: center; justify-content: center; font-weight: bold; color: white; }
        .tech-info { display: flex; flex-direction: column; overflow: hidden; }
        .tech-name { font-weight: 600; font-size: 0.9rem; color: white; }
        .tech-id { font-size: 0.7rem; color: var(--color-text-muted); }
        .mt-4 { margin-top: 1rem; }
        .mt-1 { margin-top: 0.25rem; }
        .flex-1 { flex: 1; min-width: 0; }
        .text-xs { font-size: 0.75rem; }
        .text-muted { color: var(--color-text-muted); }
        .truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      `}</style>
    </article>
  );
}