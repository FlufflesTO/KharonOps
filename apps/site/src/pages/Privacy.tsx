import React from "react";
import { Helmet } from "react-helmet-async";

export function PrivacyPage() {
  return (
    <>
      <Helmet>
        <title>Privacy Policy | Kharon Fire & Security</title>
      </Helmet>
      <section className="site-section">
        <div className="section-heading">
          <p className="section-kicker">Governance</p>
          <h2>Privacy Policy</h2>
        </div>
        <div style={{ maxWidth: "800px", marginTop: "2.5rem" }} className="section-subtitle">
          <p>Kharon Fire & Security Solutions is committed to protecting the privacy and security of your personal and operational data. This policy outlines how we handle information in accordance with South African data protection regulations.</p>
          
          <h3 style={{ marginTop: "2rem", color: "var(--color-text)" }}>1. Collection of Information</h3>
          <p>We collect information necessary to provide fire detection, suppression, and security services. This includes site data, contact details for personnel, and operational records required for compliance reporting.</p>
          
          <h3 style={{ marginTop: "2rem", color: "var(--color-text)" }}>2. Use of Data</h3>
          <p>Data is used exclusively for the delivery of requested services, maintaining an immutable operational trail, and ensuring site safety compliance. We do not sell or trade your data with third parties.</p>
          
          <h3 style={{ marginTop: "2rem", color: "var(--color-text)" }}>3. Data Security</h3>
          <p>We implement high-stakes security engineering to protect your data, ensuring that service reports, jobcards, and biometric logs remain confidential and tamper-proof.</p>
          
          <h3 style={{ marginTop: "2rem", color: "var(--color-text)" }}>4. Contact</h3>
          <p>For any privacy-related enquiries, please contact our administration at admin@kharon.co.za.</p>
        </div>
      </section>
    </>
  );
}
