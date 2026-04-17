import React from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { CtaSection } from "../components/CtaSection";
import { services } from "../constants/siteData";

export function ServicesHub(): React.JSX.Element {
  return (
    <>
      <Helmet>
        <title>Services | Kharon Fire and Security</title>
        <meta
          name="description"
          content="Service hub covering planned maintenance, break-fix response, engineered systems, and inspection-ready documentation."
        />
      </Helmet>

      <section className="site-section">
        <div className="section-heading">
          <p className="section-kicker">Service hub</p>
          <h2>Structured by buyer intent, not generic brochure categories.</h2>
          <p className="section-subtitle">
            Explore service tracks for engineering projects, maintenance contracts, urgent fault response, and compliance
            closeout reporting.
          </p>
        </div>
        <div className="service-grid">
          {services.map((service) => (
            <Link key={service.slug} to={`/services/${service.slug}`} className="service-card service-card--link">
              <div className="service-card__header">
                <div className="service-card__code">{service.navLabel.slice(0, 2).toUpperCase()}</div>
                <div>
                  <h3>{service.navLabel}</h3>
                  <span className="service-card__meta">{service.standards.join(" | ")}</span>
                </div>
              </div>
              <p>{service.summary}</p>
            </Link>
          ))}
        </div>
      </section>
      <CtaSection />
    </>
  );
}
