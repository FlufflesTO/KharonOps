import React from "react";

export function CtaSection() {
  return (
    <section className="site-section cta-section">
      <div className="cta-panel">
        <div className="cta-panel__copy">
          <p className="section-kicker">Next Engagement</p>
          <h2>Authorize a command audit of your security posture.</h2>
          <p>
            Align your site documentation with SANS requirements via the Kharon Command Centre. 
            Move from fragmented reporting to a single, integrated evidence trail.
          </p>
        </div>
        <div className="cta-panel__actions">
          <a className="site-button site-button--primary" href="mailto:admin@kharon.co.za?subject=Command%20Centre%20Enquiry">
            Request Service Partnership
          </a>
          <a className="site-button site-button--secondary" href="/portal/">
            Access Command Centre
          </a>
        </div>
      </div>
    </section>
  );
}
