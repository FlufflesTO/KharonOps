import React from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { CtaSection } from "../components/CtaSection";
import {
  companyProfile,
  services,
  trustSignals
} from "../constants/siteData";

export function HomePage(): React.JSX.Element {
  return (
    <>
      <Helmet>
        <title>Kharon | Engineering-Led Fire and Security</title>
        <meta
          name="description"
          content="Engineering-led fire and security delivery with inspection-ready documentation and controlled response."
        />
      </Helmet>

      <section className="hero-section" id="top">
        <div className="hero-grid">
          <div className="hero-copy">
            <p className="hero-kicker">Compliance Execution Partner</p>
            <h1>
              <span className="hero-line">Mission-Critical</span>
              <span className="hero-line hero-line--accent">Fire and Security</span>
            </h1>
            <p className="hero-summary">
              Kharon delivers engineered fire and security systems with the operational discipline required for multi-stakeholder accountability.
            </p>
            <div className="hero-actions">
              <Link className="site-button site-button--primary" to="/contact?intent=project">
                Get assessment
              </Link>
              <a className="site-button site-button--secondary" href="/portal/">
                Portal login
              </a>
            </div>
            <div className="hero-trust-strip" aria-label="Core trust signals">
              {trustSignals.slice(0, 3).map((signal) => (
                <div key={signal} className="hero-trust-pill">
                  <span className="hero-trust-pill__dot" />
                  <span>{signal}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="hero-visual">
            <article className="hero-card hero-card--primary">
              <div className="hero-card__header">
                <div>
                  <span className="hero-card__title">Profile</span>
                  <strong>{companyProfile.registration}</strong>
                </div>
                <span className="hero-badge hero-badge--blue">Active</span>
              </div>
              <ul className="hero-card__list">
                <li>Established: {companyProfile.established}</li>
                <li>{services[0].navLabel}: {services[0].summary}</li>
              </ul>
            </article>
          </div>
        </div>
      </section>

      <section className="site-section site-section--ultra-compact">
        <div className="service-features-grid">
          {services.slice(1, 4).map((service) => (
            <Link key={service.slug} to={`/services/${service.slug}`} className="feature-pill-link">
              <strong>{service.navLabel}</strong>
              <span>{service.summary.split('.')[0]}</span>
            </Link>
          ))}
        </div>
      </section>

      <CtaSection />
    </>
  );
}
