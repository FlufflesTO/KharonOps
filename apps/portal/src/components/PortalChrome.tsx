/**
 * KharonOps - Portal Framework Shell
 * Purpose: Primary navigation and structural shell for the operational workspace.
 * Dependencies: chrome-hardened.css, @kharon/domain
 */

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
    helper: "Select a registry tool"
  };

  return (
    <>
      <header className="portal-topbar">
        <div className="portal-topbar__brand flex items-center gap-6">
          <div className="portal-mark">
            <svg viewBox="0 0 100 100" width="32" height="32" aria-hidden="true" className="animate-pulse-slow">
              <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="6" strokeDasharray="10 5" />
              <circle cx="50" cy="50" r="25" fill="currentColor" opacity="0.1" />
              <path d="M50 25 L50 75 M25 50 L75 50" stroke="currentColor" strokeWidth="4" />
            </svg>
          </div>
          
          <div>
            <div className="portal-title tracking-[0.3em]">KHARON OPS</div>
            <div className="portal-subtitle flex items-center gap-2">
              <span className="opacity-60">{effectiveRole ? effectiveRole.replace("_", " ").toUpperCase() : "CLIENT"}</span>
              {emulatedRole && <span className="px-1.5 py-0.5 rounded bg-critical/20 text-critical text-[8px] font-black">EMULATING: {emulatedRole.toUpperCase()}</span>}
            </div>
          </div>
        </div>

        <div className="portal-topbar__actions flex items-center gap-4">
          <div className="flex items-center gap-2 bg-black/20 rounded-full px-4 py-1.5 border border-white/5">
            <div className={`w-1.5 h-1.5 rounded-full ${networkOnline ? "bg-primary-light shadow-[0_0_8px_var(--color-primary-light)]" : "bg-critical shadow-[0_0_8px_var(--color-critical)]"}`}></div>
            <span className="text-[10px] font-bold text-white/60 tracking-wider uppercase">{networkOnline ? "Live Sync" : "Isolated"}</span>
          </div>

          <details className="portal-topbar__utilities relative">
            <summary className="button button--ghost px-4 py-2 text-[10px] font-black uppercase tracking-widest border border-white/5 hover:bg-white/5">Protocol</summary>
            <div className="portal-topbar__utility-menu absolute right-0 mt-4 p-4 glass-panel min-w-[240px] shadow-2xl flex flex-col gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex flex-col gap-2">
                <p className="text-[10px] font-bold opacity-30 uppercase tracking-widest mb-1">State Controls</p>
                <label className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors cursor-pointer group">
                  <span className="text-xs font-bold opacity-60 group-hover:opacity-100">Offline Queue</span>
                  <input
                    type="checkbox"
                    className="toggle-switch"
                    checked={offlineEnabled}
                    onChange={(e) => onOfflineEnabledChange(e.target.checked)}
                  />
                </label>
                <button
                  className={`button flex justify-between items-center p-3 rounded-xl border border-white/5 ${focusMode ? "bg-primary/20 border-primary/20" : "bg-white/5 hover:bg-white/10"}`}
                  type="button"
                  onClick={() => onFocusModeChange(!focusMode)}
                >
                  <span className="text-xs font-bold">{focusMode ? "Exit Focus" : "Focus Protocol"}</span>
                  <kbd className="text-[10px] opacity-40 font-mono">F</kbd>
                </button>
              </div>

              <div className="flex flex-col gap-2">
                <p className="text-[10px] font-bold opacity-30 uppercase tracking-widest mb-1">Registry Actions</p>
                <button 
                  className="button button--secondary-glass w-full text-left p-3 rounded-xl border border-white/5 hover:border-primary/40" 
                  type="button" 
                  onClick={onReplayQueue}
                >
                  <span className="text-xs font-bold block">Commit Changes</span>
                  <span className="text-[10px] opacity-40">{queueCount} updates in buffer</span>
                </button>
                <button 
                  className="button button--secondary-glass w-full text-left p-3 rounded-xl border border-white/5 hover:border-primary/40" 
                  type="button" 
                  onClick={onGoHome}
                >
                  <span className="text-xs font-bold">Return to Dashboard</span>
                </button>
              </div>
            </div>
          </details>

          <div className="h-6 w-px bg-white/5 mx-2"></div>

          <button 
            className="button button--secondary-glass px-5 py-2 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-critical/10 hover:text-critical hover:border-critical/20 transition-all" 
            type="button" 
            onClick={onLogout}
          >
            Authorize Exit
          </button>
        </div>
      </header>

      <div className={`portal-layout ${activeWorkspaceTool === "jobs" ? "portal-layout--with-joblist" : "portal-layout--no-joblist"} ${focusMode ? "portal-layout--focus" : ""}`}>
        <aside className="portal-nav glass-panel no-border-radius-v">
          <div className="portal-nav__header px-4 mb-8">
            <p className="text-[10px] font-black text-primary-light uppercase tracking-[0.3em] mb-3">Registry Context</p>
            <h3 className="text-2xl font-black text-white tracking-tighter mb-1">{activeToolMeta.label}</h3>
            <p className="text-[10px] opacity-40 font-medium uppercase tracking-wider">{activeToolMeta.helper}</p>
          </div>

          <nav className="portal-nav__list flex flex-col gap-3 px-2" aria-label="Portal sections">
            <button
              type="button"
              className={`portal-nav__item ${activeWorkspaceTool === "jobs" ? "portal-nav__item--active" : ""}`}
              onClick={() => onActiveWorkspaceToolChange("jobs")}
            >
              <div className="flex items-center justify-between">
                <span>{getRoleMenuLabel("jobs", effectiveRole)}</span>
                <div className="w-1.5 h-1.5 rounded-full bg-white/20"></div>
              </div>
              <small>Primary Execution</small>
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
                  >
                    <div className="flex items-center justify-between">
                      <span>{getRoleMenuLabel(tool, effectiveRole)}</span>
                      {active && <div className="w-1.5 h-1.5 rounded-full bg-primary-light"></div>}
                    </div>
                    <small>{item.helper || "Operational Tool"}</small>
                  </button>
                );
              })}
          </nav>

          <div className="mt-auto p-4">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
              <p className="text-[9px] font-black opacity-30 uppercase tracking-widest mb-2">Sync Status</p>
              <p className="text-[10px] font-bold text-white/60 tracking-tight">{syncPulseText}</p>
            </div>
          </div>
        </aside>

        <main id="main-content" className="portal-main overflow-y-auto">
          {children}
        </main>
      </div>

      <style>{`
        .no-border-radius-v { border-radius: 0 !important; }
        .animate-pulse-slow { animation: pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        .toggle-switch {
          appearance: none;
          width: 32px;
          height: 16px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          position: relative;
          cursor: pointer;
          transition: background 0.3s ease;
        }
        .toggle-switch:checked { background: var(--color-primary); }
        .toggle-switch::before {
          content: '';
          position: absolute;
          width: 12px;
          height: 12px;
          background: white;
          border-radius: 50%;
          top: 2px;
          left: 2px;
          transition: transform 0.3s ease;
        }
        .toggle-switch:checked::before { transform: translateX(16px); }
      `}</style>
    </>
  );
}
