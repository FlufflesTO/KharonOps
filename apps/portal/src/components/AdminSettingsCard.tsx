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
    <article className="workspace-card glass-panel">
      <div className="panel-heading">
        <p className="panel-eyebrow">Administration</p>
        <h2>Office Settings</h2>
      </div>

      <div className="control-stack">
        <section className="control-block interaction-panel">
          <div className="control-block__head">
            <h3>Profile</h3>
            <p>Current admin account context.</p>
          </div>
          <div className="detail-grid mt-4 bg-glass border-glass rounded-lg p-6">
            <div>
              <dt className="text-muted text-xs uppercase tracking-wider mb-1">Display Name</dt>
              <dd className="text-white font-medium">{session?.session.display_name}</dd>
            </div>
            <div>
              <dt className="text-muted text-xs uppercase tracking-wider mb-1">Email Address</dt>
              <dd className="text-white font-medium">{session?.session.email}</dd>
            </div>
            <div>
              <dt className="text-muted text-xs uppercase tracking-wider mb-1">Assigned Role</dt>
              <dd className="text-white font-medium capitalize">{session?.session.role}</dd>
            </div>
          </div>
        </section>

        <section className="control-block mt-8 interaction-panel">
          <div className="control-block__head">
            <h3>Workspace Preferences</h3>
            <p>Customize the behavior and layout of the admin workspace.</p>
          </div>
          <div className="form-grid form-grid--two mt-4">
            <label className="field-stack">
              <span>Default landing tool</span>
              <div className="combo-input">
                <select value={workspaceTool} onChange={(event) => setWorkspaceTool(event.target.value)} className="enhanced-select">
                  {allowedWorkspaceTools.map((tool) => (
                    <option key={tool} value={tool}>
                      {tool}
                    </option>
                  ))}
                </select>
              </div>
            </label>
            <label className="toggle-box h-full">
              <input type="checkbox" checked={onboardingDraft} onChange={(event) => setOnboardingDraft(event.target.checked)} className="enhanced-checkbox" />
              <span>Keep first-time checklist dismissed</span>
            </label>
          </div>
          <div className="pin-grid mt-4">
            {pinCandidates.map((tool) => (
              <button
                key={tool}
                type="button"
                className={`button button--compact ${pinnedDraft.includes(tool) ? "button--primary" : "button--ghost enhanced-btn"}`}
                onClick={() => togglePin(tool)}
              >
                {pinnedDraft.includes(tool) ? "📌 " : ""}{tool}
              </button>
            ))}
          </div>
        </section>

        <section className="control-block mt-8 interaction-panel">
          <div className="control-block__head">
            <h3>Notifications & Region</h3>
            <p>Set local office preferences for alerts and reporting context.</p>
          </div>
          <div className="form-grid mt-4">
            <label className="toggle-box">
              <input
                type="checkbox"
                checked={settings.notifications.criticalJobs}
                className="enhanced-checkbox"
                onChange={(event) =>
                  setSettings((current) => ({
                    ...current,
                    notifications: { ...current.notifications, criticalJobs: event.target.checked }
                  }))
                }
              />
              <span>Email summaries for critical jobs</span>
            </label>
            <label className="toggle-box">
              <input
                type="checkbox"
                checked={settings.notifications.documents}
                className="enhanced-checkbox"
                onChange={(event) =>
                  setSettings((current) => ({
                    ...current,
                    notifications: { ...current.notifications, documents: event.target.checked }
                  }))
                }
              />
              <span>New document review alerts</span>
            </label>
          </div>

          <div className="form-grid form-grid--two mt-4 border-t border-white/10 pt-4">
            <div className="field-stack">
              <span>Primary Business Unit</span>
              <div className="combo-input">
                <select
                  value={settings.businessUnit}
                  className="enhanced-select"
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
            </div>
            <div className="field-stack">
              <span>Timezone</span>
              <div className="info-readout">{Intl.DateTimeFormat().resolvedOptions().timeZone}</div>
            </div>
          </div>
        </section>

        <div className="button-row mt-8 flex items-center justify-end gap-4">
          {saved && (
            <span className="text-positive text-sm font-medium animate-fade-in">
              ✓ Settings saved locally
            </span>
          )}
          <button 
            type="button" 
            className={`button button--large ${isSaving ? "button--loading" : "button--primary"}`} 
            onClick={save}
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Save settings"}
          </button>
        </div>
      </div>

      <style>{`
        .interaction-panel { background: rgba(255,255,255,0.02); padding: var(--space-6); border-radius: var(--radius-lg); border: 1px solid rgba(255,255,255,0.05); }
        .bg-glass { background: rgba(255,255,255,0.02); }
        .border-glass { border: 1px solid rgba(255,255,255,0.05); }
        .rounded-lg { border-radius: var(--radius-lg); }
        .p-6 { padding: 1.5rem; }
        .text-white { color: white; }
        .text-muted { color: var(--color-text-muted); }
        .text-positive { color: var(--color-positive); }
        .text-xs { font-size: 0.75rem; }
        .text-sm { font-size: 0.875rem; }
        .uppercase { text-transform: uppercase; }
        .capitalize { text-transform: capitalize; }
        .tracking-wider { letter-spacing: 0.05em; }
        .font-medium { font-weight: 500; }
        .mb-1 { margin-bottom: 0.25rem; }
        .mt-4 { margin-top: 1rem; }
        .mt-8 { margin-top: 2rem; }
        .pt-4 { padding-top: 1rem; }
        .border-t { border-top-width: 1px; border-style: solid; }
        .border-white\\\\/10 { border-color: rgba(255,255,255,0.1); }
        
        .flex { display: flex; }
        .flex-wrap { flex-wrap: wrap; }
        .items-center { align-items: center; }
        .justify-end { justify-content: flex-end; }
        .gap-4 { gap: 1rem; }
        .h-full { height: 100%; }
        
        .enhanced-select { width: 100%; padding: 0.875rem 1rem; background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.15); border-radius: var(--radius-md); color: white; font-size: 0.95rem; transition: border-color 0.2s; }
        .enhanced-select:focus { outline: none; border-color: var(--color-primary); box-shadow: 0 0 0 3px rgba(99,102,241,0.2); }
        .enhanced-checkbox { width: 1.25rem; height: 1.25rem; accent-color: var(--color-primary); }
        .info-readout { padding: 0.875rem 1rem; background: rgba(255,255,255,0.05); border-radius: var(--radius-md); color: white; font-size: 0.95rem; display: flex; align-items: center; }
        
        .toggle-box { display: flex; align-items: center; gap: 1rem; padding: 1rem; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1); border-radius: var(--radius-md); cursor: pointer; transition: all 0.2s; font-size: 0.95rem; }
        .toggle-box:hover { background: rgba(255,255,255,0.05); }
        
        .pin-grid { display: flex; flex-wrap: wrap; gap: 0.75rem; }
        .enhanced-btn { background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1); color: white; transition: all 0.2s; }
        .enhanced-btn:hover { background: rgba(255,255,255,0.05); border-color: rgba(255,255,255,0.2); }
        
        .button--large { padding: 1rem 2.5rem; font-size: 1.1rem; font-weight: 600; }
        .button--loading { opacity: 0.8; cursor: wait; }
        
        .animate-fade-in { animation: fadeIn 0.3s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </article>
  );
}
