import React from "react";

export function TechHelpCard(): React.JSX.Element {
  return (
    <article className="workspace-card">
      <div className="panel-heading">
        <p className="panel-eyebrow">Support</p>
        <h2>Field Assistance</h2>
      </div>

      <div className="control-stack">
        <section className="control-block">
          <div className="control-block__head">
            <h3>Office Contact</h3>
            <p>Direct lines for dispatch and technical support.</p>
          </div>
          <div className="summary-grid">
            <div className="summary-card">
              <span className="summary-card__label">Dispatch</span>
              <strong>011 123 4567</strong>
              <small>Scheduling & Assignments</small>
            </div>
            <div className="summary-card">
              <span className="summary-card__label">Technical</span>
              <strong>011 123 4568</strong>
              <small>System & Coding Help</small>
            </div>
          </div>
        </section>

        <section className="control-block">
          <div className="control-block__head">
            <h3>Quick Guides</h3>
            <p>Simple instructions for common portal tasks.</p>
          </div>
          <div className="fact-list">
            <details className="telemetry-card">
              <summary>How to check in?</summary>
              <div className="mt-2 text-sm text-muted">
                Select your job in "My Day", verify your location by clicking "Capture Location", then press the large "Check In" button.
              </div>
            </details>
            <details className="telemetry-card mt-2">
              <summary>How to submit a report?</summary>
              <div className="mt-2 text-sm text-muted">
                Go to the "Reports" section, choose the report type (e.g. Jobcard), fill in the checklist, and press "Generate".
              </div>
            </details>
          </div>
        </section>
      </div>

      <style>{`
        .mt-2 { margin-top: 0.5rem; }
        .text-sm { font-size: 0.85rem; }
        .text-muted { color: var(--color-text-muted); }
      `}</style>
    </article>
  );
}
