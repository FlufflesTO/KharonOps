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
    title: "Compliance",
    description: "Open documentation, certificates, and governance support.",
    to: "/compliance"
  },
  {
    title: "Resources",
    description: "Use the guides and checklists when you need a simple next step.",
    to: "/resources"
  },
  {
    title: "Contact",
    description: "Request a quote, maintenance visit, or urgent callout.",
    to: "/contact"
  },
  {
    title: "About",
    description: "Read who we are and where we work.",
    to: "/about"
  }
] as const;

const valuePillars = [
  {
    title: "Fast routing",
    copy: "Each request path points to a dedicated page, so visitors do not need to scroll through everything first."
  },
  {
    title: "Plain language",
    copy: "Services and industries are described the way clients actually ask for them."
  },
  {
    title: "Clear next steps",
    copy: "Every page ends with a direct action, not a dead-end marketing paragraph."
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
            <h1>One place to choose the right service, industry, or support path.</h1>
            <p className="public-hero__summary">
              This site is organised as a simple front door. Use it to reach services, industries, documentation, resources,
              or contact quickly without wading through a long landing page.
            </p>
            <div className="hero-actions">
              <Link className="site-button site-button--primary" to="/contact?intent=project">
                Request a Quote
              </Link>
              <Link className="site-button site-button--secondary" to="/services">
                Browse Services
              </Link>
              <Link className="hero-inline-link" to="/resources">
                Open guides
              </Link>
            </div>
            <div className="public-hero__trust" aria-label="Request paths">
              {contactPaths.map((path) => (
                <Link key={path.value} to={`/contact?intent=${path.value}`} className="hero-trust-pill">
                  <span className="hero-trust-pill__dot" />
                  <span>{path.label}</span>
                </Link>
              ))}
            </div>
          </div>

          <aside className="public-hero__panel" aria-label="Company snapshot">
            <span className="public-hero__panel-label">Direct navigation</span>
            <strong>Start with the page that does one job well.</strong>
            <p>
              Kharon supports {companyProfile.serviceFootprint.join(", ")} and keeps the public website focused on fast
              routing into the right path.
            </p>
            <ul>
              <li>Services, industries, compliance, and contact all have their own pages</li>
              <li>Portal and public site are separated by purpose</li>
              <li>Mobile visitors get short paths instead of a long scroll</li>
            </ul>
          </aside>
        </div>
      </section>

      <section className="site-section">
        <div className="section-heading">
          <p className="section-kicker">Start here</p>
          <h2>Choose the page that matches what you need.</h2>
          <p className="section-subtitle">
            The home page now works as a hub, not a brochure wall.
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
          <h2>Short pages, clear routes, no dead ends.</h2>
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
            <h2>Go straight to the page you need.</h2>
            <p>
              If you already know the path, use it. If not, start with services or contact and we will route it from there.
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
