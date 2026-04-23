import React, { useEffect, useMemo, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useSearchParams } from "react-router-dom";
import { CtaSection } from "../components/CtaSection";
import { companyProfile, contactPaths } from "../constants/siteData";

type EnquiryType = "project" | "maintenance" | "urgent_callout" | "compliance" | "resource" | "general";

type FormState = {
  name: string;
  email: string;
  phone: string;
  company: string;
  site_location: string;
  enquiry_type: EnquiryType;
  message: string;
  honey: string;
};

function normalizeIntent(value: string | null): EnquiryType {
  switch (value) {
    case "project":
    case "maintenance":
    case "urgent_callout":
    case "compliance":
    case "resource":
      return value;
    default:
      return "general";
  }
}

function makeInitialForm(intent: EnquiryType, resourceName: string): FormState {
  return {
    name: "",
    email: "",
    phone: "",
    company: "",
    site_location: "",
    enquiry_type: intent,
    message: resourceName ? `Please send: ${resourceName}.` : "",
    honey: ""
  };
}

export function ContactPage(): React.JSX.Element {
  const [searchParams] = useSearchParams();
  const resourceName = searchParams.get("resource") ?? "";
  const intent = normalizeIntent(searchParams.get("intent"));
  const initialState = useMemo(() => makeInitialForm(intent, resourceName), [intent, resourceName]);
  const [form, setForm] = useState<FormState>(initialState);
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const messageRef = useRef<HTMLTextAreaElement>(null);
  const telHref = `tel:+${companyProfile.phone.replace(/\D+/g, "")}`;

  useEffect(() => {
    setForm(initialState);
    setStatusMessage("");
  }, [initialState]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    if (form.name.trim() === "") {
      setStatusMessage("Enter the contact name before submitting the request.");
      nameRef.current?.focus();
      return;
    }
    if (form.email.trim() === "") {
      setStatusMessage("Enter the email address before submitting the request.");
      emailRef.current?.focus();
      return;
    }
    if (form.phone.trim() === "") {
      setStatusMessage("Enter the phone number before submitting the request.");
      return;
    }
    if (form.message.trim() === "") {
      setStatusMessage("Describe the site, issue, or requested resource before submitting.");
      messageRef.current?.focus();
      return;
    }

    setSubmitting(true);
    setStatusMessage("Submitting request…");

    try {
      const response = await fetch("/api/v1/public/contact", {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify(form)
      });

      const body = (await response.json()) as { error?: { message?: string } };
      if (!response.ok) {
        throw new Error(body.error?.message ?? `Request failed with status ${response.status}`);
      }

      setForm(makeInitialForm(intent, resourceName));
      setStatusMessage("Request submitted. Kharon will direct it to the right team.");
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Helmet>
        <title>Contact | Kharon Fire and Security</title>
        <meta
          name="description"
          content="Request a quote, book maintenance, or ask for urgent help from Kharon Fire and Security Solutions."
        />
      </Helmet>

      <section className="site-section">
        <div className="section-heading">
          <p className="section-kicker">Contact</p>
          <h2>Tell us what you need and we’ll direct it to the right team.</h2>
          <p className="section-subtitle">
            Choose the path that best matches your request, then send the simplest form that gets the job moving.
          </p>
        </div>

        <div className="contact-paths" aria-label="Request paths">
          {contactPaths.map((path) => (
            <button
              key={path.value}
              type="button"
              className={`contact-path${form.enquiry_type === path.value ? " contact-path--active" : ""}`}
              onClick={() => setForm((current) => ({ ...current, enquiry_type: path.value }))}
            >
              <strong>{path.label}</strong>
              <span>{path.summary}</span>
            </button>
          ))}
        </div>

        <div className="operations-board detail-grid">
          <article className="operations-flow">
            <div className="operations-flow__header">
              <h3>Contact form</h3>
            </div>
            <form className="site-form" onSubmit={handleSubmit} noValidate>
              <div className="site-form__grid">
                <label className="site-form__field">
                  <span>Name</span>
                  <input
                    ref={nameRef}
                    name="name"
                    autoComplete="name"
                    value={form.name}
                    onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                    placeholder="Primary contact name"
                  />
                </label>
                <label className="site-form__field">
                  <span>Email</span>
                  <input
                    ref={emailRef}
                    name="email"
                    type="email"
                    autoComplete="email"
                    spellCheck={false}
                    value={form.email}
                    onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                    placeholder="name@example.com"
                  />
                </label>
                <label className="site-form__field">
                  <span>Phone</span>
                  <input
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    value={form.phone}
                    onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                    placeholder="+27 61 234 5678"
                  />
                </label>
                <label className="site-form__field">
                  <span>Message</span>
                  <textarea
                    ref={messageRef}
                    name="message"
                    rows={6}
                    value={form.message}
                    onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))}
                    placeholder="Tell us about the site, the system, and timing"
                  />
                </label>
              </div>

              <details className="contact-details" open={form.enquiry_type !== "general"}>
                <summary>More details</summary>
                <div className="site-form__grid contact-details__grid">
                  <label className="site-form__field">
                    <span>Company</span>
                    <input
                      name="company"
                      autoComplete="organization"
                      value={form.company}
                      onChange={(event) => setForm((current) => ({ ...current, company: event.target.value }))}
                      placeholder="Company or site owner"
                    />
                  </label>
                  <label className="site-form__field">
                    <span>Site location</span>
                    <input
                      name="site_location"
                      autoComplete="street-address"
                      value={form.site_location}
                      onChange={(event) => setForm((current) => ({ ...current, site_location: event.target.value }))}
                      placeholder="Address, suburb, or city"
                    />
                  </label>
                  <label className="site-form__field">
                    <span>Service type</span>
                    <select
                      name="enquiry_type"
                      value={form.enquiry_type}
                      onChange={(event) => setForm((current) => ({ ...current, enquiry_type: event.target.value as EnquiryType }))}
                    >
                      <option value="general">General enquiry</option>
                      {contactPaths
                        .filter((path) => path.value !== "general")
                        .map((path) => (
                          <option key={path.value} value={path.value}>
                            {path.label}
                          </option>
                        ))}
                    </select>
                  </label>
                  <label className="site-form__field site-form__field--hidden" aria-hidden="true">
                    <span>Leave this field empty</span>
                    <input
                      name="honey"
                      tabIndex={-1}
                      autoComplete="off"
                      value={form.honey}
                      onChange={(event) => setForm((current) => ({ ...current, honey: event.target.value }))}
                    />
                  </label>
                </div>
              </details>

              <div className="site-form__meta" aria-live="polite">
                {resourceName ? <p>Requested resource: {resourceName}</p> : null}
                <p>
                  Personal information submitted here is processed for service delivery, follow-up, and recordkeeping. See
                  the <Link to="/privacy">privacy notice</Link> for more detail.
                </p>
                <p className="site-form__status">{statusMessage}</p>
              </div>

              <div className="detail-actions">
                <button className="site-button site-button--primary" type="submit" disabled={submitting}>
                  {submitting ? "Submitting…" : "Submit request"}
                </button>
                <a className="site-button site-button--secondary" href={telHref}>
                  Call emergency line
                </a>
                <a className="site-button site-button--secondary" href={`mailto:${companyProfile.email}`}>
                  Email operations
                </a>
              </div>
            </form>
          </article>

          <aside className="assurance-panel">
            <h3>How we can help</h3>
            <div className="assurance-list">
              <article className="assurance-list__item">
                <span>Request paths</span>
                <p>Quote, maintenance, emergency callout, general enquiry, and resource requests are handled separately.</p>
              </article>
              <article className="assurance-list__item">
                <span>Contact</span>
                <p>
                  T: {companyProfile.phone}
                  <br />
                  E: {companyProfile.email}
                </p>
              </article>
              <article className="assurance-list__item">
                <span>Coverage and hours</span>
                <p>
                  {companyProfile.serviceFootprint.join(", ")}
                  <br />
                  {companyProfile.officeHours}
                </p>
              </article>
            </div>
          </aside>
        </div>
      </section>

      <CtaSection />
    </>
  );
}
