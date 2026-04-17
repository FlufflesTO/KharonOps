import React from "react";
import { Helmet } from "react-helmet-async";
import { caseStudies } from "../constants/siteData";
import { CtaSection } from "../components/CtaSection";

export function OperationalTrailPage() {
  return (
    <>
      <Helmet>
        <title>Operational Trail | Kharon Fire & Security</title>
        <meta name="description" content="Immutable records and case studies of site integrity and security rollouts." />
      </Helmet>

      <section className="site-section">
        <div className="section-heading">
          <p className="section-kicker">Operational Trail</p>
          <h2>Immutable records of site integrity.</h2>
        </div>
        <div className="case-grid">
          {caseStudies.map((study) => (
            <article key={study.title} className="case-card">
              <div className="case-card__visual">
                <span>{study.tag}</span>
                <strong>{study.stat}</strong>
              </div>
              <div className="case-card__body">
                <h3>{study.title}</h3>
                <p>{study.detail}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
      <CtaSection />
    </>
  );
}
