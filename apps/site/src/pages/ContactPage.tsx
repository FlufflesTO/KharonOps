import React from "react";
import { Helmet } from "react-helmet-async";
import { CtaSection } from "../components/CtaSection";

export function ContactPage() {
  return (
    <>
      <Helmet>
        <title>Contact Us | Kharon Fire & Security</title>
        <meta name="description" content="Request a site assessment or schedule maintenance with Kharon Fire & Security." />
      </Helmet>
      
      <section className="site-section">
        <div className="section-heading">
          <p className="section-kicker">Engage Command</p>
          <h2>Secure your site's operational future.</h2>
        </div>
        
        <div className="operations-board" style={{ marginTop: '3rem' }}>
          <div className="operations-flow">
            <div className="operations-flow__header">
              <h3>Enquiry Registration</h3>
            </div>
            <form style={{ display: 'grid', gap: '1.25rem', marginTop: '1.5rem' }}>
              <div style={{ display: 'grid', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-primary)', textTransform: 'uppercase' }}>Enquiry Type</label>
                <select className="site-button site-button--secondary" style={{ width: '100%', justifyContent: 'flex-start', appearance: 'auto' }}>
                  <option>New Project / Installation</option>
                  <option>Maintenance Contract Inquiry</option>
                  <option>Urgent Callout / Break-Fix</option>
                  <option>Audit or Documentation Request</option>
                </select>
              </div>
              <div style={{ display: 'grid', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-primary)', textTransform: 'uppercase' }}>Site Location</label>
                <input type="text" placeholder="e.g. Cape Town, Johannesburg, Gaborone" className="site-button site-button--secondary" style={{ width: '100%', justifyContent: 'flex-start' }} />
              </div>
              <div style={{ display: 'grid', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-primary)', textTransform: 'uppercase' }}>Message / Scope</label>
                <textarea rows={4} placeholder="Briefly describe your site requirements..." className="site-button site-button--secondary" style={{ width: '100%', justifyContent: 'flex-start', minHeight: '100px', resize: 'vertical' }} />
              </div>
              <button type="submit" className="site-button site-button--primary">Submit Request</button>
            </form>
          </div>
          
          <aside className="assurance-panel">
            <h3>Operational Details</h3>
            <div className="assurance-list" style={{ marginTop: '1.5rem' }}>
              <div className="assurance-list__item">
                <span>HEADQUARTERS</span>
                <p>Unit 58, M5 Freeway Park, Ndabeni, Cape Town, 7405</p>
              </div>
              <div className="assurance-list__item">
                <span>COMMUNICATIONS</span>
                <p>T: 061 545 8830<br/>E: admin@kharon.co.za</p>
              </div>
              <div className="assurance-list__item">
                <span>RESPONSE EXPECTATION</span>
                <p>Urgent breakdown requests are prioritized. Standard project inquiries are reviewed within 24 operational hours.</p>
              </div>
            </div>
          </aside>
        </div>
      </section>
      
      <CtaSection />
    </>
  );
}
