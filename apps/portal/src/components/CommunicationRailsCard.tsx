import React, { useEffect, useState } from "react";
import { apiClient } from "../apiClient";

function errorMessage(error: unknown): string {
  const typed = error as { error?: { message?: string } };
  return typed.error?.message ?? String(error);
}

interface CommunicationRailsCardProps {
  selectedJobUid: string;
  selectedJobTitle: string;
  onFeedback: (msg: string) => void;
}

export function CommunicationRailsCard({
  selectedJobUid,
  selectedJobTitle,
  onFeedback
}: CommunicationRailsCardProps): React.JSX.Element {
  const [gmailTo, setGmailTo] = useState("");
  const [gmailSubject, setGmailSubject] = useState("");
  const [gmailBody, setGmailBody] = useState("");
  const [chatMessage, setChatMessage] = useState("");
  const [chatSeverity, setChatSeverity] = useState<"info" | "warning" | "critical">("info");

  useEffect(() => {
    if (selectedJobUid === "") {
      setGmailSubject("");
      setGmailBody("");
      setChatMessage("");
      return;
    }

    setGmailSubject(`Service update | ${selectedJobUid}`);
    setGmailBody(selectedJobTitle ? `Update for ${selectedJobTitle}.` : "");
    setChatMessage(`Dispatch update for ${selectedJobUid}.`);
  }, [selectedJobTitle, selectedJobUid]);

  const disabled = selectedJobUid === "";

  return (
    <article className="workspace-card">
      <div className="panel-heading">
        <p className="panel-eyebrow">Communication rails</p>
        <h2>Outbound actions</h2>
      </div>

      <p className="muted-copy">
        {disabled
          ? "Select a job before sending Gmail or Chat notifications."
          : `Linked to ${selectedJobUid}${selectedJobTitle ? ` | ${selectedJobTitle}` : ""}.`}
      </p>

      <div className="control-block">
        <div className="control-block__head">
          <h3>Gmail notify</h3>
          <p>Send a job-linked service update to the client or internal stakeholder.</p>
        </div>
        <div className="form-grid">
          <label className="field-stack">
            <span>To</span>
            <input
              name="gmail_to"
              type="email"
              autoComplete="email"
              spellCheck={false}
              value={gmailTo}
              onChange={(event) => setGmailTo(event.target.value)}
              placeholder="client@example.com"
            />
          </label>
          <label className="field-stack">
            <span>Subject</span>
            <input
              name="gmail_subject"
              autoComplete="off"
              value={gmailSubject}
              onChange={(event) => setGmailSubject(event.target.value)}
              placeholder="Service update for JOB-1001…"
            />
          </label>
          <label className="field-stack field-stack--full">
            <span>Body</span>
            <textarea
              name="gmail_body"
              rows={4}
              value={gmailBody}
              onChange={(event) => setGmailBody(event.target.value)}
              placeholder="Summarise the current service status, next step, and timing…"
            />
          </label>
          <div className="field-stack field-stack--action field-stack--full">
            <span>&nbsp;</span>
            <button
              className="button button--secondary"
              type="button"
              disabled={disabled}
              onClick={async () => {
                if (gmailTo.trim() === "" || gmailSubject.trim() === "" || gmailBody.trim() === "") {
                  onFeedback("Complete the Gmail recipient, subject, and body before sending.");
                  return;
                }

                try {
                  await apiClient.sendGmailNotification(gmailTo.trim(), gmailSubject.trim(), gmailBody.trim(), selectedJobUid);
                  onFeedback("Gmail notification sent.");
                } catch (error) {
                  onFeedback(errorMessage(error));
                }
              }}
            >
              Send Gmail
            </button>
          </div>
        </div>
      </div>

      <div className="control-block">
        <div className="control-block__head">
          <h3>Chat alert</h3>
          <p>Escalate a dispatch message without leaving the selected job context.</p>
        </div>
        <div className="form-grid">
          <label className="field-stack">
            <span>Severity</span>
            <select
              name="chat_severity"
              value={chatSeverity}
              onChange={(event) => setChatSeverity(event.target.value as "info" | "warning" | "critical")}
            >
              <option value="info">Info</option>
              <option value="warning">Warning</option>
              <option value="critical">Critical</option>
            </select>
          </label>
          <label className="field-stack field-stack--full">
            <span>Message</span>
            <textarea
              name="chat_message"
              rows={3}
              value={chatMessage}
              onChange={(event) => setChatMessage(event.target.value)}
              placeholder="Describe the issue, operator action, and expected response…"
            />
          </label>
          <div className="field-stack field-stack--action field-stack--full">
            <span>&nbsp;</span>
            <button
              className="button button--secondary"
              type="button"
              disabled={disabled}
              onClick={async () => {
                if (chatMessage.trim() === "") {
                  onFeedback("Enter the Chat alert message before sending.");
                  return;
                }

                try {
                  await apiClient.sendChatAlert(chatMessage.trim(), chatSeverity, selectedJobUid);
                  onFeedback("Chat alert sent.");
                } catch (error) {
                  onFeedback(errorMessage(error));
                }
              }}
            >
              Send alert
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

