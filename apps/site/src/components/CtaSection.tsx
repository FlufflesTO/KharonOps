import React from "react";
import { Link } from "react-router-dom";

export function CtaSection(): React.JSX.Element {
  return (
    <section className="site-section cta-section">
      <div className="cta-panel">
        <div className="cta-panel__copy">
          <p className="section-kicker">Next Step</p>
          <h2>Route the request to the right commercial and operational track.</h2>
          <p>
            Submit a scoped project enquiry, planned maintenance request, urgent callout, or resource request without
            relying on unstructured email.
          </p>
        </div>
        <div className="cta-panel__actions">
          <Link className="site-button site-button--primary" to="/contact?intent=project">
            Request site assessment
          </Link>
          <Link className="site-button site-button--secondary" to="/contact?intent=urgent_callout">
            Emergency callout
          </Link>
          <a className="site-button site-button--secondary" href="/portal/">
            Portal login
          </a>
        </div>
      </div>
    </section>
  );
}
