import React from "react";
import { Helmet } from "react-helmet-async";
import { Link, useParams } from "react-router-dom";
import { Breadcrumbs } from "../components/Breadcrumbs";
import { CtaSection } from "../components/CtaSection";
import { NotFound } from "../components/NotFound";
import { industries, services } from "../constants/siteData";

export function SectorDetailPage(): React.JSX.Element {
  const { sectorSlug } = useParams<{ sectorSlug: string }>();
  const industry = industries.find((item) => item.slug === sectorSlug);

  if (!industry) {
    return <NotFound />;
  }

  const relatedServices = services.filter((service) => industry.relatedServices.includes(service.slug));

  return (
    <>
      <Helmet>
        <title>{industry.title} | Kharon Industries</title>
        <meta name="description" content={industry.summary} />
      </Helmet>

      <section className="site-section">
        <Breadcrumbs />
        <div className="section-heading">
          <p className="section-kicker">Industry</p>
          <h2>{industry.title}</h2>
          <p className="section-subtitle">{industry.summary}</p>
        </div>

        <div className="operations-board detail-grid">
          <article className="operations-flow">
            <div className="operations-flow__header">
              <h3>What matters most in this environment</h3>
            </div>
            <ul className="service-list">
              {industry.commonNeeds.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>

          <aside className="assurance-panel">
            <h3>Services often used here</h3>
            <ul className="service-list service-list--compact">
              {industry.relatedServices.map((item) => {
                const service = services.find((candidate) => candidate.slug === item);
                return <li key={item}>{service?.navLabel ?? item}</li>;
              })}
            </ul>
          </aside>
        </div>

        <div className="operations-board detail-grid detail-grid--single">
          <article className="operations-flow">
            <div className="operations-flow__header">
              <h3>How we work</h3>
            </div>
            <ul className="service-list">
              <li>Plan the site visit and confirm the work needed.</li>
              <li>Install, maintain, or repair the relevant systems.</li>
              <li>Document the work clearly so the next step is obvious.</li>
            </ul>
          </article>
        </div>

        <div className="operations-board detail-grid">
          <article className="case-card">
            <div className="case-card__visual">
              <span>Example outcome</span>
            </div>
            <div className="case-card__body">
              <h3>What a good result looks like</h3>
              <p>
                Systems are easier to use, easier to maintain, and easier to explain to operators, management, and
                auditors.
              </p>
            </div>
          </article>
          <article className="assurance-panel">
            <h3>What to do next</h3>
            <div className="assurance-list">
              <article className="assurance-list__item">
                <span>Talk to us</span>
                <p>Tell us about the site and we will match the service path to the environment.</p>
              </article>
              <article className="assurance-list__item">
                <span>Useful links</span>
                <ul className="service-list service-list--compact">
                  {relatedServices.map((service) => (
                    <li key={service.slug}>
                      <Link to={`/services/${service.slug}`}>{service.navLabel}</Link>
                    </li>
                  ))}
                </ul>
              </article>
            </div>
          </article>
        </div>

        <div className="detail-actions">
          <Link className="site-button site-button--primary" to="/contact?intent=project">
            Discuss this industry
          </Link>
          <Link className="site-button site-button--secondary" to="/industries">
            Back to industries
          </Link>
        </div>
      </section>

      <CtaSection />
    </>
  );
}
