import React from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { CtaSection } from "../components/CtaSection";
import { caseStudies } from "../constants/siteData";

export function OperationalTrailPage(): React.JSX.Element {
  return (
    <>
      <Helmet>
        <title>Case Studies | Kharon</title>
        <meta
          name="description"
          content="Plain-language examples of recent work across commercial, industrial, hospitality, healthcare, and technical sites."
        />
      </Helmet>

      <section className="site-section">
        <div className="section-heading">
          <p className="section-kicker">Case Studies</p>
          <h2>Operational history.</h2>
          <p className="section-subtitle">
            A selection of recent projects showing how we solve fire and security challenges for our clients.
          </p>
        </div>
        <div className="case-grid">
          {caseStudies.map((study) => (
            <article key={study.slug} className="case-card">
              <div className="case-card__visual">
                <span>{study.siteType}</span>
              </div>
              <div className="case-card__body">
                <h3>{study.title}</h3>
                <p>{study.challenge}</p>
                <ul className="service-list service-list--compact">
                  {study.scope.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                <p>
                  <strong>Result:</strong> {study.result}
                </p>
                <p>
                  <strong>Documents:</strong> {study.documents.join(", ")}
                </p>
              </div>
            </article>
          ))}
        </div>
        <div className="detail-actions">
          <Link className="site-button site-button--primary site-button--large" to="/contact?intent=project">
            Request a Consultation
          </Link>
        </div>
      </section>

      <CtaSection />
    </>
  );
}
