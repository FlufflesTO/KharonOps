import React, { useState } from "react";
import { type JobRecord } from "./JobListView";
import type { JobStatus } from "@kharon/domain";

interface TechCertifyCardProps {
  selectedJob: JobRecord | null;
  onUpdateStatus: (status: JobStatus) => void;
}

export function TechCertifyCard({ selectedJob, onUpdateStatus }: TechCertifyCardProps): React.JSX.Element {
  const [completed, setCompleted] = useState(false);
  const [safety, setSafety] = useState(false);
  const [cleared, setCleared] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);

  if (!selectedJob) {
    return (
      <article className="workspace-card glass-panel">
        <div className="panel-heading">
          <p className="panel-eyebrow">Completion</p>
          <h2>No job selected</h2>
        </div>
      </article>
    );
  }

  const isCheckedIn = selectedJob.status === "performed";
  const isFinished = selectedJob.status === "certified";

  const canCertify = completed && safety && cleared;

  return (
    <article className="workspace-card glass-panel">
      <div className="panel-heading">
        <p className="panel-eyebrow">Field Activity</p>
        <h2>Finish & Sign Out</h2>
      </div>

      <div className="control-stack">
        <section className="highlight-box border-active">
          <span className="highlight-box__label">Active Selection</span>
          <h3>{selectedJob.job_id} | {selectedJob.client_name}</h3>
        </section>

        {!isCheckedIn && !isFinished ? (
          <div className="highlight-box empty-state-enhanced">
            <span className="empty-state__icon">⚠️</span>
            <p className="mt-2">You must start the job (Check In) before you can certify it.</p>
          </div>
        ) : isFinished ? (
          <section className="control-block">
            <div className="success-celebration__content bg-positive-subtle border-positive rounded-lg p-6 text-center">
              <span className="text-4xl block mb-2">🏆</span>
              <h3>Job Certified!</h3>
              <p className="mt-2 text-positive">Work is complete and recorded.</p>
            </div>
          </section>
        ) : (
          <section className="control-block interaction-panel">
            <div className="control-block__head mb-4">
              <h3>Mandatory Checklist</h3>
              <p>Ensure all work is completed and safety systems are reinstated before leaving.</p>
            </div>
            <div className="fact-list flex flex-col gap-3">
              <label className={`toggle-box ${completed ? "toggle-box--active" : ""}`}>
                <input type="checkbox" checked={completed} onChange={(e) => setCompleted(e.target.checked)} />
                <span>Work completed to standard</span>
              </label>
              <label className={`toggle-box ${safety ? "toggle-box--active" : ""}`}>
                <input type="checkbox" checked={safety} onChange={(e) => setSafety(e.target.checked)} />
                <span>Safety systems reinstated</span>
              </label>
              <label className={`toggle-box ${cleared ? "toggle-box--active" : ""}`}>
                <input type="checkbox" checked={cleared} onChange={(e) => setCleared(e.target.checked)} />
                <span>Site cleared of debris</span>
              </label>
            </div>
            <button 
              className={`button button--large mt-6 ${isFinishing ? "button--loading" : "button--primary"}`}
              disabled={!canCertify}
              onClick={() => {
                setIsFinishing(true);
                setTimeout(() => onUpdateStatus("certified"), 800);
              }}
            >
              {isFinishing ? "Signing out..." : "Sign Out & Complete"}
            </button>
          </section>
        )}
      </div>

      <style>{`
        .mt-2 { margin-top: 0.5rem; }
        .mt-6 { margin-top: 1.5rem; }
        .mb-2 { margin-bottom: 0.5rem; }
        .mb-4 { margin-bottom: 1rem; }
        .gap-3 { gap: 0.75rem; }
        .flex { display: flex; }
        .flex-col { flex-direction: column; }
        .border-active { border-left: 4px solid var(--color-positive); }
        .button--large { padding: 1.25rem 2rem; font-size: 1.15rem; width: 100%; border-radius: var(--radius-lg); font-weight: 600; transition: all var(--transition-fast); }
        .button--loading { opacity: 0.8; cursor: wait; }
        .bg-positive-subtle { background: rgba(16, 185, 129, 0.1); }
        .border-positive { border: 1px solid rgba(16, 185, 129, 0.3); }
        .rounded-lg { border-radius: var(--radius-lg); }
        .p-6 { padding: 1.5rem; }
        .text-center { text-align: center; }
        .text-4xl { font-size: 2.25rem; }
        .text-positive { color: var(--color-positive); }
        .interaction-panel { background: rgba(255,255,255,0.02); padding: var(--space-6); border-radius: var(--radius-lg); border: 1px solid rgba(255,255,255,0.05); }
        .toggle-box { display: flex; align-items: center; gap: 1rem; padding: 1rem; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1); border-radius: var(--radius-md); cursor: pointer; transition: all 0.2s; font-size: 1.05rem; }
        .toggle-box:hover { background: rgba(255,255,255,0.05); }
        .toggle-box--active { border-color: var(--color-primary); background: rgba(99, 102, 241, 0.1); }
        .toggle-box input[type="checkbox"] { width: 1.5rem; height: 1.5rem; accent-color: var(--color-primary); }
      `}</style>
    </article>
  );
}