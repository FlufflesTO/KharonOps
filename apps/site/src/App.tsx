import React from "react";

const metrics = [
  { label: "Annual inspections", value: "12k+" },
  { label: "Average dispatch SLA", value: "22 min" },
  { label: "Audit-ready service reports", value: "100%" }
];

const capabilities = [
  "Fire detection and suppression maintenance",
  "Security system commissioning and troubleshooting",
  "Scheduled compliance visits with controlled documentation",
  "Real-time dispatcher orchestration with technician mobility",
  "Client self-service scheduling requests with controlled confirmation"
];

export function SiteApp(): React.JSX.Element {
  return (
    <div className="site-shell">
      <header className="site-header">
        <div className="brand-lockup">
          <div className="brand-accent" />
          <div>
            <div className="brand-title">KHARON FIRE &amp; SECURITY SOLUTIONS (PTY) LTD</div>
            <div className="brand-subtitle">Engineering Operations Platform + Field Service Control</div>
          </div>
        </div>
        <a className="cta-primary" href="/portal/">
          Open Operations Portal
        </a>
      </header>

      <main>
        <section className="hero-grid">
          <article className="hero-card">
            <h1>Mission-Critical Fire and Security Execution with End-to-End Traceability.</h1>
            <p>
              Kharon Unified v1 connects clients, technicians, dispatch, and administration through a single operational surface.
              Every action is identity-backed, audited, and synchronized to controlled records.
            </p>
            <div className="hero-actions">
              <a className="cta-primary" href="mailto:ops@kharonfs.co.za?subject=Kharon%20Operations%20Assessment">
                Request Operations Assessment
              </a>
              <a className="cta-secondary" href="/portal/">
                Client & Technician Access
              </a>
            </div>
          </article>

          <aside className="metrics-panel">
            <h2>Operational Baseline</h2>
            <ul>
              {metrics.map((item) => (
                <li key={item.label}>
                  <strong>{item.value}</strong>
                  <span>{item.label}</span>
                </li>
              ))}
            </ul>
          </aside>
        </section>

        <section className="capability-section">
          <h2>Service Capability Matrix</h2>
          <div className="capability-grid">
            {capabilities.map((capability, index) => (
              <article key={capability} className="capability-item">
                <div className="capability-index">{String(index + 1).padStart(2, "0")}</div>
                <p>{capability}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="conversion-strip">
          <h2>Need a full migration to controlled digital operations?</h2>
          <p>
            Internal pilot onboarding and hard cutover programs are available with rollback and legacy read-only fallback procedures.
          </p>
          <a className="cta-primary" href="mailto:projects@kharonfs.co.za?subject=Pilot%20and%20Cutover%20Program">
            Engage Pilot Program
          </a>
        </section>
      </main>
    </div>
  );
}
