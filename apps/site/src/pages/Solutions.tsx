import React from "react";
import { Helmet } from "react-helmet-async";
import { servicePrograms } from "../constants/siteData";
import { CtaSection } from "../components/CtaSection";

export function SolutionsPage() {
  return (
    <>
      <Helmet>
        <title>Engineering Solutions | Kharon Fire & Security</title>
        <meta name="description" content="Total compliance across fire detection, gaseous suppression, and forensic CCTV systems." />
      </Helmet>
      
      <section className="site-section">
        <div className="section-heading">
          <p className="section-kicker">Engineering Solutions</p>
          <h2>Total compliance across detection, suppression, and physical security.</h2>
        </div>
        <div className="service-grid">
          {servicePrograms.map((program) => (
            <article key={program.title} className="service-card">
              <div className="service-card__header">
                <div className="service-card__code">{program.code}</div>
                <div>
                  <span className="service-card__meta">{program.meta}</span>
                  <h3>{program.title}</h3>
                </div>
                <span className="hero-badge hero-badge--blue">{program.status}</span>
              </div>
              <p>{program.body}</p>
              <ul>
                {program.points.map((point) => <li key={point}>{point}</li>)}
              </ul>
            </article>
          ))}
        </div>
      </section>
      <CtaSection />
    </>
  );
}
