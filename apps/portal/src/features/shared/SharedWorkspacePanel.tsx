import React from "react";
import type { Role } from "@kharon/domain";
import { JobListView } from "../../components/JobListView";
import { SummaryBoard } from "../../components/SummaryBoard";
import { DashboardView } from "../../components/DashboardView";
import { COPY_GLOSSARY, WORKSPACE_TOOL_META } from "../../appShell/helpers";
import { WorkspaceContent } from "./WorkspaceContent";

interface SharedWorkspacePanelProps {
  state: any;
}

export function SharedWorkspacePanel({ state }: SharedWorkspacePanelProps): React.JSX.Element {
  const {
    session,
    effectiveRole,
    jobs,
    selectedJobid,
    onSelectJobid,
    searchTerm,
    onSearchTermChange,
    activeWorkspaceTool,
    onActiveWorkspaceToolChange,
    openJobCount,
    selectedJobStatus,
    queueCount,
    generatedDocumentCount,
    adminAuditCount,
    networkOnline,
    syncPulseText,
    portalView,
    onboardingDismissed,
    onDismissOnboarding,
    onLogout
  } = state;

  const activeToolMeta = WORKSPACE_TOOL_META[activeWorkspaceTool] ?? { label: "Workspace", helper: "Use the sidebar to move between sections" };
  const showOperationalEngagements = activeWorkspaceTool === "jobs";

  if (portalView === "dashboard" && session) {
    return (
      <DashboardView
        session={session}
        openJobCount={openJobCount}
        overrideRole={effectiveRole as Role}
        onboardingDismissed={onboardingDismissed}
        onDismissOnboarding={onDismissOnboarding}
        onEnterWorkspace={(tool) => onActiveWorkspaceToolChange(tool)}
        onLogout={onLogout}
      />
    );
  }

  return (
    <>
      {showOperationalEngagements ? (
        <aside className="portal-sidebar portal-sidebar--jobs">
          <JobListView
            jobs={jobs}
            selectedJobid={selectedJobid}
            onSelectJob={onSelectJobid}
            globalQuery={searchTerm}
            onGlobalQueryChange={onSearchTermChange}
            onBulkStatusUpdate={state.onBulkStatusUpdate}
            title="Jobs List"
          />
        </aside>
      ) : null}

      <main className="portal-main">
        <section className="workspace-header-card">
          <h1>{activeToolMeta.label}</h1>
          <p>{activeToolMeta.helper.replace("documents", COPY_GLOSSARY.documents.toLowerCase())}</p>
          <div className="workspace-header-card__actions">
            <input
              type="search"
              id="workspace-global-search"
              value={searchTerm}
              onChange={(event) => onSearchTermChange(event.target.value)}
              placeholder="Search jobs, clients, sites, IDs..."
              aria-label="Search across workspace data"
            />
          </div>
        </section>

        {state.notifications.length > 0 ? (
          <section className="notification-center" aria-live="polite">
            {state.notifications.map((item: any) => (
              <article key={item.id} className="notification-card">
                <span className={`status-chip status-chip--${item.tone}`}>{item.title}</span>
                <p>{item.detail}</p>
                <button className="button button--ghost" type="button" onClick={() => state.onDismissNotification(item.id)}>
                  Dismiss
                </button>
              </article>
            ))}
            <button className="button button--secondary" type="button" onClick={state.onDismissAllNotifications}>
              Dismiss all
            </button>
          </section>
        ) : null}

        {state.actionPending ? <p className="inline-note">Loading latest updates...</p> : null}
        {/failed|error|unavailable/i.test(state.feedback) ? <p className="inline-note">Action could not complete. Check connection and try again.</p> : null}

        <SummaryBoard
          role={(effectiveRole || "client") as Role}
          openJobCount={openJobCount}
          selectedJobStatus={selectedJobStatus}
          queueCount={queueCount}
          generatedDocumentCount={generatedDocumentCount}
          adminAuditCount={adminAuditCount}
          networkOnline={networkOnline}
          syncPulseText={syncPulseText}
        />

        <WorkspaceContent state={state} />
      </main>
    </>
  );
}
