import React from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { CtaSection } from "../components/CtaSection";
import { compliancePillars, standards } from "../constants/siteData";

const documentationStreams = [
  "Service reports and attendance records",
  "Certificates and test results",
  "As-built notes and handover packs",
  "Defect and remedial action trackers",
  "Simple summaries for management review"
];

const supportNotes = [
  {
    title: "What we provide",
    detail: "We help clients keep the records that matter in one place so the next audit or handover is easier."
  },
  {
    title: "Why it matters",
    detail: "Good records reduce delays, support insurer and auditor questions, and make follow-up work clearer."
  },
  {
    title: "Standards support",
    detail: "Relevant SANS remain visible, but the page stays focused on what the client needs to do next."
  }
];

export function CompliancePage(): React.JSX.Element {
  return (
    <>
      <Helmet>
        <title>Documentation and Compliance Support | Kharon</title>
        <meta
          name="description"
          content="Service records, certificates, maintenance logs, handover packs, and compliance support for fire and security systems."
        />
      </Helmet>

      <section className="site-section site-section--split">
        <div className="section-heading">
          <p className="section-kicker">Documentation</p>
          <h2>Documentation support.</h2>
          <p className="section-subtitle">
            This page provides context on the service records and certificates we help our clients maintain. 
            We ensure your documentation is accurate, organised, and ready for your next audit.
          </p>
        </div>
        <div className="operations-board detail-grid">
          {compliancePillars.map((pillar) => (
            <article key={pillar.title} className="assurance-list__item">
              <span>{pillar.title}</span>
              <p>{pillar.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="site-section">
        <div className="operations-board detail-grid">
          <article className="operations-flow">
            <div className="operations-flow__header">
              <h3>What documentation we provide</h3>
            </div>
            <ul className="service-list">
              {documentationStreams.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>

          <aside className="assurance-panel">
            <h3>Why it matters</h3>
            <div className="assurance-list">
              {supportNotes.map((note) => (
                <article key={note.title} className="assurance-list__item">
                  <span>{note.title}</span>
                  <p>{note.detail}</p>
                </article>
              ))}
            </div>
          </aside>
        </div>
      </section>

      <section className="site-section">
        <div className="section-heading">
          <p className="section-kicker">Standards</p>
          <h2>Standards we commonly work against.</h2>
        </div>
        <div className="assurance-list">
          <article className="assurance-list__item">
            <span>Relevant SANS</span>
            <p>{standards.join(", ")}</p>
          </article>
        </div>
      </section>

      <section className="site-section">
        <div className="cta-panel">
          <div className="cta-panel__copy">
            <p className="section-kicker">How to request support</p>
            <h2>Send us the site, the system, and the document set you need.</h2>
            <p>We will route the request to the right team and keep the follow-up clear.</p>
          </div>
          <div className="cta-panel__actions">
            <Link className="site-button site-button--primary" to="/contact?intent=compliance">
              Request Documentation
            </Link>
            <Link className="site-button site-button--secondary" to="/resources">
              View Guides
            </Link>
          </div>
        </div>
      </section>

      <CtaSection />
    </>
  );
}
