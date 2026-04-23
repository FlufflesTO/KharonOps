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

  useEffect(() => {
    setForm(initialState);
    setStatusMessage("");
  }, [initialState]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    if (form.name.trim() === "") {
      setStatusMessage("Enter your name before submitting.");
      nameRef.current?.focus();
      return;
    }
    if (form.email.trim() === "") {
      setStatusMessage("Enter your work email address.");
      emailRef.current?.focus();
      return;
    }
    if (form.phone.trim() === "") {
      setStatusMessage("Enter a valid phone number.");
      return;
    }
    if (form.message.trim() === "") {
      setStatusMessage("Please provide a brief description of your request.");
      messageRef.current?.focus();
      return;
    }

    setSubmitting(true);
    setStatusMessage("Sending request...");

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
      setStatusMessage("Request sent. Our team will contact you shortly.");
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Helmet>
        <title>Connect | Kharon Fire and Security</title>
        <meta
          name="description"
          content="Request a quote, book maintenance, or ask for urgent help from Kharon Fire and Security Solutions."
        />
      </Helmet>

      <section className="site-section contact-page">
        <div className="section-heading">
          <p className="section-kicker">Connect</p>
          <h2>Tell us what you need.</h2>
          <p className="section-subtitle">
            Complete the simplest form that gets your request moving. We'll direct it to the right team immediately.
          </p>
        </div>

        <div className="contact-layout">
          <article className="operations-flow">
            <div className="operations-flow__header">
              <h3>Service Request</h3>
            </div>
            <form className="site-form" onSubmit={handleSubmit} noValidate>
              <div className="site-form__grid">
                <label className="site-form__field">
                  <span>Full Name</span>
                  <input
                    ref={nameRef}
                    name="name"
                    autoComplete="name"
                    value={form.name}
                    onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                    placeholder="Contact name"
                  />
                </label>
                <label className="site-form__field">
                  <span>Work Email</span>
                  <input
                    ref={emailRef}
                    name="email"
                    type="email"
                    autoComplete="email"
                    spellCheck={false}
                    value={form.email}
                    onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                    placeholder="name@company.com"
                  />
                </label>
                <label className="site-form__field">
                  <span>Phone Number</span>
                  <input
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    value={form.phone}
                    onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                    placeholder="+27"
                  />
                </label>
                <label className="site-form__field">
                  <span>Service Type</span>
                  <select
                    name="enquiry_type"
                    value={form.enquiry_type}
                    onChange={(event) => setForm((current) => ({ ...current, enquiry_type: event.target.value as EnquiryType }))}
                  >
                    {contactPaths.map((path) => (
                      <option key={path.value} value={path.value}>
                        {path.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="site-form__field">
                  <span>Company / Site Name</span>
                  <input
                    name="company"
                    autoComplete="organization"
                    value={form.company}
                    onChange={(event) => setForm((current) => ({ ...current, company: event.target.value }))}
                    placeholder="Company name"
                  />
                </label>
                <label className="site-form__field">
                  <span>Location</span>
                  <input
                    name="site_location"
                    autoComplete="street-address"
                    value={form.site_location}
                    onChange={(event) => setForm((current) => ({ ...current, site_location: event.target.value }))}
                    placeholder="City or area"
                  />
                </label>
                <label className="site-form__field site-form__field--full">
                  <span>Message / Scope</span>
                  <textarea
                    ref={messageRef}
                    name="message"
                    rows={4}
                    value={form.message}
                    onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))}
                    placeholder="Briefly describe the site and requirements"
                  />
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

              <div className="site-form__meta" aria-live="polite">
                {resourceName ? <p className="requested-resource">Requested resource: <strong>{resourceName}</strong></p> : null}
                <p className="privacy-hint">
                  Your data is used strictly for service delivery. See the <Link to="/privacy">privacy notice</Link>.
                </p>
                {statusMessage && <p className="site-form__status">{statusMessage}</p>}
              </div>

              <div className="site-form__actions">
                <button className="site-button site-button--primary site-button--large" type="submit" disabled={submitting}>
                  {submitting ? "Sending..." : "Submit Request"}
                </button>
              </div>
            </form>
          </article>

          <aside className="assurance-panel">
            <h3>Support & Context</h3>
            <div className="assurance-list">
              <article className="assurance-list__item">
                <span>Immediate Help</span>
                <p>
                  <strong>{companyProfile.phone}</strong>
                  <br />
                  For emergencies and faults.
                </p>
              </article>
              <article className="assurance-list__item">
                <span>Coverage</span>
                <p>
                  {companyProfile.serviceFootprint.join(", ")}
                  <br />
                  {companyProfile.officeHours}
                </p>
              </article>
              <article className="assurance-list__item">
                <span>Direct Email</span>
                <p>{companyProfile.email}</p>
              </article>
            </div>
          </aside>
        </div>
      </section>

      <CtaSection />
    </>
  );
}
