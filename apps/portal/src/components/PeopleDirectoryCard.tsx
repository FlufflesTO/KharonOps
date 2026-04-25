import React, { useMemo, useState } from "react";
import type { PeopleDirectoryEntry, SkillMatrixRecord } from "../apiClient";

function errorMessage(error: unknown): string {
  const typed = error as { error?: { message?: string } };
  return typed.error?.message ?? String(error);
}

interface PeopleDirectoryCardProps {
  people: PeopleDirectoryEntry[];
  skillsState: SkillMatrixRecord[];
  onUpsertSkill: (payload: SkillMatrixRecord) => void;
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

export function PeopleDirectoryCard({ people, skillsState, onUpsertSkill, onSync, onFeedback }: PeopleDirectoryCardProps): React.JSX.Element {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [roleHint, setRoleHint] = useState("client");
  const [isSyncing, setIsSyncing] = useState(false);

  const counts = useMemo(() => {
    return people.reduce<Record<string, number>>((accumulator, person) => {
      accumulator[person.role] = (accumulator[person.role] ?? 0) + 1;
      return accumulator;
    }, {});
  }, [people]);

  function skillFor(userid: string) {
    return skillsState.find((item) => item.user_id === userid) ?? null;
  }

  function setSkillField(userid: string, patch: Partial<{ saqcc_type: string; saqcc_expiry: string; medical_expiry: string; rest_hours_last_24h: number }>): void {
    const current = skillFor(userid);
    onUpsertSkill({
      user_id: userid,
      saqcc_type: patch.saqcc_type ?? current?.saqcc_type ?? "",
      saqcc_expiry: patch.saqcc_expiry ?? current?.saqcc_expiry ?? "",
      medical_expiry: patch.medical_expiry ?? current?.medical_expiry ?? "",
      rest_hours_last_24h: patch.rest_hours_last_24h ?? current?.rest_hours_last_24h ?? 0
    });
  }

  async function handleSync(): Promise<void> {
    if (name.trim() === "" || email.trim() === "" || phone.trim() === "") {
      onFeedback("Identity parameters (name, email, phone) are required for registry handshake.");
      return;
    }

    setIsSyncing(true);
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
      onFeedback(`Identity synchronized: ${name.trim()}`);
    } catch (error) {
      onFeedback(errorMessage(error));
    } finally {
      setIsSyncing(false);
    }
  }

  return (
    <article className="workspace-card workspace-card--primary">
      <div className="panel-header-premium">
        <div className="panel-title-stack">
          <span className="panel-eyebrow-premium">Registry & Authority</span>
          <h2 className="panel-title-premium">Institutional People Directory</h2>
        </div>
        <div className="action-row-premium">
          <span className="count-pill-premium">
            <strong>{people.length}</strong>
            <span>Active Entities</span>
          </span>
        </div>
      </div>

      <div className="admin-intelligence-layout">
        <section className="governance-section">
          <div className="section-head-premium">
            <h3>Registry Composition</h3>
            <p>Distribution of authorized actors across functional roles.</p>
          </div>
          <div className="stats-grid-premium stats-grid-premium--compact">
            {Object.entries(counts).map(([role, count]) => (
              <div key={role} className="intelligence-card">
                <span className="intel-label">{ROLE_LABELS[role] ?? role}</span>
                <strong className="intel-value">{count}</strong>
              </div>
            ))}
          </div>
        </section>

        <section className="governance-section">
          <div className="section-head-premium">
            <h3>Identity Handshake</h3>
            <p>Synchronize a new actor or update existing identity metadata in the global registry.</p>
          </div>
          <div className="form-grid-premium">
            <div className="field-group-premium">
              <label className="field-label-premium">Legal Name</label>
              <input
                className="input-premium"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Forensic Identity..."
              />
            </div>
            <div className="field-group-premium">
              <label className="field-label-premium">Institutional Email</label>
              <input
                className="input-premium"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="actor@kharon.co.za"
              />
            </div>
            <div className="field-group-premium">
              <label className="field-label-premium">Primary Contact</label>
              <input
                className="input-premium"
                type="tel"
                autoComplete="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+27..."
              />
            </div>
            <div className="field-group-premium">
              <label className="field-label-premium">Functional Role</label>
              <div className="select-container-premium">
                <select className="select-premium" value={roleHint} onChange={(e) => setRoleHint(e.target.value)}>
                  <option value="client">Client Stakeholder</option>
                  <option value="technician">Field Technician</option>
                  <option value="dispatcher">Operations Dispatcher</option>
                  <option value="finance">Financial Controller</option>
                  <option value="admin">Platform Administrator</option>
                </select>
              </div>
            </div>
            <div className="field-group-premium field-group-premium--action">
              <button 
                className={`button button--premium-action ${isSyncing ? "button--loading" : ""}`} 
                onClick={handleSync}
                disabled={isSyncing}
              >
                <div className="button-inner">
                  {isSyncing ? <span className="loader-mini" /> : null}
                  <span>{isSyncing ? "Syncing..." : "Synchronize Identity"}</span>
                </div>
              </button>
            </div>
          </div>
        </section>

        <section className="governance-section">
          <div className="section-head-premium">
            <h3>Competency & Readiness Matrix</h3>
            <p>Verifiable technician credentials, medical status, and fatigue governance.</p>
          </div>
          <div className="history-table-premium">
            {people.length === 0 ? (
              <div className="empty-state-placeholder">No institutional entities found in current scope.</div>
            ) : (
              people.map((person) => {
                const skill = skillFor(person.user_id);
                const restHours = skill?.rest_hours_last_24h ?? 0;
                const fatigue = restHours < 8;
                const certExpired = skill?.saqcc_expiry ? Date.parse(skill.saqcc_expiry) < Date.now() : false;
                const medicalExpired = skill?.medical_expiry ? Date.parse(skill.medical_expiry) < Date.now() : false;
                
                return (
                  <div key={person.user_id} className="history-row-premium history-row-premium--complex">
                    <div className="row-id-stack">
                      <strong>{person.display_name}</strong>
                      <span>{person.email}</span>
                      <div className="role-pill-small">{ROLE_LABELS[person.role] ?? person.role}</div>
                    </div>

                    <div className="competency-grid-premium">
                      <div className="field-group-premium field-group-premium--compact">
                        <label className="field-label-premium">SAQCC Cert</label>
                        <div className="input-pair-premium">
                          <input
                            className="input-premium"
                            value={skill?.saqcc_type ?? ""}
                            onChange={(e) => setSkillField(person.user_id, { saqcc_type: e.target.value })}
                            placeholder="Type"
                          />
                          <input
                            className="input-premium"
                            type="date"
                            value={skill?.saqcc_expiry ?? ""}
                            onChange={(e) => setSkillField(person.user_id, { saqcc_expiry: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="field-group-premium field-group-premium--compact">
                        <label className="field-label-premium">Medical & Rest</label>
                        <div className="input-pair-premium">
                          <input
                            className="input-premium"
                            type="date"
                            value={skill?.medical_expiry ?? ""}
                            onChange={(e) => setSkillField(person.user_id, { medical_expiry: e.target.value })}
                            title="Medical Expiry"
                          />
                          <input
                            className="input-premium"
                            type="number"
                            min={0}
                            max={24}
                            value={skill?.rest_hours_last_24h ?? 0}
                            onChange={(e) => setSkillField(person.user_id, { rest_hours_last_24h: Number(e.target.value) })}
                            title="Rest Hours"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="readiness-indicators-premium">
                      <div className={`readiness-pill ${fatigue ? "readiness-pill--critical" : "readiness-pill--success"}`}>
                        {fatigue ? "Fatigue Risk" : "Rest Verified"}
                      </div>
                      <div className={`readiness-pill ${certExpired ? "readiness-pill--critical" : "readiness-pill--success"}`}>
                        {certExpired ? "Cert Expired" : "Cert Valid"}
                      </div>
                      <div className={`readiness-pill ${medicalExpired ? "readiness-pill--critical" : "readiness-pill--success"}`}>
                        {medicalExpired ? "Medical Alert" : "Medical OK"}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>
    </article>
  );
}
