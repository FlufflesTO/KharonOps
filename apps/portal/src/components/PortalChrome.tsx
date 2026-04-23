import React from "react";
import type { Role } from "@kharon/domain";
import type { PortalSession } from "../apiClient";
import { getRoleMenuLabel } from "../appShell/navigation";
import { WORKSPACE_TOOL_META } from "../appShell/helpers";

interface PortalChromeProps {
  session: PortalSession | null;
  effectiveRole: Role | "";
  emulatedRole: Role | "";
  offlineEnabled: boolean;
  onOfflineEnabledChange: (value: boolean) => void;
  networkOnline: boolean;
  syncPulseText: string;
  focusMode: boolean;
  onFocusModeChange: (value: boolean) => void;
  installPromptAvailable: boolean;
  onInstallApp: () => void;
  queueCount: number;
  onReplayQueue: () => void;
  onLogout: () => void;
  onGoHome: () => void;
  activeWorkspaceTool: string;
  onActiveWorkspaceToolChange: (tool: string) => void;
  primaryTools: string[];
  children: React.ReactNode;
}

export function PortalChrome({
  session,
  effectiveRole,
  emulatedRole,
  offlineEnabled,
  onOfflineEnabledChange,
  networkOnline,
  syncPulseText,
  focusMode,
  onFocusModeChange,
  installPromptAvailable,
  onInstallApp,
  queueCount,
  onReplayQueue,
  onLogout,
  onGoHome,
  activeWorkspaceTool,
  onActiveWorkspaceToolChange,
  primaryTools,
  children
}: PortalChromeProps): React.JSX.Element {
  const activeToolMeta = WORKSPACE_TOOL_META[activeWorkspaceTool] ?? {
    label: "Workspace",
    helper: "Use the sidebar to move between sections"
  };

  return (
    <>
      <header className="portal-topbar">
        <div className="portal-topbar__brand">
          <div className="portal-mark">
            <svg viewBox="0 0 100 100" width="28" height="28" aria-hidden="true">
              <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8" />
              <circle cx="50" cy="50" r="25" fill="currentColor" opacity="0.3" />
              <circle cx="50" cy="50" r="12" fill="currentColor" />
            </svg>
          </div>
          <div className="user-avatar" title={session?.session.display_name ?? "Portal user"}>
            {(session?.session.display_name ?? "Kharon Ops")
              .split(" ")
              .map((name) => name[0])
              .join("")
              .toUpperCase()}
          </div>
          <div>
            <div className="portal-title">KHARON OPS</div>
            <div className="portal-subtitle">
              {effectiveRole ? effectiveRole.replace("_", " ").toUpperCase() : "CLIENT"}
              {emulatedRole ? <span className="emulation-tag"> [EMULATING: {emulatedRole.toUpperCase()}]</span> : null}
            </div>
          </div>
        </div>

        <div className="portal-topbar__actions" role="toolbar" aria-label="Portal actions">
          <label className="toggle-inline">
            <input
              id="portal-offline-queue-toggle"
              name="portal_offline_queue_toggle"
              type="checkbox"
              checked={offlineEnabled}
              onChange={(event) => onOfflineEnabledChange(event.target.checked)}
              aria-label="Toggle offline queue mode"
            />
            Offline queue mode
          </label>
          <span className={`status-chip status-chip--${networkOnline ? "active" : "critical"}`} role="status" aria-live="polite">
            {networkOnline ? "Online" : "Offline"}
          </span>
          <span className="status-chip status-chip--neutral" title="Real-time sync pulse" aria-label={`Sync status: ${syncPulseText}`}>
            {syncPulseText}
          </span>
          <button
            className={`button ${focusMode ? "button--primary" : "button--ghost"}`}
            type="button"
            onClick={() => onFocusModeChange(!focusMode)}
            title="Toggle Focus Mode (F)"
            aria-pressed={focusMode}
            aria-label={focusMode ? "Exit Focus Mode" : "Enter Focus Mode"}
          >
            {focusMode ? "Exit Focus" : "Focus"}
          </button>
          {installPromptAvailable ? (
            <button className="button button--secondary" type="button" onClick={onInstallApp} aria-label="Install Kharon Ops app">
              Install App
            </button>
          ) : null}
          <button 
            className="button button--secondary" 
            type="button" 
            onClick={onReplayQueue}
            aria-label={`Synchronize ${queueCount} queued changes`}
          >
            Sync queued changes ({queueCount})
          </button>
          <button className="button button--secondary" type="button" onClick={onGoHome} aria-label="Go to overview dashboard">
            Overview
          </button>
          <button className="button button--ghost" type="button" onClick={onLogout} aria-label="Log out of Kharon Ops">
            Logout
          </button>
        </div>
      </header>

      <div className={`portal-layout ${activeWorkspaceTool === "jobs" ? "portal-layout--with-joblist" : "portal-layout--no-joblist"} ${focusMode ? "portal-layout--focus" : ""}`}>
        <aside className="portal-nav">
          <div className="portal-nav__header">
            <p className="portal-nav__label">Workspace</p>
            <h3>{activeToolMeta.label}</h3>
            <p className="portal-nav__helper">{activeToolMeta.helper}</p>
          </div>

          <nav className="portal-nav__list" aria-label="Portal sections" role="navigation">
            <button
              type="button"
              className={`portal-nav__item ${activeWorkspaceTool === "jobs" ? "portal-nav__item--active" : ""}`}
              onClick={() => onActiveWorkspaceToolChange("jobs")}
              aria-current={activeWorkspaceTool === "jobs" ? "page" : undefined}
              aria-label={`Navigate to ${getRoleMenuLabel("jobs", effectiveRole)} - Primary workspace`}
            >
              <span>{getRoleMenuLabel("jobs", effectiveRole)}</span>
              <small>Primary workspace</small>
            </button>

            {primaryTools
              .filter((tool) => tool !== "jobs")
              .map((tool) => {
                const item = WORKSPACE_TOOL_META[tool] ?? { label: tool, helper: "" };
                const active = tool === activeWorkspaceTool;
                return (
                  <button
                    key={tool}
                    type="button"
                    className={`portal-nav__item ${active ? "portal-nav__item--active" : ""}`}
                    onClick={() => onActiveWorkspaceToolChange(tool)}
                    aria-current={active ? "page" : undefined}
                    aria-label={`Navigate to ${getRoleMenuLabel(tool, effectiveRole)}${item.helper ? ` - ${item.helper}` : ""}`}
                  >
                    <span>{getRoleMenuLabel(tool, effectiveRole)}</span>
                    <small>{item.helper}</small>
                  </button>
                );
              })}
          </nav>

        </aside>

        {children}
      </div>
    </>
  );
}
