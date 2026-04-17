import React from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { CtaSection } from "../components/CtaSection";
import {
  caseStudies,
  companyProfile,
  compliancePillars,
  partnerLogos,
  sectors,
  services,
  standards,
  trustSignals
} from "../constants/siteData";

export function HomePage(): React.JSX.Element {
  return (
    <>
      <Helmet>
        <title>Kharon | Engineering-Led Fire and Security Execution</title>
        <meta
          name="description"
          content="Engineering-led fire and security delivery with inspection-ready documentation, compliance traceability, and controlled service response."
        />
      </Helmet>

      <section className="hero-section" id="top">
        <div className="hero-grid">
          <div className="hero-copy">
            <p className="hero-kicker">Engineering and Compliance Execution Partner</p>
            <h1>
              <span className="hero-line">Mission-Critical</span>
              <span className="hero-line hero-line--accent">Fire and Security Operations</span>
            </h1>
            <p className="hero-summary">
              Kharon delivers engineered fire and security systems with the operational discipline required for high-stakes
              sites, inspection cycles, and multi-stakeholder accountability.
            </p>
            <div className="hero-actions">
              <Link className="site-button site-button--primary" to="/contact">
                Request site assessment
              </Link>
              <a className="site-button site-button--secondary" href="/portal/">
                Portal login
              </a>
            </div>
            <div className="hero-trust-strip" aria-label="Core trust signals">
              {trustSignals.map((signal) => (
                <div key={signal} className="hero-trust-pill">
                  <span className="hero-trust-pill__dot" />
                  <span>{signal}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="hero-visual" aria-label="Company credentials">
            <div className="hero-visual__stack">
              <article className="hero-card hero-card--primary">
                <div className="hero-card__header">
                  <div>
                    <span className="hero-card__title">Operational profile</span>
                    <strong>Established {companyProfile.established}</strong>
                  </div>
                  <span className="hero-badge hero-badge--blue">Active</span>
                </div>
                <div className="hero-card__bar">
                  <span className="hero-card__bar-fill" />
                </div>
                <ul className="hero-card__list">
                  <li>Service footprint: {companyProfile.serviceFootprint.join(", ")}</li>
                  <li>Standards alignment: {standards.slice(0, 4).join(" | ")}</li>
                  <li>Office hours: {companyProfile.officeHours}</li>
                </ul>
              </article>

              <article className="hero-card hero-card--secondary">
                <div className="hero-card__header">
                  <div>
                    <span className="hero-card__title">Digitization Status</span>
                    <strong>SANS Compliance Tier 1</strong>
                  </div>
                </div>
                <div className="status-grid">
                  <div className="status-item">
                    <small>Inspection Ready</small>
                    <strong>100%</strong>
                  </div>
                  <div className="status-item">
                    <small>Records Logic</small>
                    <strong>Verified</strong>
                  </div>
                </div>
              </article>
            </div>
          </div>
        </div>
      </section>

      <section className="signal-band" aria-label="Proof and standards">
        <div className="signal-band__inner">
          <div className="signal-band__item">
            <span>Registration</span>
            <small>{companyProfile.registration}</small>
          </div>
          <div className="signal-band__item">
            <span>Standards</span>
            <small>{standards.join(", ")}</small>
          </div>
          <div className="signal-band__item">
            <span>Operating regions</span>
            <small>{companyProfile.serviceFootprint.join(", ")}</small>
          </div>
        </div>
      </section>

      <section className="site-section">
        <div className="section-heading">
          <p className="section-kicker">Core capabilities</p>
          <h2>Service architecture built around buyer intent.</h2>
        </div>
        <div className="service-grid">
          {services.slice(0, 4).map((service) => (
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

      <section className="site-section site-section--split">
        <div className="section-heading">
          <p className="section-kicker">Compliance and documentation</p>
          <h2>Inspection-ready records as a core deliverable, not an afterthought.</h2>
        </div>
        <div className="operations-board">
          {compliancePillars.map((pillar) => (
            <article key={pillar.title} className="assurance-list__item">
              <span>{pillar.title}</span>
              <p>{pillar.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="site-section">
        <div className="section-heading">
          <p className="section-kicker">Sector coverage</p>
          <h2>Built for environments with long buying cycles and strict accountability.</h2>
        </div>
        <div className="case-grid">
          {sectors.slice(0, 4).map((sector) => (
            <Link key={sector.slug} to={`/sectors/${sector.slug}`} className="case-card case-card--link">
              <div className="case-card__visual">
                <span>{sector.title}</span>
              </div>
              <div className="case-card__body">
                <p>{sector.summary}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="site-section">
        <div className="section-heading">
          <p className="section-kicker">Project proof</p>
          <h2>Case studies that show execution constraints, decisions, and outcomes.</h2>
        </div>
        <div className="case-grid">
          {caseStudies.map((study) => (
            <article key={study.slug} className="case-card">
              <div className="case-card__visual">
                <span>{study.environment}</span>
              </div>
              <div className="case-card__body">
                <h3>{study.title}</h3>
                <p>{study.outcome}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="site-section">
        <div className="section-heading">
          <p className="section-kicker">Partner ecosystem</p>
          <h2>Manufacturer and platform familiarity across real-world deployments.</h2>
        </div>
        <div className="logo-strip" aria-label="Partner and manufacturer familiarity">
          {partnerLogos.map((logo) => (
            <span key={logo}>{logo}</span>
          ))}
        </div>
      </section>

      <CtaSection />
    </>
  );
}
