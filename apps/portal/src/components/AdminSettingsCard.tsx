import React from "react";
import type { PortalSession } from "../apiClient";

interface AdminSettingsCardProps {
  session: PortalSession | null;
}

export function AdminSettingsCard({ session }: AdminSettingsCardProps): React.JSX.Element {
  return (
    <article className="workspace-card">
      <div className="panel-heading">
        <p className="panel-eyebrow">Administration</p>
        <h2>Office Settings</h2>
      </div>

      <div className="control-stack">
        <section className="control-block">
          <div className="control-block__head">
            <h3>Profile</h3>
            <p>Manage your office identity and display preferences.</p>
          </div>
          <div className="detail-grid">
            <div>
              <dt>Display Name</dt>
              <dd>{session?.session.display_name}</dd>
            </div>
            <div>
              <dt>Email Address</dt>
              <dd>{session?.session.email}</dd>
            </div>
            <div>
              <dt>Assigned Role</dt>
              <dd className="text-capitalize">{session?.session.role}</dd>
            </div>
          </div>
        </section>

        <section className="control-block">
          <div className="control-block__head">
            <h3>Office Notifications</h3>
            <p>Choose how you want to be alerted about job updates.</p>
          </div>
          <div className="form-grid">
            <label className="toggle-inline">
              <input type="checkbox" defaultChecked />
              Email summaries for critical jobs
            </label>
            <label className="toggle-inline">
              <input type="checkbox" defaultChecked />
              New document review alerts
            </label>
          </div>
        </section>

        <section className="control-block">
          <div className="control-block__head">
            <h3>Regional Preferences</h3>
            <p>Set the default context for office-level reporting.</p>
          </div>
          <div className="form-grid">
            <div className="field-stack">
              <span>Primary Business Unit</span>
              <select defaultValue="hq">
                <option value="hq">Kharon South Africa (HQ)</option>
                <option value="wc">Kharon Western Cape</option>
              </select>
            </div>
            <div className="field-stack">
              <span>Timezone</span>
              <dd>{Intl.DateTimeFormat().resolvedOptions().timeZone}</dd>
            </div>
          </div>
        </section>
      </div>

      <style>{`
        .text-capitalize { text-transform: capitalize; }
      `}</style>
    </article>
  );
}
