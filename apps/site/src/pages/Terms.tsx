import React from "react";
import { Helmet } from "react-helmet-async";

export function TermsPage() {
  return (
    <>
      <Helmet>
        <title>Terms of Service | Kharon Fire & Security</title>
      </Helmet>
      <section className="site-section">
        <div className="section-heading">
          <p className="section-kicker">Governance</p>
          <h2>Terms of Service</h2>
        </div>
        <div style={{ maxWidth: "800px", marginTop: "2.5rem" }} className="section-subtitle">
          <p>By accessing the Kharon Command Centre or utilizing our fire and security solutions, you agree to the following terms and conditions.</p>
          
          <h3 style={{ marginTop: "2rem", color: "var(--color-text)" }}>1. Service Provision</h3>
          <p>All fire detection and suppression systems are designed and maintained in accordance with SANS 10139 and SANS 14520 standards. Kharon provides the engineering-led execution and reporting as defined in the service agreement.</p>
          
          <h3 style={{ marginTop: "2rem", color: "var(--color-text)" }}>2. Client Responsibilities</h3>
          <p>Clients are responsible for providing safe site access for technicians and ensuring that high-stakes environments are prepared for mandatory testing (e.g., door fan integrity tests).</p>
          
          <h3 style={{ marginTop: "2rem", color: "var(--color-text)" }}>3. Limitation of Liability</h3>
          <p>While Kharon delivers precision execution, the ultimate liability for site safety remains with the designated site owner. Our role is to provide the systems and verifiable evidence of their operational state.</p>
          
          <h3 style={{ marginTop: "2rem", color: "var(--color-text)" }}>4. Governing Law</h3>
          <p>These terms are governed by the laws of the Republic of South Africa.</p>
        </div>
      </section>
    </>
  );
}
