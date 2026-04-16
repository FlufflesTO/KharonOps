import React, { useState } from "react";
import { apiClient } from "../apiClient";

interface CommunicationRailsCardProps {
  selectedJobUid: string;
  onFeedback: (msg: string) => void;
}

export function CommunicationRailsCard({
  selectedJobUid,
  onFeedback,
}: CommunicationRailsCardProps): React.JSX.Element {
  const [gmailTo, setGmailTo] = useState("connor@kharon.co.za");
  const [gmailSubject, setGmailSubject] = useState("Kharon service update");
  const [gmailBody, setGmailBody] = useState("Service team update attached.");
  const [chatMessage, setChatMessage] = useState("Dispatcher alert test");
  const [chatSeverity, setChatSeverity] = useState<"info" | "warning" | "critical">("info");
  const [personName, setPersonName] = useState("New Contact");
  const [personEmail, setPersonEmail] = useState("connor@kharon.co.za");
  const [personPhone, setPersonPhone] = useState("+27110000000");

  return (
    <article className="workspace-card">
      <div className="panel-heading">
        <p className="panel-eyebrow">Communication rails</p>
        <h2>Outbound actions</h2>
      </div>

      {/* Gmail Notify */}
      <div className="control-block">
        <div className="control-block__head">
          <h3>Gmail notify</h3>
          <p>Send an update linked to the selected job.</p>
        </div>
        <div className="form-grid">
          <label className="field-stack">
            <span>To</span>
            <input name="gmail_to" value={gmailTo} onChange={(event) => setGmailTo(event.target.value)} placeholder="to" />
          </label>
          <label className="field-stack">
            <span>Subject</span>
            <input
              name="gmail_subject"
              value={gmailSubject}
              onChange={(event) => setGmailSubject(event.target.value)}
              placeholder="subject"
            />
          </label>
          <label className="field-stack field-stack--full">
            <span>Body</span>
            <input name="gmail_body" value={gmailBody} onChange={(event) => setGmailBody(event.target.value)} placeholder="body" />
          </label>
          <div className="field-stack field-stack--action">
            <span>&nbsp;</span>
            <button
              className="button button--secondary"
              onClick={async () => {
                await apiClient.sendGmailNotification(gmailTo, gmailSubject, gmailBody, selectedJobUid);
                onFeedback("Gmail notification sent.");
              }}
            >
              Send
            </button>
          </div>
        </div>
      </div>

      {/* Chat Alert */}
      <div className="control-block">
        <div className="control-block__head">
          <h3>Chat alert</h3>
          <p>Escalate a dispatch message for the selected job.</p>
        </div>
        <div className="button-row">
          <select
            name="chat_severity"
            value={chatSeverity}
            onChange={(event) => setChatSeverity(event.target.value as "info" | "warning" | "critical")}
          >
            <option value="info">info</option>
            <option value="warning">warning</option>
            <option value="critical">critical</option>
          </select>
          <input name="chat_message" value={chatMessage} onChange={(event) => setChatMessage(event.target.value)} placeholder="message" />
          <button
            className="button button--secondary"
            onClick={async () => {
              await apiClient.sendChatAlert(chatMessage, chatSeverity, selectedJobUid);
              onFeedback("Chat alert sent.");
            }}
          >
            Alert
          </button>
        </div>
      </div>

      {/* People Sync */}
      <div className="control-block">
        <div className="control-block__head">
          <h3>People sync</h3>
          <p>Push a contact update into the shared people surface.</p>
        </div>
        <div className="form-grid">
          <label className="field-stack">
            <span>Name</span>
            <input name="person_name" value={personName} onChange={(event) => setPersonName(event.target.value)} placeholder="name" />
          </label>
          <label className="field-stack">
            <span>Email</span>
            <input
              name="person_email"
              value={personEmail}
              onChange={(event) => setPersonEmail(event.target.value)}
              placeholder="email"
            />
          </label>
          <label className="field-stack">
            <span>Phone</span>
            <input
              name="person_phone"
              value={personPhone}
              onChange={(event) => setPersonPhone(event.target.value)}
              placeholder="phone"
            />
          </label>
          <div className="field-stack field-stack--action">
            <span>&nbsp;</span>
            <button
              className="button button--secondary"
              onClick={async () => {
                await apiClient.syncPerson(personName, personEmail, personPhone, "client");
                onFeedback("People sync executed.");
              }}
            >
              Sync
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
