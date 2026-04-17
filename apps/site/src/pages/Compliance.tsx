import React from "react";
import { Helmet } from "react-helmet-async";
import { CtaSection } from "../components/CtaSection";
import { compliancePillars, standards } from "../constants/siteData";

const documentationStreams = [
  "Inspection and maintenance logs",
  "Service certificates and test records",
  "As-built and O and M handover sets",
  "Defect and remediation trackers",
  "Audit-readiness summaries for stakeholders"
];

const controlNotes = [
  {
    title: "Standards baseline",
    detail:
      "Relevant SANS provide the engineering baseline. The required evidence set can expand where permits, leases, insurers, tenders, or client policies impose additional obligations."
  },
  {
    title: "Security service regulation",
    detail:
      "Where regulated private-security services are in scope, clients should verify current PSiRA registration and good standing for the provider and deployed personnel before appointment."
  },
  {
    title: "Personal information handling",
    detail:
      "Operational records that contain personal information should be governed with role-based access, retention rules, and breach-escalation procedures aligned to POPIA responsibilities."
  }
];

export function CompliancePage(): React.JSX.Element {
  return (
    <>
      <Helmet>
        <title>Compliance and Documentation | Kharon</title>
        <meta
          name="description"
          content="Standards alignment, audit-ready documentation, and evidence-led closeout designed for insurers, auditors, and operational teams."
        />
      </Helmet>

      <section className="site-section site-section--split">
        <div className="section-heading">
          <p className="section-kicker">Compliance and documentation</p>
          <h2>Execution that remains auditable long after the site visit.</h2>
          <p className="section-subtitle">
            Kharon combines engineering delivery with documentation discipline so inspection cycles, insurer reviews, and
            client governance checks can be supported by a clear evidence trail.
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
              <h3>Documentation streams</h3>
            </div>
            <ul className="service-list">
              {documentationStreams.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>

          <aside className="assurance-panel">
            <h3>Control position</h3>
            <div className="assurance-list">
              {controlNotes.map((note) => (
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
          <p className="section-kicker">Reference baseline</p>
          <h2>Common standards referenced across delivery planning and closeout.</h2>
        </div>
        <div className="assurance-list">
          <article className="assurance-list__item">
            <span>Relevant SANS</span>
            <p>{standards.join(", ")}</p>
          </article>
        </div>
      </section>

      <CtaSection />
    </>
  );
}
