import React from "react";
import { Helmet } from "react-helmet-async";
import { CtaSection } from "../components/CtaSection";
import { companyProfile } from "../constants/siteData";

const enquiryTypes = [
  "New project enquiry",
  "Maintenance contract enquiry",
  "Urgent callout or break-fix",
  "Compliance or documentation request"
];

export function ContactPage(): React.JSX.Element {
  return (
    <>
      <Helmet>
        <title>Contact | Kharon Fire and Security</title>
        <meta
          name="description"
          content="Contact Kharon for project engineering, maintenance contracts, urgent callouts, and compliance documentation support."
        />
      </Helmet>

      <section className="site-section">
        <div className="section-heading">
          <p className="section-kicker">Contact and callout</p>
          <h2>Route your request to the right delivery track.</h2>
        </div>
        <div className="operations-board detail-grid">
          <article className="operations-flow">
            <div className="operations-flow__header">
              <h3>Request pathways</h3>
            </div>
            <p className="section-subtitle">
              Email the operations team with your site location, urgency, and required outcome. Kharon separates project,
              maintenance, and emergency response flows to accelerate triage.
            </p>
            <ul className="service-list">
              {enquiryTypes.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <div className="detail-actions">
              <a className="site-button site-button--primary" href="mailto:admin@kharon.co.za?subject=Site%20Assessment%20Request">
                Email operations
              </a>
              <a className="site-button site-button--secondary" href="tel:+27615458830">
                Call emergency line
              </a>
            </div>
          </article>

          <aside className="assurance-panel">
            <h3>Operational details</h3>
            <div className="assurance-list">
              <article className="assurance-list__item">
                <span>Address</span>
                <p>{companyProfile.address}</p>
              </article>
              <article className="assurance-list__item">
                <span>Contact</span>
                <p>
                  T: {companyProfile.phone}
                  <br />
                  E: {companyProfile.email}
                </p>
              </article>
              <article className="assurance-list__item">
                <span>Coverage and hours</span>
                <p>
                  {companyProfile.serviceFootprint.join(", ")}
                  <br />
                  {companyProfile.officeHours}
                </p>
              </article>
            </div>
          </aside>
        </div>
      </section>

      <CtaSection />
    </>
  );
}
