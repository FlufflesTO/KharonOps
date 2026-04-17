import React from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { CtaSection } from "../components/CtaSection";
import { resourceCards } from "../constants/siteData";

const faqs = [
  {
    question: "How often should fire systems be serviced?",
    answer:
      "Service cadence depends on site class, asset type, insurer requirements, and the maintenance plan adopted for the facility. PH30 and PH120 patterns are common reference points, but the actual schedule should be set for the specific estate."
  },
  {
    question: "What is included in a compliance closeout pack?",
    answer:
      "Typical contents include service reports, test records, certificates, as-built references, and a clearly prioritised remedial actions register. The required evidence set can expand where leases, tenders, insurers, or site-specific rules apply."
  },
  {
    question: "Can Kharon support multi-site portfolios?",
    answer:
      "Yes. Kharon supports distributed estates with standardised reporting, service governance, and cross-site visibility for leadership teams."
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
          <p className="section-subtitle">
            Each resource request routes into a structured intake flow so Kharon can respond with the relevant reference,
            follow-up context, and next-step recommendation.
          </p>
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
                <div className="detail-actions">
                  <Link
                    className="site-button site-button--secondary"
                    to={`/contact?intent=${encodeURIComponent(card.intent)}&resource=${encodeURIComponent(card.title)}`}
                  >
                    {card.ctaLabel}
                  </Link>
                </div>
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
