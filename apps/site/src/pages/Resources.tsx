import React from "react";
import { Helmet } from "react-helmet-async";
import { CtaSection } from "../components/CtaSection";
import { resourceCards } from "../constants/siteData";

const faqs = [
  {
    question: "How often should fire systems be serviced?",
    answer:
      "Service cadence depends on site class and insurer requirements, but PH30 and PH120 schedules are common for managed commercial environments."
  },
  {
    question: "What is included in a compliance closeout pack?",
    answer:
      "Typical contents include service reports, test records, certificates, as-built references, and a clearly prioritized remedial actions register."
  },
  {
    question: "Can Kharon support multi-site portfolios?",
    answer:
      "Yes. Kharon supports distributed estates with standardized reporting, service governance, and cross-site visibility for leadership teams."
  }
];

export function ResourcesPage(): React.JSX.Element {
  return (
    <>
      <Helmet>
        <title>Resources | Kharon Fire and Security</title>
        <meta
          name="description"
          content="Practical guidance for maintenance planning, compliance documentation, and fire and security governance."
        />
      </Helmet>

      <section className="site-section">
        <div className="section-heading">
          <p className="section-kicker">Resources</p>
          <h2>Guidance designed to improve operational and compliance outcomes.</h2>
        </div>
        <div className="case-grid">
          {resourceCards.map((card) => (
            <article key={card.title} className="case-card">
              <div className="case-card__visual">
                <span>{card.format}</span>
              </div>
              <div className="case-card__body">
                <h3>{card.title}</h3>
                <p>{card.description}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="site-section">
        <div className="section-heading">
          <p className="section-kicker">FAQ</p>
          <h2>Common buyer and operations questions.</h2>
        </div>
        <div className="assurance-list">
          {faqs.map((faq) => (
            <article key={faq.question} className="assurance-list__item">
              <span>{faq.question}</span>
              <p>{faq.answer}</p>
            </article>
          ))}
        </div>
      </section>

      <CtaSection />
    </>
  );
}
