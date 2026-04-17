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
              <span className="hero-line reveal-text">Mission-Critical</span>
              <span className="hero-line hero-line--accent reveal-text" style={{ animationDelay: '0.2s' }}>Fire and Security</span>
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
            <div className="hero-visual__stack">
              <article className="hero-card hero-card--primary animate-float">
                <div className="hero-card__header">
                  <div>
                    <span className="hero-card__title">Profile</span>
                    <strong>{companyProfile.registration}</strong>
                  </div>
                  <span className="hero-badge hero-badge--blue">Active</span>
                </div>
                <div className="hero-card__bar">
                  <span className="hero-card__bar-fill" />
                </div>
                <ul className="hero-card__list">
                  <li>Established: {companyProfile.established}</li>
                  {services[0] && (
                    <li>{services[0].navLabel}: {services[0].summary}</li>
                  )}
                </ul>
              </article>
              <article className="hero-card hero-card--secondary animate-float" style={{ animationDelay: '1s' }}>
                <span className="hero-card__title">System Status</span>
                <div className="status-grid">
                  <div className="status-item">
                    <small>Uptime</small>
                    <strong>99.9%</strong>
                  </div>
                  <div className="status-item">
                    <small>Safety</small>
                    <strong>100%</strong>
                  </div>
                </div>
              </article>
            </div>
          </div>
        </div>
      </section>

      <section className="logo-section">
        <div className="logo-strip">
          {partnerLogos.map((logo) => (
            <span key={logo} className="logo-item">{logo}</span>
          ))}
        </div>
      </section>

      <section className="site-section site-section--compact">
        <div className="section-heading">
          <p className="section-kicker">Core Capabilities</p>
          <h2>Precision Delivery</h2>
        </div>
        <div className="service-features-grid">
          {services.slice(1, 4).map((service) => (
            <Link key={service.slug} to={`/services/${service.slug}`} className="feature-pill-link">
              <strong>{service.navLabel}</strong>
              <span>{service.summary.split('.')[0]}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="site-section site-section--compact">
        <div className="pillar-grid">
          {compliancePillars.map((pillar) => (
            <article key={pillar.title} className="pillar-card">
              <h3>{pillar.title}</h3>
              <p>{pillar.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="site-section site-section--compact">
        <div className="section-heading">
          <p className="section-kicker">Forensic Evidence</p>
          <h2>Recent Deployments</h2>
        </div>
        <div className="case-grid">
          {caseStudies.slice(0, 2).map((study) => (
            <article key={study.slug} className="case-card">
              <span className="case-card__tag">{study.environment}</span>
              <h3>{study.title}</h3>
              <p>{study.outcome}</p>
              <Link to={`/cases/${study.slug}`} className="text-link">View case study →</Link>
            </article>
          ))}
        </div>
      </section>

      <section className="site-section site-section--compact">
        <div className="section-heading">
          <p className="section-kicker">Technical Library</p>
          <h2>Compliance Resources</h2>
        </div>
        <div className="resource-grid">
          {resourceCards.map((resource) => (
            <article key={resource.title} className="resource-card">
              <span className="resource-card__format">{resource.format}</span>
              <h3>{resource.title}</h3>
              <p>{resource.description}</p>
              <Link
                to={`/contact?intent=resource&resource=${encodeURIComponent(resource.title)}`}
                className="site-button site-button--secondary"
              >
                {resource.ctaLabel}
              </Link>
            </article>
          ))}
        </div>
      </section>

      <CtaSection />

    </>
  );
}
