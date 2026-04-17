import React from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { CtaSection } from "../components/CtaSection";
import { sectors } from "../constants/siteData";

export function SectorsHub(): React.JSX.Element {
  return (
    <>
      <Helmet>
        <title>Sectors | Kharon Fire and Security</title>
        <meta
          name="description"
          content="Sector-specific fire and security solutions for commercial, industrial, healthcare, education, and mission-critical environments."
        />
      </Helmet>

      <section className="site-section">
        <div className="section-heading">
          <p className="section-kicker">Sector focus</p>
          <h2>Designed for environments with different risk and governance profiles.</h2>
        </div>
        <div className="case-grid">
          {sectors.map((sector) => (
            <Link key={sector.slug} to={`/sectors/${sector.slug}`} className="case-card case-card--link">
              <div className="case-card__visual">
                <span>{sector.title}</span>
              </div>
              <div className="case-card__body">
                <p>{sector.summary}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
      <CtaSection />
    </>
  );
}
