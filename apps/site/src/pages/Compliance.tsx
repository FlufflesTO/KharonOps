import React from "react";
import { Helmet } from "react-helmet-async";
import { workflowSteps, assurancePanels } from "../constants/siteData";
import { CtaSection } from "../components/CtaSection";

export function CompliancePage() {
  return (
    <>
      <Helmet>
        <title>Compliance Engine | Kharon Fire & Security</title>
        <meta name="description" content="Verifiable evidence and precision execution for audit-ready fire and security reporting." />
      </Helmet>

      <section className="site-section site-section--split">
        <div className="section-heading">
          <p className="section-kicker">Compliance Engine</p>
          <h2>Verifiable evidence. Precision execution.</h2>
        </div>
        <div className="operations-board">
          <div className="operations-flow">
            <div className="operations-flow__header">
              <p className="section-kicker">Certification Flow</p>
              <h3>Audit-ready reporting trail</h3>
            </div>
            <div className="operations-timeline">
              {workflowSteps.map((item, index) => (
                <article key={item.step} className="operations-timeline__item">
                  <span className="operations-timeline__index">0{index + 1}</span>
                  <div>
                    <h4>{item.step}</h4>
                    <p>{item.body}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
          <aside className="assurance-panel">
            <p className="section-kicker">Command Assurances</p>
            <h3>Operational standards</h3>
            <div className="assurance-list">
              {assurancePanels.map((panel) => (
                <article key={panel.label} className="assurance-list__item">
                  <span>{panel.label}</span>
                  <p>{panel.detail}</p>
                </article>
              ))}
            </div>
          </aside>
        </div>
      </section>
      <CtaSection />
    </>
  );
}
