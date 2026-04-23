import React from "react";

export function ClientSupportCard(): React.JSX.Element {
  return (
    <article className="workspace-card">
      <div className="panel-heading">
        <p className="panel-eyebrow">Assistance</p>
        <h2>Customer Support</h2>
      </div>

      <div className="control-stack">
        <section className="control-block">
          <div className="control-block__head">
            <h3>Contact Our Team</h3>
            <p>We're here to help with your fire safety systems and service requests.</p>
          </div>
          <div className="summary-grid">
            <div className="summary-card">
              <span className="summary-card__label">Phone</span>
              <strong>011 123 4567</strong>
              <small>Office Hours (08:00 - 17:00)</small>
            </div>
            <div className="summary-card">
              <span className="summary-card__label">Email</span>
              <strong>support@kharon.co.za</strong>
              <small>Standard Support Requests</small>
            </div>
          </div>
        </section>

        <section className="control-block">
          <div className="control-block__head">
            <h3>Request a Callback</h3>
            <p>Need someone to call you back about a specific job or invoice?</p>
          </div>
          <div className="form-grid">
            <label className="field-stack field-stack--full">
              <span>Message</span>
              <textarea placeholder="Tell us how we can help..." />
            </label>
            <div className="flex-end">
              <button className="button button--primary">Send Request</button>
            </div>
          </div>
        </section>
      </div>

      <style>{`
        .flex-end { display: flex; justify-content: flex-end; width: 100%; margin-top: 1rem; }
      `}</style>
    </article>
  );
}
