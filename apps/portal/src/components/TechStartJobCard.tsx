import React, { useState } from "react";
import { type JobRecord } from "./JobListView";
import type { JobStatus } from "@kharon/domain";

interface TechStartJobCardProps {
  selectedJob: JobRecord | null;
  onUpdateStatus: (status: JobStatus) => void;
  onVerifyLocation: () => void;
  geoStatus: "idle" | "verified" | "warning" | "error";
}

export function TechStartJobCard({ selectedJob, onUpdateStatus, onVerifyLocation, geoStatus }: TechStartJobCardProps): React.JSX.Element {
  const [isStarting, setIsStarting] = useState(false);

  if (!selectedJob) {
    return (
      <article className="workspace-card glass-panel">
        <div className="panel-heading">
          <p className="panel-eyebrow">Arrival</p>
          <h2>No job selected</h2>
        </div>
        <div className="highlight-box empty-state-enhanced">
          <span className="empty-state__icon">📍</span>
          <h3>Select a Job</h3>
          <p className="muted-copy mt-2">Please select a job from "My Day" or the "Jobs" list before checking in.</p>
        </div>
      </article>
    );
  }

  const isCheckedIn = selectedJob.status === "performed" || selectedJob.status === "certified";

  return (
    <article className="workspace-card glass-panel">
      <div className="panel-heading">
        <p className="panel-eyebrow">Field Activity</p>
        <h2>Arrive at Site</h2>
      </div>

      <div className="control-stack">
        <section className="highlight-box border-active">
          <span className="highlight-box__label">Active Job</span>
          <h3>{selectedJob.job_id} | {selectedJob.client_name}</h3>
          <p className="mt-2">{selectedJob.site_id}</p>
        </section>

        {!isCheckedIn ? (
          <section className="control-block interaction-panel">
            <div className="control-block__head">
              <h3>Verify & Start</h3>
              <p>Confirm your arrival and signal to dispatch that you are beginning work.</p>
            </div>
            <div className="flex flex-col gap-4 mt-4">
              <div className="button-row">
                <button 
                  className={`button button--large ${geoStatus === "verified" ? "button--positive" : "button--secondary"}`}
                  onClick={onVerifyLocation}
                >
                  {geoStatus === "verified" ? "✓ Location Verified" : "📍 Capture Location"}
                </button>
              </div>
              
              <button 
                className={`button button--large mt-4 ${isStarting ? "button--loading" : "button--primary"}`}
                disabled={geoStatus !== "verified" && geoStatus !== "warning"}
                onClick={() => {
                  setIsStarting(true);
                  setTimeout(() => onUpdateStatus("performed"), 600);
                }}
              >
                {isStarting ? "Checking in..." : "Start Work"}
              </button>
            </div>
          </section>
        ) : (
          <section className="control-block">
            <div className="success-celebration__content bg-positive-subtle border-positive rounded-lg p-6 text-center">
              <span className="text-4xl block mb-2">✅</span>
              <h3>You are checked in!</h3>
              <p className="mt-2 text-positive">Proceed to "Certify Job" when finished.</p>
            </div>
          </section>
        )}
      </div>

      <style>{`
        .mt-2 { margin-top: 0.5rem; }
        .mt-4 { margin-top: 1rem; }
        .gap-4 { gap: 1rem; }
        .flex { display: flex; }
        .flex-col { flex-direction: column; }
        .border-active { border-left: 4px solid var(--color-positive); }
        .button--large { padding: 1.25rem 2rem; font-size: 1.15rem; width: 100%; border-radius: var(--radius-lg); font-weight: 600; transition: all var(--transition-fast); }
        .button--positive { background-color: var(--color-positive); color: white; border-color: var(--color-positive); }
        .button--loading { opacity: 0.8; cursor: wait; }
        .bg-positive-subtle { background: rgba(16, 185, 129, 0.1); }
        .border-positive { border: 1px solid rgba(16, 185, 129, 0.3); }
        .rounded-lg { border-radius: var(--radius-lg); }
        .p-6 { padding: 1.5rem; }
        .text-center { text-align: center; }
        .text-4xl { font-size: 2.25rem; }
        .mb-2 { margin-bottom: 0.5rem; }
        .text-positive { color: var(--color-positive); }
        .interaction-panel { background: rgba(255,255,255,0.02); padding: var(--space-6); border-radius: var(--radius-lg); border: 1px solid rgba(255,255,255,0.05); }
      `}</style>
    </article>
  );
}