import React from "react";
import { apiClient } from "../apiClient";

interface AdminPanelCardProps {
  adminHealth: Record<string, unknown> | null;
  adminAuditCount: number;
  onLoadHealth: () => void;
  onLoadAudits: () => void;
  onFeedback: (msg: string) => void;
}

export function AdminPanelCard({
  adminHealth,
  adminAuditCount,
  onLoadHealth,
  onLoadAudits,
  onFeedback,
}: AdminPanelCardProps): React.JSX.Element {
  return (
    <article className="workspace-card">
      <div className="panel-heading">
        <p className="panel-eyebrow">Admin</p>
        <h2>Health and audit surface</h2>
      </div>
      <div className="button-row">
        <button className="button button--secondary" onClick={onLoadHealth}>
          Load health
        </button>
        <button className="button button--secondary" onClick={onLoadAudits}>
          Load audits
        </button>
        <button
          className="button button--ghost"
          onClick={async () => {
            await apiClient.retryAutomation("AUTO-001");
            onFeedback("Automation retry requested.");
          }}
        >
          Retry AUTO-001
        </button>
      </div>
      <div className="feedback-panel">
        <pre>{JSON.stringify({ health: adminHealth, audit_count: adminAuditCount }, null, 2)}</pre>
      </div>
    </article>
  );
}
