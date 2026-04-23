import React from "react";
import { type JobRecord } from "./JobListView";
import type { JobStatus } from "@kharon/domain";

interface TechCheckInOutCardProps {
  selectedJob: JobRecord | null;
  onUpdateStatus: (status: JobStatus) => void;
  onVerifyLocation: () => void;
  geoStatus: "idle" | "verified" | "warning" | "error";
}

export function TechCheckInOutCard({ selectedJob, onUpdateStatus, onVerifyLocation, geoStatus }: TechCheckInOutCardProps): React.JSX.Element {
  if (!selectedJob) {
    return (
      <article className="workspace-card">
        <div className="panel-heading">
          <p className="panel-eyebrow">Check In / Out</p>
          <h2>No job selected</h2>
        </div>
        <div className="highlight-box">
          <p>Please select a job from "My Day" or the "Jobs" list before checking in.</p>
        </div>
      </article>
    );
  }

  const isCheckedIn = selectedJob.status === "performed";

  return (
    <article className="workspace-card">
      <div className="panel-heading">
        <p className="panel-eyebrow">Field Activity</p>
        <h2>{isCheckedIn ? "Finish Job" : "Arrive at Site"}</h2>
      </div>

      <div className="control-stack">
        <section className="highlight-box border-active">
          <span className="highlight-box__label">Active Selection</span>
          <h3>{selectedJob.job_id} | {selectedJob.client_name}</h3>
          <p className="mt-2">{selectedJob.site_id}</p>
        </section>

        {!isCheckedIn ? (
          <section className="control-block">
            <div className="control-block__head">
              <h3>1. Verify Location</h3>
              <p>Capture your coordinates to confirm site arrival.</p>
            </div>
            <div className="button-row">
              <button 
                className={`button ${geoStatus === "verified" ? "button--primary" : "button--secondary"}`}
                onClick={onVerifyLocation}
              >
                {geoStatus === "verified" ? "Location Verified" : "Capture Location"}
              </button>
              {geoStatus === "verified" && <span className="status-chip status-chip--active">OK</span>}
            </div>
            
            <div className="mt-8">
              <h3>2. Start Work</h3>
              <p>Signal to dispatch that you are starting the task.</p>
              <button 
                className="button button--primary button--large mt-2"
                disabled={geoStatus !== "verified" && geoStatus !== "warning"}
                onClick={() => onUpdateStatus("performed")}
              >
                Check In
              </button>
            </div>
          </section>
        ) : (
          <section className="control-block">
            <div className="control-block__head">
              <h3>Finish & Sign Out</h3>
              <p>Ensure all work is completed and safety systems are reinstated before leaving.</p>
            </div>
            <div className="fact-list">
              <label className="toggle-inline">
                <input type="checkbox" /> Work completed to standard
              </label>
              <label className="toggle-inline">
                <input type="checkbox" /> Safety systems reinstated
              </label>
              <label className="toggle-inline">
                <input type="checkbox" /> Site cleared of debris
              </label>
            </div>
            <button 
              className="button button--primary button--large mt-6"
              onClick={() => onUpdateStatus("certified")}
            >
              Sign Out & Complete
            </button>
          </section>
        )}
      </div>

      <style>{`
        .mt-2 { margin-top: 0.5rem; }
        .mt-6 { margin-top: 1.5rem; }
        .mt-8 { margin-top: 2rem; }
        .border-active { border-left: 4px solid var(--color-positive); }
        .button--large { padding: 1rem 2rem; font-size: 1.1rem; width: 100%; }
      `}</style>
    </article>
  );
}
