import React from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { caseStudies, companyProfile, industries, partnerLogos, services, standards, trustSignals } from "../constants/siteData";

export function HomePage(): React.JSX.Element {
  const featuredServices = services.slice(0, 6);
  const featuredIndustries = industries;
  const featuredCases = caseStudies.slice(0, 3);
  const trustStandards = standards.slice(0, 4);

  return (
    <>
      <Helmet>
        <title>Kharon | Fire and Security Solutions</title>
        <meta
          name="description"
          content="Fire detection, suppression, access control, CCTV, maintenance, and compliance support for commercial and technical sites."
        />
      </Helmet>

      <section className="public-hero">
        <div className="public-hero__inner">
          <div className="public-hero__copy">
            <p className="section-kicker">Kharon Fire and Security Solutions</p>
            <h1>Fire and Security Systems, Designed, Installed, and Maintained.</h1>
            <p className="public-hero__summary">
              Kharon helps businesses protect people, buildings, and operations with fire detection, suppression, access
              control, CCTV, and ongoing maintenance.
            </p>
            <div className="hero-actions">
              <Link className="site-button site-button--primary" to="/contact?intent=project">
                Request a Site Visit
              </Link>
              <Link className="site-button site-button--secondary" to="/contact?intent=maintenance">
                Book Maintenance
              </Link>
              <Link className="hero-inline-link" to="/contact?intent=urgent_callout">
                Emergency callout
              </Link>
            </div>
            <div className="public-hero__trust" aria-label="Trust signals">
              {trustSignals.map((signal) => (
                <span key={signal}>{signal}</span>
              ))}
            </div>
          </div>

          <aside className="public-hero__panel" aria-label="Company snapshot">
            <span className="public-hero__panel-label">Trusted support since 2016</span>
            <strong>{companyProfile.serviceFootprint.join(" / ")}</strong>
            <p>
              Standards-led fire and security work for commercial, industrial, hospitality, healthcare, and education
              sites.
            </p>
            <ul>
              <li>{trustStandards.join(" · ")}</li>
              <li>Clear reporting and handover packs</li>
              <li>Planned maintenance and urgent response</li>
            </ul>
          </aside>
        </div>
      </section>

      <section className="site-section">
        <div className="section-heading">
          <p className="section-kicker">Services</p>
          <h2>Choose a service.</h2>
          <p className="section-subtitle">
            Four to six core services give most buyers a clear next step. If you are not sure what you need, contact us and
            we will help you decide.
          </p>
        </div>
        <div className="service-grid">
          {featuredServices.map((service) => (
            <Link key={service.slug} to={`/services/${service.slug}`} className="service-card service-card--link">
              <div className="service-card__header">
                <div className="service-card__code">{service.group.slice(0, 2).toUpperCase()}</div>
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

      <section className="site-section">
        <div className="section-heading">
          <p className="section-kicker">Why Kharon</p>
          <h2>Practical delivery that stays clear after the work is done.</h2>
        </div>
        <div className="pillar-grid">
          <article className="pillar-card">
            <h3>Clear reporting</h3>
            <p>Service notes, certificates, and action items stay readable for clients, contractors, and auditors.</p>
          </article>
          <article className="pillar-card">
            <h3>Qualified support</h3>
            <p>Fire and security work is planned and delivered by people who understand the systems and the site.</p>
          </article>
          <article className="pillar-card">
            <h3>Planned maintenance</h3>
            <p>Regular servicing reduces surprises, keeps systems reliable, and makes compliance easier to prove.</p>
          </article>
          <article className="pillar-card">
            <h3>Fast fault response</h3>
            <p>When something fails, you get direct support, clear diagnosis, and a documented closeout.</p>
          </article>
        </div>
      </section>

      <section className="site-section">
        <div className="section-heading">
          <p className="section-kicker">Industries</p>
          <h2>Support for the places people work, learn, stay, and store critical equipment.</h2>
        </div>
        <div className="case-grid">
          {featuredIndustries.map((industry) => (
            <Link key={industry.slug} to={`/industries/${industry.slug}`} className="case-card case-card--link">
              <div className="case-card__visual">
                <span>{industry.title}</span>
              </div>
              <div className="case-card__body">
                <p>{industry.summary}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="site-section">
        <div className="section-heading">
          <p className="section-kicker">Proof</p>
          <h2>Examples of recent work.</h2>
        </div>
        <div className="case-grid">
          {featuredCases.map((study) => (
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
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="site-section">
        <div className="cta-panel">
          <div className="cta-panel__copy">
            <p className="section-kicker">Next step</p>
            <h2>Tell us what you need.</h2>
            <p>Request a quote, book maintenance, or ask for urgent help and we will route it to the right team.</p>
          </div>
          <div className="cta-panel__actions">
            <Link className="site-button site-button--primary" to="/contact?intent=project">
              Request a Quote
            </Link>
            <Link className="site-button site-button--secondary" to="/contact?intent=maintenance">
              Book Maintenance
            </Link>
            <Link className="site-button site-button--secondary" to="/contact?intent=urgent_callout">
              Emergency Callout
            </Link>
          </div>
        </div>
      </section>

      <section className="site-section site-section--compact" aria-hidden="true">
        <div className="logo-strip">
          {partnerLogos.map((logo) => (
            <span key={logo} className="logo-item">
              {logo}
            </span>
          ))}
        </div>
      </section>
    </>
  );
}
