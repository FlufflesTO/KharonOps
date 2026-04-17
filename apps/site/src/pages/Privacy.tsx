import React from "react";
import { Helmet } from "react-helmet-async";

const privacySections = [
  {
    title: "1. Scope",
    body:
      "This notice explains how Kharon Fire and Security Solutions handles personal information captured through enquiries, project delivery, maintenance work, access-control operations, reporting, and support interactions."
  },
  {
    title: "2. Information collected",
    body:
      "Kharon may collect contact details, company and site information, job records, service notes, scheduling data, document outputs, and any information required to diagnose, deliver, evidence, or support the requested service."
  },
  {
    title: "3. Purpose of processing",
    body:
      "Information is processed to quote, scope, schedule, deliver, report on, and support services; to maintain operational and audit records; to manage security and access controls; and to meet lawful or contractual obligations that apply to the engagement."
  },
  {
    title: "4. Sharing and operators",
    body:
      "Information may be shared with employees, contractors, platform operators, and service providers who need it to perform the service or support the records trail. This can include scheduling, communications, document, hosting, and storage providers operating under Kharon's instructions."
  },
  {
    title: "5. Retention",
    body:
      "Records are retained for as long as required to deliver the service, support follow-up work, satisfy legal or contractual recordkeeping obligations, manage disputes, or maintain a defensible operational history. Data that is no longer required should be deleted or de-identified in line with the applicable retention position."
  },
  {
    title: "6. Security compromise handling",
    body:
      "Kharon applies technical and organisational controls intended to protect personal information. If a security compromise is identified, the incident should be assessed, contained, and escalated so that required notifications to affected parties and the Information Regulator can be made as soon as reasonably possible where POPIA requires it."
  },
  {
    title: "7. Data subject rights",
    body:
      "Subject to applicable law, you may request access to your personal information, ask for correction, object to certain processing, or request deletion where retention is no longer lawful or necessary. Identity and authority may need to be verified before any request is actioned."
  },
  {
    title: "8. Contact and complaints",
    body:
      "Privacy requests can be sent to admin@kharon.co.za. If you believe your personal information rights have been infringed, you may also lodge a complaint with the Information Regulator of South Africa."
  }
];

export function PrivacyPage(): React.JSX.Element {
  return (
    <>
      <Helmet>
        <title>Privacy Policy | Kharon Fire and Security</title>
        <meta
          name="description"
          content="Kharon's privacy notice covering enquiry handling, operational records, POPIA-aware data governance, and privacy requests."
        />
      </Helmet>
      <section className="site-section">
        <div className="section-heading">
          <p className="section-kicker">Governance</p>
          <h2>Privacy notice</h2>
          <p className="section-subtitle">
            This notice is intended to explain Kharon's handling of personal information in a way that is operationally clear.
            It does not replace contract-specific terms or any more detailed internal policy that may apply to a specific site
            or client environment.
          </p>
        </div>

        <div className="assurance-list detail-grid">
          {privacySections.map((section) => (
            <article key={section.title} className="assurance-list__item">
              <span>{section.title}</span>
              <p>{section.body}</p>
            </article>
          ))}
          <article className="assurance-list__item">
            <span>Information Regulator</span>
            <p>
              General enquiries: enquiries@inforegulator.org.za | 010 023 5200
              <br />
              POPIA complaints: POPIAComplaints@inforegulator.org.za
            </p>
          </article>
        </div>
      </section>
    </>
  );
}
