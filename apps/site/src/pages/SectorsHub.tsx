import React from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { CtaSection } from "../components/CtaSection";

const sectors = [
  { id: "commercial", title: "Commercial Buildings", desc: "Industrial-scale protection for commercial estates and office complexes." },
  { id: "industrial", title: "Industrial Facilities", desc: "Hardened security and fire safety for warehouses and manufacturing plants." },
  { id: "data-rooms", title: "Data & Server Rooms", desc: "Specialized gaseous suppression and sub-floor detection for mission-critical IT." },
  { id: "hospitality", title: "Hospitality", desc: "Seamless fire safety and access control for hotels and tourism environments." },
  { id: "healthcare", title: "Healthcare", desc: "Life safety systems for hospitals and clinics where response reliability is paramount." },
  { id: "education", title: "Education", desc: "Scalable security and detection for school and university campuses." },
  { id: "residential", title: "Residential Estates", desc: "Multi-site biometrics and perimeter protection for high-security residential zones." }
];

export function SectorsHub() {
  return (
    <>
      <Helmet>
        <title>Industry Sectors | Kharon Fire & Security</title>
        <meta name="description" content="Tailored safety solutions for commercial, industrial, healthcare, and data center environments." />
      </Helmet>
      
      <section className="site-section">
        <div className="section-heading">
          <p className="section-kicker">Sectors</p>
          <h2>Tailored safety systems for every environment.</h2>
        </div>
        <div className="case-grid">
          {sectors.map((s) => (
            <Link key={s.id} to={`/sectors/${s.id}`} className="case-card" style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="case-card__visual">
                <span>{s.title}</span>
              </div>
              <div className="case-card__body">
                <p>{s.desc}</p>
                <div style={{ marginTop: '1rem', color: 'var(--color-primary)', fontSize: '0.8rem', fontWeight: 600 }}>
                  VIEW SECTOR SCOPE →
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
      <CtaSection />
    </>
  );
}
