import React, { useMemo, useState } from "react";
import type { PeopleDirectoryEntry } from "../apiClient";

function errorMessage(error: unknown): string {
  const typed = error as { error?: { message?: string } };
  return typed.error?.message ?? String(error);
}

interface PeopleDirectoryCardProps {
  people: PeopleDirectoryEntry[];
  onSync: (payload: { name: string; email: string; phone: string; roleHint: string }) => Promise<void>;
  onFeedback: (message: string) => void;
}

const ROLE_LABELS: Record<string, string> = {
  client: "Client",
  technician: "Technician",
  dispatcher: "Dispatcher",
  admin: "Admin",
  super_admin: "Super Admin"
};

export function PeopleDirectoryCard({ people, onSync, onFeedback }: PeopleDirectoryCardProps): React.JSX.Element {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [roleHint, setRoleHint] = useState("client");

  const counts = useMemo(() => {
    return people.reduce<Record<string, number>>((accumulator, person) => {
      accumulator[person.role] = (accumulator[person.role] ?? 0) + 1;
      return accumulator;
    }, {});
  }, [people]);

  return (
    <article className="workspace-card">
      <div className="panel-heading panel-heading--inline">
        <div>
          <p className="panel-eyebrow">Registry</p>
          <h2>People directory</h2>
        </div>
        <span className="count-pill" title={`${people.length} active people in scope`}>
          {people.length}
        </span>
      </div>

      <div className="button-row">
        {Object.entries(counts).map(([role, count]) => (
          <span key={role} className="status-chip status-chip--neutral">
            {ROLE_LABELS[role] ?? role}: {count}
          </span>
        ))}
      </div>

      <div className="control-block">
        <div className="control-block__head">
          <h3>Sync contact</h3>
          <p>Push a contact update into the shared people rail, then review the active role directory below.</p>
        </div>
        <div className="form-grid">
          <label className="field-stack">
            <span>Name</span>
            <input
              name="person_name"
              autoComplete="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Operator name…"
            />
          </label>
          <label className="field-stack">
            <span>Email</span>
            <input
              name="person_email"
              type="email"
              autoComplete="email"
              spellCheck={false}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="operator@example.com"
            />
          </label>
          <label className="field-stack">
            <span>Phone</span>
            <input
              name="person_phone"
              type="tel"
              autoComplete="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="+27 61 234 5678"
            />
          </label>
          <label className="field-stack">
            <span>Role hint</span>
            <select name="person_role_hint" value={roleHint} onChange={(event) => setRoleHint(event.target.value)}>
              <option value="client">Client</option>
              <option value="technician">Technician</option>
              <option value="dispatcher">Dispatcher</option>
              <option value="admin">Admin</option>
            </select>
          </label>
          <div className="field-stack field-stack--action field-stack--full">
            <span>&nbsp;</span>
            <button
              className="button button--secondary"
              type="button"
              onClick={async () => {
                if (name.trim() === "" || email.trim() === "" || phone.trim() === "") {
                  onFeedback("Complete the name, email, and phone before syncing a contact.");
                  return;
                }

                try {
                  await onSync({
                    name: name.trim(),
                    email: email.trim(),
                    phone: phone.trim(),
                    roleHint
                  });
                  setName("");
                  setEmail("");
                  setPhone("");
                  setRoleHint("client");
                } catch (error) {
                  onFeedback(errorMessage(error));
                }
              }}
            >
              Sync person
            </button>
          </div>
        </div>
      </div>

      <div className="control-block">
        <div className="control-block__head">
          <h3>Active directory</h3>
          <p>These are the currently active people records available to dispatch and admin operators.</p>
        </div>
        <div className="history-table">
          {people.length === 0 ? (
            <p className="muted-copy">No active people records are loaded for this workspace.</p>
          ) : (
            people.map((person) => (
              <div key={person.user_uid} className="history-row history-row--people">
                <strong>{person.display_name}</strong>
                <span>{ROLE_LABELS[person.role] ?? person.role}</span>
                <span>{person.email}</span>
                <span className="history-row__url">{person.technician_uid || person.client_uid || person.user_uid}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </article>
  );
}

