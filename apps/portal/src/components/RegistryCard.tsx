import React, { useState } from "react";
import { apiClient } from "../apiClient";

interface RegistryCardProps {
  onFeedback: (msg: string) => void;
}

export function RegistryCard({ onFeedback }: RegistryCardProps): React.JSX.Element {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [roleHint, setRoleHint] = useState("technician");

  const handleSync = async () => {
    try {
      if (!name || !email) {
        onFeedback("Name and email are required for registry sync.");
        return;
      }
      await apiClient.syncPerson(name, email, phone, roleHint);
      onFeedback(`Person synced to registry: ${name}`);
      setName("");
      setEmail("");
      setPhone("");
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      onFeedback(`Registry sync failed: ${msg}`);
    }

  };

  return (
    <article className="workspace-card">
      <div className="panel-heading panel-heading--inline">
        <div>
          <p className="panel-eyebrow">Registry</p>
          <h2>People Sync</h2>
        </div>
      </div>
      
      <div className="control-block">
        <div className="control-block__head">
          <h3>Synchronize Identity</h3>
        </div>
        <div className="form-grid">
          <label className="field-stack">
            <span>Full Name</span>
            <input 
              value={name} 
              onChange={e => setName(e.target.value)} 
              placeholder="e.g. John Doe"
            />
          </label>
          <label className="field-stack">
            <span>Email Address</span>
            <input 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              placeholder="e.g. john@kharon.co.za"
            />
          </label>
          <label className="field-stack">
            <span>Phone (Optional)</span>
            <input 
              value={phone} 
              onChange={e => setPhone(e.target.value)} 
              placeholder="+27..."
            />
          </label>
          <label className="field-stack">
            <span>Role Mapping</span>
            <select value={roleHint} onChange={e => setRoleHint(e.target.value)}>
              <option value="technician">Technician</option>
              <option value="client">Client Contact</option>
              <option value="dispatcher">Dispatcher</option>
              <option value="admin">Administrator</option>
            </select>
          </label>
          <div className="field-stack field-stack--action">
            <span>&nbsp;</span>
            <button className="button button--primary" onClick={handleSync}>
              Sync to Platform
            </button>
          </div>
        </div>
      </div>

      <div className="highlight-box">
        <span className="highlight-box__label">Notice</span>
        <p>Registry changes propagate to the Command Centre and Field Rails automatically. Use this to onboard new technicians or client stakeholders.</p>
      </div>
    </article>
  );
}
