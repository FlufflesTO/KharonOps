import React from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { companyProfile, services, trustSignals, standards } from "../constants/siteData";

export function HomePage(): React.JSX.Element {
  const technicianServices = services.slice(0, 4);
  const standardsPreview = standards.slice(0, 4);

  return (
    <>
      <Helmet>
        <title>Kharon | Engineering and Technician Portal</title>
        <meta
          name="description"
          content="A compact operations portal into Kharon engineering delivery and technician execution."
        />
      </Helmet>

      <section className="home-portal-hero" id="top">
        <div className="home-portal-hero__ambient" aria-hidden="true" />
        <div className="home-portal-hero__inner">
          <div className="home-portal-hero__copy">
            <p className="home-portal-hero__kicker">KHARON COMMAND SURFACE</p>
            <h1>Engineering Precision. Technician Excellence.</h1>
            <p>
              One decisive entry point into engineered fire and security delivery. Route into planning, execution,
              compliance evidence, or live field operations in seconds.
            </p>
            <div className="home-portal-hero__actions">
              <a className="site-button site-button--primary" href="/portal/">
                Enter Portal
              </a>
              <Link className="site-button site-button--secondary" to="/contact?intent=project">
                Start Engineering Scope
              </Link>
            </div>
          </div>

          <div className="home-portal-hero__panel">
            <div className="home-portal-hero__status">
              <span>OPERATIONS LIVE</span>
              <strong>{companyProfile.registration}</strong>
              <small>{companyProfile.serviceFootprint.join(" | ")}</small>
            </div>
            <ul className="home-portal-hero__signals" aria-label="Core trust signals">
              {trustSignals.map((signal) => (
                <li key={signal}>
                  <span className="home-portal-hero__signal-dot" />
                  <span>{signal}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="home-portal-track">
        <div className="home-portal-track__inner">
          <header className="home-portal-track__header">
            <p className="home-portal-track__kicker">Choose the Track</p>
            <h2>Enter the right Kharon workflow immediately.</h2>
          </header>

          <div className="home-portal-track__grid">
            <Link className="home-portal-lane" to="/services">
              <p className="home-portal-lane__label">Engineering</p>
              <h3>Design, compliance, and managed delivery</h3>
              <p>Service architecture, standards execution, and project control from scope to closeout.</p>
              <span className="home-portal-lane__action">Explore Engineering Services</span>
            </Link>

            <a className="home-portal-lane home-portal-lane--accent" href="/portal/">
              <p className="home-portal-lane__label">Technician</p>
              <h3>Live jobs, evidence, and field closeout</h3>
              <p>Dispatch-ready queueing, jobcard generation, and inspection-grade documentation in one workspace.</p>
              <span className="home-portal-lane__action">Open Technician Dashboard</span>
            </a>
          </div>
        </div>
      </section>

      <section className="home-portal-proof">
        <div className="home-portal-proof__inner">
          <div className="home-portal-proof__summary">
            <p className="home-portal-proof__kicker">Delivery Snapshot</p>
            <h2>Built for audited engineering and high-performance field teams.</h2>
          </div>

          <div className="home-portal-proof__rows">
            <div className="home-portal-proof__row">
              <span>Active Service Domains</span>
              <strong>{services.length}</strong>
              <small>{technicianServices.map((service) => service.navLabel).join(" | ")}</small>
            </div>
            <div className="home-portal-proof__row">
              <span>Standards Backbone</span>
              <strong>{standards.length}</strong>
              <small>{standardsPreview.join(" | ")}</small>
            </div>
            <div className="home-portal-proof__row">
              <span>Command Contact</span>
              <strong>{companyProfile.phone}</strong>
              <small>{companyProfile.officeHours}</small>
            </div>
          </div>
        </div>
      </section>

      <section className="home-portal-final">
        <div className="home-portal-final__inner">
          <h2>Route work. Verify execution. Close with evidence.</h2>
          <div className="home-portal-final__actions">
            <a className="site-button site-button--primary" href="/portal/">
              Launch Kharon Portal
            </a>
            <Link className="site-button site-button--secondary" to="/contact?intent=urgent_callout">
              Emergency Callout
            </Link>
          </div>
        </div>
      </section>

      <section className="site-section site-section--compact" aria-hidden="true" style={{ paddingTop: "0.75rem" }}>
        <div className="logo-strip">
          {technicianServices.map((service) => (
            <span key={service.slug} className="logo-item">
              {service.navLabel}
            </span>
          ))}
        </div>
      </section>
    </>
  );
}
