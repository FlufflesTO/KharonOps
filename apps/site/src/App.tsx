import React from "react";

const heroSignals = [
  "South Africa service coverage",
  "SANS-aligned fire, suppression, and security delivery",
  "Jobcards, service reports, and site evidence under one trail"
];

const marketMetrics = [
  { value: "SANS 10139", label: "Fire detection engineering baseline" },
  { value: "SANS 14520", label: "Gaseous suppression and integrity testing" },
  { value: "PSiRA / 24714", label: "Security and biometric governance layer" }
];

const heroCards = [
  {
    title: "Fire detection systems",
    status: "Operational",
    metric: "L1 to P1 protection tiers",
    tone: "blue",
    items: ["Manual to automatic detection categories", "SAQCC-led design and maintenance", "Inspection-ready evidence packs"]
  },
  {
    title: "Special risk suppression",
    status: "Controlled",
    metric: "Server room and archive protection",
    tone: "amber",
    items: ["Door fan integrity testing", "Pre-discharge logic audits", "Inert gas and CO2 environments"]
  },
  {
    title: "Security and closeout",
    status: "Active",
    metric: "Access, CCTV, intrusion, reporting",
    tone: "green",
    items: ["Biometric movement control", "Forensic CCTV and secure audit trail", "Jobcards and service reports packaged cleanly"]
  }
];

const servicePrograms = [
  {
    code: "FD",
    title: "Fire detection systems",
    status: "SANS 10139",
    meta: "Manual to L1 and P1 tiers",
    body: "Comprehensive detection solutions from manual coverage through maximum-protection life safety and property tiers, designed to stand up under inspection.",
    points: ["SAQCC-qualified design support", "Category L1-L5 and P1-P2 logic", "Rectification and evidence-led maintenance"]
  },
  {
    code: "GS",
    title: "Gaseous suppression",
    status: "SANS 14520",
    meta: "Special risk and server room protection",
    body: "Specialized suppression for server rooms, archives, and other high-value environments where pre-discharge logic and room integrity matter.",
    points: ["Door fan integrity tests", "Pre-discharge logic audits", "Inert gas and CO2 system readiness"]
  },
  {
    code: "AC",
    title: "Access control and forensic CCTV",
    status: "Integrated",
    meta: "PSiRA, SANS 24714, SANS 10142-1",
    body: "IP-based access, biometric governance, and forensic CCTV execution aligned with fail-safe life safety egress and reliable event logging.",
    points: ["Biometric movement management", "Forensic CCTV with immutable event trail", "Fail-safe fire integration and perimeter hardening"]
  },
  {
    code: "OP",
    title: "Field ops and compliance closeout",
    status: "Operational",
    meta: "PH30 and PH120 cadence, callouts, reporting",
    body: "Planned maintenance, corrective callouts, readings, photos, sign-offs, and consistent client handover assembled into one operational record.",
    points: ["Planned maintenance cadence", "Controlled jobcards and service reports", "Audit-ready evidence and next actions"]
  }
];

const workflowSteps = [
  {
    step: "Survey and scope",
    body: "We map site type, access rules, known faults, inspection outcomes, and the reporting posture your stakeholders will expect."
  },
  {
    step: "Execute and rectify",
    body: "Install, maintenance, rectification, or callout work is carried out with safe access, disciplined technician handoff, and logged evidence."
  },
  {
    step: "Close and maintain",
    body: "Reports, notes, sign-off, and next actions are packaged cleanly so the service record remains usable months later."
  }
];

const assurancePanels = [
  {
    label: "Inspection-ready records",
    detail: "Service reports, jobcards, site readings, and photo evidence are packaged into a calm client-facing closeout."
  },
  {
    label: "Planned maintenance discipline",
    detail: "PH30 and PH120 style cadence, controlled callouts, and traceable field execution keep service estates readable."
  },
  {
    label: "High-stakes site posture",
    detail: "The same delivery model is intended for commercial, industrial, healthcare, transport, server-room, and other mission-critical environments."
  }
];

const caseStudies = [
  {
    tag: "Global compliance",
    title: "Nuclear facility fire audit",
    detail: "Rational design and SANS 10139 compliance checks for high-stakes GTI environments where the margin for vague documentation is zero.",
    stat: "Survey, audit, certify"
  },
  {
    tag: "Protection",
    title: "Server room gaseous suppression",
    detail: "Inert gas installation with mandatory room integrity testing, pre-discharge logic review, and clean closeout for specialized environments.",
    stat: "Design, test, maintain"
  },
  {
    tag: "Integration",
    title: "IP access control rollout",
    detail: "Multi-site biometric deployment with fail-safe life safety egress, controlled handover, and a security posture that remains serviceable.",
    stat: "Commission, govern, handover"
  }
];

export function SiteApp(): React.JSX.Element {
  return (
    <div className="site-shell">
      <header className="site-nav">
        <a className="site-brand" href="#top">
          <span className="site-brand__mark">K</span>
          <span className="site-brand__copy">
            <strong>Kharon Fire &amp; Security</strong>
            <small>Integrated protection programmes</small>
          </span>
        </a>

        <nav className="site-links" aria-label="Primary">
          <a href="#services">Services</a>
          <a href="#delivery">Delivery</a>
          <a href="#projects">Projects</a>
        </nav>

        <div className="site-nav__actions">
          <div className="nav-status">
            <span className="nav-status__dot" />
            Service desk live
          </div>
          <a className="site-button site-button--quiet" href="/portal/">
            Portal
          </a>
        </div>
      </header>

      <main>
        <section className="hero-section" id="top">
          <div className="hero-grid">
            <div className="hero-copy">
              <p className="hero-kicker">South African fire, suppression, security, and compliance delivery</p>
              <h1>
                <span className="hero-line">Mission-critical fire</span>
                <span className="hero-line hero-line--accent">and security engineering</span>
              </h1>
              <p className="hero-summary">
                Kharon delivers engineering-led fire detection, gaseous suppression, integrated security, planned maintenance, callouts,
                and compliance reporting for sites where failure is not an option. The public face feels premium; the operational trail
                behind it stays controlled, documented, and inspection-ready.
              </p>

              <div className="hero-actions">
                <a className="site-button site-button--primary" href="mailto:connor@kharon.co.za?subject=Kharon%20Site%20Assessment">
                  Request Assessment
                </a>
                <a className="site-button site-button--secondary" href="/portal/">
                  Client and Technician Access
                </a>
              </div>

              <div className="hero-trust-strip">
                {heroSignals.map((signal) => (
                  <div key={signal} className="hero-trust-pill">
                    <span className="hero-trust-pill__dot" />
                    <span>{signal}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="hero-visual" aria-hidden="true">
              <div className="hero-card-stack">
                {heroCards.map((card) => (
                  <article key={card.title} className="hero-card" data-tone={card.tone}>
                    <div className="hero-card__header">
                      <div>
                        <span className="hero-card__title">{card.title}</span>
                        <strong>{card.metric}</strong>
                      </div>
                      <span className={`hero-badge hero-badge--${card.tone}`}>{card.status}</span>
                    </div>
                    <div className="hero-card__bar">
                      <span className="hero-card__bar-fill" />
                    </div>
                    <ul className="hero-card__list">
                      {card.items.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="signal-band" aria-label="Proof points">
          <div className="signal-band__inner">
            {marketMetrics.map((metric) => (
              <div key={metric.label} className="signal-band__item">
                <span>{metric.value}</span>
                <small>{metric.label}</small>
              </div>
            ))}
          </div>
        </section>

        <section className="site-section" id="services">
          <div className="section-heading">
            <p className="section-kicker">Service programmes</p>
            <h2>Fire, security, and documented closeout handled as one operational stack.</h2>
            <p className="section-subtitle">
              This is the public-facing service surface. Underneath it, the same discipline applies every time: defined scope, logged
              execution, evidence capture, and client handover that stays readable after the visit.
            </p>
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
                  {program.points.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section className="site-section site-section--split" id="delivery">
          <div className="section-heading">
            <p className="section-kicker">Delivery model</p>
            <h2>Scope, execute, document, maintain.</h2>
          </div>

          <div className="operations-board">
            <div className="operations-flow">
              <div className="operations-flow__header">
                <p className="section-kicker">Operational flow</p>
                <h3>How work moves through Kharon</h3>
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
              <p className="section-kicker">Assurances</p>
              <h3>What the service model actually guarantees</h3>
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

        <section className="site-section" id="projects">
          <div className="section-heading">
            <p className="section-kicker">Project patterns</p>
            <h2>Typical engagement shapes already inside the Kharon stack.</h2>
          </div>

          <div className="case-grid">
            {caseStudies.map((study) => (
              <article key={study.title} className="case-card">
                <div className="case-card__visual">
                  <span>{study.tag}</span>
                  <strong>{study.stat}</strong>
                </div>
                <div className="case-card__body">
                  <h3>{study.title}</h3>
                  <p>{study.detail}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="site-section cta-section">
          <div className="cta-panel">
            <div className="cta-panel__copy">
              <p className="section-kicker">Next step</p>
              <h2>Start with assessment. Move through execution. Finish with evidence.</h2>
              <p>
                Use the public site to position Kharon around real disciplines already visible in the service stack, then route
                authorised clients, technicians, dispatchers, and administrators into a cleaner corporate workspace.
              </p>
            </div>
            <div className="cta-panel__actions">
              <a className="site-button site-button--primary" href="mailto:connor@kharon.co.za?subject=Kharon%20Programme%20Enquiry">
                Start a Programme Conversation
              </a>
              <a className="site-button site-button--secondary" href="/portal/">
                Open Portal
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="site-footer__inner">
          <div className="site-footer__brand">
            <strong>Kharon Fire &amp; Security</strong>
            <span>Interim public domain currently served on tequit.co.za for controlled rollout and testing.</span>
          </div>
          <nav className="site-footer__links" aria-label="Legal">
            <a href="/privacy">Privacy</a>
            <a href="/terms">Terms</a>
            <a href="/portal/">Portal</a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
