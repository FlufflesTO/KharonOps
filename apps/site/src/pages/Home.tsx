import React from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { companyProfile, contactPaths, serviceGroups } from "../constants/siteData";

const quickPaths = [
  {
    title: "Services",
    description: "See the work we do and choose the system or service you need.",
    to: "/services"
  },
  {
    title: "Industries",
    description: "Jump to the environment that looks most like your site.",
    to: "/industries"
  },
  {
    title: "Case Studies",
    description: "Review our operational history and client outcomes.",
    to: "/case-studies"
  },
  {
    title: "About",
    description: "Read who we are and where we work.",
    to: "/about"
  },
  {
    title: "Contact",
    description: "Request a quote, maintenance visit, or urgent callout.",
    to: "/contact"
  }
] as const;

const valuePillars = [
  {
    title: "Compliance-ready work",
    copy: "Fire and security tasks are handled with service records, certificates, and clear handover paths."
  },
  {
    title: "Operational response",
    copy: "Urgent faults, planned maintenance, and project requests route into the correct response path quickly."
  },
  {
    title: "Site-specific guidance",
    copy: "Visitors can start from the system, service type, or industry environment that matches their site."
  }
] as const;

export function HomePage(): React.JSX.Element {
  const featuredServices = serviceGroups.flatMap((group) => group.items).slice(0, 4);

  return (
    <>
      <Helmet>
        <title>Kharon | Fire and Security Solutions</title>
        <meta
          name="description"
          content="Fire detection, suppression, access control, CCTV, maintenance, compliance support, and direct contact routing."
        />
      </Helmet>

      <section className="public-hero">
        <div className="public-hero__inner">
          <div className="public-hero__copy">
            <p className="section-kicker">Kharon Fire and Security Solutions</p>
            <h1>Fire and security support for sites that need clear action, records, and response.</h1>
            <p className="public-hero__summary">
              Kharon supports fire detection, suppression, access control, CCTV, maintenance, emergency callouts, and
              compliance handover. Start with the service you need or route straight to support.
            </p>
            <div className="hero-actions">
              <Link className="site-button site-button--primary site-button--large" to="/contact?intent=project">
                Request a Quote
              </Link>
              <Link className="site-button site-button--outline" to="/services">
                Browse Services
              </Link>
            </div>
            <p className="hero-help-hint">
              Urgent? <Link to="/contact?intent=urgent_callout">Emergency callouts here</Link>
            </p>
          </div>

          <aside className="public-hero__panel" aria-label="Company snapshot">
            <span className="public-hero__panel-label">Operations snapshot</span>
            <strong>Built around practical site outcomes.</strong>
            <p>
              Kharon supports {companyProfile.serviceFootprint.join(", ")} with clear request paths for planned work,
              urgent callouts, documentation, and service follow-up.
            </p>
            <ul>
              <li>Fire and security systems grouped by service need</li>
              <li>Industry routes for site-specific requirements</li>
              <li>Direct contact paths for quotes, support, and callouts</li>
            </ul>
          </aside>
        </div>
      </section>

      <section className="site-section">
        <div className="section-heading">
          <p className="section-kicker">Start here</p>
          <h2>Choose the route that matches the work.</h2>
          <p className="section-subtitle">
            Each route is kept short so visitors can move from need to action without decoding internal terminology.
          </p>
        </div>
        <div className="service-grid service-grid--compact">
          {quickPaths.map((item) => (
            <Link key={item.title} to={item.to} className="service-card service-card--link">
              <div className="service-card__header">
                <div className="service-card__code">{item.title.slice(0, 2).toUpperCase()}</div>
                <div>
                  <h3>{item.title}</h3>
                  <span className="service-card__meta">Navigate directly</span>
                </div>
              </div>
              <p>{item.description}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="site-section">
        <div className="section-heading section-heading--tight">
          <p className="section-kicker">What we do</p>
          <h2>Core services at a glance.</h2>
          <p className="section-subtitle section-subtitle--small">
            If you want the detail, use the services page. This section only gives the shortlist.
          </p>
        </div>
        <div className="service-grid service-grid--compact">
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
        <div className="section-heading section-heading--tight">
          <p className="section-kicker">How to use the site</p>
          <h2>Designed to reduce request errors.</h2>
        </div>
        <div className="pillar-grid">
          {valuePillars.map((pillar) => (
            <article key={pillar.title} className="pillar-card">
              <h3>{pillar.title}</h3>
              <p>{pillar.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="site-section cta-section">
        <div className="cta-panel">
          <div className="cta-panel__copy">
            <p className="section-kicker">Next step</p>
            <h2>Tell us what the site needs next.</h2>
            <p>
              Start with a quote, maintenance visit, emergency callout, or a service question. The right details can be
              captured from the first contact.
            </p>
          </div>
          <div className="cta-panel__actions">
            <Link className="site-button site-button--primary" to="/contact?intent=project">
              Contact us
            </Link>
            <Link className="site-button site-button--secondary" to="/services">
              Services
            </Link>
            <Link className="site-button site-button--secondary" to="/industries">
              Industries
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
