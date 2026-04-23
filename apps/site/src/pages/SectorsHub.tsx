import React from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { CtaSection } from "../components/CtaSection";
import { industries } from "../constants/siteData";

export function SectorsHub(): React.JSX.Element {
  return (
    <>
      <Helmet>
        <title>Industries | Kharon Fire and Security</title>
        <meta
          name="description"
          content="Fire and security support for commercial buildings, industrial facilities, hospitality, healthcare, education, and data rooms."
        />
      </Helmet>

      <section className="site-section">
        <div className="section-heading">
          <p className="section-kicker">Industries</p>
          <h2>Industries we support.</h2>
          <p className="section-subtitle">Choose the environment that looks most like your site.</p>
        </div>

        <div className="case-grid">
          {industries.map((industry) => (
            <Link key={industry.slug} to={`/industries/${industry.slug}`} className="case-card case-card--link">
              <div className="case-card__visual">
                <span>{industry.title}</span>
              </div>
              <div className="case-card__body">
                <p>{industry.summary}</p>
                <ul className="service-list service-list--compact">
                  {industry.commonNeeds.map((need) => (
                    <li key={need}>{need}</li>
                  ))}
                </ul>
                <span className="text-link">View industry support</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <CtaSection />
    </>
  );
}
