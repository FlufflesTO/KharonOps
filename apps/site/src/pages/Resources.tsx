import React from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { CtaSection } from "../components/CtaSection";
import { resourceCards } from "../constants/siteData";

const faqs = [
  {
    question: "How often should fire systems be serviced?",
    answer:
      "Service cadence depends on the system, the site, and any insurer or lease requirements. We help clients set a practical schedule that fits the estate."
  },
  {
    question: "What goes into a good compliance pack?",
    answer:
      "A useful pack includes service reports, test records, certificates, as-built notes, and a clear action list where follow-up work is still open."
  },
  {
    question: "Can you support multi-site portfolios?",
    answer: "Yes. We can help standardise reporting, records, and maintenance plans across multiple sites."
  }
];

export function ResourcesPage(): React.JSX.Element {
  return (
    <>
      <Helmet>
        <title>Guides and Checklists | Kharon Fire and Security</title>
        <meta
          name="description"
          content="Helpful guidance for maintenance planning, documentation, and fire and security systems."
        />
      </Helmet>

      <section className="site-section">
        <div className="section-heading">
          <p className="section-kicker">Resources</p>
          <h2>Guides and checklists.</h2>
          <p className="section-subtitle">
            Helpful downloads and references for planning, maintaining, and documenting your systems.
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
          <p className="section-kicker">Common Questions</p>
          <h2>Simple answers to common planning questions.</h2>
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
