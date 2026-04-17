import React from "react";
import { Helmet } from "react-helmet-async";
import { CtaSection } from "../../components/CtaSection";

export function GaseousSuppressionPage() {
  return (
    <>
      <Helmet>
        <title>Gaseous Suppression & Special Risk | Kharon Fire & Security</title>
        <meta name="description" content="Inert gas and CO2 suppression for server rooms and high-value technical environments." />
      </Helmet>
      
      <section className="site-section">
        <div className="section-heading">
          <p className="section-kicker">Service Scope</p>
          <h2>Gaseous Suppression</h2>
        </div>
        
        <div style={{ maxWidth: "800px", marginTop: "2.5rem" }} className="section-subtitle">
          <h3 style={{ color: "var(--color-primary)" }}>Special Risk Protection</h3>
          <p>We specialized in the protection of server rooms, archive vaults, and other high-value environments where water-based suppression is not an option. Our systems are designed to SANS 14520 standards.</p>
          
          <ul className="hero-card__list" style={{ marginTop: '2rem' }}>
            <li><strong>Inert Gas Systems:</strong> Environmentally safe suppression using IG-55, IG-541, or Nitrogen.</li>
            <li><strong>CO2 Systems:</strong> High-pressure local application for unoccupied technical spaces.</li>
            <li><strong>Pre-Discharge Logic:</strong> Double-knock detection logic to prevent accidental discharge.</li>
            <li><strong>Room Integrity Testing:</strong> Mandatory door fan testing to ensure the room can retain gas for 10+ minutes.</li>
          </ul>

          <h3 style={{ marginTop: '3rem', color: "var(--color-primary)" }}>Precision Engineering</h3>
          <p>A suppression system is only as good as the room it sits in. We provide the full engineering wrap—from flow calculations to final room sealing and audit-ready certification.</p>
        </div>
      </section>
      
      <CtaSection />
    </>
  );
}
