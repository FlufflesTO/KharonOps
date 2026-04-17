import React from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { CtaSection } from "../components/CtaSection";
import { caseStudies } from "../constants/siteData";

export function OperationalTrailPage(): React.JSX.Element {
  return (
    <>
      <Helmet>
        <title>Projects and Delivery Patterns | Kharon</title>
        <meta
          name="description"
          content="Representative delivery patterns showing environment constraints, execution scope, and compliance documentation outcomes."
        />
      </Helmet>

      <section className="site-section">
        <div className="section-heading">
          <p className="section-kicker">Projects</p>
          <h2>Representative delivery patterns across high-accountability environments.</h2>
          <p className="section-subtitle">
            The profiles below are anonymised, representative patterns drawn from real delivery conditions. They are shown to
            illustrate scope, constraints, and documentation posture without disclosing client-sensitive detail.
          </p>
        </div>
        <div className="case-grid">
          {caseStudies.map((study) => (
            <article key={study.slug} className="case-card">
              <div className="case-card__visual">
                <span>{study.environment}</span>
              </div>
              <div className="case-card__body">
                <h3>{study.title}</h3>
                <p>{study.problem}</p>
                <ul className="service-list service-list--compact">
                  {study.scope.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                <p>
                  <strong>Outcome:</strong> {study.outcome}
                </p>
              </div>
            </article>
          ))}
        </div>
        <div className="detail-actions">
          <Link className="site-button site-button--primary" to="/contact?intent=project">
            Discuss your project
          </Link>
        </div>
      </section>
      <CtaSection />
    </>
  );
}
