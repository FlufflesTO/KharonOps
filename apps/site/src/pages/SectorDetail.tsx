import React from "react";
import { Helmet } from "react-helmet-async";
import { Link, useParams } from "react-router-dom";
import { CtaSection } from "../components/CtaSection";
import { sectors, services } from "../constants/siteData";
import { NotFound } from "../components/NotFound";
import { Breadcrumbs } from "../components/Breadcrumbs";

export function SectorDetailPage(): React.JSX.Element {
  const { sectorSlug } = useParams<{ sectorSlug: string }>();
  const sector = sectors.find((item) => item.slug === sectorSlug);

  if (!sector) {
    return <NotFound />;
  }

  return (
    <>
      <Helmet>
        <title>{sector.title} | Kharon Sector Coverage</title>
        <meta name="description" content={sector.summary} />
      </Helmet>

      <section className="site-section">
        <Breadcrumbs />
        <div className="section-heading">
          <p className="section-kicker">Sector Profile</p>
          <h2>{sector.title}</h2>
          <p className="section-subtitle">{sector.summary}</p>
        </div>

        <div className="operations-board detail-grid">
          <article className="operations-flow">
            <div className="operations-flow__header">
              <h3>Primary sector priorities</h3>
            </div>
            <ul className="service-list">
              {sector.focus.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
          <aside className="assurance-panel">
            <h3>Typical engagement scope</h3>
            <ul className="service-list service-list--compact">
              {sector.commonScope.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </aside>
        </div>

        <div className="operations-board detail-grid detail-grid--single">
          <article className="operations-flow">
            <div className="operations-flow__header">
              <h3>Relevant service tracks</h3>
            </div>
            <div className="service-grid service-grid--compact">
              {services.slice(0, 6).map((service) => (
                <Link key={service.slug} to={`/services/${service.slug}`} className="service-card service-card--link">
                  <h3>{service.navLabel}</h3>
                  <p>{service.summary}</p>
                </Link>
              ))}
            </div>
            <div className="detail-actions">
              <Link className="site-button site-button--primary" to="/contact">
                Discuss sector requirements
              </Link>
              <Link className="site-button site-button--secondary" to="/sectors">
                Back to sectors
              </Link>
            </div>
          </article>
        </div>
      </section>
      <CtaSection />
    </>
  );
}
