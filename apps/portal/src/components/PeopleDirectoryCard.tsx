import React, { useMemo, useState } from "react";
import type { PeopleDirectoryEntry } from "../apiClient";
import { loadUpgradeStore, upsertSkill } from "../features/upgradeStore";

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
  finance: "Finance",
  admin: "Admin",
  super_admin: "Super Admin"
};

export function PeopleDirectoryCard({ people, onSync, onFeedback }: PeopleDirectoryCardProps): React.JSX.Element {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [roleHint, setRoleHint] = useState("client");
  const [skillsState, setSkillsState] = useState(() => loadUpgradeStore().skills);

  const counts = useMemo(() => {
    return people.reduce<Record<string, number>>((accumulator, person) => {
      accumulator[person.role] = (accumulator[person.role] ?? 0) + 1;
      return accumulator;
    }, {});
  }, [people]);

  function skillFor(userUid: string) {
    return skillsState.find((item) => item.user_uid === userUid) ?? null;
  }

  function setSkillField(userUid: string, patch: Partial<{ saqcc_type: string; saqcc_expiry: string; medical_expiry: string; rest_hours_last_24h: number }>): void {
    const current = skillFor(userUid);
    const next = upsertSkill({
      user_uid: userUid,
      saqcc_type: patch.saqcc_type ?? current?.saqcc_type ?? "",
      saqcc_expiry: patch.saqcc_expiry ?? current?.saqcc_expiry ?? "",
      medical_expiry: patch.medical_expiry ?? current?.medical_expiry ?? "",
      rest_hours_last_24h: patch.rest_hours_last_24h ?? current?.rest_hours_last_24h ?? 0,
      updated_at: new Date().toISOString()
    });
    setSkillsState(next.skills);
  }

  return (
    <article className="workspace-card">
      <div className="panel-heading panel-heading--inline">
        <div>
          <p className="panel-eyebrow">Registry</p>
          <h2>People directory and skills matrix</h2>
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
              <option value="finance">Finance</option>
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
          <h3>Active directory and competency matrix</h3>
          <p>Track SAQCC certs, medicals, and rest windows for dispatch readiness.</p>
        </div>
        <div className="history-table">
          {people.length === 0 ? (
            <p className="muted-copy">No active people records are loaded for this workspace.</p>
          ) : (
            people.map((person) => {
              const skill = skillFor(person.user_uid);
              const restHours = skill?.rest_hours_last_24h ?? 0;
              const fatigue = restHours < 8;
              const certExpired = skill?.saqcc_expiry ? Date.parse(skill.saqcc_expiry) < Date.now() : false;
              const medicalExpired = skill?.medical_expiry ? Date.parse(skill.medical_expiry) < Date.now() : false;
              return (
                <div key={person.user_uid} className="history-row history-row--people" style={{ gridTemplateColumns: "1fr 0.9fr 1.4fr 1.2fr" }}>
                  <div>
                    <strong>{person.display_name}</strong>
                    <span className="job-item__meta">{ROLE_LABELS[person.role] ?? person.role}</span>
                    <span className="job-item__meta">{person.email}</span>
                  </div>
                  <span className="history-row__url">{person.technician_uid || person.client_uid || person.user_uid}</span>
                  <div className="form-grid" style={{ gridTemplateColumns: "repeat(2, minmax(110px, 1fr))" }}>
                    <input
                      value={skill?.saqcc_type ?? ""}
                      onChange={(event) => setSkillField(person.user_uid, { saqcc_type: event.target.value })}
                      placeholder="SAQCC Type"
                    />
                    <input
                      type="date"
                      value={skill?.saqcc_expiry ?? ""}
                      onChange={(event) => setSkillField(person.user_uid, { saqcc_expiry: event.target.value })}
                      title="SAQCC expiry"
                    />
                    <input
                      type="date"
                      value={skill?.medical_expiry ?? ""}
                      onChange={(event) => setSkillField(person.user_uid, { medical_expiry: event.target.value })}
                      title="Medical expiry"
                    />
                    <input
                      type="number"
                      min={0}
                      max={24}
                      value={skill?.rest_hours_last_24h ?? 0}
                      onChange={(event) => setSkillField(person.user_uid, { rest_hours_last_24h: Number(event.target.value) })}
                      title="Rest hours in last 24h"
                    />
                  </div>
                  <div className="button-row">
                    <span className={`status-chip status-chip--${fatigue ? "warning" : "active"}`}>{fatigue ? "Fatigue Risk" : "Rest OK"}</span>
                    <span className={`status-chip status-chip--${certExpired ? "critical" : "active"}`}>{certExpired ? "Cert Expired" : "Cert Valid"}</span>
                    <span className={`status-chip status-chip--${medicalExpired ? "critical" : "active"}`}>{medicalExpired ? "Medical Expired" : "Medical OK"}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </article>
  );
}
