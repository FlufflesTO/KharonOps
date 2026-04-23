import React from "react";
import { Helmet } from "react-helmet-async";
import { CtaSection } from "../components/CtaSection";
import { companyProfile, partnerLogos } from "../constants/siteData";

export function AboutPage(): React.JSX.Element {
  return (
    <>
      <Helmet>
        <title>About Kharon | Fire and Security Solutions</title>
        <meta
          name="description"
          content="Fire and security services since 2016, supporting commercial and technical sites across Southern Africa."
        />
      </Helmet>

      <section className="site-section">
        <div className="section-heading">
          <p className="section-kicker">About</p>
          <h2>Fire and security services since {companyProfile.established}.</h2>
          <p className="section-subtitle">
            Kharon supports clients who want systems that are practical, reliable, and easy to document.
          </p>
        </div>
        <div className="operations-board detail-grid">
          <article className="operations-flow">
            <div className="operations-flow__header">
              <h3>Our story</h3>
            </div>
            <p className="section-subtitle">
              We built Kharon to give clients one clear place for planning, installation, maintenance, and records. The
              goal is simple: make the work easier to understand and easier to trust.
            </p>
            <ul className="service-list">
              <li>Registration: {companyProfile.registration}</li>
              <li>Head office: {companyProfile.address}</li>
              <li>Coverage: {companyProfile.serviceFootprint.join(", ")}</li>
            </ul>
          </article>

          <aside className="assurance-panel">
            <h3>How we work</h3>
            <div className="assurance-list">
              <article className="assurance-list__item">
                <span>Delivery model</span>
                <p>Plan, install, maintain, and document under one accountable service path.</p>
              </article>
              <article className="assurance-list__item">
                <span>Our approach</span>
                <p>Be clear, keep the site moving, and leave the next person with good records.</p>
              </article>
              <article className="assurance-list__item">
                <span>Systems and brands we work with</span>
                <p>We support common fire, access, and CCTV platforms used in commercial and technical estates.</p>
              </article>
            </div>
          </aside>
        </div>
      </section>

      <section className="site-section">
        <div className="section-heading">
          <p className="section-kicker">Partners</p>
          <h2>Systems and brands we work with.</h2>
        </div>
        <div className="logo-strip">
          {partnerLogos.map((logo) => (
            <span key={logo}>{logo}</span>
          ))}
        </div>
      </section>

      <section className="site-section">
        <div className="cta-panel">
          <div className="cta-panel__copy">
            <p className="section-kicker">Why people stay with us</p>
            <h2>Consistency, standards, and long-term support.</h2>
            <p>Clients come back when service is reliable, communication is simple, and records are easy to find.</p>
          </div>
          <div className="cta-panel__actions">
            <a className="site-button site-button--primary" href="/contact?intent=project">
              Talk to us
            </a>
            <a className="site-button site-button--secondary" href="/portal/">
              Portal
            </a>
          </div>
        </div>
      </section>

      <CtaSection />
    </>
  );
}
