import React, { useEffect, useMemo, useState } from "react";
import type { PortalSession } from "../apiClient";

interface AdminSettingsCardProps {
  session: PortalSession | null;
  defaultWorkspaceTool: string;
  pinnedTools: string[];
  onboardingDismissed: boolean;
  allowedWorkspaceTools: string[];
  onSavePreferences: (preferences: {
    defaultWorkspaceTool: string;
    pinnedTools: string[];
    onboardingDismissed: boolean;
  }) => void;
}

const STORAGE_KEY = "kharon_admin_local_settings";

type LocalSettings = {
  notifications: {
    criticalJobs: boolean;
    documents: boolean;
  };
  businessUnit: string;
};

const DEFAULT_SETTINGS: LocalSettings = {
  notifications: {
    criticalJobs: true,
    documents: true
  },
  businessUnit: "hq"
};

function loadSettings(): LocalSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<LocalSettings>;
    return {
      notifications: {
        criticalJobs: parsed.notifications?.criticalJobs ?? DEFAULT_SETTINGS.notifications.criticalJobs,
        documents: parsed.notifications?.documents ?? DEFAULT_SETTINGS.notifications.documents
      },
      businessUnit: parsed.businessUnit ?? DEFAULT_SETTINGS.businessUnit
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function AdminSettingsCard({
  session,
  defaultWorkspaceTool,
  pinnedTools,
  onboardingDismissed,
  allowedWorkspaceTools,
  onSavePreferences
}: AdminSettingsCardProps): React.JSX.Element {
  const [settings, setSettings] = useState<LocalSettings>(loadSettings);
  const [saved, setSaved] = useState(false);
  const [workspaceTool, setWorkspaceTool] = useState(defaultWorkspaceTool);
  const [pinnedDraft, setPinnedDraft] = useState<string[]>(pinnedTools);
  const [onboardingDraft, setOnboardingDraft] = useState(onboardingDismissed);

  useEffect(() => {
    setWorkspaceTool(defaultWorkspaceTool);
  }, [defaultWorkspaceTool]);

  useEffect(() => {
    setPinnedDraft(pinnedTools);
  }, [pinnedTools]);

  useEffect(() => {
    setOnboardingDraft(onboardingDismissed);
  }, [onboardingDismissed]);

  const pinCandidates = useMemo(
    () => allowedWorkspaceTools.filter((tool) => ["jobs", "documents", "schedule", "people", "admin"].includes(tool)),
    [allowedWorkspaceTools]
  );

  function save(): void {
    onSavePreferences({
      defaultWorkspaceTool: workspaceTool,
      pinnedTools: pinnedDraft,
      onboardingDismissed: onboardingDraft
    });
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);
  }

  function togglePin(tool: string): void {
    setPinnedDraft((current) =>
      current.includes(tool) ? current.filter((item) => item !== tool) : [...current, tool]
    );
  }

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
            <p>Review the current admin account and apply workspace preferences.</p>
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
            <h3>Workspace Preferences</h3>
            <p>Choose where the admin workspace should land, what to pin, and whether onboarding stays hidden.</p>
          </div>
          <div className="form-grid form-grid--two">
            <label className="field-stack">
              <span>Default landing tool</span>
              <select value={workspaceTool} onChange={(event) => setWorkspaceTool(event.target.value)}>
                {allowedWorkspaceTools.map((tool) => (
                  <option key={tool} value={tool}>
                    {tool}
                  </option>
                ))}
              </select>
            </label>
            <label className="toggle-inline">
              <input type="checkbox" checked={onboardingDraft} onChange={(event) => setOnboardingDraft(event.target.checked)} />
              Keep first-time checklist dismissed
            </label>
          </div>
          <div className="pin-grid">
            {pinCandidates.map((tool) => (
              <button
                key={tool}
                type="button"
                className={`button ${pinnedDraft.includes(tool) ? "button--primary" : "button--secondary"} button--compact`}
                onClick={() => togglePin(tool)}
              >
                {tool}
              </button>
            ))}
          </div>
        </section>

        <section className="control-block">
          <div className="control-block__head">
            <h3>Notification Preferences</h3>
            <p>Set local office preferences for critical job and document alerts.</p>
          </div>
          <div className="form-grid">
            <label className="toggle-inline">
              <input
                type="checkbox"
                checked={settings.notifications.criticalJobs}
                onChange={(event) =>
                  setSettings((current) => ({
                    ...current,
                    notifications: { ...current.notifications, criticalJobs: event.target.checked }
                  }))
                }
              />
              Email summaries for critical jobs
            </label>
            <label className="toggle-inline">
              <input
                type="checkbox"
                checked={settings.notifications.documents}
                onChange={(event) =>
                  setSettings((current) => ({
                    ...current,
                    notifications: { ...current.notifications, documents: event.target.checked }
                  }))
                }
              />
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
              <select
                value={settings.businessUnit}
                onChange={(event) =>
                  setSettings((current) => ({
                    ...current,
                    businessUnit: event.target.value
                  }))
                }
              >
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

        <div className="button-row">
          <button type="button" className="button button--primary" onClick={save}>
            Save settings
          </button>
          {saved ? <span className="muted-copy">Settings saved locally and applied to the workspace.</span> : null}
        </div>
      </div>

      <style>{`
        .text-capitalize { text-transform: capitalize; }
        .pin-grid { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 1rem; }
      `}</style>
    </article>
  );
}
