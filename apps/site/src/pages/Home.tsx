import React from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { heroSignals, heroCards, marketMetrics } from "../constants/siteData";
import { CtaSection } from "../components/CtaSection";

export function HomePage() {
  return (
    <>
      <Helmet>
        <title>Kharon Fire & Security Solutions | Engineering & Compliance</title>
        <meta name="description" content="Engineering-led fire detection, gaseous suppression, and integrated security. SANS-aligned execution for mission-critical environments." />
      </Helmet>
      
      <section className="hero-section" id="top">
        <div className="hero-grid">
          <div className="hero-copy">
            <p className="hero-kicker">Engineering-Led Site Command</p>
            <h1>
              <span className="hero-line">Mission-Critical</span>
              <span className="hero-line hero-line--accent">Fire & Security</span>
            </h1>
            <p className="hero-summary">
              Kharon provides the integrated operational command for high-stakes environments. 
              We bridge the gap between fragmented security and engineering-led compliance.
            </p>
            <div className="hero-actions">
              <Link className="site-button site-button--primary" to="/contact">
                Request Site Assessment
              </Link>
              <a className="site-button site-button--secondary" href="/portal/">
                Portal Login
              </a>
            </div>
          </div>
          <div className="hero-visual" aria-hidden="true">
            {/* Proof Strip Replacement or Summary Card */}
            <div className="hero-card-stack">
              <article className="hero-card" data-tone="blue">
                <div className="hero-card__header">
                  <div>
                    <span className="hero-card__title">Service Coverage</span>
                    <strong>SANS 10139 / 14520</strong>
                  </div>
                  <span className="hero-badge hero-badge--blue">Active</span>
                </div>
                <div className="hero-card__bar"><span className="hero-card__bar-fill" /></div>
                <div style={{ marginTop: '1rem', fontSize: '0.85rem', opacity: 0.8 }}>
                  Established 2016. Serving Cape Town, Botswana, and Malawi.
                </div>
              </article>
            </div>
          </div>
        </div>
      </section>

      {/* Proof Strip: Standards and Locations */}
      <section className="signal-band" aria-label="Credentials">
        <div className="signal-band__inner">
          <div className="signal-band__item">
            <span>REGIONAL FOOTPRINT</span>
            <small>SA, Botswana, Malawi</small>
          </div>
          <div className="signal-band__item">
            <span>SANS STANDARDS</span>
            <small>10139, 14520, 10400, 322</small>
          </div>
          <div className="signal-band__item">
            <span>OPERATIONAL SINCE</span>
            <small>2016 (Registration: 2016/313076/07)</small>
          </div>
        </div>
      </section>

      {/* 4 Core Pillars Routing */}
      <section className="site-section">
        <div className="section-heading">
          <p className="section-kicker">Core Capabilities</p>
          <h2>Engineering-led protection for high-value assets.</h2>
        </div>
        <div className="service-grid">
          <Link to="/services/fire-detection" className="service-card" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="service-card__code">FD</div>
            <h3>Fire Detection</h3>
            <p>SANS 10139 aligned design and maintenance for L1 to P1 tiers.</p>
          </Link>
          <Link to="/services/gaseous-suppression" className="service-card" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="service-card__code">GS</div>
            <h3>Gaseous Suppression</h3>
            <p>Special risk server room protection and integrity testing.</p>
          </Link>
          <Link to="/services/integrated-security" className="service-card" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="service-card__code">IS</div>
            <h3>Integrated Security</h3>
            <p>Access control, biometric governance, and forensic CCTV.</p>
          </Link>
          <Link to="/services/planned-maintenance" className="service-card" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="service-card__code">PM</div>
            <h3>Planned Maintenance</h3>
            <p>Disciplined service cadence with inspection-ready reporting.</p>
          </Link>
        </div>
      </section>

      {/* Sector Orientation */}
      <section className="site-section">
        <div className="section-heading">
          <p className="section-kicker">Sectors</p>
          <h2>Tailored for the environment.</h2>
        </div>
        <div className="case-grid">
           <Link to="/sectors/commercial" className="case-card" style={{ textDecoration: 'none', color: 'inherit' }}>
             <div className="case-card__visual"><span>Commercial</span></div>
             <div className="case-card__body"><p>Industrial-scale management for commercial estates.</p></div>
           </Link>
           <Link to="/sectors/data-rooms" className="case-card" style={{ textDecoration: 'none', color: 'inherit' }}>
             <div className="case-card__visual"><span>Data Centers</span></div>
             <div className="case-card__body"><p>Mission-critical server room protection.</p></div>
           </Link>
           <Link to="/sectors/industrial" className="case-card" style={{ textDecoration: 'none', color: 'inherit' }}>
             <div className="case-card__visual"><span>Industrial</span></div>
             <div className="case-card__body"><p>Hardened security for logistics and manufacturing.</p></div>
           </Link>
        </div>
      </section>

      <CtaSection />
    </>
  );
}
