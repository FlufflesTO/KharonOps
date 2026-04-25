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
  const [isSaving, setIsSaving] = useState(false);
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
    setIsSaving(true);
    setTimeout(() => {
      onSavePreferences({
        defaultWorkspaceTool: workspaceTool,
        pinnedTools: pinnedDraft,
        onboardingDismissed: onboardingDraft
      });
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      setIsSaving(false);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2000);
    }, 600);
  }

  function togglePin(tool: string): void {
    setPinnedDraft((current) =>
      current.includes(tool) ? current.filter((item) => item !== tool) : [...current, tool]
    );
  }

  return (
    <article className="workspace-card workspace-card--primary">
      <div className="panel-header-premium">
        <div className="panel-title-stack">
          <span className="panel-eyebrow-premium">Operational Config</span>
          <h2 className="panel-title-premium">Workspace Preferences</h2>
        </div>
        <div className="button-group-premium">
          {saved && (
            <span className="save-confirmation-glow">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
              <span>Preferences Synchronized</span>
            </span>
          )}
          <button 
            type="button" 
            className={`button button--premium-action ${isSaving ? "button--loading" : ""}`} 
            onClick={save}
            disabled={isSaving}
          >
            <div className="button-inner">
              {isSaving ? <span className="loader-mini" /> : null}
              <span>{isSaving ? "Applying..." : "Save Preferences"}</span>
            </div>
          </button>
        </div>
      </div>

      <div className="admin-intelligence-layout">
        <section className="governance-section">
          <div className="section-head-premium">
            <h3>Authority Context</h3>
            <p>Active administrative profile and assigned governance role.</p>
          </div>
          <div className="posture-grid-premium">
            <div className="posture-card">
              <span className="posture-label">Identity</span>
              <strong className="posture-value">{session?.session.display_name}</strong>
              <p className="intel-description mt-2">{session?.session.email}</p>
            </div>
            <div className="posture-card">
              <span className="posture-label">Institutional Role</span>
              <strong className="posture-value capitalize">{session?.session.role?.replace("_", " ")}</strong>
              <p className="intel-description mt-2">Authority Level: Verified</p>
            </div>
          </div>
        </section>

        <section className="governance-section">
          <div className="section-head-premium">
            <h3>Layout Automation</h3>
            <p>Control how your workspace initializes and surfaces priority tools.</p>
          </div>
          <div className="settings-form-layout">
            <div className="field-group-premium">
              <label className="field-label-premium">Default Entry Tool</label>
              <div className="select-container-premium">
                <select value={workspaceTool} onChange={(event) => setWorkspaceTool(event.target.value)} className="select-premium">
                  {allowedWorkspaceTools.map((tool) => (
                    <option key={tool} value={tool}>
                      {tool.charAt(0).toUpperCase() + tool.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <p className="field-help-premium">The primary interface loaded upon successful authentication.</p>
            </div>

            <div className="field-group-premium">
              <label className="field-label-premium">Checklist Persistence</label>
              <div className="toggle-premium" onClick={() => setOnboardingDraft(!onboardingDraft)}>
                <div className={`toggle-track ${onboardingDraft ? "toggle-track--active" : ""}`}>
                  <div className="toggle-thumb" />
                </div>
                <span>Suppress onboarding guidance checklist</span>
              </div>
            </div>
          </div>

          <div className="field-group-premium mt-8">
            <label className="field-label-premium">Pinned Quick-Access Registry</label>
            <div className="emulation-grid">
              {pinCandidates.map((tool) => (
                <button
                  key={tool}
                  type="button"
                  className={`emulation-pill ${pinnedDraft.includes(tool) ? "emulation-pill--active" : ""}`}
                  onClick={() => togglePin(tool)}
                >
                  <span>{pinnedDraft.includes(tool) ? "📌 " : ""}{tool}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="governance-section">
          <div className="section-head-premium">
            <h3>Alert & Regional Governance</h3>
            <p>Configure telemetry propagation and regional operational context.</p>
          </div>
          <div className="settings-form-layout">
            <div className="field-group-premium">
              <label className="field-label-premium">Notification Protocol</label>
              <div className="toggle-stack-premium">
                <div className="toggle-premium" onClick={() => setSettings(s => ({ ...s, notifications: { ...s.notifications, criticalJobs: !s.notifications.criticalJobs } }))}>
                  <div className={`toggle-track ${settings.notifications.criticalJobs ? "toggle-track--active" : ""}`}>
                    <div className="toggle-thumb" />
                  </div>
                  <span>Propagate critical job alerts to email</span>
                </div>
                <div className="toggle-premium" onClick={() => setSettings(s => ({ ...s, notifications: { ...s.notifications, documents: !s.notifications.documents } }))}>
                  <div className={`toggle-track ${settings.notifications.documents ? "toggle-track--active" : ""}`}>
                    <div className="toggle-thumb" />
                  </div>
                  <span>Alert on pending evidence publications</span>
                </div>
              </div>
            </div>

            <div className="field-group-premium">
              <label className="field-label-premium">Institutional Unit</label>
              <div className="select-container-premium">
                <select
                  value={settings.businessUnit}
                  className="select-premium"
                  onChange={(event) => setSettings(s => ({ ...s, businessUnit: event.target.value }))}
                >
                  <option value="hq">Kharon South Africa (HQ)</option>
                  <option value="wc">Kharon Western Cape</option>
                </select>
              </div>
              <p className="field-help-premium">Canonical timezone: {Intl.DateTimeFormat().resolvedOptions().timeZone}</p>
            </div>
          </div>
        </section>
      </div>
    </article>
  );
}

