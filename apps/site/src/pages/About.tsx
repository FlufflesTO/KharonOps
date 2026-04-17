import React from "react";
import { Helmet } from "react-helmet-async";
import { CtaSection } from "../components/CtaSection";

export function AboutPage() {
  return (
    <>
      <Helmet>
        <title>About Us | Kharon Fire & Security</title>
        <meta name="description" content="Kharon Fire & Security Solutions — Engineering-led site command established in 2016." />
      </Helmet>
      
      <section className="site-section">
        <div className="section-heading">
          <p className="section-kicker">Our History</p>
          <h2>Engineering-led site command since 2016.</h2>
        </div>
        <div style={{ maxWidth: "800px", marginTop: "2.5rem" }} className="section-subtitle">
          <p>Kharon Fire & Security Solutions was established in 2016 with a mission to move from fragmented safety reporting to a single, integrated evidence trail. We are an engineering-led business focused on precision execution and inspection-ready reporting.</p>
          
          <h3 style={{ marginTop: "2rem", color: "var(--color-text)" }}>Operating Footprint</h3>
          <p>Headquartered in Cape Town, our capability extends across the SADC region with active support and project delivery in <strong>South Africa, Botswana, and Malawi</strong>.</p>
          
          <h3 style={{ marginTop: "2rem", color: "var(--color-text)" }}>Our Approach</h3>
          <p>We solve for the "long tail" of site integrity. Every installation, maintenance check, or callout is treated as a component of your site's permanent compliance record. We bridge the gap between physical security sensors and engineering-level reporting.</p>
          
          <h3 style={{ marginTop: "2rem", color: "var(--color-text)" }}>Mission Statement</h3>
          <p>To provide mission-critical fire and security environments with the operational discipline required to protect high-value assets and human life, underpinned by verifiable compliance documentation.</p>
        </div>
      </section>
      
      <section className="signal-band" aria-label="Company Details">
        <div className="signal-band__inner">
          <div className="signal-band__item">
            <span>REGISTRATION</span>
            <small>2016/313076/07</small>
          </div>
          <div className="signal-band__item">
            <span>FOUNDED</span>
            <small>Cape Town, 2016</small>
          </div>
          <div className="signal-band__item">
            <span>OFFICE HOURS</span>
            <small>08:00 - 17:00 (Mon-Fri)</small>
          </div>
        </div>
      </section>
      
      <CtaSection />
    </>
  );
}
