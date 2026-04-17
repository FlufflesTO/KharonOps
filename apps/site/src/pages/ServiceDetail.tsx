import React from "react";
import { Helmet } from "react-helmet-async";
import { Link, useParams } from "react-router-dom";
import { CtaSection } from "../components/CtaSection";
import { services } from "../constants/siteData";
import { NotFound } from "../components/NotFound";
import { Breadcrumbs } from "../components/Breadcrumbs";

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
          <p className="section-kicker">Service Scope</p>
          <h2>{service.title}</h2>
          <p className="section-subtitle">{service.summary}</p>
        </div>

        <div className="operations-board detail-grid">
          <article className="operations-flow">
            <div className="operations-flow__header">
              <h3>Scope of work</h3>
            </div>
            <ul className="service-list">
              {service.scope.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </article>
          <aside className="assurance-panel">
            <h3>Compliance and environments</h3>
            <div className="assurance-list">
              <article className="assurance-list__item">
                <span>Standards relevance</span>
                <p>{service.standards.join(" | ")}</p>
              </article>
              <article className="assurance-list__item">
                <span>Typical environments</span>
                <p>{service.environments.join(", ")}</p>
              </article>
            </div>
          </aside>
        </div>

        <div className="operations-board detail-grid detail-grid--single">
          <article className="operations-flow">
            <div className="operations-flow__header">
              <h3>Delivered outputs</h3>
            </div>
            <ul className="service-list">
              {service.deliverables.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
            <div className="detail-actions">
              <Link className="site-button site-button--primary" to="/contact">
                {service.ctaLabel}
              </Link>
              <Link className="site-button site-button--secondary" to="/services">
                Back to services
              </Link>
            </div>
          </article>
        </div>
      </section>
      <CtaSection />
    </>
  );
}
