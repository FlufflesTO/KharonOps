import React from "react";
import { Helmet } from "react-helmet-async";
import { CtaSection } from "../../components/CtaSection";

export function FireDetectionPage() {
  return (
    <>
      <Helmet>
        <title>Fire Detection & Alarm Systems | Kharon Fire & Security</title>
        <meta name="description" content="SANS 10139 compliant fire detection systems from manual to L1/P1 protection tiers." />
      </Helmet>
      
      <section className="site-section">
        <div className="section-heading">
          <p className="section-kicker">Service Scope</p>
          <h2>Fire Detection & Alarm Systems</h2>
        </div>
        
        <div style={{ maxWidth: "800px", marginTop: "2.5rem" }} className="section-subtitle">
          <h3 style={{ color: "var(--color-primary)" }}>Comprehensive Life Safety</h3>
          <p>We provide engineering-led fire detection solutions designed to meet the rigorous demands of SANS 10139. Our scope ranges from basic manual systems to full-scale automatic detection across all protection tiers.</p>
          
          <ul className="hero-card__list" style={{ marginTop: '2rem' }}>
            <li><strong>Category L1-L5:</strong> Protection of life, from full coverage to specific escape routes.</li>
            <li><strong>Category P1-P2:</strong> Protection of property and critical infrastructure.</li>
            <li><strong>Detection Logic:</strong> Smoke, heat, and flame detection integrated with site-wide alarm systems.</li>
            <li><strong>SAQCC Integration:</strong> All designs and maintenance are SAQCC-qualified and ready for certification.</li>
          </ul>

          <h3 style={{ marginTop: '3rem', color: "var(--color-primary)" }}>Our Capability</h3>
          <p>Kharon manages the entire lifecycle of your fire detection estate, ensuring that inspection-ready evidence is always available for auditors and insurers.</p>
          
          <div className="assurance-list" style={{ marginTop: '1.5rem' }}>
            <div className="assurance-list__item">
              <span>DESIGN & INSTALL</span>
              <p>Rational design support and precise field execution.</p>
            </div>
            <div className="assurance-list__item">
              <span>MAINTENANCE</span>
              <p>PH30 and PH120 cadence with detailed electronic reporting.</p>
            </div>
            <div className="assurance-list__item">
              <span>RECTIFICATION</span>
              <p>Rapid fault clearing and system health audits.</p>
            </div>
          </div>
        </div>
      </section>
      
      <CtaSection />
    </>
  );
}
