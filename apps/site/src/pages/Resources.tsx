import React from "react";
import { Helmet } from "react-helmet-async";
import { CtaSection } from "../components/CtaSection";

export function ResourcesPage() {
  return (
    <>
      <Helmet>
        <title>Technical Resources | Kharon Fire & Security</title>
        <meta name="description" content="Technical checklists, compliance guidance, and FAQs for fire and security stakeholders." />
      </Helmet>
      
      <section className="site-section">
        <div className="section-heading">
          <p className="section-kicker">Resources</p>
          <h2>Technical guidance and compliance support.</h2>
        </div>
        
        <div style={{ marginTop: '3rem' }}>
          <h3 style={{ color: 'var(--color-primary)', marginBottom: '1.5rem' }}>Compliance Checklists</h3>
          <div className="case-grid">
            <article className="case-card">
              <div className="case-card__body">
                <h3>Asset Inventory Guide</h3>
                <p>Ensuring every detector and extinguisher is correctly logged for inspection readiness.</p>
                <div style={{ marginTop: '1rem', opacity: 0.6, fontSize: '0.8rem' }}>PDF DOWNLOAD [COMING SOON]</div>
              </div>
            </article>
            <article className="case-card">
              <div className="case-card__body">
                <h3>SANS 10139 Logic Map</h3>
                <p>A high-level overview of detection tiers for property vs human life safety.</p>
                <div style={{ marginTop: '1rem', opacity: 0.6, fontSize: '0.8rem' }}>PDF DOWNLOAD [COMING SOON]</div>
              </div>
            </article>
          </div>
        </div>

        <div style={{ marginTop: '4rem' }}>
          <h3 style={{ color: 'var(--color-primary)', marginBottom: '1.5rem' }}>Frequently Asked Questions</h3>
          <div className="assurance-list">
            <article className="assurance-list__item">
              <span>What is a Room Integrity Test?</span>
              <p>It is a mandatory SANS 14520 test to verify that a server room can hold gaseous suppression agent for at least 10 minutes (the retention time) to prevent fire re-ignition.</p>
            </article>
            <article className="assurance-list__item">
              <span>What are L1 vs P1 protection tiers?</span>
              <p>L1 (Life Safety) is intended to protect human life throughout the building, while P1 (Property Protection) is focused on minimizing damage to critical infrastructure.</p>
            </article>
            <article className="assurance-list__item">
              <span>How often should fire detection be serviced?</span>
              <p>In most commercial environments, a PH30 (quarterly) or PH120 (half-yearly) maintenance cadence is required to maintain certificate validity.</p>
            </article>
          </div>
        </div>
      </section>
      
      <CtaSection />
    </>
  );
}
