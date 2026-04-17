import React from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { CtaSection } from "../components/CtaSection";

const services = [
  { id: "fire-detection", code: "FD", title: "Fire Detection & Alarm", desc: "SANS 10139 aligned systems for life safety and property protection." },
  { id: "gaseous-suppression", code: "GS", title: "Gaseous Suppression", desc: "Special risk server room protection and room integrity testing." },
  { id: "access-control", code: "AC", title: "Access Control", desc: "Biometric governance and IP-based movement management." },
  { id: "cctv-surveillance", code: "CCTV", title: "CCTV & Surveillance", desc: "Forensic video execution and secure event logging." },
  { id: "integrated-security", code: "IS", title: "Integrated Security Systems", desc: "Unified command for detection, security, and safety." },
  { id: "planned-maintenance", code: "PM", title: "Planned Maintenance", desc: "Disciplined service cadence (PH30/PH120) and reporting." },
  { id: "callouts-break-fix", code: "BF", title: "Callouts / Break-Fix", desc: "Rapid response and corrective engineering for site faults." },
  { id: "compliance-reporting", code: "CR", title: "Compliance Documentation", desc: "Inspection-ready service reports and audit trails." }
];

export function ServicesHub() {
  return (
    <>
      <Helmet>
        <title>Engineering Services | Kharon Fire & Security</title>
        <meta name="description" content="Comprehensive fire and security services including detection, suppression, and maintenance." />
      </Helmet>
      
      <section className="site-section">
        <div className="section-heading">
          <p className="section-kicker">Services</p>
          <h2>Engineering-led execution across the safety spectrum.</h2>
        </div>
        <div className="service-grid">
          {services.map((s) => (
            <Link key={s.id} to={`/services/${s.id}`} className="service-card" style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="service-card__header">
                <div className="service-card__code">{s.code}</div>
                <h3>{s.title}</h3>
              </div>
              <p>{s.desc}</p>
              <div style={{ marginTop: 'auto', paddingTop: '1rem', color: 'var(--color-primary)', fontSize: '0.8rem', fontWeight: 600 }}>
                EXPLORE SCOPE →
              </div>
            </Link>
          ))}
        </div>
      </section>
      <CtaSection />
    </>
  );
}
