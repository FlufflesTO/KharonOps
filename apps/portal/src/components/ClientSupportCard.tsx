import React, { useMemo, useState } from "react";

export function ClientSupportCard(): React.JSX.Element {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [topic, setTopic] = useState<"general" | "maintenance" | "urgent_callout" | "resource">("general");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const topicLabel = useMemo(() => {
    switch (topic) {
      case "maintenance":
        return "Maintenance request";
      case "urgent_callout":
        return "Urgent callout";
      case "resource":
        return "Resource request";
      default:
        return "General enquiry";
    }
  }, [topic]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!name.trim() || !email.trim() || !phone.trim() || !message.trim()) {
      setStatus("Enter your name, email, phone, and message before sending.");
      return;
    }

    setSubmitting(true);
    setStatus("Submitting request...");

    try {
      const response = await fetch("/api/v1/public/contact", {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          name,
          email,
          phone,
          company: "Portal support request",
          site_location: "Kharon portal",
          enquiry_type: topic,
          message: `${topicLabel}\n\n${message}`,
          honey: ""
        })
      });

      const body = (await response.json()) as { error?: { message?: string } };
      if (!response.ok) {
        throw new Error(body.error?.message ?? `Request failed with status ${response.status}`);
      }

      setStatus("Request submitted. Support will follow up through the office inbox.");
      setMessage("");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : String(error));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <article className="workspace-card">
      <div className="panel-heading">
        <p className="panel-eyebrow">Assistance</p>
        <h2>Customer Support</h2>
      </div>

      <div className="control-stack">
        <section className="control-block">
          <div className="control-block__head">
            <h3>Contact Our Team</h3>
            <p>Send a request for help with a job, invoice, maintenance visit, or general question.</p>
          </div>
          <form className="support-form" onSubmit={handleSubmit}>
            <div className="form-grid form-grid--two">
              <label className="field-stack">
                <span>Name</span>
                <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name" />
              </label>
              <label className="field-stack">
                <span>Email</span>
                <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" />
              </label>
              <label className="field-stack">
                <span>Phone</span>
                <input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+27 ..." />
              </label>
              <label className="field-stack">
                <span>Request type</span>
                <select value={topic} onChange={(event) => setTopic(event.target.value as typeof topic)}>
                  <option value="general">General enquiry</option>
                  <option value="maintenance">Maintenance request</option>
                  <option value="urgent_callout">Urgent callout</option>
                  <option value="resource">Resource request</option>
                </select>
              </label>
              <label className="field-stack field-stack--full">
                <span>Message</span>
                <textarea value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Tell us how we can help..." rows={5} />
              </label>
            </div>
            <div className="support-status" aria-live="polite">{status}</div>
            <div className="flex-end">
              <button className="button button--primary" disabled={submitting}>
                {submitting ? "Sending..." : "Send Request"}
              </button>
            </div>
          </form>
        </section>
      </div>

      <style>{`
        .support-form { display: grid; gap: 1rem; }
        .flex-end { display: flex; justify-content: flex-end; width: 100%; margin-top: 1rem; }
        .support-status { min-height: 1.25rem; color: var(--color-secondary); font-size: 0.85rem; }
      `}</style>
    </article>
  );
}
