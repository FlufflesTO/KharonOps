import React from "react";
import { Link } from "react-router-dom";

export function CtaSection(): React.JSX.Element {
  return (
    <section className="site-section cta-section">
      <div className="cta-panel">
        <div className="cta-panel__copy">
          <p className="section-kicker">Next step</p>
          <h2>Tell us what you need.</h2>
          <p>Request a quote, book maintenance, or ask for urgent help and we will direct it to the right team.</p>
        </div>
        <div className="cta-panel__actions">
          <Link className="site-button site-button--primary" to="/contact?intent=project">
            Request a Quote
          </Link>
          <Link className="site-button site-button--secondary" to="/contact?intent=maintenance">
            Book Maintenance
          </Link>
          <Link className="site-button site-button--secondary" to="/contact?intent=urgent_callout">
            Emergency Callout
          </Link>
        </div>
      </div>
    </section>
  );
}
