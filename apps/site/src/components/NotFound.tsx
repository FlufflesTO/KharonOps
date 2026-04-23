import React from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";

export function NotFound(): React.JSX.Element {
  return (
    <section
      className="site-section"
      style={{
        minHeight: "60vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        textAlign: "center"
      }}
    >
      <Helmet>
        <title>404 - Page Not Found | Kharon Fire and Security</title>
      </Helmet>
      <p className="section-kicker">Status 404</p>
      <h2>Page not found</h2>
      <p style={{ maxWidth: 500, margin: "1rem auto 2rem" }}>
        The page you asked for is not available on the public site. If you need help with a site, use the contact page or
        return home.
      </p>
      <div className="detail-actions">
        <Link to="/" className="site-button site-button--primary">
          Go home
        </Link>
        <Link to="/contact" className="site-button site-button--secondary">
          Contact us
        </Link>
      </div>
    </section>
  );
}
