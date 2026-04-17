import React from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";

export function NotFound() {
  return (
    <section className="site-section" style={{ minHeight: "60vh", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center" }}>
      <Helmet>
        <title>404 - Record Not Found | Kharon Fire & Security</title>
      </Helmet>
      <p className="section-kicker">Status 404</p>
      <h2>Record Not Found</h2>
      <p style={{ maxWidth: 500, margin: "1rem auto 2rem" }}>The requested page is not located in the public directory. If you are looking for an operational record, use the portal access.</p>
      <Link to="/" className="site-button site-button--secondary">Return to Command Centre</Link>
    </section>
  );
}
