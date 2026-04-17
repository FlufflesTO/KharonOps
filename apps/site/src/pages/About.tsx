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
          content="Company profile, operating footprint, quality stance, and technical delivery model for Kharon Fire and Security Solutions."
        />
      </Helmet>

      <section className="site-section">
        <div className="section-heading">
          <p className="section-kicker">About</p>
          <h2>Engineering-led fire and security delivery since {companyProfile.established}.</h2>
        </div>
        <div className="operations-board detail-grid">
          <article className="operations-flow">
            <div className="operations-flow__header">
              <h3>Company profile</h3>
            </div>
            <p className="section-subtitle">
              Kharon was founded to close the gap between site-level engineering work and the compliance evidence decision-makers
              need. We focus on high-accountability projects where safety, continuity, and traceability are all non-negotiable.
            </p>
            <ul className="service-list">
              <li>Established: {companyProfile.established}</li>
              <li>Registration: {companyProfile.registration}</li>
              <li>Head office: {companyProfile.address}</li>
              <li>Coverage: {companyProfile.serviceFootprint.join(", ")}</li>
            </ul>
          </article>

          <aside className="assurance-panel">
            <h3>Operational posture</h3>
            <div className="assurance-list">
              <article className="assurance-list__item">
                <span>Delivery model</span>
                <p>Design, install, maintain, and document under one controlled execution flow.</p>
              </article>
              <article className="assurance-list__item">
                <span>Quality stance</span>
                <p>Low-hype, high-discipline reporting with clear closeout and stakeholder visibility.</p>
              </article>
              <article className="assurance-list__item">
                <span>Ecosystem support</span>
                <p>Manufacturer and platform familiarity across fire detection, suppression, access, and CCTV.</p>
              </article>
            </div>
          </aside>
        </div>
      </section>

      <section className="site-section">
        <div className="section-heading">
          <p className="section-kicker">Partner familiarity</p>
          <h2>Technology ecosystems we regularly support.</h2>
        </div>
        <div className="logo-strip">
          {partnerLogos.map((logo) => (
            <span key={logo}>{logo}</span>
          ))}
        </div>
      </section>

      <CtaSection />
    </>
  );
}
