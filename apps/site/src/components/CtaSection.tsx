import React from "react";
import { Link } from "react-router-dom";

export function CtaSection(): React.JSX.Element {
  return (
    <section className="site-section cta-section">
      <div className="cta-panel">
        <div className="cta-panel__copy">
          <p className="section-kicker">Next Step</p>
          <h2>Engage Kharon for engineering, maintenance, or urgent response.</h2>
          <p>
            Choose your intent: project scoping, planned maintenance, urgent break-fix response, or returning-client portal
            access.
          </p>
        </div>
        <div className="cta-panel__actions">
          <Link className="site-button site-button--primary" to="/contact">
            Request site assessment
          </Link>
          <a className="site-button site-button--secondary" href="/portal/">
            Portal login
          </a>
        </div>
      </div>
    </section>
  );
}
