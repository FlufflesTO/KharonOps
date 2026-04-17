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
          <h2>Flagship differentiator: execution that remains auditable months later.</h2>
          <p className="section-subtitle">
            Kharon combines engineering delivery with documentation discipline so inspection cycles are supported by complete
            and structured evidence packs.
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
            <h3>Standards baseline</h3>
            <ul className="service-list service-list--compact">
              {standards.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </aside>
        </div>
      </section>

      <CtaSection />
    </>
  );
}
