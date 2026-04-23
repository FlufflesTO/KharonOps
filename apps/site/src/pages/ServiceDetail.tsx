import React from "react";
import { Helmet } from "react-helmet-async";
import { Link, useParams } from "react-router-dom";
import { Breadcrumbs } from "../components/Breadcrumbs";
import { CtaSection } from "../components/CtaSection";
import { NotFound } from "../components/NotFound";
import { services } from "../constants/siteData";

export function ServiceDetailPage(): React.JSX.Element {
  const { serviceSlug } = useParams<{ serviceSlug: string }>();
  const service = services.find((item) => item.slug === serviceSlug);

  if (!service) {
    return <NotFound />;
  }

  return (
    <>
      <Helmet>
        <title>{service.title} | Kharon Fire and Security</title>
        <meta name="description" content={service.summary} />
      </Helmet>

      <section className="site-section">
        <Breadcrumbs />
        <div className="section-heading">
          <p className="section-kicker">Service</p>
          <h2>{service.title}</h2>
          <p className="section-subtitle">{service.summary}</p>
          <p className="section-subtitle section-subtitle--small">Best fit: {service.audience}</p>
        </div>

        <div className="operations-board detail-grid">
          <article className="operations-flow">
            <div className="operations-flow__header">
              <h3>What this service covers</h3>
            </div>
            <ul className="service-list">
              {service.scope.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </article>

          <aside className="assurance-panel">
            <h3>Standards and compliance</h3>
            <details className="details-panel" open={false}>
              <summary>{service.standards.join(" | ")}</summary>
              <div className="assurance-list">
                <article className="assurance-list__item">
                  <span>Where it is used</span>
                  <p>{service.environments.join(", ")}</p>
                </article>
              </div>
            </details>
          </aside>
        </div>

        <div className="operations-board detail-grid">
          <article className="operations-flow">
            <div className="operations-flow__header">
              <h3>What you receive</h3>
            </div>
            <ul className="service-list">
              {service.deliverables.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </article>

          <article className="operations-flow">
            <div className="operations-flow__header">
              <h3>Common questions</h3>
            </div>
            <ul className="service-list">
              {service.questions.map((question) => (
                <li key={question}>{question}</li>
              ))}
            </ul>
          </article>
        </div>

        <div className="detail-actions">
          <Link className="site-button site-button--primary" to="/contact?intent=project">
            {service.ctaLabel}
          </Link>
          <Link className="site-button site-button--secondary" to="/services">
            Back to services
          </Link>
        </div>
      </section>

      <CtaSection />
    </>
  );
}
