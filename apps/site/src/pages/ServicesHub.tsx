import React from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { CtaSection } from "../components/CtaSection";
import { serviceGroups } from "../constants/siteData";

export function ServicesHub(): React.JSX.Element {
  return (
    <>
      <Helmet>
        <title>Services | Kharon Fire and Security</title>
        <meta
          name="description"
          content="Fire systems, security systems, maintenance, and compliance support in plain language."
        />
      </Helmet>

      <section className="site-section">
        <div className="section-heading">
          <p className="section-kicker">Services</p>
          <h2>Choose the service you need, or contact us for help deciding.</h2>
          <p className="section-subtitle">
            The services below are organised by plain needs so first-time visitors can scan them quickly.
          </p>
        </div>

        <div className="site-section__stack">
          {serviceGroups.map((group) => (
            <section key={group.title} className="site-section__group">
              <div className="section-heading section-heading--tight">
                <h2>{group.title}</h2>
                <p className="section-subtitle">{group.summary}</p>
              </div>
              <div className="service-grid">
                {group.items.map((service) => (
                  <Link key={service.slug} to={`/services/${service.slug}`} className="service-card service-card--link">
                    <div className="service-card__header">
                      <div className="service-card__code">{service.navLabel.slice(0, 2).toUpperCase()}</div>
                      <div>
                        <h3>{service.navLabel}</h3>
                        <span className="service-card__meta">{service.audience}</span>
                      </div>
                    </div>
                    <p>{service.summary}</p>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      </section>

      <CtaSection />
    </>
  );
}
